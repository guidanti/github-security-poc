import { type Operation, call } from "npm:effection@4.0.0-alpha.3";
import { useLogger } from "fetcher-lib/useLogger.ts";
import semver from "npm:semver@7.6.3";
import { whatPM as _whatPM, type WhatPMResult } from "npm:what-pm@3.3.1";
import { x } from "./tinyexec.ts";
import { type ClonedPath } from "./repos-clone.ts";

export function* installDependencies(cloned: ClonedPath) {
  const logger = yield* useLogger();

  const pm = yield* whatPM(cloned.path.pathname);
  
  if (pm) {
    logger.info(
      ` Detected a package using ${pm.name}@${pm.version} ${pm.isWorkspace ? "with" : "without"} a workspace.`
    );
  } else {
    logger.info(` package.json not found in ${cloned.nameWithOwner}; skipping.`);
    return;
  }

  switch (pm?.name) {
    case "yarn": {
      let version: number;
      if (pm.version === "*") {
        const yarnVersion = yield* yield* x("yarn", ["--version"], {
          nodeOptions: {
            cwd: cloned.path.pathname,
          }
        });
        version = semver.parse(yarnVersion.stdout).major;
      } else {
        version = semver.parse(pm.version).major;
      }
      
      const args = version > 1 ? ["--immutable"] : ["--frozen-lockfile", "--ignore-engines"];

      const install = yield* yield* x("yarn", args, {
        nodeOptions: {
          cwd: cloned.path.pathname,
        }
      });

      if (install.exitCode !== 0) {
        logger.log(install.stdout);
        logger.error(install.stderr)
      }
      return;
    }
    case "npm": {
      const install = yield* yield* x("npm", ["install"], {
        nodeOptions: {
          cwd: cloned.path.pathname,
        }
      });
      
      if (install.exitCode !== 0) {
        logger.log(install.stdout);
        logger.error(install.stderr);
      }
      return;
    }
    default:
      throw new Error(`installDependencies does not support ${pm.name}`);
  }
}

function* whatPM(pkgPath: string): Operation<WhatPMResult | null> {
  return yield* call(() => _whatPM(pkgPath));
}