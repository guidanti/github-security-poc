cube(`commits`, {
  sql_table: `main.commits`,
  
  data_source: `default`,
  
  dimensions: {
    id: {
      sql: `commit_id`,
      type: `number`,
      primary_key: true
    },

    commit_sha: {
      sql: `commit_sha`,
      type: `string`
    },
    
    author_name: {
      sql: `author_name`,
      type: `string`
    },
    
    author_email: {
      sql: `author_email`,
      type: `string`
    },
    
    commit_date: {
      sql: `commit_date`,
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
