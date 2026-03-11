import pool from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import validator from "validator";

const JWT_SECRET = process.env.JWT_SECRET || "secretkey";

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, supervisor_code } = req.body;
    const normalizedName  = name?.trim();
    const normalizedEmail = email?.trim().toLowerCase();
    const chosenRole      = role === "supervisor" ? "supervisor" : "student";

    if (!normalizedName || !normalizedEmail || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    if (!validator.isEmail(normalizedEmail)) {
      return res.status(400).json({ message: "Enter a valid email address" });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long" });
    }

    // --- Supervisor code validation ---
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

    const [existingUsers] = await pool.query(
      "SELECT id FROM users WHERE email=?",
      [normalizedEmail]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const codeToStore    = chosenRole === "supervisor" ? supervisor_code.trim().toUpperCase() : null;

    const [result] = await pool.query(
      "INSERT INTO users (name, email, password, role, supervisor_code) VALUES (?,?,?,?,?)",
      [normalizedName, normalizedEmail, hashedPassword, chosenRole, codeToStore]
    );

    // Mark supervisor code as used so nobody else can reuse it
    if (chosenRole === "supervisor") {
      await pool.query(
        "UPDATE valid_supervisor_ids SET used = 1, used_by = ? WHERE code = ?",
        [result.insertId, codeToStore]
      );
    }

    res.json({
      message: "User registered successfully",
      userId: result.insertId
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const loginUser = async (req, res) => {
  try {

    const normalizedEmail = req.body.email?.trim().toLowerCase();
    const { password } = req.body;

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const [rows] = await pool.query(
      "SELECT * FROM users WHERE email=?",
      [normalizedEmail]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    const user = rows[0];

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
