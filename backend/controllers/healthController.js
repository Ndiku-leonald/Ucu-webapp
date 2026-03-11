import pool from "../config/db.js";

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
