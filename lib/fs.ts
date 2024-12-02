import * as fs from "jsr:@std/fs@1.0.4";
import { call, type Operation } from "npm:effection@4.0.0-alpha.3";

export function* exists(
  path: string | URL,
  options?: fs.ExistsOptions
): Operation<boolean> {
  return yield* call(() => fs.exists(path, options));
}

export function* remove(
  path: string | URL,
  options?: Deno.RemoveOptions
): Operation<void> {
  return yield* call(() => Deno.remove(path, options));
}

export function* mkdir(
  path: string | URL,
  options?: Deno.MkdirOptions
): Operation<void> {
  return yield* call(() => Deno.mkdir(path, options));
}

export function* write(
  path: string | URL,
  data: Uint8Array | ReadableStream<Uint8Array>,
  options?: Deno.WriteFileOptions
): Operation<void> {
  return yield* call(() => Deno.writeFile(path, data, options));
}
