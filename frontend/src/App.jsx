import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import SubmitProject from "./pages/SubmitProject";
import Leaderboard from "./pages/Leaderboard";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MyProjects from "./pages/MyProjects";
import SupervisorPanel from "./pages/SupervisorPanel";

function App() {

  return (
    <BrowserRouter>

      <Navbar />

      <Routes>

        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route path="/submit" element={<SubmitProject />} />

        <Route path="/my-projects" element={<MyProjects />} />

        <Route path="/leaderboard" element={<Leaderboard />} />

        <Route path="/dashboard" element={<Dashboard />} />

  <Route path="/supervisor" element={<SupervisorPanel />} />

      </Routes>

    </BrowserRouter>
  )

}

export default App