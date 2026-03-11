-- ============================================================
-- Migration: Add supervisor grading + valid_supervisor_ids
-- Run this if you already have the DB created from schema.sql
-- ============================================================
USE ucu_innovators;

-- 1.  Add supervisor_code column to users (safe to run multiple times)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS supervisor_code VARCHAR(20) DEFAULT NULL;

-- 2.  Add grading columns to projects
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS grade         ENUM('A','B','C','D','F') DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS grade_comment TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS graded_by     INT  DEFAULT NULL;

-- 3. Add FK for graded_by (ignore error if already exists)
ALTER TABLE projects
  ADD CONSTRAINT fk_projects_grader
  FOREIGN KEY (graded_by) REFERENCES users(id) ON DELETE SET NULL;

-- 4.  Create valid_supervisor_ids table
CREATE TABLE IF NOT EXISTS valid_supervisor_ids (
  id      INT AUTO_INCREMENT PRIMARY KEY,
  code    VARCHAR(20)  NOT NULL UNIQUE,
  used    TINYINT(1)   NOT NULL DEFAULT 0,
  used_by INT          DEFAULT NULL,
  CONSTRAINT fk_supid_user FOREIGN KEY (used_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 5.  Seed the 20 supervisor codes
INSERT IGNORE INTO valid_supervisor_ids (code) VALUES
  ('SP1901'),('SP1902'),('SP1903'),('SP1904'),('SP1905'),
  ('SP1906'),('SP1907'),('SP1908'),('SP1909'),('SP1910'),
  ('SP1911'),('SP1912'),('SP1913'),('SP1914'),('SP1915'),
  ('SP1916'),('SP1917'),('SP1918'),('SP1919'),('SP1920');

SELECT 'Migration complete' AS status;
