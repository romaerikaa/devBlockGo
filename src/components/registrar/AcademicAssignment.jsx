import React, { useMemo, useState } from "react";
import { facultyList, sections as sectionList } from "../../data/registrarData";

function AcademicAssignment() {
  const [selectedSchoolYear, setSelectedSchoolYear] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedFacultyId, setSelectedFacultyId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");

  const [savedAssignments, setSavedAssignments] = useState(() => {
    const saved = localStorage.getItem("registrarAssignments");
    return saved ? JSON.parse(saved) : [];
  });

  const schoolYears = [...new Set(sectionList.map((section) => section.schoolYear))];
  const semesters = [...new Set(sectionList.map((section) => section.semester))];
  const programs = [...new Set(sectionList.map((section) => section.program))];

  const filteredFaculty = facultyList.filter(
    (faculty) => faculty.program === selectedProgram
  );

  const filteredSections = sectionList.filter(
    (section) =>
      section.program === selectedProgram &&
      section.schoolYear === selectedSchoolYear &&
      section.semester === selectedSemester
  );

  const selectedFaculty = facultyList.find(
    (faculty) => faculty.id === Number(selectedFacultyId)
  );

  const selectedSection = sectionList.find(
    (section) => section.id === Number(selectedSectionId)
  );

  const handleAssign = () => {
    if (
      !selectedSchoolYear ||
      !selectedSemester ||
      !selectedProgram ||
      !selectedFacultyId ||
      !selectedSectionId
    ) {
      alert("Please complete all fields.");
      return;
    }

    const alreadyExists = savedAssignments.some(
      (item) =>
        item.facultyId === Number(selectedFacultyId) &&
        item.sectionId === Number(selectedSectionId) &&
        item.schoolYear === selectedSchoolYear &&
        item.semester === selectedSemester
    );

    if (alreadyExists) {
      alert("This assignment already exists.");
      return;
    }

    const newAssignment = {
      id: Date.now(),
      facultyId: Number(selectedFacultyId),
      facultyName: selectedFaculty.name,
      program: selectedProgram,
      sectionId: Number(selectedSectionId),
      sectionName: selectedSection.section,
      yearLevel: selectedSection.yearLevel,
      schoolYear: selectedSchoolYear,
      semester: selectedSemester,
    };

    const updatedAssignments = [...savedAssignments, newAssignment];
    setSavedAssignments(updatedAssignments);
    localStorage.setItem(
      "registrarAssignments",
      JSON.stringify(updatedAssignments)
    );

    alert("Section assigned successfully.");

    setSelectedSchoolYear("");
    setSelectedSemester("");
    setSelectedProgram("");
    setSelectedFacultyId("");
    setSelectedSectionId("");
  };

  const assignmentRows = useMemo(() => savedAssignments, [savedAssignments]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-bold text-[#003366]">
          Academic Assignment
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Assign sections to faculty based on school year, semester, and program.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              School Year
            </label>
            <select
              value={selectedSchoolYear}
              onChange={(e) => {
                setSelectedSchoolYear(e.target.value);
                setSelectedSemester("");
                setSelectedProgram("");
                setSelectedFacultyId("");
                setSelectedSectionId("");
              }}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
            >
              <option value="">Choose school year</option>
              {schoolYears.map((schoolYear) => (
                <option key={schoolYear} value={schoolYear}>
                  {schoolYear}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Semester
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => {
                setSelectedSemester(e.target.value);
                setSelectedProgram("");
                setSelectedFacultyId("");
                setSelectedSectionId("");
              }}
              disabled={!selectedSchoolYear}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm disabled:bg-slate-100"
            >
              <option value="">Choose semester</option>
              {semesters.map((semester) => (
                <option key={semester} value={semester}>
                  {semester}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Program
            </label>
            <select
              value={selectedProgram}
              onChange={(e) => {
                setSelectedProgram(e.target.value);
                setSelectedFacultyId("");
                setSelectedSectionId("");
              }}
              disabled={!selectedSchoolYear || !selectedSemester}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm disabled:bg-slate-100"
            >
              <option value="">Choose program</option>
              {programs.map((program) => (
                <option key={program} value={program}>
                  {program}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Faculty
            </label>
            <select
              value={selectedFacultyId}
              onChange={(e) => setSelectedFacultyId(e.target.value)}
              disabled={!selectedProgram}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm disabled:bg-slate-100"
            >
              <option value="">Choose faculty</option>
              {filteredFaculty.map((faculty) => (
                <option key={faculty.id} value={faculty.id}>
                  {faculty.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Section
            </label>
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              disabled={!selectedProgram}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm disabled:bg-slate-100"
            >
              <option value="">Choose section</option>
              {filteredSections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.section} - {section.yearLevel}
                </option>
              ))}
            </select>
          </div>
        </div>

        {(selectedFaculty || selectedSection) && (
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Faculty</p>
              <p className="mt-1 font-semibold text-slate-800">
                {selectedFaculty?.name || "--"}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Section</p>
              <p className="mt-1 font-semibold text-slate-800">
                {selectedSection?.section || "--"}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Year Level</p>
              <p className="mt-1 font-semibold text-slate-800">
                {selectedSection?.yearLevel || "--"}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Academic Term</p>
              <p className="mt-1 font-semibold text-slate-800">
                {selectedSchoolYear && selectedSemester
                  ? `${selectedSchoolYear} | ${selectedSemester}`
                  : "--"}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={handleAssign}
          className="mt-6 rounded-xl bg-[#003366] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#00264d]"
        >
          Assign Section
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-[#003366]">
          Current Assignments
        </h3>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-[#003366] text-white">
                <th className="px-4 py-3 text-left text-sm">Faculty</th>
                <th className="px-4 py-3 text-left text-sm">Program</th>
                <th className="px-4 py-3 text-left text-sm">Section</th>
                <th className="px-4 py-3 text-left text-sm">Year Level</th>
                <th className="px-4 py-3 text-left text-sm">School Year</th>
                <th className="px-4 py-3 text-left text-sm">Semester</th>
              </tr>
            </thead>

            <tbody>
              {assignmentRows.length > 0 ? (
                assignmentRows.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="px-4 py-3">{item.facultyName}</td>
                    <td className="px-4 py-3">{item.program}</td>
                    <td className="px-4 py-3">{item.sectionName}</td>
                    <td className="px-4 py-3">{item.yearLevel}</td>
                    <td className="px-4 py-3">{item.schoolYear}</td>
                    <td className="px-4 py-3">{item.semester}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-6 text-center text-slate-500">
                    No assignments yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AcademicAssignment;