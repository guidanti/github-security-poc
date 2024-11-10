import { Database } from "duckdb";
import { main, call } from "npm:effection@4.0.0-alpha.3";

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  await main(function*() {
    const db = yield* call(() => Database.create("./securitydb.duckdb"));
    const result = yield* call(() => db.all(`SELECT * FROM read_json_auto('./effection.sarif.json')`));
    console.dir(result)
  });
}
