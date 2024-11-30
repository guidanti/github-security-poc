import { useLogger } from "fetcher-lib/useLogger.ts";
import { exists } from "jsr:@std/fs@1.0.4";
import { call } from "npm:effection@4.0.0-alpha.3";
import semver from "npm:semver@7.6.3";

export function* installDependencies(localRepositoryPaths: {
  path: string,
  name: string,
}[]) {
  const logger = yield* useLogger();
  let noRoot = 0;
  let failedInstall = 0;
  
  for (const { path: repository } of localRepositoryPaths) {
    const packageJson = new URL('package.json', `file://${repository}/`);
    if (yield* call(async () => await exists(packageJson))) {
      const lockfile = new URL('yarn.lock', `file://${repository}/`);
      const useYarn = yield* call(async () => {
        return await exists(lockfile);
      });
      if (useYarn) {
        const yarnVersion = new Deno.Command("yarn", {
          args: ["--version"],
          cwd: repository,
        });
        const { stdout: version } = yield* call(async () => await yarnVersion.output());
        const { major } = semver.parse(new TextDecoder().decode(version));
        
        const flag = major > 1 ? "--immutable" : "--frozen-lockfile";
  
        const install = new Deno.Command("yarn", {
          args: [flag],
          cwd: repository,
        });
  
        try {
          const installResult = yield* call(async () => await install.output());
          if (installResult.code !== 0) {
            const errors = new TextDecoder().decode(installResult.stderr);
            const stdout = new TextDecoder().decode(installResult.stdout);
            throw new Error(`${errors}, ${stdout}`);
          }
        } catch(e) {
          failedInstall++;
          logger.info("\nSomething went wrong while installing dependencies for", repository, "\n");
          if (e instanceof Error) {
            logger.info(e.message);
          }
        }
      } else {
        const install = new Deno.Command("npm", {
          args: ["install"],
          cwd: repository,
        });
        try {
          const installResult = yield* call(async () => await install.output());
          if (installResult.code !== 0) {
            const errors = new TextDecoder().decode(installResult.stderr);
            const stdout = new TextDecoder().decode(installResult.stdout);
            throw new Error(`${errors}, ${stdout}`);
          }
        } catch(e) {
          failedInstall++;
          logger.info("\nSomething went wrong while installing dependencies for", repository, "\n");
          if (e instanceof Error) {
            logger.info(e.message);
          }
        }
      }
    } else {
      logger.info(`Skipping ${repository} because there is no root package.json`);
      noRoot++;
    }
  }
  logger.info(`Skipped ${noRoot} repositories because there were no root package.json file for those repositories`);
  logger.info(`Successfully installed dependencies for ${localRepositoryPaths.length - noRoot - failedInstall} repositories out of ${localRepositoryPaths.length} total`);
}
