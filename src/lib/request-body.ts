export class BodyTooLargeError extends Error {}

export async function boundedBody(request: Pick<Request, 'headers' | 'body'>, limit = 12 * 1024 * 1024): Promise<Uint8Array | undefined> {
   if (Number(request.headers.get("content-length") || 0) > limit) throw new BodyTooLargeError();
   if (!request.body) return undefined;
   const reader = request.body.getReader();
   const parts: Uint8Array[] = [];
   let size = 0;
   try {
      while (true) {
         const { value, done } = await reader.read();
         if (done) break;
         size += value.byteLength;
         if (size > limit) {
            await reader.cancel();
            throw new BodyTooLargeError();
         }
         parts.push(value);
      }
   } finally { reader.releaseLock(); }
   const body = new Uint8Array(size);
   let offset = 0;
   for (const part of parts) { body.set(part, offset); offset += part.byteLength; }
   return size ? body : undefined;
}
