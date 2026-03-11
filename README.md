# UCU Innovators Hub

UCU Innovators Hub is a full-stack web platform for managing student innovation projects inside a university environment. Students can register, log in, submit projects, upload supporting documents, like and comment on published work, and track their own submissions. Supervisors can register with a controlled supervisor ID, review all student submissions, approve or reject projects, grade them, and leave academic feedback.

This repository contains the complete system from scratch:

- A React + Vite frontend
- A Node.js + Express backend API
- A MySQL relational database
- JWT-based authentication and role-based authorization
- File upload support for project documents
- A supervisor grading workflow
- Analytics and leaderboard views

This README is intentionally detailed so you can use it both to:

1. Explain the project in a presentation
2. Recreate a similar system from scratch
3. Understand how the frontend, backend, and database connect together

---

## Rebuild Guide From Step 1 To The Final Step

This section explains exactly how to recreate the project from scratch, in the correct order, including which folders to create, which files go into which folders, and the key code that belongs in them.

## Step 1. Create the root project folder

Create a project folder named:

```text
ucu-innovator-hub
```

Inside it, create two main folders:

```text
backend
frontend
```

These represent the server and client sides of the application.

## Step 2. Create the backend folder structure

Inside `backend`, create these folders:

```text
backend/
├── config/
├── controllers/
├── database/
├── middleware/
├── routes/
└── uploads/
```

### What each backend folder is for

- `config/` stores shared configuration such as the MySQL connection.
- `controllers/` stores the main business logic for authentication, projects, health checks, grading, likes, comments, and analytics.
- `database/` stores SQL files such as schema, seed data, and migrations.
- `middleware/` stores reusable request-processing logic such as JWT verification and file upload configuration.
- `routes/` stores Express route definitions.
- `uploads/` stores files uploaded by students.

## Step 3. Initialize the backend project

Open a terminal inside `backend` and run:

```bash
npm init -y
npm install express mysql2 bcryptjs jsonwebtoken validator multer dotenv cors
npm install -D nodemon
```

Then update `backend/package.json` so it contains these important fields:

```json
{
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

## Step 4. Create the backend environment file

Create this file:

```text
backend/.env
```

Put this inside it:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=root
DB_NAME=ucu_innovators
JWT_SECRET=change-me
```

Also create:

```text
backend/.env.example
```

with the same variable names so other developers know what they need to configure.

## Step 5. Create the backend database connection file

Create this file:

```text
backend/config/db.js
```

Put this code inside:

```js
import mysql from "mysql2";

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_NAME || "ucu_innovators",
  waitForConnections: true,
  connectionLimit: 10,
});

export default pool.promise();
```

This file belongs in `backend/config/` because it is shared configuration used across the backend.

## Step 6. Create the backend entry point

Create this file:

```text
backend/server.js
```

Put this code inside:

```js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import healthRoutes from "./routes/healthRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);

app.get("/", (req, res) => {
  res.send("UCU Innovators Hub API Running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

This file belongs directly in `backend/` because it is the backend entry point.

## Step 7. Create the SQL schema file

Create this file:

```text
backend/database/schema.sql
```

Put the database schema there. This file creates:

- `users`
- `valid_supervisor_ids`
- `projects`
- `comments`
- 

Use this code as the base:

```sql
CREATE DATABASE IF NOT EXISTS ucu_innovators;
USE ucu_innovators;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('student', 'supervisor', 'admin') NOT NULL DEFAULT 'student',
  supervisor_code VARCHAR(20) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS valid_supervisor_ids (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  used TINYINT(1) NOT NULL DEFAULT 0,
  used_by INT DEFAULT NULL,
  CONSTRAINT fk_supid_user FOREIGN KEY (used_by) REFERENCES users(id) ON DELETE SET NULL
);

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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

This file belongs in `backend/database/` because it defines the entire database structure.

## Step 8. Create the seed file

Create this file:

```text
backend/database/seed.sql
```

This file should insert sample users, projects, comments, and likes. Use it to create demo accounts and initial data for testing and presentation.

Important seeded accounts:

- `alice@example.com`
- `brian@example.com`
- `sarah@example.com`

Password:

```text
password123
```

## Step 9. Create the migration file

Create this file:

```text
backend/database/migrate_supervisor_grading.sql
```

This file belongs in `backend/database/` and is used when you already had an older version of the project without grading and supervisor IDs.

It should:

- add `supervisor_code` to `users`
- add `grade`, `grade_comment`, and `graded_by` to `projects`
- create the `valid_supervisor_ids` table
- insert supervisor IDs `SP1901` to `SP1920`

