cube(`sarifs`, {
  sql: `
    SELECT * FROM read_json_auto(
      's3://security/*/*/*/*.json', 
      hive_partitioning=true, 
      filename=true
    )
  `,
  data_source: `default`,

  dimensions: {
    version: {
      sql: `version`,
      type: `string`,
    },
    id: {
      sql: `filename`,
      type: `string`,
    },
    filename: {
      sql: `filename`,
      type: `string`,
    },
  }
})