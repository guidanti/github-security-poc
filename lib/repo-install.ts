import { useLogger } from "fetcher-lib/useLogger.ts";
import semver from "npm:semver@7.6.3";
import { exists } from "./fs.ts";
import { x } from "./tinyexec.ts";

export function* installDependencies(path: URL) {
  const logger = yield* useLogger();
  
  const packageJson = new URL('package.json', `${path}/`);
  if (yield* exists(packageJson)) {
    const lockfile = new URL('yarn.lock', `${path}/`);

    if (yield* exists(lockfile)) {
      const yarnVersion = yield* x("yarn", ["--version"], {
        nodeOptions: {
          cwd: path.pathname,
        }
      });
      const { stdout: version } = yield* yarnVersion;
      const { major } = semver.parse(version);
      
      const args = major > 1 ? ["--immutable"] : ["--frozen-lockfile", "--ignore-engines"];

      logger.info(`Using Yarn ${major}`);
      const install = yield* yield* x("yarn", args, {
        nodeOptions: {
          cwd: path.pathname,
        }
      });

      if (install.exitCode !== 0) {
        logger.log(install.stdout);
        logger.error(install.stderr)
      }

      return;
    }

    const install = yield* yield* x("npm", ["install"], {
      nodeOptions: {
        cwd: path.pathname,
      }
    });
    logger.info(`Using NPM`);
    
    if (install.exitCode !== 0) {
      logger.log(install.stdout);
      logger.error(install.stderr);
    }

  } else {
    logger.info(`Skipping ${path} because there is no root package.json`);
  }
}