## Step 10. Create backend middleware files

Create these files:

```text
backend/middleware/authMiddleware.js
backend/middleware/uploadMiddleware.js
```

### `authMiddleware.js`
This file should verify JWT tokens and restrict access by role.

Key code:

```js
export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization token is required" });
  }

  const token = authHeader.split(" ")[1];
  req.user = jwt.verify(token, JWT_SECRET);
  next();
};
```

### `uploadMiddleware.js`
This file configures multer to save uploaded files into `backend/uploads/`.

Key code:

```js
import multer from "multer";

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

export default multer({ storage });
```

## Step 11. Create the controller files

Create these files:

```text
backend/controllers/authController.js
backend/controllers/healthController.js
backend/controllers/projectController.js
```

### `authController.js`
Put the registration and login logic here.

This file is responsible for:
- trimming and validating user input
- hashing passwords with bcrypt
- generating JWT tokens
- validating supervisor IDs for supervisor accounts

Important code that belongs there:

```js
if (chosenRole === "supervisor") {
  const trimmedCode = supervisor_code?.trim().toUpperCase();

  if (!/^SP19\d+$/.test(trimmedCode)) {
    return res.status(400).json({ message: "Invalid Supervisor ID format. Must start with SP19 followed by digits" });
  }
}
```

### `healthController.js`
Put the API and database health logic there.

### `projectController.js`
Put all project logic there:

- submit project
- get all public approved projects
- get own projects
- get all projects for supervisors
- search projects
- approve project
- reject project
- grade project
- comment on project
- get comments
- like project
- get likes
- leaderboard
- analytics

## Step 12. Create the backend route files

Create these files:

```text
backend/routes/authRoutes.js
backend/routes/healthRoutes.js
backend/routes/projectRoutes.js
```

### `authRoutes.js`
This file belongs in `backend/routes/` and connects `/register` and `/login` to the auth controller.

### `healthRoutes.js`
This file belongs in `backend/routes/` and connects `/api/health` to the health controller.

### `projectRoutes.js`
This file belongs in `backend/routes/` and connects all project endpoints, including supervisor-only routes.

Important code for `projectRoutes.js`:

```js
router.post("/submit", requireAuth, upload.single("document"), submitProject);
router.get("/", getProjects);
router.get("/mine", requireAuth, getUserProjects);
router.get("/all", requireAuth, authorizeRoles("supervisor", "admin"), getAllProjects);
router.post("/grade/:id", requireAuth, authorizeRoles("supervisor", "admin"), gradeProject);
```

## Step 13. Run the database

Open MySQL Workbench and run the files in this order:

1. `backend/database/schema.sql`
2. `backend/database/seed.sql`

If you are upgrading an older version, also run:

3. `backend/database/migrate_supervisor_grading.sql`

## Step 14. Start the backend

In `backend/`, run:

```bash
npm install
npm run dev
```

If successful, the backend will be available at:

```text
http://localhost:5000
```

Health endpoint:

```text
http://localhost:5000/api/health
```

## Step 15. Create the frontend folder structure

Inside `frontend`, create this structure:

```text
frontend/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── pages/
│   └── services/
```

### What each frontend folder is for

- `assets/` stores static frontend resources if needed.
- `components/` stores reusable UI components such as the navbar and project card.
- `pages/` stores route-level pages such as Home, Login, Register, Dashboard, and Supervisor Panel.
- `services/` stores the API helper logic.

## Step 16. Initialize the frontend project

In the root project folder, create the Vite app:

```bash
npm create vite@latest frontend -- --template react
```

Then install frontend dependencies:

```bash
cd frontend
npm install
npm install axios react-router-dom chart.js react-chartjs-2
npm install -D tailwindcss postcss autoprefixer
```

## Step 17. Create the frontend environment file

Create:

```text
frontend/.env
```

Put this code inside:

```env
VITE_API_URL=http://localhost:5000/api
```

Also create:

```text
frontend/.env.example
```

with the same variable.

## Step 18. Create the frontend API helper

Create:

```text
frontend/src/services/api.js
```

Put the API helper code there. This file stores the session in local storage and automatically attaches JWT tokens to requests.

Important code:

```js
const SESSION_KEY = "ucu-innovators-session";
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
export const UPLOADS_URL = API_BASE_URL.replace(/\/api$/, "");
```

## Step 19. Create the main page and component files

Create these component files:

```text
frontend/src/components/Navbar.jsx
frontend/src/components/ProjectCard.jsx
```

