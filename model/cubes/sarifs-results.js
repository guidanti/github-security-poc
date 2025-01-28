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
      rule_index,
      rule_level,
      rule_message
    FROM sarif_results_items
  `,
  data_source: `default`,

  pre_aggregations: {
    results_by_rule_level: {
      dimensions: [
        id,
        rule_level,
        tool_name
      ],
      measures: [
        number_of_errors
      ],
    },
  },

  measures: {
    number_of_errors: {
      type: `count`,
      drill_members: [id, rule_level, tool_name, rule_id],
    },
  },


  dimensions: {
    tool_name: {
      sql: `tool_name`,
      type: `string`,
    },
    tool_full_name: {
      sql: `tool_full_name`,
      type: `string`,
    },
    id: {
      sql: `CONCAT(${github_owner}, '/', ${github_repository}, '/', ${github_sha})`,
      type: `string`,
      primary_key: true
    },
    github_owner: {
      sql: `github_owner`,
      type: 'string',
    },
    github_repository: {
      sql: `github_repository`,
      type: 'string',
    },
    github_sha: {
      sql: `github_sha`,
      type: 'string',
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