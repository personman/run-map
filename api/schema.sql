-- Run this once on your MySQL server to set up the database schema.

CREATE TABLE IF NOT EXISTS activity_groups (
  id          CHAR(12)     NOT NULL PRIMARY KEY,  -- bin2hex(random_bytes(6))
  name        VARCHAR(255) NOT NULL,
  activities  MEDIUMTEXT   NOT NULL,              -- JSON array of parsed activity objects
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
