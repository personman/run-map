-- Run this once on your MySQL server to set up the database schema.

CREATE TABLE IF NOT EXISTS activity_groups (
  id          CHAR(12)     NOT NULL PRIMARY KEY,  -- bin2hex(random_bytes(6))
  name        VARCHAR(255) NOT NULL,
  activities  MEDIUMTEXT   NOT NULL,              -- JSON array of parsed activity objects
  public_list TINYINT(1)   NOT NULL DEFAULT 0,   -- user opted in to public list
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- TODO: Build public list page that queries WHERE public_list = 1

CREATE TABLE IF NOT EXISTS import_logs (
  id          INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  method      VARCHAR(16)  NOT NULL,              -- 'gpx' or 'strava'
  count       SMALLINT     NOT NULL,              -- number of activities imported
  total_miles DECIMAL(8,2) NOT NULL,              -- sum of distances
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS strava_tokens (
  id             INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  athlete_id     BIGINT       NOT NULL UNIQUE,
  access_token   VARCHAR(255) NOT NULL,
  refresh_token  VARCHAR(255) NOT NULL,
  expires_at     INT          NOT NULL,
  athlete_json   TEXT         NOT NULL,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
