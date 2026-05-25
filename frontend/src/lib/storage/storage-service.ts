import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Storage } from "@google-cloud/storage";

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

let storageClient: Storage | null = null;

export function isUploadedFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}

export async function saveLocalImageFile(file: File, folder: ImageFolder, maxBytes: number): Promise<StoredObject> {
  if (process.env.STORAGE_PROVIDER === "gcs") {
    return saveGcsImageFile(file, folder, maxBytes);
  }

  return saveFilesystemImageFile(file, folder, maxBytes);
}

async function saveFilesystemImageFile(file: File, folder: ImageFolder, maxBytes: number): Promise<StoredObject> {
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

async function saveGcsImageFile(file: File, folder: ImageFolder, maxBytes: number): Promise<StoredObject> {
  const extension = IMAGE_EXTENSIONS.get(file.type);

  if (!extension) {
    throw new Error("INVALID_IMAGE_TYPE");
  }

  if (file.size > maxBytes) {
    throw new Error("IMAGE_TOO_LARGE");
  }

  const bucketName = process.env.GCS_BUCKET;

  if (!bucketName) {
    throw new Error("STORAGE_BUCKET_REQUIRED");
  }

  const client = getStorageClient();
  const filename = `${folder}/${randomUUID()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await client.bucket(bucketName).file(filename).save(buffer, {
    contentType: file.type,
    resumable: false,
    metadata: {
      cacheControl: "public, max-age=31536000, immutable",
    },
  });

  return {
    url: `https://storage.googleapis.com/${bucketName}/${filename}`,
  };
}

function getStorageClient() {
  storageClient ??= new Storage();
  return storageClient;
}
