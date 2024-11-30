import { useLogger } from "fetcher-lib/useLogger.ts";
import { exists } from "jsr:@std/fs@1.0.4/exists";
import { call } from "npm:effection@4.0.0-alpha.3";
import fs from "node:fs";
import { promisify } from "node:util";
import { installDependencies } from "./repo-install.ts";

export function* scanRepositories(localRepositoryPaths: {
  path: string,
  name: string,
  branch: string,
}[]) {
  const logger = yield* useLogger();
  yield* ensureCacheDirExists();
  yield* checkTrivyExists();

  for (const [index, { path, name, branch }] of localRepositoryPaths.entries()) {
    logger.info('Running trivy scans for', name, `${index+1}/${localRepositoryPaths.length}`);

    const gitLog = new Deno.Command("git", {
      args: ["--no-pager", "log", "--pretty=format:%h", "-n", "5"],
      cwd: path,
    });

    const { stdout } = yield* call(async () => await gitLog.output());
    const commits = new TextDecoder()
      .decode(stdout)
      .split("\n")
      .filter(commit => commit.trim());
    try {
      for (const commit of commits) {
        const reportExists = yield* call(async () => await exists(`${Deno.cwd()}/.cache/sarif/${name}-${commit}.sarif`));
        if (!reportExists) {
          yield* checkout(commit, path);
          yield* installDependencies(path);
          yield* scanAndOutput({ path, name, commit });
        }
      }
    } finally {
      yield* checkout(branch, path);
    }
  }
}

function* checkout(commit: string, path: string) {
  const logger = yield* useLogger();
  const reset = new Deno.Command("git", {
    args: [
      "reset", "--hard"
    ],
    cwd: path,
  });
  yield* call(async () => await reset.output());
  const checkout = new Deno.Command("git", {
    args: [
      "checkout",
      commit,
    ],
    cwd: path,
  });
  const result = yield* call(async () => await checkout.output());
  if (result.code !== 0) {
    const stdout = new TextDecoder().decode(result.stdout);
    const stderr = new TextDecoder().decode(result.stderr);
    logger.error('Something went wrong while checking out a commit/branch:', stdout, stderr);
  }
}

function* scanAndOutput({
  path, name, commit,
}: {
  path: string,
  name: string,
  commit: string,
}) {
  const logger = yield* useLogger();
  const scan = new Deno.Command("trivy", {
    args: [
      "fs",
      "--scanners", "vuln,secret",
      "--format", "sarif",
      `--output`, `${path}/../../sarif/${name}-${commit}.sarif`,
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

function* ensureCacheDirExists() {
  const resultsDirectory = `${Deno.cwd()}/.cache/sarif/`;
  const resultsDirectoryExists = yield* call(async () => await exists(resultsDirectory));
  if (!resultsDirectoryExists) {
    yield* call(() => promisify(fs.mkdir)(resultsDirectory, { recursive: true }));
  }
}

function* checkTrivyExists() {
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
}
