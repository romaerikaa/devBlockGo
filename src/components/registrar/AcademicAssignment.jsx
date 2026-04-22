import React, { useMemo, useState } from "react";
import { facultyList, sections as sectionList } from "../../data/registrarData";

function AcademicAssignment() {
  const [selectedSchoolYear, setSelectedSchoolYear] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedFacultyId, setSelectedFacultyId] = useState("");
  const [selectedSectionName, setSelectedSectionName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [subjectTitle, setSubjectTitle] = useState("");
  const [schedule, setSchedule] = useState("");
  const [day, setDay] = useState("");

  const [savedAssignments, setSavedAssignments] = useState(() => {
    const saved = localStorage.getItem("registrarAssignments");
    return saved ? JSON.parse(saved) : [];
  });

  const studentSections =
    JSON.parse(localStorage.getItem("studentSections")) || [];

  const schoolYears = [
    ...new Set([
      ...sectionList.map((s) => s.schoolYear),
      ...studentSections.map((s) => s.schoolYear),
    ]),
  ];

  const semesters = [
    ...new Set([
      ...sectionList.map((s) => s.semester),
      ...studentSections.map((s) => s.semester),
    ]),
  ];

  const programs = [
    ...new Set([
      ...sectionList.map((s) => s.program),
      ...studentSections.map((s) => s.program),
    ]),
  ];

  const filteredFaculty = facultyList.filter(
    (faculty) => faculty.program === selectedProgram
  );

  const filteredSections = studentSections.filter(
    (section) =>
      section.program === selectedProgram &&
      section.schoolYear === selectedSchoolYear &&
      section.semester === selectedSemester
  );

  const selectedFaculty = facultyList.find(
    (faculty) => faculty.id === Number(selectedFacultyId)
  );

  const selectedSection = filteredSections.find(
    (section) => section.section === selectedSectionName
  );

  const handleAssign = () => {
    if (
      !selectedSchoolYear ||
      !selectedSemester ||
      !selectedProgram ||
      !selectedFacultyId ||
      !selectedSectionName ||
      !subjectCode.trim() ||
      !subjectTitle.trim() ||
      !schedule.trim() ||
      !day.trim()
    ) {
      alert("Please complete all fields.");
      return;
    }

    if (!selectedSection) {
      alert("Selected section was not found.");
      return;
    }

    const alreadyExists = savedAssignments.some(
      (item) =>
        item.facultyId === Number(selectedFacultyId) &&
        item.sectionName === selectedSectionName &&
        item.schoolYear === selectedSchoolYear &&
        item.semester === selectedSemester &&
        item.subjectCode.toLowerCase() === subjectCode.trim().toLowerCase()
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
      sectionName: selectedSection.section,
      yearLevel: selectedSection.yearLevel,
      subjectCode: subjectCode.trim(),
      subjectTitle: subjectTitle.trim(),
      schedule: schedule.trim(),
      day: day.trim(),
      schoolYear: selectedSchoolYear,
      semester: selectedSemester,
    };

    const updatedAssignments = [...savedAssignments, newAssignment];
    setSavedAssignments(updatedAssignments);
    localStorage.setItem(
      "registrarAssignments",
      JSON.stringify(updatedAssignments)
    );

    alert("Faculty assignment saved successfully.");

    setSelectedSchoolYear("");
    setSelectedSemester("");
    setSelectedProgram("");
    setSelectedFacultyId("");
    setSelectedSectionName("");
    setSubjectCode("");
    setSubjectTitle("");
    setSchedule("");
    setDay("");
  };

  const handleDeleteAssignment = (id) => {
    const updatedAssignments = savedAssignments.filter((item) => item.id !== id);
    setSavedAssignments(updatedAssignments);
    localStorage.setItem(
      "registrarAssignments",
      JSON.stringify(updatedAssignments)
    );
  };

  const assignmentRows = useMemo(() => savedAssignments, [savedAssignments]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-bold text-[#003366]">
          Academic Assignment
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Assign a faculty member to a section together with the subject they will handle.
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
                setSelectedSectionName("");
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
                setSelectedSectionName("");
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
                setSelectedSectionName("");
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
              value={selectedSectionName}
              onChange={(e) => setSelectedSectionName(e.target.value)}
              disabled={!selectedProgram}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm disabled:bg-slate-100"
            >
              <option value="">Choose section</option>
              {filteredSections.map((section, index) => (
                <option key={`${section.section}-${index}`} value={section.section}>
                  {section.section} - {section.yearLevel}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Subject Code
            </label>
            <input
              type="text"
              value={subjectCode}
              onChange={(e) => setSubjectCode(e.target.value)}
              placeholder="e.g. IT 101"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
            />
          </div>

          <div className="md:col-span-2 xl:col-span-3">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Subject Title
            </label>
            <input
              type="text"
              value={subjectTitle}
              onChange={(e) => setSubjectTitle(e.target.value)}
              placeholder="e.g. Introduction to Computing"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Schedule
            </label>
            <input
              type="text"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              placeholder="e.g. 3:00 PM - 5:00 PM"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Day
            </label>
            <input
              type="text"
              value={day}
              onChange={(e) => setDay(e.target.value)}
              placeholder="e.g. Friday"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
            />
          </div>
        </div>

        {(selectedFaculty || selectedSection || subjectCode || subjectTitle || schedule || day) && (
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
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
              <p className="text-sm text-slate-500">Subject Code</p>
              <p className="mt-1 font-semibold text-slate-800">
                {subjectCode || "--"}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Schedule</p>
              <p className="mt-1 font-semibold text-slate-800">
                {schedule || "--"}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Day</p>
              <p className="mt-1 font-semibold text-slate-800">
                {day || "--"}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 md:col-span-2 xl:col-span-6">
              <p className="text-sm text-slate-500">Subject Title</p>
              <p className="mt-1 font-semibold text-slate-800">
                {subjectTitle || "--"}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 md:col-span-2 xl:col-span-6">
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
          Assign Faculty Load
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-[#003366]">
          Current Assignments
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          These assignments will be the basis of what appears in the faculty portal.
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-[#003366] text-white">
                <th className="px-4 py-3 text-left text-sm">Faculty</th>
                <th className="px-4 py-3 text-left text-sm">Program</th>
                <th className="px-4 py-3 text-left text-sm">Section</th>
                <th className="px-4 py-3 text-left text-sm">Year Level</th>
                <th className="px-4 py-3 text-left text-sm">Subject Code</th>
                <th className="px-4 py-3 text-left text-sm">Subject Title</th>
                <th className="px-4 py-3 text-left text-sm">Schedule</th>
                <th className="px-4 py-3 text-left text-sm">Day</th>
                <th className="px-4 py-3 text-left text-sm">School Year</th>
                <th className="px-4 py-3 text-left text-sm">Semester</th>
                <th className="px-4 py-3 text-left text-sm">Action</th>
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
                    <td className="px-4 py-3">{item.subjectCode}</td>
                    <td className="px-4 py-3">{item.subjectTitle}</td>
                    <td className="px-4 py-3">{item.schedule}</td>
                    <td className="px-4 py-3">{item.day}</td>
                    <td className="px-4 py-3">{item.schoolYear}</td>
                    <td className="px-4 py-3">{item.semester}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDeleteAssignment(item.id)}
                        className="rounded-lg border border-red-200 px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="11" className="py-6 text-center text-slate-500">
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