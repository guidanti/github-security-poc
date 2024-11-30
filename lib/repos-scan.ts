import { useLogger } from "fetcher-lib/useLogger.ts";
import { call } from "npm:effection@4.0.0-alpha.3";

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

  for (const { path, name } of localRepositoryPaths) {
    const scan = new Deno.Command("trivy", {
      args: [
        "trivy",
        "fs",
        "--scanners vuln,secret",
        "--format sarif",
        `--output ${path}/../../sarif/${name}.sarif`,
        path,
      ],
    });
    yield* call(async () => await scan.output());
  }
}
