cube(`duckdb_settings`, {
  sql: `
    SELECT * FROM duckdb_settings()
  `,
  dimensions: {
    id: {
      sql: `name`,
      type: `string`,
      primary_key: true
    },
    value: {
      sql: `value`,
      type: `string`,
    }
  }
})