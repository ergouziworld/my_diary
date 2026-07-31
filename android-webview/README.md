# MyDiary Android WebView Shell

This is a minimal native Android WebView wrapper for `https://bocchi.website`.
It avoids TWA/Chrome requirements so it can run on devices where the previous
Trusted Web Activity package does not open reliably.

## Build

Run from the repository root:

```powershell
powershell -ExecutionPolicy Bypass -File .\android-webview\build-webview-apk.ps1
```

The signed APK is written to:

```text
android-webview\dist\mydiary-webview.apk
```

If an older APK with the same package name is already installed and was signed
with another key, uninstall it before installing this APK.
