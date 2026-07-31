export async function convertToStaticImage(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0);
    bitmap.close();
    return await new Promise<File>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) { reject(new Error("转换失败")); return; }
        resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
      }, "image/jpeg", 0.92);
    });
  } catch {
    // createImageBitmap 不支持该格式（如部分设备的 HEIC）时，回退用原始文件
    return file;
  }
}
