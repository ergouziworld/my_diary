$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$AppDir = Join-Path $PSScriptRoot "app"
$BuildDir = Join-Path $PSScriptRoot "build"
$DistDir = Join-Path $PSScriptRoot "dist"

function Get-ShortPath($Path) {
    $full = [System.IO.Path]::GetFullPath($Path)
    $fso = New-Object -ComObject Scripting.FileSystemObject
    if (Test-Path -LiteralPath $full -PathType Container) {
        return $fso.GetFolder($full).ShortPath
    }
    return $fso.GetFile($full).ShortPath
}

$Sdk = $env:ANDROID_SDK_ROOT
if (-not $Sdk) { $Sdk = $env:ANDROID_HOME }
if (-not $Sdk -or -not (Test-Path -LiteralPath $Sdk)) {
    if (Test-Path -LiteralPath "C:\android-sdk") {
        $Sdk = "C:\android-sdk"
    } elseif (Test-Path -LiteralPath "$env:LOCALAPPDATA\Android\Sdk") {
        $Sdk = "$env:LOCALAPPDATA\Android\Sdk"
    } else {
        throw "Android SDK was not found."
    }
}

$Jdk = $env:JAVA_HOME
if (-not $Jdk -or -not (Test-Path -LiteralPath $Jdk)) {
    if (Test-Path -LiteralPath "C:\JDK17") {
        $Jdk = "C:\JDK17"
    } else {
        $Jdk = Split-Path -Parent (Split-Path -Parent (Get-Command java.exe).Source)
    }
}

$BuildTools = Get-ChildItem -LiteralPath (Join-Path $Sdk "build-tools") -Directory | Sort-Object Name -Descending | Select-Object -First 1
$Platform = Get-ChildItem -LiteralPath (Join-Path $Sdk "platforms") -Directory | Sort-Object Name -Descending | Select-Object -First 1
if (-not $BuildTools) { throw "No Android build-tools installation was found." }
if (-not $Platform) { throw "No Android platform installation was found." }

$Aapt2 = Join-Path $BuildTools.FullName "aapt2.exe"
$D8 = Join-Path $BuildTools.FullName "d8.bat"
$ZipAlign = Join-Path $BuildTools.FullName "zipalign.exe"
$ApkSigner = Join-Path $BuildTools.FullName "apksigner.bat"
$AndroidJar = Join-Path $Platform.FullName "android.jar"
$Javac = Join-Path $Jdk "bin\javac.exe"
$Keytool = Join-Path $Jdk "bin\keytool.exe"
if (-not (Test-Path -LiteralPath $Javac)) { throw "javac.exe was not found." }
if (-not (Test-Path -LiteralPath $Keytool)) { throw "keytool.exe was not found." }

Remove-Item -Recurse -Force $BuildDir -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path $BuildDir, $DistDir | Out-Null

$ResDir = Join-Path $AppDir "src\main\res"
$IconSource = Join-Path $ProjectRoot "public\icon-512.png"
$MipMapDir = Join-Path $ResDir "mipmap-hdpi"
New-Item -ItemType Directory -Force -Path $MipMapDir | Out-Null
Copy-Item -LiteralPath $IconSource -Destination (Join-Path $MipMapDir "ic_launcher.png") -Force

$CompiledRes = Join-Path $BuildDir "compiled-res.zip"
$GeneratedDir = Join-Path $BuildDir "generated"
$ClassesDir = Join-Path $BuildDir "classes"
$DexDir = Join-Path $BuildDir "dex"
$UnsignedApk = Join-Path $BuildDir "mydiary-webview-unsigned.apk"
$AlignedApk = Join-Path $BuildDir "mydiary-webview-aligned.apk"
$SignedApk = Join-Path $DistDir "mydiary-webview.apk"
$Keystore = Join-Path $PSScriptRoot "mydiary-webview.keystore"
New-Item -ItemType Directory -Force -Path $GeneratedDir, $ClassesDir, $DexDir | Out-Null

$ResDirShort = Get-ShortPath $ResDir
$CompiledResFull = [System.IO.Path]::GetFullPath($CompiledRes)
$GeneratedDirShort = Get-ShortPath $GeneratedDir
$UnsignedApkFull = [System.IO.Path]::GetFullPath($UnsignedApk)
$ManifestShort = Get-ShortPath (Join-Path $AppDir "src\main\AndroidManifest.xml")
$AndroidJarShort = Get-ShortPath $AndroidJar

& $Aapt2 compile --dir $ResDirShort -o $CompiledResFull
if ($LASTEXITCODE -ne 0) { throw "aapt2 compile failed." }

& $Aapt2 link -I $AndroidJarShort --manifest $ManifestShort --java $GeneratedDirShort --min-sdk-version 23 --target-sdk-version 35 --version-code 6 --version-name "6.0-webview" -o $UnsignedApkFull $CompiledResFull
if ($LASTEXITCODE -ne 0) { throw "aapt2 link failed." }

$JavaSources = Get-ChildItem -Recurse -File -Path (Join-Path $AppDir "src\main\java"), $GeneratedDir -Filter "*.java" | ForEach-Object { $_.FullName }
& $Javac -encoding UTF-8 -source 8 -target 8 -bootclasspath $AndroidJar -d $ClassesDir $JavaSources
if ($LASTEXITCODE -ne 0) { throw "javac failed." }

$ClassFiles = Get-ChildItem -Recurse -File -LiteralPath $ClassesDir -Filter "*.class" | ForEach-Object { $_.FullName }
& $D8 --min-api 23 --lib $AndroidJar --output $DexDir $ClassFiles
if ($LASTEXITCODE -ne 0) { throw "d8 failed." }

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$apkZip = [System.IO.Compression.ZipFile]::Open($UnsignedApk, [System.IO.Compression.ZipArchiveMode]::Update)
try {
    $existing = $apkZip.GetEntry("classes.dex")
    if ($existing) { $existing.Delete() }
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($apkZip, (Join-Path $DexDir "classes.dex"), "classes.dex") | Out-Null
} finally {
    $apkZip.Dispose()
}

& $ZipAlign -f -p 4 $UnsignedApk $AlignedApk
if ($LASTEXITCODE -ne 0) { throw "zipalign failed." }

if (-not (Test-Path -LiteralPath $Keystore)) {
    & $Keytool -genkeypair -keystore $Keystore -storepass "123456" -keypass "123456" -alias "mydiary-webview" -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Bocchi WebView, OU=Personal, O=Bocchi, C=CN"
    if ($LASTEXITCODE -ne 0) { throw "keytool failed." }
}

& $ApkSigner sign --ks $Keystore --ks-key-alias "mydiary-webview" --ks-pass "pass:123456" --key-pass "pass:123456" --out $SignedApk $AlignedApk
if ($LASTEXITCODE -ne 0) { throw "apksigner sign failed." }

& $ApkSigner verify --print-certs $SignedApk
if ($LASTEXITCODE -ne 0) { throw "apksigner verify failed." }

Write-Host "Built $SignedApk"
