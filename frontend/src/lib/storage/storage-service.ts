type StoredObject = {
  url: string;
};

export async function putObjectPlaceholder(): Promise<StoredObject> {
  throw new Error("Object storage is not implemented yet.");
}
