import { type Operation } from "npm:effection@4.0.0-alpha.3";
import { useDuckDB } from "./useDuckDB.ts";
import { readTextFile } from "./readTextFile.ts";

export function* executeScript(path: string | URL, ...args: unknown[]): Operation<void> {
  const db = yield* useDuckDB();
  const sql = yield* readTextFile(path);

  yield* db.exec(sql, ...args);
}