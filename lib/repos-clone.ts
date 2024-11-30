import type { SearchRepositoriesQuery } from "./__generated__/graphql.ts";
import { exists } from "jsr:@std/fs@1.0.4";
import { call } from "npm:effection@4.0.0-alpha.3";
import gh from 'npm:parse-github-url@1.0.3';

interface Repositories {
  nameWithOwner: string;
  url: string;
  defaultBranchRef: {
    name: string;
  };
  languages: {
    nodes: {
      id: string;
      name: string;
    }[]
  };
}

export function* cloneRepositories(data: SearchRepositoriesQuery) {
  if (data?.search?.nodes?.length) {
    const repositories = data?.search?.nodes as unknown as Repositories[];
    const clonePaths = [];
    for (const repository of repositories) {
      const { href, name } = gh(repository.url);
      const clonePath = `${Deno.cwd()}/.cache/repositories/${name}`;
      if (call(async () => await exists(clonePath))) {
        const command = new Deno.Command("git", {
          args: ["pull origin", repository.defaultBranchRef.name],
          cwd: clonePath,
        });
        yield* call(async () => await command.output());
      } else {
        const command = new Deno.Command("git", {
          args: ["clone", href, clonePath],
        });
        yield* call(async () => await command.output());
      }
      clonePaths.push({
        path: clonePath,
        name,
        branch: repository.defaultBranchRef.name,
      });
    }
    return clonePaths;
  } else {
    throw new Error(`There are no repositories in the query results`);
  }
}
