const DuckDBDriver = require('@cubejs-backend/duckdb-driver');

module.exports = {
  driverFactory: () => {
    return new DuckDBDriver({
      initSql: /* SQL */`
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
              json_extract_string(item, '$.tool.driver.name') AS tool_name,
              json_extract_string(item, '$.tool.driver.organization') AS tool_organization,
              filename,
              id.owner AS github_owner,
              id.name AS github_repository,
              id.sha AS github_sha
          FROM items;
        
        CREATE TEMPORARY TABLE sarif_results_items AS
          WITH 
            items AS (
              SELECT
                filename,
                unnest(runs) as runs,
                regexp_extract(
                    filename, 
                    '^s3://[^/]+/([^/]+)/([^/]+)/([^/]+)/([^/]+)$', 
                    ['owner', 'name', 'sha']
                ) AS id
              FROM read_json_auto(
                's3://security/*/*/*/*.json',
                hive_partitioning=true,
                filename=true,
                columns={
                  runs: 'STRUCT(
                    tool STRUCT(
                      driver STRUCT(
                        fullName VARCHAR, 
                        informationUri VARCHAR, 
                        "name" VARCHAR, 
                        rules STRUCT(
                          id VARCHAR, 
                          "name" VARCHAR, 
                          shortDescription STRUCT("text" VARCHAR), 
                          fullDescription STRUCT("text" VARCHAR), 
                          defaultConfiguration STRUCT("level" VARCHAR), 
                          helpUri VARCHAR, 
                          help STRUCT(
                            "text" VARCHAR, 
                            markdown VARCHAR
                          ), 
                          properties STRUCT(
                            "precision" VARCHAR, 
                            "security-severity" VARCHAR, 
                            tags VARCHAR[]
                          )
                        )[], 
                      "version" VARCHAR)
                    ), 
                    results STRUCT(
                      ruleId VARCHAR, 
                      ruleIndex BIGINT, 
                      "level" VARCHAR, 
                      message STRUCT("text" VARCHAR), 
                      locations STRUCT(
                        physicalLocation STRUCT(
                          artifactLocation STRUCT(
                            uri VARCHAR, 
                            uriBaseId VARCHAR
                          ), 
                          region STRUCT(
                            startLine BIGINT, 
                            startColumn BIGINT, 
                            endLine BIGINT, 
                            endColumn BIGINT
                          )
                        ), 
                        message STRUCT(
                          "text" VARCHAR
                        )
                      )[]
                    )[], 
                    columnKind VARCHAR, 
                    originalUriBaseIds STRUCT(
                      ROOTPATH STRUCT(uri VARCHAR)
                    )
                  )[]'
                }
              )
            ),
            result AS (
              SELECT
                id.owner AS github_owner,
                id.name AS github_repository,
                id.sha AS github_sha,
                filename,
                unnest(runs.results) as rule, 
                runs.tool.driver.name as tool_name,
                runs.tool.driver.fullName as tool_full_name
              FROM items
            )
          SELECT
            github_owner,
            github_repository,
            github_sha,
            tool_name,
            tool_full_name,
            filename, 
            rule.ruleId as rule_id, 
            rule.ruleIndex as rule_index,
            rule.level as rule_level, 
            rule.message.text as rule_message
          FROM result;
      `
    })
  }
};
 
 
 