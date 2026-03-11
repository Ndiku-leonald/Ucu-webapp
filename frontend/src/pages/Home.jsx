import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProjectCard from "../components/ProjectCard";
import API, { getCurrentUser } from "../services/api";

export default function Home() {

  const [projects, setProjects] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const currentUser = getCurrentUser();
  const navigate = useNavigate();

  useEffect(() => {

    const fetchProjects = async () => {

      setErrorMessage("");

      try {

        const res = await API.get("/projects");

        setProjects(res.data);

      } catch (error) {

        setErrorMessage(error.response?.data?.message || "Failed to load projects");

      }

    };

    fetchProjects();

  }, []);

  const requireLogin = () => {

    if (!currentUser) {

      navigate("/login");
      return false;

    }

    return true;

  };

  const likeProject = async (id) => {

    if (!requireLogin()) {
      return;
    }

    try {

      await API.post("/projects/like", {
        project_id: id
      });

      setProjects((currentProjects) => currentProjects.map((project) => (
        project.id === id
          ? { ...project, like_count: Number(project.like_count || 0) + 1 }
          : project
      )));

    } catch (error) {

      alert(error.response?.data?.message || "Unable to like project");

    }

  };

  const addComment = async (projectId, comment) => {

    if (!requireLogin()) {
      return false;
    }

    try {

      await API.post("/projects/comment", {
        project_id: projectId,
        comment
      });

      setProjects((currentProjects) => currentProjects.map((project) => (
        project.id === projectId
          ? { ...project, comment_count: Number(project.comment_count || 0) + 1 }
          : project
      )));

      return true;

    } catch (error) {

      alert(error.response?.data?.message || "Unable to add comment");
      return false;

    }

  };

  return (

    <div className="p-6">

      <h1 className="text-3xl font-bold mb-6">
        Innovation Projects
      </h1>

      {errorMessage ? (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {!projects.length && !errorMessage ? (
        <p className="text-gray-600">No approved projects are available yet.</p>
      ) : null}

      <div className="space-y-4">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            currentUser={currentUser}
            onLike={() => likeProject(project.id)}
            onAddComment={addComment}
          />
        ))}
      </div>

    </div>

  );

}