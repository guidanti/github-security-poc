cube(`runs`, {
  sql_table: `main.runs`,
  
  data_source: `default`,

  joins: {
    commits: {
      sql: `${CUBE}.commit_id = ${commits}.commit_id`,
      relationship: `many_to_one`
    }
  },
  
  dimensions: {
    id: {
      sql: `run_id`,
      type: `number`,
      primary_key: true
    },

    tool_name: {
      sql: `tool_name`,
      type: `string`
    },
    
    tool_version: {
      sql: `tool_version`,
      type: `string`
    },
    
    execution_successful: {
      sql: `execution_successful`,
      type: `boolean`
    },
    
    original_uri_base_ids: {
      sql: `original_uri_base_ids`,
      type: `string`
    },
    
    invocation_time: {
      sql: `invocation_time`,
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
