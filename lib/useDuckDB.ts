import { resource, call, createContext, type Operation, type Stream, stream } from 'npm:effection@4.0.0-alpha.3';
import { assert } from 'jsr:@std/assert';
import duckdb from "duckdb";
interface DuckDBConnection {
  all(sql: string, ...args: any[]): Operation<duckdb.TableData>
  stream(sql: any, ...args: any[]): Stream<duckdb.RowData, void>
  exec(sql: string, ...args: any[]): Operation<void>
}

function createDuckDBConnection(path: string, accessMode?: number | Record<string, string>) {
  return resource<DuckDBConnection>(function*(provide) {
    let db: duckdb.Database;
    let connection: duckdb.Connection;
    try {
      db = yield* call(() => duckdb.Database.create(path, accessMode));
      connection = yield* call(() => db.connect());
      yield* provide({
        *all(sql, ...args) {
          return yield* call(() => connection.all(sql, ...args));
        },
        stream(sql, ...args) {
          return stream(connection.stream(sql, ...args))
        },
        *exec(sql, ...args) {
          return yield* call(() => connection.exec(sql, ...args));
        }
      })
    } finally {
      yield* call(() => connection?.close());
      yield* call(() => db?.close());
    }
  })
}

export const DuckDBContext = createContext<DuckDBConnection>("duckdb")

export function* initDuckDBContext(path: string, accessMode?: number | Record<string, string>): Operation<void> {
  const connection = yield* createDuckDBConnection(path, accessMode);

  yield* DuckDBContext.set(connection);
}

export function* useDuckDB(): Operation<DuckDBConnection> {
  return yield* DuckDBContext.expect();
}