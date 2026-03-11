import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API, { getCurrentUser } from "../services/api";

export default function SubmitProject() {

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [technologies, setTechnologies] = useState("");
  const [githubLink, setGithubLink] = useState("");
  const [document, setDocument] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const handleSubmit = async (e) => {

    e.preventDefault();

    if (!currentUser) {
      navigate("/login");
      return;
    }

    setErrorMessage("");

    const formData = new FormData();

    formData.append("title", title);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("technologies", technologies);
    formData.append("github_link", githubLink);

    if (document) {
      formData.append("document", document);
    }

    try {

      await API.post("/projects/submit", formData);

      alert("Project submitted successfully!");

      setTitle("");
      setDescription("");
      setCategory("");
      setTechnologies("");
      setGithubLink("");
      setDocument(null);

    } catch (error) {

      setErrorMessage(error.response?.data?.message || "Project submission failed");

    }

  };

  return (

    <div className="p-6 max-w-xl mx-auto">

      <h1 className="text-2xl font-bold mb-4">
        Submit Innovation Project
      </h1>

      {errorMessage ? (
        <p className="mb-4 rounded bg-red-100 px-3 py-2 text-sm text-red-700">{errorMessage}</p>
      ) : null}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">

        <input
          className="border p-2"
          placeholder="Project Title"
          value={title}
          onChange={(e)=>setTitle(e.target.value)}
        />

        <textarea
          className="border p-2"
          placeholder="Description"
          value={description}
          onChange={(e)=>setDescription(e.target.value)}
        />

        <input
          className="border p-2"
          placeholder="Category"
          value={category}
          onChange={(e)=>setCategory(e.target.value)}
        />

        <input
          className="border p-2"
          placeholder="Technologies"
          value={technologies}
          onChange={(e)=>setTechnologies(e.target.value)}
        />

        <input
          className="border p-2"
          placeholder="GitHub Link"
          value={githubLink}
          onChange={(e)=>setGithubLink(e.target.value)}
        />

        <input
          type="file"
          onChange={(e)=>setDocument(e.target.files[0])}
        />

        <button className="bg-black text-white p-2">
          Submit Project
        </button>

      </form>

    </div>

  );

}