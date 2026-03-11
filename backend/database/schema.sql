CREATE DATABASE IF NOT EXISTS ucu_innovators;
USE ucu_innovators;

-- -------------------------------------------------------
-- Users: students, supervisors and admins
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('student', 'supervisor', 'admin') NOT NULL DEFAULT 'student',
  supervisor_code VARCHAR(20) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------
-- Valid supervisor registration codes SP1901-SP1920
-- A supervisor must supply one of these when registering.
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS valid_supervisor_ids (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  used TINYINT(1) NOT NULL DEFAULT 0,
  used_by INT DEFAULT NULL,
  CONSTRAINT fk_supid_user FOREIGN KEY (used_by) REFERENCES users(id) ON DELETE SET NULL
);

INSERT IGNORE INTO valid_supervisor_ids (code) VALUES
  ('SP1901'), ('SP1902'), ('SP1903'), ('SP1904'), ('SP1905'),
  ('SP1906'), ('SP1907'), ('SP1908'), ('SP1909'), ('SP1910'),
  ('SP1911'), ('SP1912'), ('SP1913'), ('SP1914'), ('SP1915'),
  ('SP1916'), ('SP1917'), ('SP1918'), ('SP1919'), ('SP1920');

-- -------------------------------------------------------
-- Projects submitted by students
-- grade / grade_comment / graded_by filled by supervisors
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  technologies VARCHAR(255) DEFAULT '',
  github_link VARCHAR(255) DEFAULT NULL,
  document VARCHAR(255) DEFAULT NULL,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  user_id INT NOT NULL,
  grade ENUM('A', 'B', 'C', 'D', 'F') DEFAULT NULL,
  grade_comment TEXT DEFAULT NULL,
  graded_by INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_projects_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_projects_grader FOREIGN KEY (graded_by) REFERENCES users(id) ON DELETE SET NULL
);

-- -------------------------------------------------------
-- Comments on projects (students and supervisors)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  user_id INT NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_comments_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- -------------------------------------------------------
-- Likes: one per user per project
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS likes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_likes_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_likes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT uq_project_like UNIQUE (project_id, user_id)
);
