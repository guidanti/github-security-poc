import { main } from "npm:effection@4.0.0-alpha.3";
import { initDuckDBContext } from "./lib/useDuckDB.ts";
import { executeScript } from "./lib/executeScript.ts";

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  await main(function*() {
    yield* initDuckDBContext("./securitydb.duckdb");

    yield* executeScript('./sql/schema.sql');

    
  });
}
