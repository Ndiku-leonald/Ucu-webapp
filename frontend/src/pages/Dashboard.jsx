import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from "chart.js";
import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import API from "../services/api";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Dashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await API.get("/projects/analytics");
        setAnalytics(res.data);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Failed to load dashboard analytics");
      }
    };

    fetchAnalytics();
  }, []);

  const totals = analytics?.totals || {
    users: 0,
    projects: 0,
    likes: 0,
    comments: 0,
  };

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

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: "Platform Activity",
      },
    },
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Innovation Dashboard</h1>

      {errorMessage ? (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Users</p>
          <p className="text-3xl font-bold">{totals.users}</p>
        </div>
        <div className="rounded bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Projects</p>
          <p className="text-3xl font-bold">{totals.projects}</p>
        </div>
        <div className="rounded bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Likes</p>
          <p className="text-3xl font-bold">{totals.likes}</p>
        </div>
        <div className="rounded bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Comments</p>
          <p className="text-3xl font-bold">{totals.comments}</p>
        </div>
      </div>

      <div className="bg-white p-4 shadow rounded">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}