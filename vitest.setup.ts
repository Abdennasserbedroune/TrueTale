import { TextDecoder, TextEncoder } from "node:util";
import "whatwg-fetch";

if (!globalThis.TextEncoder) {
  globalThis.TextEncoder = TextEncoder as typeof globalThis.TextEncoder;
}

if (!globalThis.TextDecoder) {
  // @ts-expect-error - assigning for test environment
  globalThis.TextDecoder = TextDecoder;
}
