cube(`runs`, {
  sql_table: `main.runs`,
  
  data_source: `default`,
  
  joins: {
    
  },
  
  dimensions: {
    runs: {
      sql: `runs`,
      type: `time`
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
