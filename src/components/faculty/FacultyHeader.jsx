import React from "react";
import plvlogo from "../../assets/plvlogo.png";


const FacultyHeader = ({ facultyData, totalSections, onLogout }) => {
  return (
    <div className="w-screen">

      

      {/* 🔵 TOP NAV BAR */}
      <div className="bg-[#003366] px-6 py-3 flex items-center justify-between">

        <div className="flex items-center gap-3">
          <img
            src={plvlogo}
            alt="PLV Logo"
            className="w-10 h-10 object-contain"
          />

          <h1 className="text-white text-sm font-semibold">
            Welcome, {facultyData.sex === "Male" ? "Mr." : "Ms."}{" "}
            {facultyData.lastName}!
          </h1>
        </div>

        <button
          onClick={onLogout}
          className="border border-yellow-400 text-yellow-400 px-4 py-2 rounded-lg font-bold text-sm hover:bg-yellow-400 hover:text-[#003366] transition"
        >
          LOGOUT
        </button>
      </div>

      {/* 🟦 MAIN HEADER CARD */}
      <div className="bg-[#003366] text-white rounded-xl p-6 flex justify-between items-center mt-5 mx-6">

        {/* LEFT INFO */}
        <div>
          <h1 className="text-4xl font-bold">
            {facultyData.firstName} {facultyData.lastName}
          </h1>

          <p className="text-sm opacity-80">
            {facultyData.facultyId}
          </p>

          <p className="text-sm opacity-80">
            {facultyData.department}
          </p>
        </div>

        {/* RIGHT STATS */}
        <div className="flex gap-4">

          <div className="bg-white/20 px-5 py-3 rounded-lg text-center">
            <span className="text-xs block">Sections</span>
            <div className="text-lg font-bold">{totalSections}</div>
          </div>

          <div className="bg-yellow-400 text-[#003366] px-5 py-3 rounded-lg text-center font-bold">
            <span className="text-xs block">Classification</span>
            <div className="text-lg">{facultyData.Classification}</div>
          </div>

        </div>
      </div>

    </div>
  );
};

export default FacultyHeader;