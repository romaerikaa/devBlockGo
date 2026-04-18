import React, { useState } from "react";
import BulkUploadModal from "./BulkUploadModal";
import { exportGradingSheet } from "../utils/exportGradingSheet";
import StudentRow from "./StudentRow";

const GradingTable = ({
  selectedSection,
  onBack,
  systemTerm,
  activeGradeKey,
  grades,
  setAllGrades,
}) => {
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const activeTerm = systemTerm;

  const formatName = (student) => {
    if (student.firstName && student.lastName) {
      return `${student.lastName}, ${student.firstName}`;
    }

    if (student.name) {
      const parts = student.name.trim().split(" ");

      if (parts.length === 1) return student.name;

      const firstName = parts[0];
      const lastName = parts.slice(1).join(" ");

      return `${lastName}, ${firstName}`;
    }

    return "No Name";
  };

  const getGradeEquivalent = (grade) => {
    const g = Number(grade);

    if (isNaN(g)) return "-";

    if (g >= 97) return "1.00";
    if (g >= 94) return "1.25";
    if (g >= 91) return "1.50";
    if (g >= 88) return "1.75";
    if (g >= 85) return "2.00";
    if (g >= 82) return "2.25";
    if (g >= 79) return "2.50";
    if (g >= 76) return "2.75";
    if (g === 75) return "3.00";
    if (g < 75) return "5.00";

    return "-";
  };

  const handleChange = (studentId, field, value) => {
    const formattedValue = ["INC", "UD", "D", "W"].includes(value.toUpperCase())
      ? value.toUpperCase()
      : value;

    setAllGrades((prev) => ({
      ...prev,
      [activeGradeKey]: {
        ...(prev[activeGradeKey] || {}),
        [selectedSection.sectionName]: {
          ...(prev[activeGradeKey]?.[selectedSection.sectionName] || {}),
          [studentId]: {
            ...(prev[activeGradeKey]?.[selectedSection.sectionName]?.[studentId] || {}),
            [field]: formattedValue,
          },
        },
      },
    }));
  };

  const toggleFlagStudent = (studentId) => {
    setAllGrades((prev) => ({
      ...prev,
      [activeGradeKey]: {
        ...(prev[activeGradeKey] || {}),
        [selectedSection.sectionName]: {
          ...(prev[activeGradeKey]?.[selectedSection.sectionName] || {}),
          [studentId]: {
            ...(prev[activeGradeKey]?.[selectedSection.sectionName]?.[studentId] || {}),
            flagged:
              !prev[activeGradeKey]?.[selectedSection.sectionName]?.[studentId]
                ?.flagged,
          },
        },
      },
    }));
  };

  const computeFinal = (studentId) => {
    const mid = grades[studentId]?.midterm;
    const fin = grades[studentId]?.finals;

    if (["INC", "UD", "D", "W"].includes(mid)) return mid;
    if (["INC", "UD", "D", "W"].includes(fin)) return fin;

    const midterm = Number(mid);
    const finals = Number(fin);

    if (activeTerm === "midterm") {
      return "-";
    }

    if (activeTerm === "finals") {
      if (!midterm || !finals) return "-";
      return ((midterm + finals) / 2).toFixed(2);
    }

    return "-";
  };

  const getStatus = (studentId) => {
    const result = computeFinal(studentId);

    if (activeTerm === "midterm") return "Pending Finals";

    if (["INC", "UD", "D", "W"].includes(result)) return result;
    if (result === "-") return "Incomplete";

    return Number(result) >= 75 ? "Passed" : "Failed";
  };

  return (
    <div className="px-6 pb-10 pt-6">
      <button
        onClick={onBack}
        className="mb-4 rounded-xl border border-red-200 bg-white px-4 py-2 font-semibold text-red-500 hover:bg-red-500 hover:text-white"
      >
        ← Back to Sections
      </button>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md">
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="flex min-w-0 items-center gap-4">
            <span className="shrink-0 rounded-lg bg-blue-50 px-3 py-1 text-sm font-bold text-blue-500">
              {selectedSection.subjectCode}
            </span>

            <div className="flex min-w-0 items-center flex-wrap gap-3 text-sm">
              <h2 className="text-lg font-bold text-[#003366]">
                Section: {selectedSection.sectionName}
              </h2>

              <span className="text-slate-300">•</span>
              <span className="text-slate-600">
                {selectedSection.units} Units
              </span>

              <span className="text-slate-300">•</span>
              <span className="text-slate-600">
                {selectedSection.schedule}
              </span>

              <span className="text-slate-300">•</span>
              <span className="text-slate-600">{selectedSection.day}</span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => setShowBulkUpload(true)}
              className="rounded-lg bg-yellow-400 px-4 py-2 text-sm font-bold text-[#003366] hover:bg-yellow-500"
            >
              Bulk Upload
            </button>

            <button
              onClick={() =>
                exportGradingSheet(selectedSection, grades, systemTerm)
              }
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Export Grades
            </button>
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b-4 border-yellow-400 bg-[#003b78] text-white">
              <th className="px-6 py-4 text-left text-[15px] font-bold uppercase tracking-wide">
                Student ID
              </th>
              <th className="px-6 py-4 text-left text-[15px] font-bold uppercase tracking-wide">
                Student Name
              </th>
              <th className="px-6 py-4 text-center text-[15px] font-bold uppercase tracking-wide">
                Midterm{" "}
                <span className="font-normal text-slate-300">(60–100)</span>
              </th>
              <th className="px-6 py-4 text-center text-[15px] font-bold uppercase tracking-wide">
                Finals{" "}
                <span className="font-normal text-slate-300">(60–100)</span>
              </th>
              <th className="px-6 py-4 text-center text-[15px] font-bold uppercase tracking-wide">
                Final Grade
              </th>
              <th className="px-6 py-4 text-center text-[15px] font-bold uppercase tracking-wide">
                Grade Equivalent
              </th>
              <th className="px-6 py-4 text-center text-[15px] font-bold uppercase tracking-wide">
                Status
              </th>
              <th className="px-6 py-4 text-center text-[15px] font-bold uppercase tracking-wide">
                Flag
              </th>
            </tr>
          </thead>

          <tbody>
            {selectedSection.students.map((student) => {
              const final = computeFinal(student.id);
              const isFlagged = grades[student.id]?.flagged;

              return (
                <tr
                  key={student.id}
                  className={`border-b border-slate-200 last:border-b-0 ${
                    isFlagged ? "bg-red-50" : ""
                  }`}
                >
                  <td className="px-6 py-4 text-[15px] text-slate-800">
                    {student.id}
                  </td>

                  <td className="px-6 py-4 text-[15px] text-slate-800">
                    <span className="flex items-center gap-2">
                      {isFlagged && (
                        <span className="text-lg text-red-500"></span>
                      )}
                      <span>{formatName(student)}</span>
                    </span>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <input
                      type="text"
                      value={grades[student.id]?.midterm || ""}
                      onChange={(e) =>
                        handleChange(student.id, "midterm", e.target.value)
                      }
                      disabled={activeTerm !== "midterm"}
                      className="h-10 w-24 rounded-xl border border-slate-300 bg-white px-2 text-center focus:outline-none focus:ring-2 focus:ring-[#003366] disabled:bg-slate-100 disabled:text-slate-400"
                    />
                  </td>

                  <td className="px-6 py-4 text-center">
                    <input
                      type="text"
                      value={grades[student.id]?.finals || ""}
                      onChange={(e) =>
                        handleChange(student.id, "finals", e.target.value)
                      }
                      disabled={activeTerm !== "finals"}
                      className="h-10 w-24 rounded-xl border border-slate-300 bg-white px-2 text-center focus:outline-none focus:ring-2 focus:ring-[#003366] disabled:bg-slate-100 disabled:text-slate-400"
                    />
                  </td>

                  <td className="px-6 py-4 text-center text-[16px] font-bold text-[#003366]">
                    {final}
                  </td>

                  <td className="px-6 py-4 text-center font-bold text-[#003366]">
                    {final !== "-" && !isNaN(final)
                      ? getGradeEquivalent(final)
                      : "-"}
                  </td>

                  <td
                    className={`px-6 py-4 text-center text-[14px] font-semibold ${
                      getStatus(student.id) === "Passed"
                        ? "text-green-600"
                        : getStatus(student.id) === "Failed"
                        ? "text-red-600"
                        : getStatus(student.id) === "Incomplete" || getStatus(student.id) === "Pending Finals"
                        ? "text-amber-600"
                        : "text-slate-600"
                    }`}
                  >
                    {getStatus(student.id)}
                  </td>

                  <td className="px-6 py-4 text-center">
                    <button
                      type="button"
                      onClick={() => toggleFlagStudent(student.id)}
                      className={`rounded-lg px-3 py-2 text-sm font-bold transition ${
                        isFlagged
                          ? "bg-red-100 text-red-600 hover:bg-red-200"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {isFlagged ? "Unflag" : "Flag"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <BulkUploadModal
        isOpen={showBulkUpload}
        onClose={() => setShowBulkUpload(false)}
        sectionData={selectedSection}
        systemTerm={systemTerm}
        onUpload={(data) => {
          setAllGrades((prev) => ({
            ...prev,
            [activeGradeKey]: {
              ...(prev[activeGradeKey] || {}),
              [selectedSection.sectionName]: {
                ...(prev[activeGradeKey]?.[selectedSection.sectionName] || {}),
                ...Object.keys(data).reduce((acc, studentId) => {
                  acc[studentId] = {
                    ...(prev[activeGradeKey]?.[selectedSection.sectionName]?.[
                      studentId
                    ] || {}),
                    ...data[studentId],
                  };
                  return acc;
                }, {}),
              },
            },
          }));
        }}
      />
    </div>
  );
};

export default GradingTable;