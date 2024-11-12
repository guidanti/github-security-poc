cube(`artifacts`, {
  sql_table: `main.artifacts`,
  
  data_source: `default`,

  joins: {
    runs: {
      sql: `${CUBE}.run_id = ${runs}.run_id`,
      relationship: `many_to_one`
    }
  },
  
  dimensions: {
    id: {
      sql: `artifact_id`,
      type: `number`,
      primary_key: true
    },

    file_path: {
      sql: `file_path`,
      type: `string`
    },
    
    mime_type: {
      sql: `mime_type`,
      type: `string`
    },
    
    hash: {
      sql: `hash`,
      type: `string`
    }
  },
  
  measures: {
    count: {
      type: `count`
    }
  },
  
  pre_aggregations: {
    // Pre-aggregation definitions go here.
    // Learn more in the documentation: https://cube.dev/docs/caching/pre-aggregations/getting-started
  }
});
