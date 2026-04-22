import React, { useMemo, useState } from "react";

function StudentListImport() {
  // =========================
  // IMPORT SECTION (TOP)
  // =========================
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedYearLevel, setSelectedYearLevel] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedSchoolYear, setSelectedSchoolYear] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  // =========================
  // FILTER SECTION (LEFT PANEL)
  // =========================
  const [filterProgram, setFilterProgram] = useState("");
  const [filterYearLevel, setFilterYearLevel] = useState("");
  const [filterSchoolYear, setFilterSchoolYear] = useState("");
  const [filterSemester, setFilterSemester] = useState("");

  // =========================
  // SELECTED SECTION LIST
  // =========================
  const [selectedSectionListKey, setSelectedSectionListKey] = useState("");
  const [studentSearch, setStudentSearch] = useState("");

  // =========================
  // MANUAL ADD STUDENT
  // =========================
  const [manualStudentId, setManualStudentId] = useState("");
  const [manualFirstName, setManualFirstName] = useState("");
  const [manualLastName, setManualLastName] = useState("");

  // =========================
  // COPY SECTION LIST
  // =========================
  const [copySchoolYear, setCopySchoolYear] = useState("");
  const [copySemester, setCopySemester] = useState("");
  const [copyYearLevel, setCopyYearLevel] = useState("");
  const [copySection, setCopySection] = useState("");

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

  const availableSchoolYears = ["2025-2026", "2026-2027", "2027-2028"];
  const availableSemesters = ["1st Semester", "2nd Semester", "Summer"];

  const buildGroupedSectionLists = (students) => {
    const grouped = {};

    students.forEach((student) => {
      const key = [
        student.program,
        student.yearLevel,
        student.section,
        student.schoolYear,
        student.semester,
      ].join("|");

      if (!grouped[key]) {
        grouped[key] = {
          key,
          program: student.program,
          yearLevel: student.yearLevel,
          section: student.section,
          schoolYear: student.schoolYear,
          semester: student.semester,
          students: [],
        };
      }

      grouped[key].students.push({
        studentId: student.studentId,
        firstName: student.firstName,
        lastName: student.lastName,
      });
    });

    return Object.values(grouped);
  };

  const saveAllStudents = (students) => {
    setImportedStudents(students);
    localStorage.setItem("studentMasterlist", JSON.stringify(students));

    const groupedSectionLists = buildGroupedSectionLists(students);
    localStorage.setItem("studentSections", JSON.stringify(groupedSectionLists));
  };

  const parseCSV = (text) => {
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length < 2) return [];

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

    return lines
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
  };

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
      alert("Please upload a CSV file.");
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      const text = event.target?.result;
      if (!text) {
        alert("Unable to read file.");
        return;
      }

      const parsedStudents = parseCSV(text);

      if (parsedStudents.length === 0) {
        alert("No valid student rows found.");
        return;
      }

      const fullSectionName = `${selectedProgram} ${selectedSection}`;

      const completedImportedStudents = parsedStudents.map((student) => ({
        ...student,
        program: selectedProgram,
        yearLevel: selectedYearLevel,
        section: fullSectionName,
        schoolYear: selectedSchoolYear,
        semester: selectedSemester,
      }));

      const remainingStudents = importedStudents.filter(
        (student) =>
          !(
            student.program === selectedProgram &&
            student.yearLevel === selectedYearLevel &&
            student.section === fullSectionName &&
            student.schoolYear === selectedSchoolYear &&
            student.semester === selectedSemester
          )
      );

      const updatedStudents = [
        ...remainingStudents,
        ...completedImportedStudents,
      ];

      saveAllStudents(updatedStudents);

      const newKey = [
        selectedProgram,
        selectedYearLevel,
        fullSectionName,
        selectedSchoolYear,
        selectedSemester,
      ].join("|");

      setSelectedSectionListKey(newKey);
      setSelectedFile(null);
      alert("Section list imported successfully.");
    };

    reader.readAsText(selectedFile);
  };

  const groupedSectionLists = useMemo(() => {
    return buildGroupedSectionLists(importedStudents).sort((a, b) => {
      const left = `${a.program} ${a.schoolYear} ${a.semester} ${a.section}`;
      const right = `${b.program} ${b.schoolYear} ${b.semester} ${b.section}`;
      return left.localeCompare(right);
    });
  }, [importedStudents]);

  const filteredSectionLists = useMemo(() => {
    if (!filterProgram) return [];

    return groupedSectionLists.filter((sectionList) => {
      const matchesProgram = sectionList.program === filterProgram;
      const matchesYearLevel =
        !filterYearLevel || sectionList.yearLevel === filterYearLevel;
      const matchesSchoolYear =
        !filterSchoolYear || sectionList.schoolYear === filterSchoolYear;
      const matchesSemester =
        !filterSemester || sectionList.semester === filterSemester;

      return (
        matchesProgram &&
        matchesYearLevel &&
        matchesSchoolYear &&
        matchesSemester
      );
    });
  }, [
    groupedSectionLists,
    filterProgram,
    filterYearLevel,
    filterSchoolYear,
    filterSemester,
  ]);

  const selectedSectionList = useMemo(() => {
    return (
      groupedSectionLists.find(
        (sectionList) => sectionList.key === selectedSectionListKey
      ) || null
    );
  }, [groupedSectionLists, selectedSectionListKey]);

  const filteredSelectedStudents = useMemo(() => {
    if (!selectedSectionList) return [];

    const searchValue = studentSearch.trim().toLowerCase();

    if (!searchValue) return selectedSectionList.students;

    return selectedSectionList.students.filter((student) => {
      const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();

      return (
        student.studentId.toLowerCase().includes(searchValue) ||
        student.firstName.toLowerCase().includes(searchValue) ||
        student.lastName.toLowerCase().includes(searchValue) ||
        fullName.includes(searchValue)
      );
    });
  }, [selectedSectionList, studentSearch]);

  const handleAddStudent = () => {
    if (!selectedSectionList) {
      alert("Please select a section list first.");
      return;
    }

    if (!manualStudentId || !manualFirstName || !manualLastName) {
      alert("Please complete the student fields.");
      return;
    }

    const alreadyExists = importedStudents.some(
      (student) =>
        student.studentId === manualStudentId &&
        student.section === selectedSectionList.section &&
        student.schoolYear === selectedSectionList.schoolYear &&
        student.semester === selectedSectionList.semester
    );

    if (alreadyExists) {
      alert("Student already exists in this section.");
      return;
    }

    const updatedStudents = [
      ...importedStudents,
      {
        studentId: manualStudentId.trim(),
        firstName: manualFirstName.trim(),
        lastName: manualLastName.trim(),
        program: selectedSectionList.program,
        yearLevel: selectedSectionList.yearLevel,
        section: selectedSectionList.section,
        schoolYear: selectedSectionList.schoolYear,
        semester: selectedSectionList.semester,
      },
    ];

    saveAllStudents(updatedStudents);
    setManualStudentId("");
    setManualFirstName("");
    setManualLastName("");
  };

  const handleRemoveStudent = (studentId) => {
    if (!selectedSectionList) return;

    const updatedStudents = importedStudents.filter(
      (student) =>
        !(
          student.studentId === studentId &&
          student.section === selectedSectionList.section &&
          student.schoolYear === selectedSectionList.schoolYear &&
          student.semester === selectedSectionList.semester
        )
    );

    saveAllStudents(updatedStudents);
  };

  const handleDeleteSectionList = () => {
    if (!selectedSectionList) {
      alert("Please select a section list first.");
      return;
    }

    const updatedStudents = importedStudents.filter(
      (student) =>
        !(
          student.section === selectedSectionList.section &&
          student.program === selectedSectionList.program &&
          student.schoolYear === selectedSectionList.schoolYear &&
          student.semester === selectedSectionList.semester
        )
    );

    saveAllStudents(updatedStudents);
    setSelectedSectionListKey("");
    setStudentSearch("");
    alert("Section list deleted.");
  };

  const handleCopySectionList = () => {
    if (!selectedSectionList) {
      alert("Please select a section list first.");
      return;
    }

    if (!copySchoolYear || !copySemester || !copyYearLevel || !copySection) {
      alert("Please complete the copy target fields.");
      return;
    }

    const targetSectionName = `${selectedSectionList.program} ${copySection}`;

    const targetExists = importedStudents.some(
      (student) =>
        student.program === selectedSectionList.program &&
        student.section === targetSectionName &&
        student.schoolYear === copySchoolYear &&
        student.semester === copySemester
    );

    if (targetExists) {
      alert("Target section list already exists.");
      return;
    }

    const copiedStudents = selectedSectionList.students.map((student) => ({
      studentId: student.studentId,
      firstName: student.firstName,
      lastName: student.lastName,
      program: selectedSectionList.program,
      yearLevel: copyYearLevel,
      section: targetSectionName,
      schoolYear: copySchoolYear,
      semester: copySemester,
    }));

    const updatedStudents = [...importedStudents, ...copiedStudents];
    saveAllStudents(updatedStudents);

    const newKey = [
      selectedSectionList.program,
      copyYearLevel,
      targetSectionName,
      copySchoolYear,
      copySemester,
    ].join("|");

    setSelectedSectionListKey(newKey);
    setCopySchoolYear("");
    setCopySemester("");
    setCopyYearLevel("");
    setCopySection("");
    alert("Section list copied successfully.");
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h3 className="text-2xl font-bold text-[#003366]">
            Student List Import
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Import and manage enrolled student records by section.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Program
            </label>
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#003366]"
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
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#003366]"
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
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#003366]"
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
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#003366]"
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
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#003366]"
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

        <div className="mt-6 rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 p-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto_auto] lg:items-end">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Upload Completed CSV File
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm"
              />
              <p className="mt-2 text-sm text-slate-500">
                {selectedFile
                  ? `Selected file: ${selectedFile.name}`
                  : "No file selected"}
              </p>
            </div>

            <button
              onClick={handleDownloadTemplate}
              className="rounded-2xl border border-[#003366] px-5 py-3 text-sm font-semibold text-[#003366] transition hover:bg-[#003366] hover:text-white"
            >
              Download Template
            </button>

            <button
              onClick={handleImport}
              className="rounded-2xl bg-[#003366] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#00264d]"
            >
              Import Student List
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-[#003366]">
              Existing Section Lists
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Filter and select one section list to preview and edit.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <select
              value={filterProgram}
              onChange={(e) => {
                setFilterProgram(e.target.value);
                setSelectedSectionListKey("");
                setStudentSearch("");
              }}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#003366]"
            >
              <option value="">Filter by program</option>
              {availablePrograms.map((program) => (
                <option key={program} value={program}>
                  {program}
                </option>
              ))}
            </select>

            <select
              value={filterYearLevel}
              onChange={(e) => {
                setFilterYearLevel(e.target.value);
                setSelectedSectionListKey("");
                setStudentSearch("");
              }}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#003366]"
            >
              <option value="">All year levels</option>
              {availableYearLevels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>

            <select
              value={filterSchoolYear}
              onChange={(e) => {
                setFilterSchoolYear(e.target.value);
                setSelectedSectionListKey("");
                setStudentSearch("");
              }}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#003366]"
            >
              <option value="">All school years</option>
              {availableSchoolYears.map((schoolYear) => (
                <option key={schoolYear} value={schoolYear}>
                  {schoolYear}
                </option>
              ))}
            </select>

            <select
              value={filterSemester}
              onChange={(e) => {
                setFilterSemester(e.target.value);
                setSelectedSectionListKey("");
                setStudentSearch("");
              }}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#003366]"
            >
              <option value="">All semesters</option>
              {availableSemesters.map((semester) => (
                <option key={semester} value={semester}>
                  {semester}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-5 max-h-[620px] space-y-3 overflow-y-auto pr-1">
            {!filterProgram ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                Select a program first to view section lists.
              </div>
            ) : filteredSectionLists.length > 0 ? (
              filteredSectionLists.map((sectionList) => (
                <button
                  key={sectionList.key}
                  onClick={() => {
                    setSelectedSectionListKey(sectionList.key);
                    setStudentSearch("");
                  }}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    selectedSectionListKey === sectionList.key
                      ? "border-[#003366] bg-[#003366]/5 shadow-sm"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <p className="text-lg font-bold text-[#003366]">
                    {sectionList.section}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {sectionList.yearLevel}
                  </p>
                  <p className="text-sm text-slate-600">
                    {sectionList.schoolYear} | {sectionList.semester}
                  </p>
                  <div className="mt-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    Students: {sectionList.students.length}
                  </div>
                </button>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                No section lists found for this program.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {selectedSectionList ? (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Program</p>
                  <p className="mt-2 text-lg font-bold text-[#003366]">
                    {selectedSectionList.program}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Year Level</p>
                  <p className="mt-2 text-lg font-bold text-[#003366]">
                    {selectedSectionList.yearLevel}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Section</p>
                  <p className="mt-2 text-lg font-bold text-[#003366]">
                    {selectedSectionList.section}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">School Year</p>
                  <p className="mt-2 text-lg font-bold text-[#003366]">
                    {selectedSectionList.schoolYear}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Semester</p>
                  <p className="mt-2 text-lg font-bold text-[#003366]">
                    {selectedSectionList.semester}
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-[#003366]">
                      Selected Section List
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Edit students inside this section.
                    </p>
                  </div>

                  <button
                    onClick={handleDeleteSectionList}
                    className="rounded-2xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                  >
                    Delete Section List
                  </button>
                </div>

                <div className="mt-4">
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Search by student ID or name..."
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#003366]"
                  />
                </div>

                <div className="mt-6 overflow-x-auto">
                  <table className="min-w-full overflow-hidden rounded-2xl">
                    <thead>
                      <tr className="bg-[#003366] text-white">
                        <th className="px-4 py-3 text-left text-sm font-semibold">
                          Student ID
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">
                          First Name
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">
                          Last Name
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredSelectedStudents.length > 0 ? (
                        filteredSelectedStudents.map((student) => (
                          <tr key={student.studentId} className="border-b bg-white">
                            <td className="px-4 py-3">{student.studentId}</td>
                            <td className="px-4 py-3">{student.firstName}</td>
                            <td className="px-4 py-3">{student.lastName}</td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() =>
                                  handleRemoveStudent(student.studentId)
                                }
                                className="rounded-xl border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="4"
                            className="py-8 text-center text-slate-500"
                          >
                            {studentSearch
                              ? "No matching students found."
                              : "No students in this section."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-xl font-bold text-[#003366]">
                  Add Student Manually
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Use this for irregular, transferee, or late-added students.
                </p>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <input
                    type="text"
                    value={manualStudentId}
                    onChange={(e) => setManualStudentId(e.target.value)}
                    placeholder="Student ID"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#003366]"
                  />

                  <input
                    type="text"
                    value={manualFirstName}
                    onChange={(e) => setManualFirstName(e.target.value)}
                    placeholder="First Name"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#003366]"
                  />

                  <input
                    type="text"
                    value={manualLastName}
                    onChange={(e) => setManualLastName(e.target.value)}
                    placeholder="Last Name"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#003366]"
                  />
                </div>

                <button
                  onClick={handleAddStudent}
                  className="mt-4 rounded-2xl bg-[#003366] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#00264d]"
                >
                  Add Student
                </button>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-xl font-bold text-[#003366]">
                  Copy Section List
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Copy this section list into a new academic term, then edit it
                  for irregular or new students.
                </p>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <select
                    value={copySchoolYear}
                    onChange={(e) => setCopySchoolYear(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#003366]"
                  >
                    <option value="">Target school year</option>
                    {availableSchoolYears.map((schoolYear) => (
                      <option key={schoolYear} value={schoolYear}>
                        {schoolYear}
                      </option>
                    ))}
                  </select>

                  <select
                    value={copySemester}
                    onChange={(e) => setCopySemester(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#003366]"
                  >
                    <option value="">Target semester</option>
                    {availableSemesters.map((semester) => (
                      <option key={semester} value={semester}>
                        {semester}
                      </option>
                    ))}
                  </select>

                  <select
                    value={copyYearLevel}
                    onChange={(e) => setCopyYearLevel(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#003366]"
                  >
                    <option value="">Target year level</option>
                    {availableYearLevels.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>

                  <select
                    value={copySection}
                    onChange={(e) => setCopySection(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#003366]"
                  >
                    <option value="">Target section</option>
                    {availableSections.map((section) => (
                      <option key={section} value={section}>
                        {section}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleCopySectionList}
                  className="mt-4 rounded-2xl bg-[#003366] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#00264d]"
                >
                  Copy Section List
                </button>
              </div>
            </>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 shadow-sm">
              Select a section list from the left to preview and edit it.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentListImport;