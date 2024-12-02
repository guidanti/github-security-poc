import "jsr:@std/dotenv/load";
import { main } from "npm:effection@4.0.0-alpha.3";
import { initGithubContext } from './github.ts';
import { initLoggerContext } from "fetcher-lib/useLogger.ts"
import { initCacheContext } from "fetcher-lib/useCache.ts";
import { initCostContext } from "fetcher-lib/useCost.ts"
import { fetchRepositories } from "./fetchers/repositories.ts";
import { initRetryWithBackoff } from "fetcher-lib/useRetryWithBackoff.ts";
import { cloneRepositories } from "./repos-clone.ts";
import { scanRepositories } from "./repos-scan.ts";
import { initS3Client, S3ClientConfig } from "./s3.ts";
import { generateEntities } from "./generate-entities.ts";

await main(function* () {
  yield* initCostContext();
  yield* initRetryWithBackoff({
    timeout: 6000 * 60,
    operationName: "Unknown"
  });
  
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

  const logger = yield* initLoggerContext(console);

  const cache = yield* initCacheContext({
    location: new URL(".cache/", `file://${Deno.cwd()}/`)
  });

  logger.info(`Cache location: ${cache.location}`)

  yield* initGithubContext();

  const repositories = yield* fetchRepositories();

  console.log(`Found ${repositories.search.nodes?.length} repositories`);

  const localRepositoryPaths = yield* cloneRepositories(repositories);

  const repositoryNames = yield* scanRepositories(localRepositoryPaths);

  yield* generateEntities(repositoryNames);
});
