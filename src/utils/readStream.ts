export async function readStream(
  body: ReadableStream<Uint8Array>,
  onChunk: (chunk: string) => void,
) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value, { stream: true }));
  }
}
