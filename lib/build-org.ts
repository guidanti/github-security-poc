import { main } from "npm:effection@4.0.0-alpha.3";
import { initGithubContext } from './github.ts';
import { initLoggerContext } from "fetcher-lib/useLogger.ts"
import { initCacheContext } from "fetcher-lib/useCache.ts";
import { initCostContext } from "fetcher-lib/useCost.ts"
import { fetchRepositories } from "./fetchers/repositories.ts";
import { initRetryWithBackoff } from "fetcher-lib/useRetryWithBackoff.ts";
import { cloneRepositories } from "./repos-clone.ts";
import { installDependencies } from "./repos-install.ts";
import { scanRepositories } from "./repos-scan.ts";

await main(function* () {
  yield* initCostContext();
  yield* initRetryWithBackoff({
    timeout: 6000 * 60,
    operationName: "Unknown"
  });
  
  const logger = yield* initLoggerContext(console);

  const cache = yield* initCacheContext({
    location: new URL(".cache/", `file://${Deno.cwd()}/`)
  });

  logger.info(`Cache location: ${cache.location}`)

  yield* initGithubContext();

  const repositories = yield* fetchRepositories();
  const localRepositoryPaths = yield* cloneRepositories(repositories);
  yield* installDependencies(localRepositoryPaths);
  yield* scanRepositories(localRepositoryPaths);
});
