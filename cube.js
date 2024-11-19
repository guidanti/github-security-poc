const DuckDBDriver = require('@cubejs-backend/duckdb-driver');

module.exports = {
  driverFactory: () => {
    return new DuckDBDriver({
      initSql: `
        CREATE OR REPLACE MACRO json_each(val) AS
        TABLE (
          SELECT CASE
            WHEN json_array_length(j) >0 THEN unnest(range(json_array_length(j)::BIGINT))::VARCHAR
            ELSE unnest(json_keys(j)) END as key,
          CASE
            WHEN json_array_length(j) >0 THEN
            json_extract(j, key::BIGINT) ELSE
            json_extract(j, key)
          END as value
          FROM (SELECT val as j)
        );
      `
    })
  }
};
 
 
 