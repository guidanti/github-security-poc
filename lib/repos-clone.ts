import type { SearchRepositoriesQuery } from "./__generated__/graphql.ts";
import { exists } from "jsr:@std/fs@1.0.4";
import { call } from "npm:effection@4.0.0-alpha.3";

export function* cloneRepositories(data: SearchRepositoriesQuery) {
  if (data?.search?.nodes?.length) {
    const repositories = data?.search?.nodes;
    const clonePaths = [];
    for (const repository of repositories) {
      if (repository?.__typename === "Repository") {
        const defaultBranch = repository.defaultBranchRef?.__typename === "Ref" ? repository.defaultBranchRef.name : "main";
        const clonePath = `${Deno.cwd()}/.cache/repositories/${repository.name}`;
        if (yield* call(() => exists(clonePath))) {
          const command = new Deno.Command("git", {
            args: ["pull origin", defaultBranch],
            cwd: clonePath,
          });
          yield* call(() => command.output());
        } else {
          const command = new Deno.Command("git", {
            args: ["clone", repository.url, clonePath],
          });
          yield* call(() => command.output());
        }
        clonePaths.push({
          path: clonePath,
          name,
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
