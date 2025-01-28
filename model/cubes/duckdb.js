cube('duckdb', {
  sql: `
    SELECT version() AS version, extension_name, extension_version, installed_from, install_mode FROM duckdb_extensions()
  `,
  dimensions: {
    version: {
      sql: `version`,
      type: 'string'
    },
    extension_name: {
      sql: `extension_name`,
      type: 'string'
    },
    extension_version: {
      sql: `extension_version`,
      type: 'string'
    },
    installed_from: {
      sql: `installed_from`,
      type: 'string'
    },
    install_mode: {
      sql: `install_mode`,
      type: 'string'
    },
  }
})