export const COMMITS_QUERY = `
  query LastTenCommits($owner: String!, $name: String!, $branch: String!) {
    repository(owner: $owner, name: $name) {
      ref(qualifiedName: $branch) {
        target {
          ... on Commit {
            history(first: 5) {
              edges {
                node {
                  abbreviatedOid
                }
              }
            }
          }
        }
      }
    }
  }
`;

/*
localhost
  query all commits

http://localhost:4000/cubejs-api/graphql

query CubeQuery {
  cube(where: {
    sarifs: {
      github_owner: { equals: "bcgov" },
      github_sha: { equals: "06deb7b" },
      github_repository: { equals: "bc-wallet-mobile" },
    }
  }) {
    sarifs {
      github_owner
      github_repository
      tool_name
      results
    }
  }
}
*/
