import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  STUDENT_BATCHES_KEY,
  STUDENT_SUBMISSION_LOGS_KEY,
  buildStudentCsvContent,
  parseStudentIdSpreadsheet,
  syncSectionedStudentsToStorage,
} from "../../utils/studentSectioningHelpers";

const buildRegistrarSectioningName = () => "Registrar Sectioning Office";
const CURRENT_YEAR = new Date().getFullYear();

export function StudentSubmissionLogs({ version = 0 }) {
  const [submissionLogs, setSubmissionLogs] = useState(() => {
    const saved = localStorage.getItem(STUDENT_SUBMISSION_LOGS_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const saved = localStorage.getItem(STUDENT_SUBMISSION_LOGS_KEY);
    setSubmissionLogs(saved ? JSON.parse(saved) : []);
  }, [version]);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-[#003366]">
          Submission Logs
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Track which department files were already imported for sectioning.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-[#003366] text-white">
              <th className="px-4 py-3 text-left text-sm">Department</th>
              <th className="px-4 py-3 text-left text-sm">Batch Year</th>
              <th className="px-4 py-3 text-left text-sm">File</th>
              <th className="px-4 py-3 text-left text-sm">Students</th>
              <th className="px-4 py-3 text-left text-sm">Workspace</th>
              <th className="px-4 py-3 text-left text-sm">Imported At</th>
              <th className="px-4 py-3 text-left text-sm">Status</th>
            </tr>
          </thead>

          <tbody>
            {submissionLogs.length > 0 ? (
              submissionLogs.map((log) => (
                <tr key={log.id} className="border-b bg-white">
                  <td className="px-4 py-3">{log.program}</td>
                  <td className="px-4 py-3">{log.batchYear}</td>
                  <td className="px-4 py-3">{log.fileName}</td>
                  <td className="px-4 py-3">{log.totalStudents}</td>
                  <td className="px-4 py-3">{log.submittedTo}</td>
                  <td className="px-4 py-3">
                    {new Date(log.submittedAt).toLocaleString("en-US")}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="py-8 text-center text-slate-500">
                  No submission logs yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StudentListImport({ selectedProgram = "", onImportComplete }) {
  const [selectedBatchYear, setSelectedBatchYear] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);
  const [yearPickerAnchor, setYearPickerAnchor] = useState(CURRENT_YEAR);
  const yearPickerRef = useRef(null);

  const [submissionBatches, setSubmissionBatches] = useState(() => {
    const saved = localStorage.getItem(STUDENT_BATCHES_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [submissionLogs, setSubmissionLogs] = useState(() => {
    const saved = localStorage.getItem(STUDENT_SUBMISSION_LOGS_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    if (!isYearPickerOpen) return;

    const handleOutsideClick = (event) => {
      if (yearPickerRef.current?.contains(event.target)) return;
      setIsYearPickerOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isYearPickerOpen]);

  const yearOptions = useMemo(
    () => Array.from({ length: 12 }, (_, index) => String(yearPickerAnchor + index)),
    [yearPickerAnchor]
  );

  const openYearPicker = () => {
    const resolvedYear = Math.max(Number(selectedBatchYear) || CURRENT_YEAR, CURRENT_YEAR);
    setYearPickerAnchor(resolvedYear);
    setIsYearPickerOpen(true);
  };

  const handleYearInputChange = (event) => {
    const numericValue = event.target.value.replace(/\D/g, "").slice(0, 4);

    if (numericValue.length === 4) {
      const resolvedYear = Math.max(Number(numericValue), CURRENT_YEAR);
      setSelectedBatchYear(String(resolvedYear));
      setYearPickerAnchor(resolvedYear);
      return;
    }

    setSelectedBatchYear(numericValue);
  };

  const handleYearSelect = (year) => {
    setSelectedBatchYear(year);
    setIsYearPickerOpen(false);
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
  };

  const handleDownloadTemplate = () => {
    if (!selectedProgram || !selectedBatchYear) {
      alert("Please complete the department and batch year first.");
      return;
    }

    if (Number(selectedBatchYear) < CURRENT_YEAR) {
      alert(`Batch year cannot be earlier than ${CURRENT_YEAR}.`);
      return;
    }

    const csvContent =
      "Student ID,Sex,Last Name,First Name,Middle Initial\n" +
      "26-0001,Male,Dela Cruz,Juan,A\n" +
      "26-0002,Female,Santos,Maria,L\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.setAttribute(
      "download",
      `${selectedProgram}-${selectedBatchYear}-student-list.csv`
    );

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = () => {
    if (!selectedProgram || !selectedBatchYear) {
      alert("Please complete the department and batch year first.");
      return;
    }

    if (!/^\d{4}$/.test(selectedBatchYear)) {
      alert("Batch year must be a 4-digit year.");
      return;
    }

    if (Number(selectedBatchYear) < CURRENT_YEAR) {
      alert(`Batch year cannot be earlier than ${CURRENT_YEAR}.`);
      return;
    }

    if (!selectedFile) {
      alert("Please choose the Excel CSV file first.");
      return;
    }

    if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
      alert("Please upload the Excel CSV template in .csv format.");
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      const text = event.target?.result;

      if (!text) {
        alert("Unable to read file.");
        return;
      }

      const parsedStudents = parseStudentIdSpreadsheet(text);

      if (parsedStudents.length === 0) {
        alert(
          "The file must contain Student ID, Sex, Last Name, First Name, and Middle Initial columns with valid rows."
        );
        return;
      }

      const submissionKey = [selectedProgram, selectedBatchYear].join("|");
      const submittedAt = new Date().toISOString();

      const nextBatch = {
        id: Date.now(),
        key: submissionKey,
        program: selectedProgram,
        batchYear: selectedBatchYear,
        submittedTo: buildRegistrarSectioningName(),
        fileName: selectedFile.name,
        submittedAt,
        status: "Imported",
        receivedCsvContent: buildStudentCsvContent(parsedStudents, {
          includeYearLevel: false,
        }),
        students: parsedStudents,
      };

      const updatedBatches = [
        ...submissionBatches.filter((batch) => batch.key !== submissionKey),
        nextBatch,
      ];

      const updatedLogs = [
        {
          id: Date.now(),
          program: selectedProgram,
          batchYear: selectedBatchYear,
          submittedTo: buildRegistrarSectioningName(),
          fileName: selectedFile.name,
          totalStudents: parsedStudents.length,
          submittedAt,
        status: "Imported",
        },
        ...submissionLogs,
      ];

      setSubmissionBatches(updatedBatches);
      setSubmissionLogs(updatedLogs);
      localStorage.setItem(STUDENT_BATCHES_KEY, JSON.stringify(updatedBatches));
      localStorage.setItem(
        STUDENT_SUBMISSION_LOGS_KEY,
        JSON.stringify(updatedLogs)
      );
      syncSectionedStudentsToStorage(updatedBatches);
      onImportComplete?.(updatedBatches);

      setSelectedFile(null);
      alert("Student list imported for registrar sectioning successfully.");
    };

    reader.readAsText(selectedFile);
  };

  return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h3 className="text-2xl font-bold text-[#003366]">
            Import Student List
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Upload one Excel CSV file per department with student ID, sex, last
            name, first name, middle initial, and optional year level, then
            keep it in the registrar workspace for official sectioning.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Batch Year
            </label>
            <div ref={yearPickerRef} className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={selectedBatchYear}
                onFocus={openYearPicker}
                onClick={openYearPicker}
                onChange={handleYearInputChange}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#003366]"
                placeholder="Select year"
              />

              {isYearPickerOpen ? (
                <div className="absolute left-0 top-[calc(100%+12px)] z-20 w-full min-w-[320px] rounded-3xl border border-slate-200 bg-white shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                    <button
                      type="button"
                      onClick={() =>
                        setYearPickerAnchor((current) =>
                          Math.max(current - 12, CURRENT_YEAR)
                        )
                      }
                      disabled={yearPickerAnchor <= CURRENT_YEAR}
                      className="text-2xl font-light text-slate-500 transition hover:text-[#003366] disabled:cursor-not-allowed disabled:text-slate-300"
                    >
                      ‹
                    </button>

                    <p className="text-lg font-semibold text-slate-700">
                      {yearPickerAnchor}
                    </p>

                    <button
                      type="button"
                      onClick={() => setYearPickerAnchor((current) => current + 12)}
                      className="text-2xl font-light text-slate-500 transition hover:text-[#003366]"
                    >
                      ›
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3 p-5">
                    {yearOptions.map((year) => {
                      const isSelected = selectedBatchYear === year;

                      return (
                        <button
                          key={year}
                          type="button"
                          onClick={() => handleYearSelect(year)}
                          className={`rounded-2xl px-4 py-5 text-lg transition ${
                            isSelected
                              ? "bg-rose-50 text-rose-500"
                              : "text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {year}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 p-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto_auto] lg:items-end">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Upload Excel CSV File
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
                  : "Template format: Student ID, Sex, Last Name, First Name, Middle Initial saved from Excel as CSV"}
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
              Import for Sectioning
            </button>
          </div>
        </div>
      </div>
  );
}

export default StudentListImport;
