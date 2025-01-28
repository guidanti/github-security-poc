// source https://github.com/duckdb/duckdb/discussions/3578#discussioncomment-10791871
cube(`sarifs`, {
  sql: `
    SELECT
      filename,
      github_sha,
      github_repository,
      github_owner,
      tool_organization,
      tool_name,
      notifications,
      results
    FROM sarif_results
  `,
  data_source: `default`,

  dimensions: {
    results: {
      sql: `results`,
      type: `string`
    },
    notifications: {
      sql: `notifications`,
      type: `string`
    },
    tool_name: {
      sql: `tool_name`,
      type: `string`,
    },
    tool_organization: {
      sql: `tool_organization`,
      type: `string`,
    },
    github_owner: {
      sql: `github_owner`,
      type: 'string'
    },
    github_repository: {
      sql: `github_repository`,
      type: 'string'
    },
    github_sha: {
      sql: `github_sha`,
      type: 'string'
    },
    id: {
      sql: `filename`,
      type: `string`,
    },

  }
})