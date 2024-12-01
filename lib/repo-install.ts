import { useLogger } from "fetcher-lib/useLogger.ts";
import { exists } from "jsr:@std/fs@1.0.4";
import { call } from "npm:effection@4.0.0-alpha.3";
import semver from "npm:semver@7.6.3";

export function* installDependencies(path: string) {
  const logger = yield* useLogger();
  
  const packageJson = new URL('package.json', `file://${path}/`);
  if (yield* call(async () => await exists(packageJson))) {
    const lockfile = new URL('yarn.lock', `file://${path}/`);
    const useYarn = yield* call(async () => {
      return await exists(lockfile);
    });
    if (useYarn) {
      const yarnVersion = new Deno.Command("yarn", {
        args: ["--version"],
        cwd: path,
      });
      const { stdout: version } = yield* call(() => yarnVersion.output());
      const { major } = semver.parse(new TextDecoder().decode(version));
      
      const args = major > 1 ? ["--immutable"] : ["--frozen-lockfile", "--ignore-engines"];

      const install = new Deno.Command("yarn", {
        args,
        cwd: path,
      });

      try {
        const installResult = yield* call(async () => await install.output());
        if (installResult.code !== 0) {
          const errors = new TextDecoder().decode(installResult.stderr);
          const stdout = new TextDecoder().decode(installResult.stdout);
          throw new Error(`${errors}, ${stdout}`);
        }
      } catch(e) {
        logger.info("\nSomething went wrong while installing dependencies for", path, "\n");
        if (e instanceof Error) {
          logger.info(e.message);
        }
      }
    } else {
      const install = new Deno.Command("npm", {
        args: ["install"],
        cwd: path,
      });
      try {
        const installResult = yield* call(async () => await install.output());
        if (installResult.code !== 0) {
          const errors = new TextDecoder().decode(installResult.stderr);
          const stdout = new TextDecoder().decode(installResult.stdout);
          throw new Error(`${errors}, ${stdout}`);
        }
      } catch(e) {
        logger.info("\nSomething went wrong while installing dependencies for", path, "\n");
        if (e instanceof Error) {
          logger.info(e.message);
        }
      }
    }
  } else {
    logger.info(`Skipping ${path} because there is no root package.json`);
  }
}
