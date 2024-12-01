import { graphql } from '../__generated__/gql.ts';
import { useGithub } from '../github.ts';

const SearchRepositoriesQuery = graphql(/* GraphQL */ `
  query SearchRepositories {
    search(type: REPOSITORY, query: "user:bcgov language:TypeScript", first: 100) {
      nodes {
        __typename
        ... on Repository {
          name
          nameWithOwner
          url
          defaultBranchRef {
            name
          }
          languages(first: 10) {
            nodes {
              id
              name
            }
          }
        }
      }
    }
  }
`)

export function* fetchRepositories() {
  const github = yield* useGithub();
  return yield* github(SearchRepositoriesQuery);
}
