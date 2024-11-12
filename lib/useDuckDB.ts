import { resource, call, createContext } from 'npm:effection@4.0.0-alpha.3';
import { assert } from 'jsr:@std/assert';
import duckdb from "duckdb";

export const DuckDB = createContext<Database>("duckdb")

function createDatabase(path: string, accessMode?: number | Record<string, string>) {
  return resource(function*(provide) {
    let db: duckdb.Database = ;
    let connection: duckdb.Connection | undefined;
    try {
      db = yield* call(() => duckdb.Database.create(path, accessMode));
      connection = yield* call(() => db.connect());
      yield* provide(db)
    } finally {
      connection?.close();
    }
  })
}

interface Database {

}

export function* useDuckDB() {
  const db = ;

}