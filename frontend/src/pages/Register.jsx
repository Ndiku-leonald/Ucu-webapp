import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API, { setSession } from "../services/api";

export default function Register() {

  const [name,           setName]           = useState("");
  const [email,          setEmail]          = useState("");
  const [password,       setPassword]       = useState("");
  const [role,           setRole]           = useState("student");
  const [supervisorCode, setSupervisorCode] = useState("");
  const [errorMessage,   setErrorMessage]   = useState("");
  const [isSubmitting,   setIsSubmitting]   = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const trimmedName  = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedCode  = supervisorCode.trim().toUpperCase();

    if (!trimmedName || !trimmedEmail || !password) {
      setErrorMessage("Name, email, and password are required");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long");
      return;
    }

    if (role === "supervisor" && !trimmedCode) {
      setErrorMessage("Supervisor ID is required when registering as a supervisor");
      return;
    }

    if (role === "supervisor" && !/^SP19\d+$/.test(trimmedCode)) {
      setErrorMessage("Supervisor ID must start with SP19 (e.g. SP1901)");
      return;
    }

    setIsSubmitting(true);

    try {
      await API.post("/auth/register", {
        name:            trimmedName,
        email:           trimmedEmail,
        password,
        role,
        supervisor_code: role === "supervisor" ? trimmedCode : undefined,
      });

      const loginResponse = await API.post("/auth/login", {
        email:    trimmedEmail,
        password,
      });

      setSession({
        token: loginResponse.data.token,
        user:  loginResponse.data.user,
      });

      navigate(loginResponse.data.user.role === "supervisor" ? "/supervisor" : "/");

    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-slate-100 px-4 py-10">

      <form
        onSubmit={handleRegister}
        className="bg-white p-6 shadow rounded w-full max-w-sm"
      >
        <h1 className="text-2xl font-bold mb-4">Create Account</h1>

        {errorMessage && (
          <p className="mb-3 rounded bg-red-100 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </p>
        )}

        <input
          className="border p-2 w-full mb-3 rounded"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className="border p-2 w-full mb-3 rounded"
          placeholder="Email address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="border p-2 w-full mb-3 rounded"
          placeholder="Password (min 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            I am registering as
          </label>
          <select
            className="border p-2 w-full rounded bg-white"
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setSupervisorCode("");
              setErrorMessage("");
            }}
          >
            <option value="student">Student</option>
            <option value="supervisor">Supervisor</option>
          </select>
        </div>

        {role === "supervisor" && (
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supervisor ID
            </label>
            <input
              className="border p-2 w-full rounded font-mono tracking-widest"
              placeholder="e.g. SP1901"
              value={supervisorCode}
              onChange={(e) => setSupervisorCode(e.target.value)}
            />
            <p className="mt-1 text-xs text-gray-500">
              Your unique Supervisor ID starts with <strong>SP19</strong>.
              Contact the administrator if you do not have one.
            </p>
          </div>
        )}

        <button
          className="bg-black text-white w-full p-2 rounded disabled:cursor-not-allowed disabled:bg-gray-500"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating account..." : "Register"}
        </button>

        <p className="mt-4 text-sm text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-black">Login</Link>
        </p>
      </form>

    </div>
  );
}
