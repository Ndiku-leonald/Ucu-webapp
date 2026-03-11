import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API, { getCurrentUser, UPLOADS_URL } from "../services/api";

const STATUS_STYLES = {
  approved: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  rejected: "bg-red-100 text-red-700",
};

export default function MyProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const currentUser = getCurrentUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    const fetchMyProjects = async () => {
      try {
        const res = await API.get("/projects/mine");
        setProjects(res.data);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Failed to load your projects");
      } finally {
        setLoading(false);
      }
    };

    fetchMyProjects();
  }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">My Projects</h1>
        <Link
          to="/submit"
          className="rounded bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
        >
          + Submit new project
        </Link>
      </div>

      {errorMessage ? (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {loading ? (
        <p className="text-gray-500">Loading your projects…</p>
      ) : null}

      {!loading && projects.length === 0 && !errorMessage ? (
        <div className="rounded border border-dashed border-gray-300 p-8 text-center text-gray-500">
          <p className="mb-3">You have not submitted any projects yet.</p>
          <Link to="/submit" className="font-semibold text-black underline">
            Submit your first project
          </Link>
        </div>
      ) : null}

      <div className="space-y-4">
        {projects.map((project) => (
          <article key={project.id} className="rounded border bg-white p-4 shadow">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-lg font-semibold">{project.title}</h2>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                  STATUS_STYLES[project.status] || "bg-gray-100 text-gray-700"
                }`}
              >
                {project.status}
              </span>
            </div>

            <p className="mt-2 text-sm text-gray-700">{project.description}</p>

            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-500">
              <span>Category: {project.category}</span>
              <span>Technologies: {project.technologies || "—"}</span>
              <span>Likes: {project.like_count || 0}</span>
              <span>Comments: {project.comment_count || 0}</span>
            </div>

            <div className="mt-3 flex flex-wrap gap-4">
              {project.github_link ? (
                <a
                  className="text-sm font-semibold text-blue-700"
                  href={project.github_link}
                  target="_blank"
                  rel="noreferrer"
                >
                  View repository
                </a>
              ) : null}

              {project.document ? (
                <a
                  className="text-sm font-semibold text-teal-700"
                  href={`${UPLOADS_URL}/uploads/${project.document}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  View uploaded document
                </a>
              ) : null}
            </div>

            {project.status === "rejected" ? (
              <p className="mt-3 text-xs text-red-600">
                This project was rejected. You can submit a new, revised version.
              </p>
            ) : null}

            {project.status === "pending" ? (
              <p className="mt-3 text-xs text-yellow-700">
                Awaiting supervisor approval before it appears publicly.
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
