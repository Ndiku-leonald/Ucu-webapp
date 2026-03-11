import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API, { setSession } from "../services/api";

export default function Login() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {

    e.preventDefault();
    setErrorMessage("");

    try {

      const res = await API.post("/auth/login", {
        email,
        password
      });

      setSession({
        token: res.data.token,
        user: res.data.user,
      });

      navigate("/");

    } catch (error) {

      setErrorMessage(error.response?.data?.message || "Login failed");

    }

  };

  return (

    <div className="flex justify-center items-center h-screen bg-slate-100 px-4">

      <form
        onSubmit={handleLogin}
        className="bg-white p-6 shadow rounded w-full max-w-sm"
      >

        <h1 className="text-2xl font-bold mb-4">
          Login
        </h1>

        {errorMessage ? (
          <p className="mb-3 rounded bg-red-100 px-3 py-2 text-sm text-red-700">{errorMessage}</p>
        ) : null}

        <input
          className="border p-2 w-full mb-3"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="border p-2 w-full mb-3"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          className="bg-black text-white w-full p-2"
        >
          Login
        </button>

        <p className="mt-4 text-sm text-gray-600">
          Need an account? <Link to="/register" className="font-semibold text-black">Register</Link>
        </p>

      </form>

    </div>

  );

}