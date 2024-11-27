import { join } from "jsr:@std/path@1.0.6";
import { generate } from "npm:@graphql-codegen/cli@5.0.3";

const __generated__ = join(Deno.cwd(), "lib", "__generated__", "/");

await generate({
  documents: ["./lib/fetchers/*.ts", `!${__generated__}`],
  schema: './node_modules/@octokit/graphql-schema/schema.graphql',
  config: {},
  verbose: true,
  overwrite: true,
  generates: {
    [__generated__]: {
      preset: "client",
      config: {
        documentMode: 'string'
      }
    },
  },
}, true);