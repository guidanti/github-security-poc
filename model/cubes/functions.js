const string = (sql) => ({ 
  [`${sql}`]: {
    sql,
    type: 'string'
  }
});

cube('functions', {
  sql: `
    SELECT * FROM duckdb_functions()
  `,
  dimensions: {
    database_name: {
      sql: `database_name`,
      type: 'string'
    },
    schema_name: {
      sql: `schema_name`,
      type: 'string'
    },
    function_name: {
      sql: `function_name`,
      type: 'string'
    },
    function_type: {
      sql: `function_type`,
      type: 'string'
    },
    description: {
      sql: `description`,
      type: 'string'
    },
    return_type: {
      sql: `return_type`,
      type: 'string'
    },
    parameters: {
      sql: `parameters`,
      type: 'string'
    },
    parameter_types: {
      sql: `parameter_types`,
      type: 'string'
    },
    varargs: {
      sql: `varargs`,
      type: 'string'
    },
    macro_definition: {
      sql: `macro_definition`,
      type: 'string'
    },
    has_side_effects: {
      sql: `has_side_effects`,
      type: 'string'
    },
    function_oid: {
      sql: `function_oid`,
      type: 'string'
    }
  }
})