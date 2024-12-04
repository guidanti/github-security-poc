import type { SearchRepositoriesQuery } from "./__generated__/graphql.ts";
import { type Operation } from "npm:effection@4.0.0-alpha.3";
import { type Output, TinyProcess, x } from "./tinyexec.ts";
import { useCache } from "fetcher-lib/useCache.ts";
import { exists, remove } from "./fs.ts";

export interface ClonedPath {
  path: URL;
  name: string;
  nameWithOwner: string;
  branch: string;
}

export function* cloneRepositories(data: SearchRepositoriesQuery): Operation<ClonedPath[]> {
  const clonePaths: ClonedPath[] = [];
  const cache = yield* useCache();

  if (data?.search?.nodes?.length) {
    const repositories = [ ...data?.search?.nodes, {
      __typename: "Repository",
      name: "an-example-security-repo",
      nameWithOwner: "guidanti/an-example-security-repo",
      url: "https://github.com/guidanti/an-example-security-repo",
      defaultBranchRef: {
        __typename: "Ref",
        name: "main",
      }
    }];
    for (const repository of repositories) {
      if (repository?.__typename === "Repository") {
        const defaultBranch = repository?.defaultBranchRef?.name;
        const clonePath = new URL(`./repositories/${repository.nameWithOwner}`, cache.location);
        
        if (!defaultBranch) {
          throw new Error(`there is no defaultBranchRef for ${repository.name}`);
        }

        let cmd: Operation<TinyProcess> | undefined;
        if (yield* exists(clonePath)) {
          if (yield* exists(new URL('./.git', `${clonePath}/`))) {
            console.log(`Reusing and pulling to ${clonePath} because it already exists`);
            cmd = x("git", ["pull origin", defaultBranch], {
              nodeOptions: {
                cwd: clonePath.pathname,
              }
            });
          } else {
            console.log(`Deleting ${clonePath} because it's missing GIT repository`);
            yield* remove(clonePath, { recursive: true })
          }
        }

        if (cmd === undefined) {
          console.log(`Cloning ${repository.nameWithOwner}`);
          cmd = x("git", ["clone", repository.url, clonePath.pathname]);
        }

        let exec: TinyProcess | undefined;
        let output: Output | undefined;
        try {
          exec = yield* cmd;
          output = yield* exec;
          console.log(`Successfully downloaded ${repository.nameWithOwner} to ${clonePath.pathname}`)
        } catch {
          console.log(output?.stdout);
          console.error(`Command exited with ${output?.exitCode}: ${output?.stderr}`)
        } finally {
          clonePaths.push({
            path: clonePath,
            name: repository.name,
            nameWithOwner: repository.nameWithOwner,
            branch: defaultBranch,
          });
        }
        
      } else {
        console.log(`Encountered ${repository?.__typename} instead of Repository`);
      }
    }
  } else {
    throw new Error(`There are no repositories in the query results`);
  }

  return clonePaths;
}
