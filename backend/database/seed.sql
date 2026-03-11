USE ucu_innovators;

INSERT INTO users (id, name, email, password, role)
VALUES
  (1, 'Alice Student', 'alice@example.com', '$2a$10$p0hBRJcz7tKvsxqtsNF3m.biudgLmVnGMGJwqhhPgBDrSdhvgAEZq', 'student'),
  (2, 'Brian Builder', 'brian@example.com', '$2a$10$p0hBRJcz7tKvsxqtsNF3m.biudgLmVnGMGJwqhhPgBDrSdhvgAEZq', 'student'),
  (3, 'Sarah Supervisor', 'sarah@example.com', '$2a$10$p0hBRJcz7tKvsxqtsNF3m.biudgLmVnGMGJwqhhPgBDrSdhvgAEZq', 'supervisor')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  password = VALUES(password),
  role = VALUES(role);

INSERT INTO projects (id, title, description, category, technologies, github_link, document, status, user_id)
VALUES
  (1, 'Smart Attendance Tracker', 'A QR-based classroom attendance system with analytics for lecturers.', 'Education', 'React, Node.js, MySQL', 'https://github.com/example/smart-attendance', NULL, 'approved', 1),
  (2, 'Campus Marketplace', 'A student marketplace for buying, selling, and swapping campus essentials.', 'E-Commerce', 'React, Express, MySQL', 'https://github.com/example/campus-marketplace', NULL, 'approved', 2),
  (3, 'Lab Equipment Booking', 'A booking workflow for reserving shared lab devices and time slots.', 'Operations', 'Vite, Express, MySQL', 'https://github.com/example/lab-booking', NULL, 'pending', 1)
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  description = VALUES(description),
  category = VALUES(category),
  technologies = VALUES(technologies),
  github_link = VALUES(github_link),
  status = VALUES(status),
  user_id = VALUES(user_id);

INSERT INTO comments (id, project_id, user_id, comment)
VALUES
  (1, 1, 2, 'The reporting view is clean and useful.'),
  (2, 1, 3, 'Please add export support for semester summaries.'),
  (3, 2, 1, 'The onboarding flow is straightforward.')
ON DUPLICATE KEY UPDATE
  comment = VALUES(comment),
  user_id = VALUES(user_id);

INSERT INTO likes (id, project_id, user_id)
VALUES
  (1, 1, 2),
  (2, 1, 3),
  (3, 2, 1)
ON DUPLICATE KEY UPDATE
  project_id = VALUES(project_id),
  user_id = VALUES(user_id);

ALTER TABLE users AUTO_INCREMENT = 4;
ALTER TABLE projects AUTO_INCREMENT = 4;
ALTER TABLE comments AUTO_INCREMENT = 4;
ALTER TABLE likes AUTO_INCREMENT = 4;

-- Seed user password for all sample accounts: password123
