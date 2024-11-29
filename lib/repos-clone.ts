import { useLogger } from "fetcher-lib/useLogger.ts";
import type { SearchRepositoriesQuery } from "./__generated__/graphql.ts";
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
    const { href, name } = gh(repositories[0].url);
    const clonePath = `${Deno.cwd()}/.cache/repositories/${name}`;
    const command = new Deno.Command("git", {
      args: ["clone", href, clonePath],
    });
    // https://docs.deno.com/api/deno/~/Deno.Command
    yield* call(async () => await command.output());
    return [clonePath];
  } else {
    throw new Error(`There are no repositories in the query results`);
  }
}
