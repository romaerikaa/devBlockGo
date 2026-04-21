import React, { useMemo, useState } from "react";

function StudentListImport() {
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedYearLevel, setSelectedYearLevel] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedSchoolYear, setSelectedSchoolYear] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  const [importedStudents, setImportedStudents] = useState(() => {
    const saved = localStorage.getItem("studentMasterlist");
    return saved ? JSON.parse(saved) : [];
  });

  const availablePrograms = [
    "BSIT",
    "BSA",
    "BSED English",
    "BSED Math",
    "BSBA Marketing",
  ];

  const availableYearLevels = [
    "1st Year",
    "2nd Year",
    "3rd Year",
    "4th Year",
  ];

  const availableSections = [
    "1-1",
    "1-2",
    "1-3",
    "1-4",
    "2-1",
    "2-2",
    "3-1",
    "3-2",
    "4-1",
    "4-2",
  ];

  const availableSchoolYears = ["2025-2026", "2026-2027"];
  const availableSemesters = ["1st Semester", "2nd Semester", "Summer"];

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
  };

  const handleDownloadTemplate = () => {
    if (
      !selectedProgram ||
      !selectedYearLevel ||
      !selectedSection ||
      !selectedSchoolYear ||
      !selectedSemester
    ) {
      alert("Please complete all section details first.");
      return;
    }

    const csvContent =
      "Student ID,First Name,Last Name\n" +
      "23-0001,Roma,Alapar\n" +
      "23-0002,Maria,Santos\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `${selectedProgram}-${selectedSection}-template.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCSV = (text) => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) {
      return [];
    }

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

    const studentIdIndex = headers.indexOf("student id");
    const firstNameIndex = headers.indexOf("first name");
    const lastNameIndex = headers.indexOf("last name");

    if (
      studentIdIndex === -1 ||
      firstNameIndex === -1 ||
      lastNameIndex === -1
    ) {
      alert("CSV must contain: Student ID, First Name, Last Name");
      return [];
    }

    const students = lines
      .slice(1)
      .map((line) => {
        const values = line.split(",").map((v) => v.trim());

        return {
          studentId: values[studentIdIndex] || "",
          firstName: values[firstNameIndex] || "",
          lastName: values[lastNameIndex] || "",
        };
      })
      .filter(
        (student) =>
          student.studentId && student.firstName && student.lastName
      );

    return students;
  };

  const handleImport = () => {
    if (
      !selectedProgram ||
      !selectedYearLevel ||
      !selectedSection ||
      !selectedSchoolYear ||
      !selectedSemester
    ) {
      alert("Please complete all section details first.");
      return;
    }

    if (!selectedFile) {
      alert("Please choose a CSV file first.");
      return;
    }

    if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
      alert("Please upload a CSV file for now.");
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      const text = event.target?.result;
      if (!text) {
        alert("Unable to read file.");
        return;
      }

      const rawImportedStudents = parseCSV(text);

      if (rawImportedStudents.length === 0) {
        alert("No valid student rows found.");
        return;
      }

      const fullSectionName = `${selectedProgram} ${selectedSection}`;

      const completedImportedStudents = rawImportedStudents.map((student) => ({
        ...student,
        program: selectedProgram,
        yearLevel: selectedYearLevel,
        section: fullSectionName,
        schoolYear: selectedSchoolYear,
        semester: selectedSemester,
      }));

      const updatedStudents = [...importedStudents, ...completedImportedStudents];

      setImportedStudents(updatedStudents);
      localStorage.setItem("studentMasterlist", JSON.stringify(updatedStudents));

      alert("Student list imported successfully.");
      setSelectedFile(null);
    };

    reader.readAsText(selectedFile);
  };

  const filteredPreview = useMemo(() => {
    return importedStudents.filter(
      (student) =>
        (!selectedProgram || student.program === selectedProgram) &&
        (!selectedYearLevel || student.yearLevel === selectedYearLevel) &&
        (!selectedSchoolYear || student.schoolYear === selectedSchoolYear) &&
        (!selectedSemester || student.semester === selectedSemester) &&
        (!selectedSection ||
          student.section === `${selectedProgram} ${selectedSection}`)
    );
  }, [
    importedStudents,
    selectedProgram,
    selectedYearLevel,
    selectedSchoolYear,
    selectedSemester,
    selectedSection,
  ]);

  const summary = useMemo(() => {
    const totalStudents = filteredPreview.length;
    const uniqueSections = [...new Set(filteredPreview.map((s) => s.section))];

    return {
      totalStudents,
      totalSections: uniqueSections.length,
    };
  }, [filteredPreview]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-bold text-[#003366]">
          Upload / Import Student List
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Select the section details first, then upload a CSV template
          containing only student information.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Program
            </label>
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
            >
              <option value="">Choose program</option>
              {availablePrograms.map((program) => (
                <option key={program} value={program}>
                  {program}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Year Level
            </label>
            <select
              value={selectedYearLevel}
              onChange={(e) => setSelectedYearLevel(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
            >
              <option value="">Choose year level</option>
              {availableYearLevels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Section
            </label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
            >
              <option value="">Choose section</option>
              {availableSections.map((section) => (
                <option key={section} value={section}>
                  {section}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              School Year
            </label>
            <select
              value={selectedSchoolYear}
              onChange={(e) => setSelectedSchoolYear(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
            >
              <option value="">Choose school year</option>
              {availableSchoolYears.map((schoolYear) => (
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
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
            >
              <option value="">Choose semester</option>
              {availableSemesters.map((semester) => (
                <option key={semester} value={semester}>
                  {semester}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700">
                Download Template
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Template only needs: Student ID, First Name, Last Name
              </p>
            </div>

            <button
              onClick={handleDownloadTemplate}
              className="rounded-xl border border-[#003366] px-5 py-3 text-sm font-semibold text-[#003366] transition hover:bg-[#003366] hover:text-white"
            >
              Download Template
            </button>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-slate-700">
              Upload Completed CSV File
            </label>

            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="mt-3 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
            />

            <p className="mt-3 text-sm text-slate-500">
              {selectedFile
                ? `Selected file: ${selectedFile.name}`
                : "No file selected"}
            </p>

            <button
              onClick={handleImport}
              className="mt-5 rounded-xl bg-[#003366] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#00264d]"
            >
              Import Student List
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Program</p>
          <p className="mt-2 text-lg font-bold text-[#003366]">
            {selectedProgram || "--"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Year Level</p>
          <p className="mt-2 text-lg font-bold text-[#003366]">
            {selectedYearLevel || "--"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Section</p>
          <p className="mt-2 text-lg font-bold text-[#003366]">
            {selectedProgram && selectedSection
              ? `${selectedProgram} ${selectedSection}`
              : "--"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">School Year</p>
          <p className="mt-2 text-lg font-bold text-[#003366]">
            {selectedSchoolYear || "--"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Semester</p>
          <p className="mt-2 text-lg font-bold text-[#003366]">
            {selectedSemester || "--"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Students Imported</p>
          <p className="mt-2 text-3xl font-bold text-[#003366]">
            {summary.totalStudents}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-[#003366]">
          Required File Columns
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          The downloaded template only requires student-specific information.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          {["Student ID", "First Name", "Last Name"].map((field) => (
            <div
              key={field}
              className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700"
            >
              {field}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-[#003366]">
          Imported Student Preview
        </h3>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-[#003366] text-white">
                <th className="px-4 py-3 text-left text-sm">Student ID</th>
                <th className="px-4 py-3 text-left text-sm">Name</th>
                <th className="px-4 py-3 text-left text-sm">Program</th>
                <th className="px-4 py-3 text-left text-sm">Year Level</th>
                <th className="px-4 py-3 text-left text-sm">Section</th>
                <th className="px-4 py-3 text-left text-sm">School Year</th>
                <th className="px-4 py-3 text-left text-sm">Semester</th>
              </tr>
            </thead>

            <tbody>
              {filteredPreview.length > 0 ? (
                filteredPreview.map((student, index) => (
                  <tr key={index} className="border-b">
                    <td className="px-4 py-3">{student.studentId}</td>
                    <td className="px-4 py-3">
                      {student.firstName} {student.lastName}
                    </td>
                    <td className="px-4 py-3">{student.program}</td>
                    <td className="px-4 py-3">{student.yearLevel}</td>
                    <td className="px-4 py-3">{student.section}</td>
                    <td className="px-4 py-3">{student.schoolYear}</td>
                    <td className="px-4 py-3">{student.semester}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-6 text-center text-slate-500">
                    No imported student list yet.
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

export default StudentListImport;