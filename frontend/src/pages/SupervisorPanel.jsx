import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API, { getCurrentUser, UPLOADS_URL } from "../services/api";

const GRADE_COLOURS = {
  A: "bg-green-100 text-green-800",
  B: "bg-blue-100 text-blue-800",
  C: "bg-yellow-100 text-yellow-800",
  D: "bg-orange-100 text-orange-800",
  F: "bg-red-100 text-red-800",
};

const STATUS_COLOURS = {
  approved: "bg-green-100 text-green-700",
  pending:  "bg-yellow-100 text-yellow-700",
  rejected: "bg-red-100 text-red-700",
};

function GradeForm({ project, onGraded }) {
  const [grade,    setGrade]    = useState(project.grade || "");
  const [feedback, setFeedback] = useState(project.grade_comment || "");
  const [saving,   setSaving]   = useState(false);
  const [msg,      setMsg]      = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!grade) { setMsg("Please select a grade"); return; }
    setSaving(true);
    setMsg("");
    try {
      await API.post("/projects/grade/" + project.id, { grade, feedback });
      setMsg("Graded successfully");
      onGraded(project.id, grade, feedback);
    } catch (err) {
      setMsg(err.response?.data?.message || "Failed to save grade");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-3 border-t pt-3">
      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
        {project.grade ? "Update Grade" : "Assign Grade"}
      </p>

      <div className="flex gap-2 mb-2 flex-wrap">
        {["A","B","C","D","F"].map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGrade(g)}
            className={`w-10 h-10 rounded-full font-bold border-2 transition-all ${
              grade === g
                ? "border-black bg-black text-white"
                : "border-gray-300 text-gray-600 hover:border-gray-600"
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      <textarea
        className="border rounded w-full p-2 text-sm mb-2"
        rows={2}
        placeholder="Optional feedback for the student..."
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
      />

      {msg && (
        <p className={`text-xs mb-2 ${msg.includes("success") ? "text-green-700" : "text-red-600"}`}>
          {msg}
        </p>
      )}

      <button
        className="bg-black text-white text-sm px-4 py-1.5 rounded disabled:bg-gray-400"
        disabled={saving}
      >
        {saving ? "Saving..." : "Save Grade"}
      </button>
    </form>
  );
}

function CommentSection({ project }) {
  const [comments,    setComments]    = useState([]);
  const [newComment,  setNewComment]  = useState("");
  const [open,        setOpen]        = useState(false);
  const [posting,     setPosting]     = useState(false);

  const loadComments = async () => {
    const res = await API.get("/projects/comments/" + project.id);
    setComments(res.data);
  };

  const toggle = () => {
    if (!open) loadComments();
    setOpen(!open);
  };

  const postComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setPosting(true);
    try {
      await API.post("/projects/comment", { project_id: project.id, comment: newComment.trim() });
      setNewComment("");
      loadComments();
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="mt-3">
      <button
        onClick={toggle}
        className="text-sm text-blue-600 hover:underline"
      >
        {open ? "Hide comments" : "Comments"}
      </button>

      {open && (
        <div className="mt-2">
          {comments.length === 0 && (
            <p className="text-xs text-gray-400 italic mb-2">No comments yet</p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="text-xs bg-gray-50 rounded px-2 py-1 mb-1">
              <span className="font-semibold">{c.user_name}: </span>{c.comment}
            </div>
          ))}
          <form onSubmit={postComment} className="flex gap-1 mt-1">
            <input
              className="border rounded p-1 text-xs flex-1"
              placeholder="Add supervisor comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button
              className="bg-black text-white text-xs px-3 rounded disabled:bg-gray-400"
              disabled={posting}
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function SupervisorPanel() {
  const [projects,  setProjects]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState("all");
  const navigate = useNavigate();

  const user = getCurrentUser();

  useEffect(() => {
    if (!user || user.role !== "supervisor") {
      navigate("/login");
      return;
    }
    API.get("/projects/all")
      .then((res) => setProjects(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleGraded = (projectId, grade, feedback) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? { ...p, grade, grade_comment: feedback, status: "approved" }
          : p
      )
    );
  };

  const handleApprove = async (id) => {
    await API.put("/projects/approve/" + id);
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "approved" } : p))
    );
  };

  const handleReject = async (id) => {
    await API.put("/projects/reject/" + id);
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "rejected" } : p))
    );
  };

  const filtered = filter === "all"
    ? projects
    : projects.filter((p) => p.status === filter);

  const counts = {
    all:      projects.length,
    pending:  projects.filter((p) => p.status === "pending").length,
    approved: projects.filter((p) => p.status === "approved").length,
    rejected: projects.filter((p) => p.status === "rejected").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading projects...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-1">Supervisor Panel</h1>
      <p className="text-gray-500 mb-6">
        Welcome, <strong>{user?.name}</strong>. Review, grade and comment on student projects.
      </p>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {["all","pending","approved","rejected"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              filter === f
                ? "bg-black text-white border-black"
                : "bg-white text-gray-600 border-gray-300 hover:border-gray-600"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-gray-400 italic">No projects in this category.</p>
      )}

      <div className="grid gap-6">
        {filtered.map((project) => (
          <div key={project.id} className="bg-white rounded-xl shadow p-5 border border-gray-100">

            {/* Header row */}
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-lg font-bold">{project.title}</h2>
                <p className="text-sm text-gray-500">
                  By <strong>{project.author_name}</strong> &bull; {project.category}
                  {project.technologies ? ` &bull; ${project.technologies}` : ""}
                </p>
              </div>
              <div className="flex gap-2 items-center">
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLOURS[project.status]}`}>
                  {project.status}
                </span>
                {project.grade && (
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${GRADE_COLOURS[project.grade]}`}>
                    Grade: {project.grade}
                  </span>
                )}
              </div>
            </div>

            <p className="text-gray-700 text-sm mt-2">{project.description}</p>

            {/* Links */}
            <div className="flex gap-3 mt-2 flex-wrap">
              {project.github_link && (
                <a href={project.github_link} target="_blank" rel="noreferrer"
                  className="text-xs text-blue-600 hover:underline">
                  GitHub
                </a>
              )}
              {project.document && (
                <a href={`${UPLOADS_URL}/uploads/${project.document}`} target="_blank" rel="noreferrer"
                  className="text-xs text-blue-600 hover:underline">
                  View Document
                </a>
              )}
            </div>

            {project.grade_comment && (
              <p className="mt-2 text-xs italic text-gray-500">
                Feedback: {project.grade_comment}
              </p>
            )}

            {/* Approve / Reject quick actions */}
            {project.status === "pending" && (
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleApprove(project.id)}
                  className="text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleReject(project.id)}
                  className="text-xs bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700"
                >
                  Reject
                </button>
              </div>
            )}

            {/* Grade form */}
            <GradeForm project={project} onGraded={handleGraded} />

            {/* Comment section */}
            <CommentSection project={project} />
          </div>
        ))}
      </div>
    </div>
  );
}
