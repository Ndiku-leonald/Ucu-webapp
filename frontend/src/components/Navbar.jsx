import { Link } from "react-router-dom";
import { clearSession, getCurrentUser } from "../services/api";

export default function Navbar() {
  const currentUser = getCurrentUser();

  const handleLogout = () => {
    clearSession();
    window.location.href = "/login";
  };

  return (
    <div className="bg-black text-white p-4 flex flex-wrap items-center justify-between gap-4">
      <div className="flex gap-6 flex-wrap">
        <Link to="/">Home</Link>
        {currentUser?.role !== "supervisor" && <Link to="/submit">Submit Project</Link>}
        {currentUser && currentUser.role !== "supervisor" && (
          <Link to="/my-projects">My Projects</Link>
        )}
        <Link to="/leaderboard">Leaderboard</Link>
        <Link to="/dashboard">Dashboard</Link>
        {currentUser?.role === "supervisor" && (
          <Link to="/supervisor" className="text-yellow-300 font-semibold">
            Supervisor Panel
          </Link>
        )}
      </div>

      <div className="flex items-center gap-4">
        {currentUser ? (
          <>
            <span className="text-sm">
              {currentUser.name}
              {currentUser.role === "supervisor" && (
                <span className="ml-1 text-xs text-yellow-300">(Supervisor)</span>
              )}
            </span>
            <button onClick={handleLogout} className="rounded border border-white px-3 py-1 text-sm">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </div>
  );
}
