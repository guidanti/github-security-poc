import { useLogger } from "fetcher-lib/useLogger.ts";
import { call, each } from "npm:effection@4.0.0-alpha.3";
import { installDependencies } from "./repo-install.ts";
import { ClonedPath } from "./repos-clone.ts";
import { exists, mkdir } from "./fs.ts";
import { x } from "./tinyexec.ts";
import { existsObject, putObject } from "./s3.ts";

type ClonedPathWithCommit = ClonedPath & {
  commit: string;
}

export function* scanRepositories(localRepositoryPaths: ClonedPath[]) {
  const logger = yield* useLogger();
  yield* ensureCacheDirExists();
  yield* checkTrivyExists();

  for (const [index, cloned] of localRepositoryPaths.entries()) {
    logger.info(
      `[${
        index + 1
      }/${localRepositoryPaths.length}] Running trivy scan for ${cloned.nameWithOwner}`,
    );
    try {
      logger.info('Getting top 5 commits');
      const commits = yield* getCommits(cloned, 5);

      let i = 1;
      for (const commit of commits) {
        const key = getKey({ ...cloned, commit });
        if (yield* existsObject({
          Key: key,
          Bucket: 'security'
        })) {
          logger.info(`${key} exists; Skipping.`);
        } else {
          try {
            logger.info(`[${i++}/${commits.length}] Scanning commit with SHA ${commit}`)
            logger.info(` Git Checkout ${commit}`)
            yield* checkout(commit, cloned.path);
            logger.info(` Installing dependencies`)
            yield* installDependencies(cloned);
            logger.info(` Scanning with trivy`);
            const output = yield* scan({ ...cloned, commit });
            if (output.trim() === "") {
              logger.info(` Scanner output is empty; Skipping S3 Upload`);
            } else {
              logger.info(` Uploading to S3`);
              yield* uploadToS3({ ...cloned, commit }, output);
            }
            logger.info(` Successfully scanned ${commit}`)
          } catch (e) {
            logger.info(` Failed to complete ${commit}`);
            logger.error(e);
          }
        }
      }
    } catch (e) {
      console.info(`Failed to scan ${cloned.nameWithOwner}`);
      console.error(e);
    }

  }
}

function* getCommits(cloned: ClonedPath, count: number) {
  const gitLog = yield* yield* x("git", [
    "--no-pager",
    "log",
    "--pretty=format:%h",
    "-n",
    `${count}`,
  ], {
    nodeOptions: {
      cwd: cloned.path.pathname,
    },
  });

  return gitLog.stdout.split("\n").filter((commit) => commit.trim())
}

function* checkout(commit: string, path: URL) {
  const logger = yield* useLogger();

  const reset = yield* yield* x("git", [
    "reset",
    "--hard",
  ], {
    nodeOptions: {
      cwd: path.pathname,
    },
  });

  if (reset.exitCode !== 0) {
    logger.log(reset.stdout);
    logger.error(reset.stderr);
    throw new Error(`Git reset failed`)
  }

  const checkout = yield* yield* x("git", [
    "checkout",
    commit,
  ], {
    nodeOptions: {
      cwd: path.pathname,
    },
  });

  if (checkout.exitCode !== 0) {
    logger.log(reset.stdout);
    logger.error(reset.stderr);
    throw new Error(`Git checkout failed`)
  }
}

function* scan(cloned: ClonedPathWithCommit) {
  const logger = yield* useLogger();

  const scanner = yield* x("trivy", [
    "--quiet",
    "fs",
    "--scanners",
    "vuln,secret",
    "--format",
    "sarif",
    cloned.path.pathname,
  ]);

  const output = [];
  for (const line of yield* each(scanner.lines)) {
    output.push(line);
    yield* each.next()
  }

  const process = yield* scanner;

  if (process.exitCode !== 0) {
    logger.error(process.stderr);
    throw new Error(`Scan failed`);
  }

  return output.join("\n");
}

function* ensureCacheDirExists() {
  const resultsDirectory = `${Deno.cwd()}/.cache/sarif/`;
  const resultsDirectoryExists = yield* exists(resultsDirectory);
  if (!resultsDirectoryExists) {
    yield* mkdir(resultsDirectory, { recursive: true });
  }
}

function* checkTrivyExists() {
  const logger = yield* useLogger();
  const checkTrivyExists = new Deno.Command("trivy", {
    args: ["--version"],
  });

  logger.info("Checking if trivy is installed");
  try {
    const trivyVersion = yield* call(() => checkTrivyExists.output());
    logger.info("Found trivy:", new TextDecoder().decode(trivyVersion.stdout));
  } catch {
    throw new Error("Unable to find trivy");
  }
}

export function* uploadToS3(cloned: ClonedPathWithCommit, output: string) {
  const logger = yield* useLogger();
  
  yield* putObject({
    Body: output,
    Key: getKey(cloned),
    Bucket: `security`,
  });
}

export function getKey(cloned: ClonedPathWithCommit) {
  return `${cloned.nameWithOwner}/${cloned.commit}/trivy.json`
}