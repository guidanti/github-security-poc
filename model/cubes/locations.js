cube(`locations`, {
  sql_table: `main.locations`,

  data_source: `default`,
  
  joins: {
    results: {
      sql: `${CUBE}.result_id = ${results}.result_id`,
      relationship: `many_to_one`
    }
  },
  
  dimensions: {
    id: {
      sql: `location_id`,
      type: `number`,
      primary_key: true
    },

    file_path: {
      sql: `file_path`,
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
