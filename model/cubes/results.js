cube(`results`, {
  sql_table: `main.results`,
  
  data_source: `default`,

  joins: {
    runs: {
      sql: `${CUBE}.run_id = ${runs}.run_id`,
      relationship: `many_to_one`
    },
    
    rules: {
      sql: `${CUBE}.rule_id = ${rules}.rule_id`,
      relationship: `many_to_one`
    }
  },
  
  dimensions: {
    id: {
      sql: `result_id`,
      type: `number`,
      primary_key: true
    },

    rule_id: {
      sql: `rule_id`,
      type: `string`
    },
    
    severity: {
      sql: `severity`,
      type: `string`
    },
    
    message: {
      sql: `message`,
      type: `string`
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
