export type UploadedFile = {
  fileName: string;
  contentType: string;
  size: number;
  url: string;
};

export interface FileStorage {
  upload(file: File): Promise<UploadedFile>;
}

class MockFileStorage implements FileStorage {
  async upload(file: File): Promise<UploadedFile> {
    return {
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
      size: file.size,
      url: `mock://uploads/${encodeURIComponent(file.name)}`
    };
  }
}

export function createFileStorage(): FileStorage {
  return new MockFileStorage();
}
