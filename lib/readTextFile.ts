import { call, useAbortSignal, type Operation } from "npm:effection@4.0.0-alpha.3";

export function* readTextFile(path: string | URL): Operation<string> {
  const signal = yield* useAbortSignal();

  return yield* call(() => Deno.readTextFile(path, { signal }));
}
