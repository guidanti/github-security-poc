import { useLogger } from "fetcher-lib/useLogger.ts";
import { exists } from "jsr:@std/fs@1.0.4/exists";
import { call, type Operation, } from "npm:effection@4.0.0-alpha.3";
import fs from "node:fs";
import { promisify } from "node:util";

function* mkdir(
  path: fs.PathLike,
  options?: fs.MakeDirectoryOptions & {
    recursive: true;
  },
): Operation<string | undefined> {
  return yield* call(() => promisify(fs.mkdir)(path, options));
}

export function* scanRepositories(localRepositoryPaths: {
  path: string,
  name: string,
}[]) {
  const logger = yield* useLogger();
  const checkTrivyExists = new Deno.Command("trivy", {
    args: ["--version"]
  });

  logger.info("Checking if trivy is installed")
  try {
    const trivyVersion = yield* call(async () => await checkTrivyExists.output());
    logger.info("Found trivy:", new TextDecoder().decode(trivyVersion.stdout))
  } catch {
    throw new Error("Unable to find trivy");
  }

  const resultsDirectory = `${Deno.cwd()}/.cache/sarif/`;
  const resultsDirectoryExists = yield* call(async () => await exists(resultsDirectory));
  if (!resultsDirectoryExists) {
    yield* mkdir(resultsDirectory);
  }

  for (const [index, { path, name }] of localRepositoryPaths.entries()) {
    logger.info('Running trivy scan for', name, `${index+1}/${localRepositoryPaths.length}`);
    const scan = new Deno.Command("trivy", {
      args: [
        "fs",
        "--scanners", "vuln,secret",
        "--format", "sarif",
        `--output`, `${path}/../../sarif/${name}.sarif`,
        path,
      ],
    });
    yield* call(async () => {
      const result = await scan.output();
      if (result.code !== 0) {
        logger.info(new TextDecoder().decode(result.stdout), new TextDecoder().decode(result.stderr))
      }
    });
  }
}
