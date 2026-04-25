import React, { useMemo, useState } from "react";
import { facultyList, sections as sectionList } from "../../data/registrarData";
import {
  downloadStudentCsvFile,
  parseStudentIdSpreadsheet,
} from "../../utils/studentSectioningHelpers";

function AcademicAssignment() {
  const [selectedSchoolYear, setSelectedSchoolYear] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedFacultyId, setSelectedFacultyId] = useState("");
  const [selectedSectionName, setSelectedSectionName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [subjectTitle, setSubjectTitle] = useState("");
  const [units, setUnits] = useState("");
  const [semester, setSemester] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduleDay, setScheduleDay] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  const [savedAssignments, setSavedAssignments] = useState(() => {
    const saved = localStorage.getItem("registrarAssignments");
    return saved ? JSON.parse(saved) : [];
  });

  const studentSections =
    JSON.parse(localStorage.getItem("studentSections")) || [];

  const schoolYears = [
    ...new Set([
      ...sectionList.map((section) => section.schoolYear),
      ...studentSections.map((section) => section.schoolYear),
    ]),
  ];

  const programs = [
    ...new Set([
      ...sectionList.map((section) => section.program),
      ...studentSections.map((section) => section.program),
    ]),
  ];

  const filteredFaculty = facultyList.filter(
    (faculty) => faculty.program === selectedProgram
  );

  const filteredSections = studentSections.filter(
    (section) =>
      section.program === selectedProgram &&
      section.schoolYear === selectedSchoolYear
  );

  const selectedFaculty = facultyList.find(
    (faculty) => faculty.id === Number(selectedFacultyId)
  );

  const selectedSection = filteredSections.find(
    (section) => section.section === selectedSectionName
  );

  const selectedSectionStudents = selectedSection?.students || [];

  const resetForm = () => {
    setSelectedFacultyId("");
    setSelectedSectionName("");
    setSubjectCode("");
    setSubjectTitle("");
    setUnits("");
    setSemester("");
    setScheduleTime("");
    setScheduleDay("");
    setSelectedFile(null);
  };

  const handleDownloadSectionTemplate = () => {
    if (!selectedSection) {
      alert("Please choose a section first.");
      return;
    }

    if (!selectedSectionStudents.length) {
      alert("This section has no students yet.");
      return;
    }

    downloadStudentCsvFile(
      selectedSectionStudents,
      `${selectedProgram}-${selectedSchoolYear}-${selectedSectionName}.csv`
    );
  };

  const handleAssign = () => {
    if (
      !selectedSchoolYear ||
      !selectedProgram ||
      !selectedFacultyId ||
      !selectedSectionName ||
      !subjectCode.trim() ||
      !subjectTitle.trim() ||
      !units.trim() ||
      !semester.trim() ||
      !scheduleTime.trim() ||
      !scheduleDay.trim()
    ) {
      alert("Please complete all fields.");
      return;
    }

    if (!selectedSection) {
      alert("Selected section was not found.");
      return;
    }

    if (!selectedFile) {
      alert("Please upload the section CSV file for this faculty load.");
      return;
    }

    if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
      alert("Please upload the section roster in CSV format.");
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      const text = event.target?.result;

      if (!text) {
        alert("Unable to read the uploaded CSV file.");
        return;
      }

      const parsedStudents = parseStudentIdSpreadsheet(text);

      if (!parsedStudents.length) {
        alert(
          "The section CSV must contain Student ID, Sex, Last Name, First Name, and Middle Initial columns with valid rows."
        );
        return;
      }

      const alreadyExists = savedAssignments.some(
        (item) =>
          item.facultyId === Number(selectedFacultyId) &&
          item.sectionName === selectedSectionName &&
          item.schoolYear === selectedSchoolYear &&
          item.semester.toLowerCase() === semester.trim().toLowerCase() &&
          item.subjectCode.toLowerCase() === subjectCode.trim().toLowerCase()
      );

      if (alreadyExists) {
        alert("This faculty section load already exists.");
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
        units: units.trim(),
        schedule: scheduleTime.trim(),
        day: scheduleDay.trim(),
        schoolYear: selectedSchoolYear,
        semester: semester.trim(),
        rosterFileName: selectedFile.name,
        rosterStudents: parsedStudents,
        uploadedAt: new Date().toISOString(),
      };

      const updatedAssignments = [...savedAssignments, newAssignment];
      setSavedAssignments(updatedAssignments);
      localStorage.setItem(
        "registrarAssignments",
        JSON.stringify(updatedAssignments)
      );

      alert("Faculty section CSV uploaded successfully.");
      resetForm();
    };

    reader.readAsText(selectedFile);
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
          Faculty Section CSV Upload
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          After sectioning students, upload each section CSV to the assigned
          faculty together with the subject and schedule details for grade
          encoding.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Batch Year
            </label>
            <select
              value={selectedSchoolYear}
              onChange={(e) => {
                setSelectedSchoolYear(e.target.value);
                setSelectedProgram("");
                resetForm();
              }}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
            >
              <option value="">Choose batch year</option>
              {schoolYears.map((schoolYear) => (
                <option key={schoolYear} value={schoolYear}>
                  {schoolYear}
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
                resetForm();
              }}
              disabled={!selectedSchoolYear}
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

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Total Units
            </label>
            <input
              type="text"
              value={units}
              onChange={(e) => setUnits(e.target.value)}
              placeholder="e.g. 3"
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
              Semester
            </label>
            <input
              type="text"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              placeholder="e.g. 1st Semester"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Time
            </label>
            <input
              type="text"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
              placeholder="e.g. 7:00 AM - 9:00 AM"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Day
            </label>
            <input
              type="text"
              value={scheduleDay}
              onChange={(e) => setScheduleDay(e.target.value)}
              placeholder="e.g. Monday and Wednesday"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
            />
          </div>

          <div className="md:col-span-2 xl:col-span-3">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Upload Section CSV
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
            />
            <div className="mt-2 flex flex-col gap-2 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
              <span>
                {selectedFile
                  ? `Selected file: ${selectedFile.name}`
                  : "Upload the finalized section roster in CSV format."}
              </span>

              <button
                type="button"
                onClick={handleDownloadSectionTemplate}
                className="rounded-xl border border-[#003366] px-4 py-2 font-semibold text-[#003366] transition hover:bg-[#003366] hover:text-white"
              >
                Export Current Section CSV
              </button>
            </div>
          </div>
        </div>

        {(selectedFaculty ||
          selectedSection ||
          subjectCode ||
          subjectTitle ||
          units ||
          semester ||
          scheduleTime ||
          scheduleDay) && (
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
              <p className="text-sm text-slate-500">Units</p>
              <p className="mt-1 font-semibold text-slate-800">
                {units || "--"}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Time</p>
              <p className="mt-1 font-semibold text-slate-800">
                {scheduleTime || "--"}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Day</p>
              <p className="mt-1 font-semibold text-slate-800">
                {scheduleDay || "--"}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Subject Code</p>
              <p className="mt-1 font-semibold text-slate-800">
                {subjectCode || "--"}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 md:col-span-2">
              <p className="text-sm text-slate-500">Semester</p>
              <p className="mt-1 font-semibold text-slate-800">
                {semester || "--"}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 md:col-span-3">
              <p className="text-sm text-slate-500">CSV Students Available</p>
              <p className="mt-1 font-semibold text-slate-800">
                {selectedSectionStudents.length || 0}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 md:col-span-2 xl:col-span-6">
              <p className="text-sm text-slate-500">Subject Title</p>
              <p className="mt-1 font-semibold text-slate-800">
                {subjectTitle || "--"}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={handleAssign}
          className="mt-6 rounded-xl bg-[#003366] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#00264d]"
        >
          Upload Section to Faculty
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-[#003366]">
          Uploaded Faculty Sections
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          One faculty member can receive multiple section CSV uploads, each with
          its own subject and schedule details.
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-[#003366] text-white">
                <th className="px-4 py-3 text-left text-sm">Faculty</th>
                <th className="px-4 py-3 text-left text-sm">Program</th>
                <th className="px-4 py-3 text-left text-sm">Section</th>
                <th className="px-4 py-3 text-left text-sm">Students</th>
                <th className="px-4 py-3 text-left text-sm">CSV File</th>
                <th className="px-4 py-3 text-left text-sm">Subject</th>
                <th className="px-4 py-3 text-left text-sm">Units</th>
                <th className="px-4 py-3 text-left text-sm">Semester</th>
                <th className="px-4 py-3 text-left text-sm">Time</th>
                <th className="px-4 py-3 text-left text-sm">Day</th>
                <th className="px-4 py-3 text-left text-sm">Batch Year</th>
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
                    <td className="px-4 py-3">
                      {item.rosterStudents?.length || 0}
                    </td>
                    <td className="px-4 py-3">{item.rosterFileName || "--"}</td>
                    <td className="px-4 py-3">
                      {item.subjectCode} - {item.subjectTitle}
                    </td>
                    <td className="px-4 py-3">{item.units || "--"}</td>
                    <td className="px-4 py-3">{item.semester || "--"}</td>
                    <td className="px-4 py-3">{item.schedule}</td>
                    <td className="px-4 py-3">{item.day}</td>
                    <td className="px-4 py-3">{item.schoolYear}</td>
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
                  <td colSpan="12" className="py-6 text-center text-slate-500">
                    No uploaded section CSVs yet.
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
