import { Database } from "duckdb";
import { main, call, each, stream } from "npm:effection@4.0.0-alpha.3";

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  await main(function*() {
    const db = yield* call(() => Database.create("./securitydb.duckdb"));
    for (const row of yield* each(stream(db.stream(`
      CREATE OR REPLACE TABLE runs AS (SELECT sarif.runs FROM read_json_auto('./effection.sarif.json') AS sarif);
      INSERT INTO runs SELECT sarif.runs FROM read_json_auto('./effection.sarif.json') AS sarif;
    `)))) {
      console.log(row);
      yield* each.next();
    }
  });
}
