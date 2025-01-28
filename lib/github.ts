import { assert } from "jsr:@std/assert@1.0.3";
import { encodeHex } from "jsr:@std/encoding@1";
import { md5 } from "jsr:@takker/md5@0.1.0";
import type { GraphQlQueryResponse } from "npm:@octokit/graphql@^4.8.0/dist-types/types.ts";
import chalk from "npm:chalk@4.1.2";
import {
  call,
  createContext,
  each,
  type Operation,
  resource,
  useAbortSignal,
} from "npm:effection@4.0.0-alpha.3";
import {
  DocumentNode,
  type OperationDefinitionNode,
  parse,
} from "npm:graphql@16.9.0";
import { useRetryWithBackoff } from "fetcher-lib/useRetryWithBackoff.ts";

import {
  type Cache,
  CacheContext,
  createPersistentCache,
  useCache,
} from "fetcher-lib/useCache.ts";
import { useCost } from "fetcher-lib/useCost.ts";
import { useLogger } from "fetcher-lib/useLogger.ts";
import type { TypedDocumentString } from "./__generated__/graphql.ts";

type ExecuteFn = <TResult, TVariables>(
  query: TypedDocumentString<TResult, TVariables>,
  ...[variables]: TVariables extends Record<string, never> ? [] : [TVariables]
) => Operation<TResult>;

export const GithubContext = createContext<
  ExecuteFn
>("graphql");

function createGithubCache() {
  return resource<Cache>(function* (provide) {
    const currentCache = yield* useCache();

    yield* provide(createPersistentCache({
      location: new URL("./github/", currentCache.location),
    }));
  });
}

export function* initGithubContext() {
  const githubCache = yield* createGithubCache();

  return yield* GithubContext.set(function* (...args) {
    return yield* CacheContext.with(
      githubCache,
      function* () {
        return yield* execute(...args);
      },
    );
  } as ExecuteFn);
}

export function* useGithub() {
  return yield* GithubContext.expect();
}

function* client<TResult, TVariables>(
  query: TypedDocumentString<TResult, TVariables>,
  variables: TVariables = {} as TVariables,
) {
  const logger = yield* useLogger();
  const signal = yield* useAbortSignal();

  const response = yield* call(() =>
    fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: new Headers({
        Authorization: `token ${Deno.env.get("GITHUB_TOKEN")}`,
        "X-Github-Next-Global-ID": "1",
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({
        query,
        variables,
      }),
      signal,
    })
  );
  console.log(response)
  if (response.ok) {
    const payload = yield* call<GraphQlQueryResponse<TResult>>(() =>
      response.json()
    );
    if (payload.errors) {
      for (const error of payload.errors ?? []) {
        logger.error(
          `${getOperationName(parse(query as unknown as string))} with ${
            JSON.stringify(
              variables,
            )
          } encountered an error ${JSON.stringify(error)}`,
        );
      }
    }
    return payload.data;
  } else {
    throw new Error(`${response.status} ${response.statusText}`);
  }
}

function* execute<TResult, TVariables>(
  query: TypedDocumentString<TResult, TVariables>,
  ...[variables]: TVariables extends Record<string, never> ? [] : [TVariables]
): Operation<TResult> {
  const cache = yield* useCache();
  // const cost = yield* useCost();
  const logger = yield* useLogger();

  const operationName = getOperationName(parse(`${query}`));
  const key = `${encodeHex(md5(`${query}`))}-${
    Object.keys(variables ?? {})
      .map((p) => `${p}:${(variables ?? {})[p]}`)
      .join("-")
  }`;

  if (yield* cache.has(key)) {
    for (const data of yield* each(yield* cache.read<TResult>(key))) {
      return data;
    }
    logger.error(`This could happen if cached document had no records.`);
    return null as TResult;
  } else {
    let data: TResult | undefined;

    yield* useRetryWithBackoff(
      function* retry() {
        data = yield* client<TResult, TVariables>(query, variables);
      },
      {
        operationName,
      },
    );

    // // @ts-expect-error Property 'rateLimit' does not exist on type 'NonNullable<ResponseData>'.
    // if (data?.rateLimit) {
    //   logger.info(
    //     `GitHub API Query ${operationName} with ${JSON.stringify(variables)
    //       // @ts-expect-error Property 'rateLimit' does not exist on type 'NonNullable<ResponseData>'.
    //     } ${chalk.green("cost", data.rateLimit.cost)} and ${
    //       // @ts-expect-error Property 'rateLimit' does not exist on type 'NonNullable<ResponseData>'.
    //       chalk.green("remaining", data.rateLimit.remaining)}`,
    //   );
    //   cost.update({
    //     // @ts-expect-error Property 'rateLimit' does not exist on type 'NonNullable<ResponseData>'.deno-ts(2339)
    //     cost: data.rateLimit.cost,
    //     // @ts-expect-error Property 'rateLimit' does not exist on type 'NonNullable<ResponseData>'.deno-ts(2339)
    //     nodeCount: data.rateLimit.nodeCount,
    //     // @ts-expect-error Property 'rateLimit' does not exist on type 'NonNullable<ResponseData>'.deno-ts(2339)
    //     remaining: data.rateLimit.remaining,
    //   });
    // }

    assert(data, "Could not fetch data from GraphQL API");

    yield* cache.write(key, data);
    return data;
  }
}

export function getOperationName(doc: DocumentNode): string | null {
  return (
    doc.definitions
      .filter(
        (definition): definition is OperationDefinitionWithName =>
          definition.kind === "OperationDefinition" && !!definition.name,
      )
      .map((x) => x.name.value)[0] || null
  );
}

type OperationDefinitionWithName = OperationDefinitionNode & {
  name: NonNullable<OperationDefinitionNode["name"]>;
};
