-- Create a sequence for each table that requires auto-increment behavior
CREATE SEQUENCE IF NOT EXISTS commit_seq;
CREATE SEQUENCE IF NOT EXISTS run_seq;
CREATE SEQUENCE IF NOT EXISTS result_seq;
CREATE SEQUENCE IF NOT EXISTS rule_seq;
CREATE SEQUENCE IF NOT EXISTS artifact_seq;
CREATE SEQUENCE IF NOT EXISTS location_seq;

-- Create the commits table with a sequence for the primary key
CREATE TABLE IF NOT EXISTS commits (
    commit_id INTEGER PRIMARY KEY DEFAULT NEXTVAL('commit_seq'),  -- Use the sequence for auto-increment
    commit_sha VARCHAR UNIQUE NOT NULL,                           -- Git commit SHA (unique)
    author_name VARCHAR,                                          -- Author of the commit (optional)
    author_email VARCHAR,                                         -- Author's email (optional)
    commit_date TIMESTAMP                                         -- Date and time of the commit (optional)
);

-- Create the runs table with a sequence for the primary key and a foreign key reference to commits
CREATE TABLE IF NOT EXISTS runs (
    run_id INTEGER PRIMARY KEY DEFAULT NEXTVAL('run_seq'),        -- Use the sequence for auto-increment
    commit_id INTEGER REFERENCES commits(commit_id),              -- Foreign key to commits table
    tool_name VARCHAR,                                            -- Name of the tool used for analysis
    tool_version VARCHAR,                                         -- Version of the tool
    invocation_time TIMESTAMP,                                    -- When the tool was run
    execution_successful BOOLEAN,                                 -- Whether the run completed successfully
    original_uri_base_ids JSON                                    -- JSON column for storing originalUriBaseIds
);

-- Create the results table with a sequence for the primary key and a foreign key reference to runs
CREATE TABLE IF NOT EXISTS results (
    result_id INTEGER PRIMARY KEY DEFAULT NEXTVAL('result_seq'),  -- Use the sequence for auto-increment
    run_id INTEGER REFERENCES runs(run_id),                       -- Foreign key to runs table
    rule_id VARCHAR,                                              -- Rule associated with the result
    severity VARCHAR,                                             -- Severity of the issue (e.g., error, warning)
    message VARCHAR,                                              -- Message describing the issue
    file_path VARCHAR,                                            -- Path to the file where the issue was found
    start_line INTEGER,                                           -- Start line of the issue
    end_line INTEGER                                              -- End line of the issue
);

-- Create the rules table with a sequence for the primary key and a foreign key reference to runs
CREATE TABLE IF NOT EXISTS rules (
    rule_id INTEGER PRIMARY KEY DEFAULT NEXTVAL('rule_seq'),      -- Use the sequence for auto-increment
    run_id INTEGER REFERENCES runs(run_id),                       -- Foreign key to runs table
    description VARCHAR,                                          -- Description of the rule
    help_uri VARCHAR,                                             -- URI with more information about the rule
    default_severity VARCHAR                                      -- Default severity level for the rule
);

-- Create the artifacts table with a sequence for the primary key and a foreign key reference to runs
CREATE TABLE IF NOT EXISTS artifacts (
    artifact_id INTEGER PRIMARY KEY DEFAULT NEXTVAL('artifact_seq'), -- Use the sequence for auto-increment
    run_id INTEGER REFERENCES runs(run_id),                          -- Foreign key to runs table
    file_path VARCHAR,                                               -- Path to the file or resource
    mime_type VARCHAR,                                               -- MIME type of the artifact
    hash VARCHAR                                                     -- Optional hash of the file for integrity verification
);

-- Optional: Create the locations table with a sequence for the primary key and a foreign key reference to results
CREATE TABLE IF NOT EXISTS locations (
    location_id INTEGER PRIMARY KEY DEFAULT NEXTVAL('location_seq'), -- Use the sequence for auto-increment
    result_id INTEGER REFERENCES results(result_id),                 -- Foreign key to results table
    file_path VARCHAR,                                               -- Path to the file where the issue was found
    start_line INTEGER,                                              -- Start line of the issue
    end_line INTEGER                                                 -- End line of the issue
);