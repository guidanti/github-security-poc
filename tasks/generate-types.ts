import { jsonSchemaToZod } from "npm:json-schema-to-zod@2.4.1";
import { parseArgs } from "jsr:@std/cli@1.0.6/parse-args";
import { resolveRefs } from "npm:json-refs@3.0.15";
import { basename, dirname, join } from "jsr:@std/path@1.0.8";
import { format } from "https://deno.land/x/deno_fmt@0.1.5/mod.ts";
import { compile } from "npm:json-schema-to-typescript@15.0.3";

const flags = parseArgs(Deno.args, {
  string: ["input"],
  default: { input: "./schemas/sarif-2.1.0-rtm.4.json" },
});

const text = Deno.readTextFileSync(flags.input);

const jsonSchema = JSON.parse(text);
const { resolved } = await resolveRefs(jsonSchema);

const filename = basename(flags.input, ".json");

const code = jsonSchemaToZod(resolved, {
  name: "sarif",
  module: "esm",
  type: "Sarif",
});

const output = join(dirname(flags.input), `${filename}.ts`);

Deno.writeTextFileSync(
  join(dirname(flags.input), `${filename}.zod.ts`),
  await format(code),
);

console.log(`Wrote Zod model from ${flags.input} to ${output}`);

Deno.writeTextFileSync(
  join(dirname(flags.input), `${filename}.ts`),
  await compile(resolved, "Sarif"),
);
