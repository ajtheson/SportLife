import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export const AVATAR_IMAGE_MAX_BYTES = 2 * 1024 * 1024;
export const VENUE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const VENUE_IMAGE_MAX_COUNT = 5;

type StoredObject = {
  url: string;
};

type ImageFolder = "avatars" | "venues";

const IMAGE_EXTENSIONS = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export function isUploadedFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}

export async function saveLocalImageFile(file: File, folder: ImageFolder, maxBytes: number): Promise<StoredObject> {
  const extension = IMAGE_EXTENSIONS.get(file.type);

  if (!extension) {
    throw new Error("INVALID_IMAGE_TYPE");
  }

  if (file.size > maxBytes) {
    throw new Error("IMAGE_TOO_LARGE");
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(uploadDir, { recursive: true });

  const filename = `${randomUUID()}.${extension}`;
  const filePath = path.join(uploadDir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());

  await writeFile(filePath, buffer);

  return {
    url: `/uploads/${folder}/${filename}`,
  };
}

export async function saveLocalImageFiles(files: File[], folder: ImageFolder, maxBytes: number): Promise<StoredObject[]> {
  return Promise.all(files.map((file) => saveLocalImageFile(file, folder, maxBytes)));
}
