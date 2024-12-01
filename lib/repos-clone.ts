import type { SearchRepositoriesQuery } from "./__generated__/graphql.ts";
import * as fs from "jsr:@std/fs@1.0.4";
import { call, type Operation } from "npm:effection@4.0.0-alpha.3";
import { type Output, TinyProcess, x } from "./tinyexec.ts";
import { join } from "node:path";

function* exists(path: string | URL, options?: fs.ExistsOptions): Operation<boolean> {
  return yield* call(() => fs.exists(path, options))
}

function* remove(path: string | URL, options?: Deno.RemoveOptions): Operation<void> {
  return yield* call(() => Deno.remove(path, options))
}

export function* cloneRepositories(data: SearchRepositoriesQuery) {
  if (data?.search?.nodes?.length) {
    const repositories = data?.search?.nodes;
    const clonePaths = [];
    for (const repository of repositories) {
      if (repository?.__typename === "Repository") {
        const defaultBranch = repository?.defaultBranchRef?.name;
        const clonePath = `${Deno.cwd()}/.cache/repositories/${repository.name}`;
        
        if (!defaultBranch) {
          throw new Error(`there is no defaultBranchRef for ${repository.name}`);
        }

        let cmd: Operation<TinyProcess> | undefined;
        if (yield* exists(clonePath)) {
          if (yield* exists(join(clonePath, '.git'))) {
            console.log(`Reusing and pulling to ${clonePath} because it already exists`);
            cmd = x("git", ["pull origin", defaultBranch], {
              nodeOptions: {
                cwd: clonePath,
              }
            });
          } else {
            console.log(`Deleting ${clonePath} because it's missing GIT repository`);
            yield* remove(clonePath, { recursive: true })
          }
        }

        if (cmd === undefined) {
          console.log(`Cloning ${clonePath}`);
          cmd = x("git", ["clone", repository.url, clonePath]);
        }

        let exec: TinyProcess | undefined;
        let output: Output | undefined;
        try {
          exec = yield* cmd;
          output = yield* exec;
        } catch {
          console.log(output?.stdout);
          console.error(`Command exited with ${output?.exitCode}: ${output?.stderr}`)
        } finally {
          console.log(`Finished with ${repository.nameWithOwner}`)
        }
        
        clonePaths.push({
          path: clonePath,
          name: repository.name,
          branch: defaultBranch,
        });
      } else {
        console.log(`Encountered ${repository?.__typename} instead of Repository`);
      }
    }
    return clonePaths;
  } else {
    throw new Error(`There are no repositories in the query results`);
  }
}
