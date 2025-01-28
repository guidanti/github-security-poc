import { call, type Operation } from "npm:effection@4.0.0-alpha.3";
import { readTextFile } from "./readTextFile.ts";
import { sarif } from '../schemas/sarif-2.1.0-rtm.4.zod.ts';
import { useDuckDB } from './useDuckDB.ts';

export function* importSarif(path: string | URL): Operation<void> {
  const db = yield* useDuckDB();
  const text = yield* readTextFile(path);
  const json = JSON.parse(text);

  const document = yield* call(() => sarif.parse(json));

  const commands = [];
  
  for (const run of document.runs) {
    run.tool.
  }
}