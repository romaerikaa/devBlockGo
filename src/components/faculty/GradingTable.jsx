import React, { useState } from "react";
import BulkUploadModal from "./BulkUploadModal";
import { exportGradingSheet } from "../../utils/exportGradingSheet";
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

  const handleStandingChange = (studentId, value) => {
    setAllGrades((prev) => ({
      ...prev,
      [activeGradeKey]: {
        ...(prev[activeGradeKey] || {}),
        [selectedSection.sectionName]: {
          ...(prev[activeGradeKey]?.[selectedSection.sectionName] || {}),
          [studentId]: {
            ...(prev[activeGradeKey]?.[selectedSection.sectionName]?.[studentId] || {}),
            standing: value,
          },
        },
      },
    }));
  };

  const handleBulkUpload = (data) => {
    setAllGrades((prev) => ({
      ...prev,
      [activeGradeKey]: {
        ...(prev[activeGradeKey] || {}),
        [selectedSection.sectionName]: {
          ...(prev[activeGradeKey]?.[selectedSection.sectionName] || {}),
          ...Object.keys(data).reduce((acc, studentId) => {
            acc[studentId] = {
              ...(prev[activeGradeKey]?.[selectedSection.sectionName]?.[studentId] || {}),
              ...data[studentId],
            };
            return acc;
          }, {}),
        },
      },
    }));
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
              Midterm <span className="font-normal text-slate-300">(60–100)</span>
            </th>
            <th className="px-6 py-4 text-center text-[15px] font-bold uppercase tracking-wide">
              Finals <span className="font-normal text-slate-300">(60–100)</span>
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
              Standing
            </th>
            <th className="px-6 py-4 text-center text-[15px] font-bold uppercase tracking-wide">
              Flag
            </th>
          </tr>
        </thead>

          <tbody>
            {selectedSection.students.map((student) => (
              <StudentRow
                key={student.id}
                student={student}
                grades={grades}
                activeTerm={systemTerm}
                handleChange={handleChange}
                toggleFlagStudent={toggleFlagStudent}
                handleStandingChange={handleStandingChange}
              />
            ))}
          </tbody>
        </table>
      </div>

      <BulkUploadModal
        isOpen={showBulkUpload}
        onClose={() => setShowBulkUpload(false)}
        sectionData={selectedSection}
        systemTerm={systemTerm}
        onUpload={handleBulkUpload}
      />
    </div>
  );
};

export default GradingTable;