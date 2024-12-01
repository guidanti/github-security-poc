import {
  call,
  type Operation,
  resource,
  type Stream,
  stream,
  useAbortSignal,
} from "npm:effection@4.0.0-alpha.3";
export { type Output } from "npm:tinyexec@0.3.1";
import { type KillSignal, type Options, type Output, x as $x } from "npm:tinyexec@0.3.1";

export interface TinyProcess extends Operation<Output> {
  lines: Stream<string, void>;

  kill(signal?: KillSignal): Operation<void>;
}

export function x(
  cmd: string,
  args: string[] = [],
  options?: Partial<Options>,
): Operation<TinyProcess> {
  return resource(function* (provide) {
    const signal = yield* useAbortSignal();

    const tinyexec = $x(cmd, args, { ...options, signal });

    const promise: Promise<Output> = tinyexec as unknown as Promise<Output>;

    const output = call(() => promise);

    const tinyproc: TinyProcess = {
      *[Symbol.iterator]() {
        return yield* output;
      },
      lines: stream(tinyexec),
      *kill(signal) {
        tinyexec.kill(signal);
        yield* output;
      },
    };

    try {
      yield* provide(tinyproc);
    } finally {
      yield* tinyproc.kill();
    }
  });
}