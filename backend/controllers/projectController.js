import pool from "../config/db.js";

export const submitProject = async (req, res) => {
  try {
    const { title, description, category, technologies, github_link } = req.body;
    const document = req.file ? req.file.filename : null;

    if (!title || !description || !category) {
      return res.status(400).json({ message: "Title, description, and category are required" });
    }

    const [result] = await pool.query(
      `INSERT INTO projects 
      (title, description, category, technologies, github_link, document, user_id)
      VALUES (?,?,?,?,?,?,?)`,
      [title, description, category, technologies || "", github_link || null, document, req.user.id]
    );

    res.status(201).json({
      message: "Project submitted successfully",
      projectId: result.insertId,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getProjects = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        projects.*,
        users.name AS author_name,
        (
          SELECT COUNT(*)
          FROM likes
          WHERE likes.project_id = projects.id
        ) AS like_count,
        (
          SELECT COUNT(*)
          FROM comments
          WHERE comments.project_id = projects.id
        ) AS comment_count
      FROM projects
      LEFT JOIN users ON users.id = projects.user_id
      WHERE projects.status='approved'
      ORDER BY projects.id DESC
    `);

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const searchProjects = async (req, res) => {
  try {
    const { technology = "" } = req.query;

    const [rows] = await pool.query(
      `SELECT projects.*, users.name AS author_name
      FROM projects
      LEFT JOIN users ON users.id = projects.user_id
      WHERE projects.technologies LIKE ? AND projects.status='approved'
      ORDER BY projects.id DESC`,
      [`%${technology}%`]
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const approveProject = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query("UPDATE projects SET status='approved' WHERE id=?", [id]);

    res.json({ message: "Project approved successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const rejectProject = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query("UPDATE projects SET status='rejected' WHERE id=?", [id]);

    res.json({ message: "Project rejected" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const addComment = async (req, res) => {
  try {
    const { project_id, comment } = req.body;

    if (!project_id || !comment) {
      return res.status(400).json({ message: "Project and comment are required" });
    }

    const [result] = await pool.query(
      "INSERT INTO comments (project_id, user_id, comment) VALUES (?,?,?)",
      [project_id, req.user.id, comment]
    );

    res.status(201).json({
      message: "Comment added successfully",
      commentId: result.insertId,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getComments = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT comments.id, comments.comment, comments.project_id, comments.user_id, users.name AS user_name
      FROM comments
      LEFT JOIN users ON users.id = comments.user_id
      WHERE comments.project_id=?
      ORDER BY comments.id DESC`,
      [id]
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const likeProject = async (req, res) => {
  try {
    const { project_id } = req.body;

    if (!project_id) {
      return res.status(400).json({ message: "Project is required" });
    }

    const [existingLike] = await pool.query(
      "SELECT id FROM likes WHERE project_id=? AND user_id=?",
      [project_id, req.user.id]
    );

    if (existingLike.length > 0) {
      return res.status(409).json({ message: "Project already liked" });
    }

    await pool.query("INSERT INTO likes (project_id, user_id) VALUES (?,?)", [project_id, req.user.id]);

    res.status(201).json({ message: "Project liked successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getLikes = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      "SELECT COUNT(*) as likes FROM likes WHERE project_id=?",
      [id]
    );

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const topInnovators = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT users.id, users.name, COUNT(likes.id) AS total_likes
      FROM users
      LEFT JOIN projects ON users.id = projects.user_id
      LEFT JOIN likes ON projects.id = likes.project_id
      GROUP BY users.id, users.name
      ORDER BY total_likes DESC, users.name ASC
      LIMIT 10
    `);

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserProjects = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        projects.*,
        (
          SELECT COUNT(*) FROM likes WHERE likes.project_id = projects.id
        ) AS like_count,
        (
          SELECT COUNT(*) FROM comments WHERE comments.project_id = projects.id
        ) AS comment_count
      FROM projects
      WHERE projects.user_id = ?
      ORDER BY projects.id DESC`,
      [req.user.id]
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ----------------------------------------------------------------
// Supervisor: view ALL projects (all statuses) with grade info
// ----------------------------------------------------------------
export const getAllProjects = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        projects.*,
        students.name  AS author_name,
        graders.name   AS graded_by_name,
        (SELECT COUNT(*) FROM likes    WHERE likes.project_id    = projects.id) AS like_count,
        (SELECT COUNT(*) FROM comments WHERE comments.project_id = projects.id) AS comment_count
      FROM projects
      LEFT JOIN users AS students ON students.id = projects.user_id
      LEFT JOIN users AS graders  ON graders.id  = projects.graded_by
      ORDER BY projects.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ----------------------------------------------------------------
// Supervisor: grade a project  POST /projects/grade/:id
// body: { grade: "A"|"B"|"C"|"D"|"F", feedback: "..." }
// ----------------------------------------------------------------
export const gradeProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { grade, feedback } = req.body;

    const validGrades = ["A", "B", "C", "D", "F"];
    if (!grade || !validGrades.includes(grade.toUpperCase())) {
      return res.status(400).json({ message: "Grade must be one of A, B, C, D, F" });
    }

    const [projectRows] = await pool.query("SELECT id FROM projects WHERE id = ?", [id]);
    if (projectRows.length === 0) {
      return res.status(404).json({ message: "Project not found" });
    }

    await pool.query(
      "UPDATE projects SET grade = ?, grade_comment = ?, graded_by = ?, status = 'approved' WHERE id = ?",
      [grade.toUpperCase(), feedback || null, req.user.id, id]
    );

    res.json({ message: "Project graded successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAnalytics = async (req, res) => {
  try {
    const [users] = await pool.query("SELECT COUNT(*) AS total_users FROM users");
    const [projects] = await pool.query("SELECT COUNT(*) AS total_projects FROM projects");
    const [likes] = await pool.query("SELECT COUNT(*) AS total_likes FROM likes");
    const [comments] = await pool.query("SELECT COUNT(*) AS total_comments FROM comments");

    const [categories] = await pool.query(`
      SELECT category, COUNT(*) AS total
      FROM projects
      GROUP BY category
      ORDER BY total DESC
    `);

    const [technologies] = await pool.query(`
      SELECT technologies, COUNT(*) AS total
      FROM projects
      WHERE technologies IS NOT NULL AND technologies <> ''
      GROUP BY technologies
      ORDER BY total DESC
      LIMIT 5
    `);

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
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};