Create these page files:

```text
frontend/src/pages/Home.jsx
frontend/src/pages/Login.jsx
frontend/src/pages/Register.jsx
frontend/src/pages/SubmitProject.jsx
frontend/src/pages/MyProjects.jsx
frontend/src/pages/Leaderboard.jsx
frontend/src/pages/Dashboard.jsx
frontend/src/pages/SupervisorPanel.jsx
```

### What goes where

- `Navbar.jsx` goes in `frontend/src/components/` because it is reused across multiple pages.
- `ProjectCard.jsx` goes in `frontend/src/components/` because it renders each project card and is reused in the project feed.
- Every route screen goes in `frontend/src/pages/` because each one represents a page.
- `api.js` goes in `frontend/src/services/` because it is a shared data service.

## Step 20. Create the app routes file

Create or update:

```text
frontend/src/App.jsx
```

This file should register:

- `/`
- `/login`
- `/register`
- `/submit`
- `/my-projects`
- `/leaderboard`
- `/dashboard`
- `/supervisor`

Key route code:

```js
<Route path="/supervisor" element={<SupervisorPanel />} />
```

## Step 21. Start the frontend

In `frontend/`, run:

```bash
npm run dev
```

Open the Vite URL in the browser.

## Step 22. Verify the full system

At this point:

1. backend should be running on port `5000`
2. frontend should be running on a Vite port such as `5173` or `5174`
3. MySQL should contain the `ucu_innovators` database
4. uploads should save into `backend/uploads/`
5. login, register, submit, comment, like, analytics, and supervisor grading should all work

---

## 1. Project idea

The problem this project solves is simple:

In many school or university environments, students build good projects, but there is no central place to:

- submit them formally,
- review them,
- publish them,
- collect feedback,
- track likes/comments,
- and let supervisors grade them in one workflow.

UCU Innovators Hub turns that process into a single platform.

### Main actors in the system

#### Student
A student can:
- register an account,
- log in,
- submit a project,
- upload a document,
- add a GitHub link,
- see their own submitted projects,
- like approved projects,
- comment on projects,
- view published projects and project analytics.

#### Supervisor
A supervisor can:
- register using a valid supervisor ID,
- log in as a supervisor,
- open the supervisor panel,
- see all submitted projects,
- approve or reject them,
- grade them using letter grades,
- add written feedback,
- comment directly on projects.

#### Admin
The schema supports an `admin` role as well, although the current UI is primarily focused on student and supervisor workflows.

---

## 2. Tech stack

### Frontend
- React 19
- Vite 8
- React Router DOM
- Axios
- Tailwind CSS
- Chart.js
- react-chartjs-2

### Backend
- Node.js
- Express
- mysql2
- bcryptjs
- jsonwebtoken
- validator
- multer
- dotenv
- cors

### Database
- MySQL

---

## 3. High-level architecture

The application follows a classic 3-layer full-stack structure:

```text
React Frontend
    |
    | HTTP requests (Axios)
    v
Express REST API
    |
    | SQL queries
    v
MySQL Database
```

### Request flow example

When a user submits a project:

1. The React form collects title, description, category, technologies, GitHub link, and a document.
2. The frontend sends a `multipart/form-data` request to the Express backend.
3. The backend authenticates the user with JWT.
4. Multer processes the uploaded file and stores it in `backend/uploads/`.
5. The project record is inserted into MySQL.
6. The project appears in the student’s personal submissions view.
7. A supervisor later reviews, approves, rejects, grades, and comments on it.

---

## 4. Folder structure

```text
ucu-innovator-hub/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── healthController.js
│   │   └── projectController.js
│   ├── database/
│   │   ├── schema.sql
│   │   ├── seed.sql
│   │   └── migrate_supervisor_grading.sql
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── uploadMiddleware.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── healthRoutes.js
│   │   └── projectRoutes.js
│   ├── uploads/
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   └── ProjectCard.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── Leaderboard.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── MyProjects.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── SubmitProject.jsx
│   │   │   └── SupervisorPanel.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
└── README.md
```

---

## 5. Core features implemented

### Authentication and roles
- User registration
- User login
- JWT token generation
- Role-based authorization
- Supervisor-only registration IDs

### Student project workflow
- Submit projects
- Upload documents
- Add GitHub repository links
- See personal submissions
- View published projects
- Like projects
- Comment on projects

### Supervisor workflow
- Register as supervisor using a valid supervisor ID
- See all student projects
- Approve or reject projects
- Assign grades: `A`, `B`, `C`, `D`, `F`
- Write grading feedback
- Comment on projects

