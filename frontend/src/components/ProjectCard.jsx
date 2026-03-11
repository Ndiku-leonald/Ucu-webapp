import { useState } from "react";
import API, { UPLOADS_URL } from "../services/api";

const GRADE_COLOUR = {
  A: "bg-green-100 text-green-800",
  B: "bg-blue-100 text-blue-800",
  C: "bg-yellow-100 text-yellow-800",
  D: "bg-orange-100 text-orange-800",
  F: "bg-red-100 text-red-800",
};

export default function ProjectCard({ project, currentUser, onLike, onAddComment }) {
  const [commentText,      setCommentText]      = useState("");
  const [comments,         setComments]         = useState([]);
  const [commentsVisible,  setCommentsVisible]  = useState(false);
  const [loadingComments,  setLoadingComments]  = useState(false);

  const toggleComments = async () => {
    if (!commentsVisible && comments.length === 0) {
      setLoadingComments(true);
      try {
        const res = await API.get(`/projects/comments/${project.id}`);
        setComments(res.data);
      } catch (error) {
        alert(error.response?.data?.message || "Unable to load comments");
      } finally {
        setLoadingComments(false);
      }
    }
    setCommentsVisible((v) => !v);
  };

  const submitComment = async (event) => {
    event.preventDefault();
    if (!commentText.trim()) return;

    const wasSaved = await onAddComment(project.id, commentText.trim());
    if (!wasSaved) return;

    setComments((prev) => [
      { id: `draft-${Date.now()}`, comment: commentText.trim(), user_name: currentUser?.name || "You" },
      ...prev,
    ]);
    setCommentText("");
    setCommentsVisible(true);
  };

  return (
    <article className="rounded border bg-white p-4 shadow">

      {/* Title row + grade badge */}
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <h2 className="text-xl font-semibold">{project.title}</h2>
        {project.grade && (
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${GRADE_COLOUR[project.grade] || "bg-gray-100 text-gray-700"}`}>
            Grade: {project.grade}
          </span>
        )}
      </div>

      <p className="mt-2 text-gray-700">{project.description}</p>
      <p className="mt-2 text-sm text-gray-500">By {project.author_name || "Unknown author"}</p>
      <p className="mt-1 text-sm text-gray-500">Category: {project.category}</p>
      <p className="mt-1 text-sm text-gray-500">Technologies: {project.technologies || "Not provided"}</p>

      {/* Supervisor feedback (visible to everyone) */}
      {project.grade_comment && (
        <p className="mt-1 text-xs italic text-gray-500">
          Supervisor feedback: {project.grade_comment}
        </p>
      )}

      {/* Links */}
      <div className="mt-3 flex flex-wrap gap-4">
        {project.github_link && (
          <a className="text-sm font-semibold text-blue-700" href={project.github_link} target="_blank" rel="noreferrer">
            View repository
          </a>
        )}
        {project.document && (
          <a
            className="text-sm font-semibold text-teal-700"
            href={`${UPLOADS_URL}/uploads/${project.document}`}
            target="_blank"
            rel="noreferrer"
          >
            View document
          </a>
        )}
      </div>

      {/* Like + Comments buttons */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="rounded bg-blue-500 px-3 py-1 text-white" onClick={onLike}>
          Like ({project.like_count || 0})
        </button>
        <button className="rounded bg-green-600 px-3 py-1 text-white" onClick={toggleComments}>
          Comments ({project.comment_count || 0})
        </button>
      </div>

      {/* Comment section */}
      {commentsVisible && (
        <div className="mt-4 rounded border border-gray-200 bg-gray-50 p-3">
          {loadingComments && <p className="text-sm text-gray-500">Loading comments...</p>}

          {!loadingComments && comments.length === 0 && (
            <p className="text-sm text-gray-500">No comments yet.</p>
          )}

          <div className="space-y-2">
            {comments.map((comment) => (
              <div key={comment.id} className="rounded bg-white px-3 py-2 text-sm shadow-sm">
                <p className="font-semibold text-gray-800">{comment.user_name || "Anonymous"}</p>
                <p className="text-gray-700">{comment.comment}</p>
              </div>
            ))}
          </div>

          <form className="mt-3 flex gap-2" onSubmit={submitComment}>
            <input
              className="flex-1 rounded border px-3 py-2 text-sm"
              placeholder={currentUser ? "Write a comment" : "Login to comment"}
              value={commentText}
              disabled={!currentUser}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <button
              className="rounded bg-black px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:bg-gray-400"
              disabled={!currentUser}
            >
              Post
            </button>
          </form>
        </div>
      )}
    </article>
  );
}
