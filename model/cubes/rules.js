cube(`rules`, {
  sql_table: `main.rules`,
  
  data_source: `default`,

  joins: {
    runs: {
      sql: `${CUBE}.run_id = ${runs}.run_id`,
      relationship: `many_to_one`
    }
  },
  
  dimensions: {
    id: {
      sql: `rule_id`,
      type: `number`,
      primary_key: true
    },

    description: {
      sql: `description`,
      type: `string`
    },
    
    help_uri: {
      sql: `help_uri`,
      type: `string`
    },
    
    default_severity: {
      sql: `default_severity`,
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