### Platform features
- Health endpoint for API + DB status
- Analytics dashboard
- Leaderboard of top innovators
- Public project feed
- My Projects page

---

## 6. Database design

The system is built on a relational MySQL schema.

### Tables

#### `users`
Stores all registered users.

Important fields:
- `id`
- `name`
- `email`
- `password`
- `role`
- `supervisor_code`
- `created_at`

#### `valid_supervisor_ids`
Stores the pre-approved supervisor registration IDs.

Important fields:
- `code`
- `used`
- `used_by`

This is how the platform prevents random users from registering as supervisors.

#### `projects`
Stores submitted projects.

Important fields:
- `title`
- `description`
- `category`
- `technologies`
- `github_link`
- `document`
- `status`
- `user_id`
- `grade`
- `grade_comment`
- `graded_by`

#### `comments`
Stores project comments.

#### `likes`
Stores project likes with a uniqueness constraint so that one user can like a project only once.

### Schema snippet

```sql
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('student', 'supervisor', 'admin') NOT NULL DEFAULT 'student',
  supervisor_code VARCHAR(20) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

```sql
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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Supervisor IDs

The database seeds 20 supervisor IDs:

```sql
INSERT IGNORE INTO valid_supervisor_ids (code) VALUES
  ('SP1901'), ('SP1902'), ('SP1903'), ('SP1904'), ('SP1905'),
  ('SP1906'), ('SP1907'), ('SP1908'), ('SP1909'), ('SP1910'),
  ('SP1911'), ('SP1912'), ('SP1913'), ('SP1914'), ('SP1915'),
  ('SP1916'), ('SP1917'), ('SP1918'), ('SP1919'), ('SP1920');
```

---

## 7. Sample seeded accounts

The sample seed creates three users:

- `alice@example.com` — student
- `brian@example.com` — student
- `sarah@example.com` — supervisor

Seed password for all sample accounts:

```text
password123
```

If you need the supervisor workflow immediately, use Sarah’s account after seeding, or register a new supervisor using one of the unused `SP19xx` codes.

---

## 8. Backend setup

### Step 1: install backend dependencies

```bash
cd backend
npm install
```

### Step 2: create backend environment file

Use the example file:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=root
DB_NAME=ucu_innovators
JWT_SECRET=change-me
```

Save that as:

```text
backend/.env
```

### Step 3: start the backend

```bash
npm run dev
```

or

```bash
npm start
```

### Backend entry point

```js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import healthRoutes from "./routes/healthRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
```

This code shows the backend’s main responsibilities:
- enable CORS,
- parse JSON,
- serve uploaded documents,
- mount API route groups.

---

## 9. Frontend setup

### Step 1: install frontend dependencies

```bash
cd frontend
npm install
```

### Step 2: create frontend environment file

```env
VITE_API_URL=http://localhost:5000/api
```

Save that as:

```text
frontend/.env
```

### Step 3: start the frontend

```bash
npm run dev
```

Vite will normally run on a local port such as `5173` or `5174`.

---

## 10. Database setup

### Option A: fresh database setup

Run the schema file first:

- `backend/database/schema.sql`

Then run the seed file:

- `backend/database/seed.sql`

### Option B: existing database that already used the old schema

Run the migration file:

- `backend/database/migrate_supervisor_grading.sql`

This migration adds:
- supervisor registration codes,
- project grading columns,
- foreign key for grader tracking.

### DB connection code

```js
import mysql from "mysql2";

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_NAME || "ucu_innovators",
  waitForConnections: true,
  connectionLimit: 10,
});

