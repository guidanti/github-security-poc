import { type Operation, call, each, stream } from "npm:effection@4.0.0-alpha.3";
import { useLogger } from "fetcher-lib/useLogger.ts";
import semver from "npm:semver@7.6.3";
import { whatPM as _whatPM, type WhatPMResult } from "npm:what-pm@3.3.1";
import { x } from "./tinyexec.ts";
import { type ClonedPath } from "./repos-clone.ts";
import { walk } from "jsr:@std/fs@1.0.6";
import { globToRegExp, dirname, toFileUrl } from "jsr:@std/path@1.0.6";
import { WalkEntry } from "jsr:@std/fs@1.0.4/walk";

export function* installDependencies(cloned: ClonedPath): Operation<void> {
  const logger = yield* useLogger();

  const pm = yield* whatPM(cloned.path.pathname);
  
  if (pm) {
    logger.info(
      ` Detected a package using ${pm.name}@${pm.version} ${pm.isWorkspace ? "with" : "without"} a workspace.`
    );
  } else {
    logger.info(` package.json not found in ${cloned.nameWithOwner}; looking in subdirectories.`);

    const reg = globToRegExp(`${cloned.path.pathname}/**/package.json`, {
      globstar: true,
    });
    const inNodeModules = globToRegExp(`${cloned.path.pathname}/**/node_modules`, {
      globstar: true,
    })

    const files = walk(cloned.path, {
      includeDirs: false,
      includeFiles: true,
      skip: [
        inNodeModules
      ],
      match: [
        reg,
      ],
    });

    const pkgs: WalkEntry[] = [];
    for (const entry of yield* each(stream(files))) {
      const pkgRoot = dirname(entry.path);
      const pm = yield* whatPM(pkgRoot);
      if (pm?.isWorkspace) {
        logger.info(` Found workspace at ${pkgRoot}.`)
        // we'll only install the workspace if we find it
        yield* installDependencies({
          ...cloned,
          path: toFileUrl(pkgRoot),
        });
        // return so it doesn't try to install the rest of the packages
        return;
      } else if (pm) {
        pkgs.push(entry);
      }
      yield* each.next();
    }

    for (const pkg of pkgs) {
      const subdir = dirname(pkg.path);
      logger.info(` Installing dependencies in a subdirectory ${subdir}`);
      try {
        yield* installDependencies({
          ...cloned,
          path: toFileUrl(subdir),
        });
      } catch (e) {
        logger.info(`Encountered an error install in subdirectory ${subdir}`);
        logger.error(e);
      }
    }

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