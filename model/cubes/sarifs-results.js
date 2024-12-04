// source https://github.com/duckdb/duckdb/discussions/3578#discussioncomment-10791871
cube(`sarif_results_items`, {
  sql: `
    SELECT
      github_owner,
      github_repository,
      github_sha,
      tool_name,
      tool_full_name,
      filename,
      rule_id,
      rule_level,
      rule_message
    FROM sarif_results_items
  `,
  data_source: `default`,

  dimensions: {
    tool_name: {
      sql: `tool_name`,
      type: `string`,
    },
    tool_full_name: {
      sql: `tool_full_name`,
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
    rule_id: {
      sql: `rule_id`,
      type: `string`,
    },
    rule_level: {
      sql: `rule_level`,
      type: `string`,
    },
    rule_message: {
      sql: `rule_message`,
      type: `string`,
    },
  }
})