export default pool.promise();
```

This file centralizes the MySQL connection and exposes a promise-based pool for clean async/await controller code.

---

## 11. Authentication system

The backend uses JWT for authentication.

### Registration logic

Key responsibilities of registration:
- trim and normalize user input,
- validate email with `validator`,
- enforce password length,
- allow only `student` or `supervisor` registration,
- require `supervisor_code` for supervisors,
- check that supervisor codes begin with `SP19`,
- verify that the code exists and has not been used,
- hash the password with bcrypt,
- store the user,
- mark the supervisor code as used.

### Registration code snippet

```js
if (chosenRole === "supervisor") {
  const trimmedCode = supervisor_code?.trim().toUpperCase();

  if (!trimmedCode) {
    return res.status(400).json({ message: "Supervisor ID is required for supervisor accounts" });
  }

  if (!/^SP19\d+$/.test(trimmedCode)) {
    return res.status(400).json({ message: "Invalid Supervisor ID format. Must start with SP19 followed by digits" });
  }

  const [codeRows] = await pool.query(
    "SELECT id, used FROM valid_supervisor_ids WHERE code = ?",
    [trimmedCode]
  );

  if (codeRows.length === 0) {
    return res.status(400).json({ message: "Supervisor ID not recognised. Contact the administrator" });
  }

  if (codeRows[0].used) {
    return res.status(400).json({ message: "Supervisor ID has already been used by another account" });
  }
}
```

### Login logic

On login:
- email is normalized,
- password is checked against the hashed password,
- a JWT token is signed,
- the frontend receives both the token and lightweight user data.

### JWT middleware

```js
export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization token is required" });
  }

  const token = authHeader.split(" ")[1];

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
```

This is the key bridge between frontend session storage and protected backend APIs.

---

## 12. Frontend session handling

The frontend stores the authenticated session in `localStorage`.

### Session helper code

```js
const SESSION_KEY = "ucu-innovators-session";
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const getSession = () => {
  const rawSession = localStorage.getItem(SESSION_KEY);

  if (!rawSession) {
    return null;
  }

  try {
    return JSON.parse(rawSession);
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
};

export const getCurrentUser = () => getSession()?.user || null;
```

### Axios auth interceptor

```js
API.interceptors.request.use((config) => {
  const session = getSession();

  if (session?.token) {
    config.headers.Authorization = `Bearer ${session.token}`;
  }

  return config;
});
```

This means the frontend does not need to manually attach JWT headers for every request. It happens automatically.

---

## 13. Student registration flow

The registration page now supports both roles.

### What the UI does
- collects name, email, password,
- asks whether the user is a student or supervisor,
- conditionally shows the Supervisor ID field,
- validates the ID format on the frontend,
- sends the payload to `/auth/register`,
- logs the user in immediately after successful registration,
- redirects students to `/` and supervisors to `/supervisor`.

### Registration UI snippet

```js
await API.post("/auth/register", {
  name: trimmedName,
  email: trimmedEmail,
  password,
  role,
  supervisor_code: role === "supervisor" ? trimmedCode : undefined,
});
```

This mirrors the backend validation rules and improves the user experience before the server even responds.

---

## 14. Project submission flow

The student submission form sends a `FormData` request so that a document file can be uploaded together with other text fields.

### Submission code snippet

```js
const formData = new FormData();

formData.append("title", title);
formData.append("description", description);
formData.append("category", category);
formData.append("technologies", technologies);
formData.append("github_link", githubLink);

if (document) {
  formData.append("document", document);
}

await API.post("/projects/submit", formData);
```

### Why `FormData` matters
If a form includes file upload, plain JSON is not enough. `FormData` allows the browser to send both text fields and the uploaded document in one request.

---

## 15. Supervisor grading workflow

This is one of the most important parts of the project because it introduces a controlled academic review flow.

### Supervisor registration control
Only people with a valid supervisor code such as `SP1901` can create supervisor accounts.

### Supervisor panel responsibilities
The supervisor panel:
- loads all projects,
- filters by status,
- shows author name and technologies,
- shows project document and GitHub link,
- allows approve/reject actions,
- allows grading with `A-F`,
- allows text feedback,
- allows comments.

### Backend grading logic

```js
export const gradeProject = async (req, res) => {
  const { id } = req.params;
  const { grade, feedback } = req.body;

  const validGrades = ["A", "B", "C", "D", "F"];
  if (!grade || !validGrades.includes(grade.toUpperCase())) {
    return res.status(400).json({ message: "Grade must be one of A, B, C, D, F" });
  }

  await pool.query(
    "UPDATE projects SET grade = ?, grade_comment = ?, graded_by = ?, status = 'approved' WHERE id = ?",
    [grade.toUpperCase(), feedback || null, req.user.id, id]
  );

  res.json({ message: "Project graded successfully" });
};
```

### Why this matters
This design turns the platform from a simple project board into an evaluation system. The supervisor does not just view projects; they can make a formal academic judgment.

---

## 16. Public project feed

The home page loads all approved projects and displays them using a reusable `ProjectCard` component.

### What visitors can see
- title
- description
- author
- category
- technologies
- GitHub link
- uploaded document link
- like count
- comment count
- grade badge
- supervisor feedback

### Project loading code

```js
const res = await API.get("/projects");
setProjects(res.data);
```

Only approved projects are shown publicly.

---

## 17. Likes and comments system

### Likes
A logged-in user can like a project once.

The backend protects against duplicates:

```js
const [existingLike] = await pool.query(
  "SELECT id FROM likes WHERE project_id=? AND user_id=?",
  [project_id, req.user.id]
);

if (existingLike.length > 0) {
  return res.status(409).json({ message: "Project already liked" });
}
```

### Comments
Comments are stored in a separate table and joined with the `users` table so the frontend can show the comment author’s name.

```js
SELECT comments.id, comments.comment, comments.project_id, comments.user_id, users.name AS user_name
FROM comments
LEFT JOIN users ON users.id = comments.user_id
WHERE comments.project_id=?
ORDER BY comments.id DESC
```

This gives a simple social layer to the platform and makes each project feel active rather than static.

---

## 18. My Projects page

Students can open the My Projects page to see all of their own submissions, including:
- pending projects,
- approved projects,
- rejected projects,
- document links,
- GitHub links,
- engagement counts,
- grading information.

This is important because a student should always be able to track what they submitted, even if the project is not yet public.

---

## 19. Dashboard and analytics

The platform includes a dashboard powered by Chart.js.

### Metrics returned by the backend
- total users
- total projects
- total likes
- total comments
- projects by category
- trending technologies

### Analytics response shape

```js
res.json({
  totals: {
    users: users[0].total_users,
    projects: projects[0].total_projects,
    likes: likes[0].total_likes,
    comments: comments[0].total_comments,
  },
  projects_by_category: categories,
  trending_technologies: technologies,
});
```

### Frontend chart usage

```js
const data = {
  labels: ["Projects", "Likes", "Comments"],
  datasets: [
    {
      label: "Platform Activity",
      data: [totals.projects, totals.likes, totals.comments],
      backgroundColor: ["#0f766e", "#ea580c", "#1d4ed8"],
    },
  ],
};
```

This helps demonstrate platform activity visually during a presentation.

---

## 20. Leaderboard

The leaderboard ranks users by the total likes received on their projects.

### Query idea
The backend joins users, projects, and likes, then aggregates by user.

This feature turns project publication into something motivating and visible across the platform.

---

## 21. Health check endpoint

The backend includes a health endpoint for operational verification.

### Endpoint

```text
GET /api/health
```

### Controller snippet

```js
export const getHealth = async (req, res) => {
  const health = {
    status: "ok",
    api: "ok",
    database: "ok",
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.floor(process.uptime()),
  };

  try {
    await pool.query("SELECT 1 AS ok");
    return res.json(health);
  } catch (error) {
    return res.status(503).json({
      ...health,
      status: "degraded",
      database: "error",
      database_error: error.code || error.message,
    });
  }
};
```

### Example success response

```json
{
  "status": "ok",
  "api": "ok",
  "database": "ok",
  "timestamp": "2026-03-11T12:00:00.000Z",
  "uptime_seconds": 321
}
```

This is useful during development, testing, and presentation demos.

---

## 22. Postman testing guide

This section explains how to test the backend without the frontend. It is useful when you want to verify the API independently or demonstrate the backend step by step.

## Step 1. Create a Postman collection

Create a collection named:

```text
UCU Innovators Hub API
```

Create a Postman environment variable:

```text
baseUrl = http://localhost:5000/api
```

Then use `{{baseUrl}}` in all requests.

## Step 2. Test the health endpoint

Request:

```http
GET {{baseUrl}}/health
```

Expected response:

```json
{
  "status": "ok",
  "api": "ok",
  "database": "ok"
}
```

If this fails, stop and fix the backend or database connection first.

## Step 3. Test student registration

Request:

```http
POST {{baseUrl}}/auth/register
Content-Type: application/json
```

Body:

```json
{
  "name": "Test Student",
  "email": "teststudent1@example.com",
  "password": "password123",
  "role": "student"
}
```

Expected response:

```json
{
  "message": "User registered successfully",
  "userId": 4
}
```

## Step 4. Test supervisor registration

Request:

```http
POST {{baseUrl}}/auth/register
Content-Type: application/json
```

Body:

```json
{
  "name": "Test Supervisor",
  "email": "supervisor1@example.com",
  "password": "password123",
  "role": "supervisor",
  "supervisor_code": "SP1901"
}
```

Expected behavior:
- the supervisor is registered if the code exists and has not been used,
- registration fails if the code is invalid,
- registration fails if the code was already used.

## Step 5. Test login

Request:

```http
POST {{baseUrl}}/auth/login
Content-Type: application/json
```

Body:

```json
{
  "email": "teststudent1@example.com",
  "password": "password123"
}
```

Expected response:

```json
{
  "message": "Login successful",
  "token": "<jwt>",
  "user": {
    "id": 4,
    "name": "Test Student",
    "role": "student"
  }
}
```

Copy the token. You will use it in the `Authorization` header:

```text
Authorization: Bearer <your-token>
```

## Step 6. Test project submission

Request:

```http
POST {{baseUrl}}/projects/submit
Authorization: Bearer <student-token>
```

In Postman, choose the `form-data` body type and add these fields:

- `title` as Text
- `description` as Text
- `category` as Text
- `technologies` as Text
- `github_link` as Text
- `document` as File

Example values:

```text
title = Smart Hostel System
description = A platform for hostel room issue reporting and maintenance tracking.
category = Operations
technologies = React, Express, MySQL
github_link = https://github.com/example/hostel-system
document = choose a real PDF or DOCX file
```

Expected response:

```json
{
  "message": "Project submitted successfully",
  "projectId": 4
}
```

## Step 7. Test public projects

Request:

```http
GET {{baseUrl}}/projects
```

Expected behavior:
- only approved projects appear,
- pending projects do not appear yet.

## Step 8. Test My Projects

Request:

```http
GET {{baseUrl}}/projects/mine
Authorization: Bearer <student-token>
```

Expected behavior:
- the logged-in student sees all their submissions,
- pending and rejected items are visible here.

## Step 9. Test supervisor login

Use either the seeded supervisor account or the one you created.

Seeded account:

```json
{
  "email": "sarah@example.com",
  "password": "password123"
}
```

Copy the returned supervisor token.

## Step 10. Test supervisor project access

Request:

```http
GET {{baseUrl}}/projects/all
Authorization: Bearer <supervisor-token>
```

Expected behavior:
- the supervisor sees all projects,
- pending, approved, and rejected projects are all visible.

## Step 11. Test approval and rejection

Approve request:

```http
PUT {{baseUrl}}/projects/approve/4
Authorization: Bearer <supervisor-token>
```

Reject request:

```http
PUT {{baseUrl}}/projects/reject/4
Authorization: Bearer <supervisor-token>
```

Use one or the other depending on your demo flow.

## Step 12. Test grading

Request:

```http
POST {{baseUrl}}/projects/grade/4
Authorization: Bearer <supervisor-token>
Content-Type: application/json
```

Body:

```json
{
  "grade": "A",
  "feedback": "Excellent structure, strong idea, and a clear technical implementation."
}
```

Expected response:

```json
{
  "message": "Project graded successfully"
}
```

## Step 13. Test comments

Request:

```http
POST {{baseUrl}}/projects/comment
Authorization: Bearer <token>
Content-Type: application/json
```

Body:

```json
{
  "project_id": 4,
  "comment": "This project has strong potential."
}
```

Then fetch the comments:

```http
GET {{baseUrl}}/projects/comments/4
```

## Step 14. Test likes

Request:

```http
POST {{baseUrl}}/projects/like
Authorization: Bearer <token>
Content-Type: application/json
```

Body:

```json
{
  "project_id": 4
}
```

If you repeat the same request from the same user, the backend should reject it. That proves the one-like-per-user rule is working.

## Step 15. Test analytics and leaderboard

Analytics:

```http
GET {{baseUrl}}/projects/analytics
```

Leaderboard:

```http
GET {{baseUrl}}/projects/leaderboard
```

These are very good requests to show during a demo because they summarize platform activity.

---

## 23. API reference

## Authentication

### Register
```http
POST /api/auth/register
```

Example student request:

```json
{
  "name": "Alice Student",
  "email": "alice@example.com",
  "password": "password123",
  "role": "student"
}
```

Example supervisor request:

```json
{
  "name": "Sarah Supervisor",
  "email": "sarah@example.com",
  "password": "password123",
  "role": "supervisor",
  "supervisor_code": "SP1901"
}
```

### Login
```http
POST /api/auth/login
```

Example request:

```json
{
  "email": "alice@example.com",
  "password": "password123"
}
```

Example response:

```json
{
  "message": "Login successful",
  "token": "<jwt>",
  "user": {
    "id": 1,
    "name": "Alice Student",
    "role": "student"
  }
}
```

## Projects

### Get approved projects
```http
GET /api/projects
```

### Get own projects
```http
GET /api/projects/mine
Authorization: Bearer <jwt>
```

### Get all projects for supervisors
```http
GET /api/projects/all
Authorization: Bearer <jwt>
```

### Submit project
```http
POST /api/projects/submit
Authorization: Bearer <jwt>
Content-Type: multipart/form-data
```

Fields:
- `title`
- `description`
- `category`
- `technologies`
- `github_link`
- `document`

### Approve project
```http
PUT /api/projects/approve/:id
Authorization: Bearer <jwt>
```

### Reject project
```http
PUT /api/projects/reject/:id
Authorization: Bearer <jwt>
```

### Grade project
```http
POST /api/projects/grade/:id
Authorization: Bearer <jwt>
```

Example body:

```json
{
  "grade": "A",
  "feedback": "Excellent problem definition and strong implementation quality."
}
```

### Comment on project
```http
POST /api/projects/comment
Authorization: Bearer <jwt>
```

```json
{
  "project_id": 1,
  "comment": "This is a promising project."
}
```

### Like a project
```http
POST /api/projects/like
Authorization: Bearer <jwt>
```

```json
{
  "project_id": 1
}
```

### Get comments
```http
GET /api/projects/comments/:id
```

### Get likes count
```http
GET /api/projects/likes/:id
```

### Leaderboard
```http
GET /api/projects/leaderboard
```

### Analytics
```http
GET /api/projects/analytics
```

---

## 24. Presentation walkthrough

If you need to present this project, one clean story is:

### Part 1: Introduce the problem
Explain that students build innovative work, but universities often lack a simple digital workflow for submission, review, grading, and public visibility.

### Part 2: Introduce the solution
Explain that UCU Innovators Hub is a role-based platform where students submit innovation projects and supervisors review and grade them.

### Part 3: Explain the architecture
Show that the system has:
- React frontend,
- Express backend,
- MySQL database,
- JWT authentication,
- multer file uploads,
- analytics and grading features.

### Part 4: Explain the user journey
Use this story:

1. A student registers and logs in.
2. The student submits a project with a file and GitHub link.
3. The submission is saved to MySQL and the file goes to the uploads folder.
4. A supervisor logs in using a valid supervisor ID.
5. The supervisor opens the Supervisor Panel.
6. The supervisor reviews the project, comments, approves or rejects it, and assigns a grade.
7. Approved projects appear publicly on the homepage.
8. Users can like and comment on them.
9. The dashboard and leaderboard show platform activity.

### Part 5: Explain what is technically important
Highlight:
- secure password hashing,
- JWT-based auth,
- role-based permissions,
- one-like-per-user enforcement,
- supervisor code validation,
- file upload handling,
- analytics aggregation,
- reusable React components.

---

## 25. What makes this project strong

This project is strong because it is not only CRUD.

It combines multiple real-world full-stack concerns:
- authentication,
- authorization,
- database modeling,
- file uploads,
- environment configuration,
- frontend routing,
- API design,
- analytics,
- moderation,
- grading workflow.

That makes it much closer to a real production-style student system than a simple demo app.

---

## 26. Possible future improvements

If you want to extend the project later, these are natural next steps:

1. Add email verification and password reset.
2. Add project categories as a separate table instead of plain text.
3. Add richer supervisor rubrics instead of only letter grades.
4. Add notifications for approval, rejection, and grading.
5. Add profile pages for students and supervisors.
6. Add pagination and search filters by category and status.
7. Add tests for controllers and frontend pages.
8. Add Docker support for easier deployment.
9. Add admin tools for managing supervisor codes from the UI.
10. Add cloud file storage instead of local disk uploads.

---

## 27. Reproducing the project from scratch

If someone wants to build something similar, the shortest roadmap is:

1. Design the user roles and workflow first.
2. Create a relational schema for users, projects, comments, and likes.
3. Build the Express backend with auth, project, and analytics routes.
4. Add JWT middleware and role guards.
5. Add multer for file uploads.
6. Build the React pages for login, register, home, submit, dashboard, and review.
7. Connect the frontend to the backend using Axios.
8. Store the session token on the frontend and attach it automatically.
9. Add supervisor review logic and grading.
10. Add dashboard and leaderboard views for visibility.

That is exactly the path this repository now demonstrates.

---

## 28. Final summary

UCU Innovators Hub is a complete academic innovation management platform built from scratch using React, Express, and MySQL.

It supports:
- student and supervisor registration,
- secure login,
- project submission,
- document uploads,
- public project publication,
- likes and comments,
- personal project tracking,
- supervisor moderation,
- project grading and feedback,
- dashboard analytics,
- leaderboard ranking,
- health monitoring.

If your goal is to present a real full-stack system with meaningful roles, business logic, and data flow, this project is a strong example.
