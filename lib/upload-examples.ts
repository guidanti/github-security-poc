import "jsr:@std/dotenv/load";
import { run, useAbortSignal, call, type Operation } from "npm:effection@4.0.0-alpha.3";
import { initS3Client, putObject, type S3ClientConfig } from "./s3.ts";
import { parseArgs } from "jsr:@std/cli/parse-args";

function* readFile(path: string | URL): Operation<Uint8Array> {
  const signal = yield* useAbortSignal();

  return yield* call(() => Deno.readFile(path, { signal }));
}

/**
 * Run these commands to test this
 * deno run -A lib/upload-examples.ts ./sarif-examples/codeql.json thefrontside/effection/asdf1234/codesql.json
 * deno run -A lib/upload-examples.ts ./sarif-examples/eslint.json thefrontside/effection/asdf1234/eslint.json
 */
await run(function*() {

  const tls = Deno.env.get("S3_USE_SSL") === "false" ? false : true;
  const endpoint = `${tls ? "https" : "http"}://${Deno.env.get("S3_ENDPOINT")}/` 

  const config: S3ClientConfig = {
    region: Deno.env.get("S3_REGION"),
    endpoint,
    forcePathStyle: Deno.env.get("S3_URL_STYLE") === "path",
    tls,
    credentials: {
      accessKeyId: Deno.env.get("S3_ACCESS_KEY_ID") ?? "",
      secretAccessKey: Deno.env.get("S3_SECRET_KEY") ?? ""
    },
  };

  yield* initS3Client(config);

  const flags = parseArgs(Deno.args, {
    string: ["bucket"],
    default: { bucket: "security" }
  });

  const path = Deno.args[0];
  const key = Deno.args[1];

  console.log(`Attempting to write file from ${path} to ${config.tls ? "https" : "http"}://${config.endpoint}/${flags.bucket}/${key}`);

  try {
    const output = yield* putObject({
      Body: yield* readFile(path),
      Bucket: flags.bucket,
      Key: Deno.args[1]
    });
    console.log({ output })
  } catch (e) {
    console.error("Failed to upload file due to", e);
  }

});