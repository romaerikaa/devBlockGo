import React, { useState } from "react";
import plvbg from "../plvbg.png";
import plvlogo from "../plvlogo.png";

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!email.includes("faculty") && !email.includes("student")) {
      alert("Unauthorized email address.");
      return;
    }

    onLogin(email);
  };

  return (
    <div className="flex h-screen">

      {/* LEFT IMAGE */}
      <div
        className="hidden md:block md:w-1/2 bg-cover bg-center"
        style={{ backgroundImage: `url(${plvbg})` }}
      />

      {/* RIGHT FORM */}
      <div className="flex items-center justify-center w-full md:w-1/2 bg-white">
        <div className="w-full max-w-sm px-6">

          {/* LOGO */}
          <img
            src={plvlogo}
            alt="PLV Logo"
            className="w-24 mb-3 ml-auto"
          />

          {/* TITLE */}
          <h2 className="text-2xl font-semibold text-[#003366] mb-6 text-center">
            Welcome
          </h2>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="block text-sm mb-1 text-gray-700">
                Email
              </label>
              <input
                type="email"
                placeholder="faculty@gmail.com / student@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm mb-1 text-gray-700">
                Password
              </label>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#003366] text-white rounded-lg font-bold hover:bg-[#002244] transition"
            >
              Sign In
            </button>
          </form>

          <p className="text-sm text-gray-500 mt-4 text-center">
            Forgot Password?
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;