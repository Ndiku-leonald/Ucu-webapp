import express from "express";
import {
 submitProject,
 getProjects,
 getAllProjects,
 getUserProjects,
 searchProjects,
 approveProject,
 rejectProject,
 gradeProject,
 addComment,
 getComments,
 likeProject,
 getLikes,
 topInnovators,
 getAnalytics
} from "../controllers/projectController.js";
import upload from "../middleware/uploadMiddleware.js";
import { authorizeRoles, requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// Submit project with document upload
router.post("/submit", requireAuth, upload.single("document"), submitProject);

// Get all approved projects
router.get("/", getProjects);

// Get the currently logged-in user's own projects
router.get("/mine", requireAuth, getUserProjects);

// Search projects
router.get("/search", searchProjects);

// Supervisor approval system
router.put("/approve/:id", requireAuth, authorizeRoles("supervisor", "admin"), approveProject);
router.put("/reject/:id", requireAuth, authorizeRoles("supervisor", "admin"), rejectProject);

// Supervisor: see all projects (all statuses) + grade a project
router.get("/all", requireAuth, authorizeRoles("supervisor", "admin"), getAllProjects);
router.post("/grade/:id", requireAuth, authorizeRoles("supervisor", "admin"), gradeProject);

// Comments system
router.post("/comment", requireAuth, addComment);
router.get("/comments/:id", getComments);

// Likes system
router.post("/like", requireAuth, likeProject);
router.get("/likes/:id", getLikes);

// Leaderboard (Top Innovators)
router.get("/leaderboard", topInnovators);

// Analytics
router.get("/analytics", getAnalytics);

export default router;