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
        CREATE TEMPORARY TABLE sarif_results AS
          WITH items AS (
              SELECT
                  value AS item,
                  filename,
                  regexp_extract(
                      filename, 
                      '^s3://[^/]+/([^/]+)/([^/]+)/([^/]+)/([^/]+)$', 
                      ['owner', 'name', 'sha']
                  ) AS id
              FROM
                  read_json_auto(
                      's3://security/*/*/*/*.json',
                      hive_partitioning=true,
                      filename=true,
                      maximum_depth=4
                  ) AS files,
                  json_each(files->'$.runs[*]')
          )
          SELECT
              item->'$.results' AS results,
              item->'$.notifications' AS notifications,
              json_value(item, '$.tool.driver.name') AS tool_name,
              json_value(item, '$.tool.driver.organization') AS tool_organization,
              filename,
              id.owner AS github_owner,
              id.name AS github_repository,
              id.sha AS github_sha
          FROM items;
      `
    })
  }
};
 
 
 