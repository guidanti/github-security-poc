// source https://github.com/duckdb/duckdb/discussions/3578#discussioncomment-10791871
cube(`sarifs`, {
  sql: `
    WITH items AS (
      SELECT 
        value AS item, 
        filename, 
        regexp_extract(filename, '^s3:\/\/[^\/]+\/([^\/]+)\/([^\/]+)\/([^\/]+)\/([^\/]+)$', ['owner', 'name', 'sha']) as id 
      FROM 
        read_json_auto(
          's3://security/*/*/*/*.json', 
          hive_partitioning=true, 
          filename=true,
          maximum_depth=4
        ) as files, 
        json_each(files->'$.runs[*]')
    )
    SELECT
      item->'$.results' as results,
      item->'$.notifications' as notifications,
      json_value(item, '$.tool.driver.name') as tool_name,
      json_value(item, '$.tool.driver.organization') as tool_organization,
      filename,
      id.owner as github_owner,
      id.name as github_repository,
      id.sha as github_sha
    FROM items
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