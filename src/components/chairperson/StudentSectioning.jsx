import React, { useMemo, useState } from "react";
import {
  AVAILABLE_SECTION_CODES,
  STUDENT_BATCHES_KEY,
  downloadStudentCsvFile,
  syncSectionedStudentsToStorage,
} from "../../utils/studentSectioningHelpers";

function StudentSectioning({ chairpersonDepartment, onSectioningSaved }) {
  const [batches, setBatches] = useState(() => {
    const saved = localStorage.getItem(STUDENT_BATCHES_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedBatchKey, setSelectedBatchKey] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [newSectionCode, setNewSectionCode] = useState("");
  const [newSectionCapacity, setNewSectionCapacity] = useState("");

  const departmentBatches = useMemo(() => {
    return batches
      .filter(
        (batch) =>
          batch.program === chairpersonDepartment &&
          (batch.status || "Forwarded") === "Forwarded"
      )
      .sort(
        (left, right) =>
          new Date(right.submittedAt || 0) - new Date(left.submittedAt || 0)
      );
  }, [batches, chairpersonDepartment]);

  const selectedBatch =
    departmentBatches.find((batch) => batch.key === selectedBatchKey) || null;

  const sectionPlans = selectedBatch?.sectionPlans || [];

  const handleDownloadReceivedCsv = () => {
    if (!selectedBatch) return;

    downloadStudentCsvFile(
      selectedBatch.students || [],
      selectedBatch.fileName ||
        `${selectedBatch.program}-${selectedBatch.batchYear}-received.csv`
    );
  };

  const handleDownloadSectionCsv = (sectionCode) => {
    if (!selectedBatch) return;

    const sectionStudents = (selectedBatch.students || []).filter(
      (student) => student.sectionCode === sectionCode
    );

    if (!sectionStudents.length) {
      alert("No students are assigned to this section yet.");
      return;
    }

    downloadStudentCsvFile(
      sectionStudents,
      `${selectedBatch.program}-${selectedBatch.batchYear}-${sectionCode}.csv`
    );
  };

  const updateSelectedBatch = (updater) => {
    setBatches((prev) =>
      prev.map((batch) => {
        if (batch.key !== selectedBatchKey) return batch;

        return updater(batch);
      })
    );
  };

  const handleSelectBatch = (batchKey) => {
    setSelectedBatchKey(batchKey);
    setStudentSearch("");
    setNewSectionCode("");
    setNewSectionCapacity("");
  };

  const handleAddSectionPlan = () => {
    if (!selectedBatch) {
      alert("Please select a forwarded student list first.");
      return;
    }

    if (!newSectionCode) {
      alert("Please choose a section code.");
      return;
    }

    const capacity = Number(newSectionCapacity);

    if (!capacity || capacity <= 0) {
      alert("Please enter a valid section capacity.");
      return;
    }

    const existingSection = sectionPlans.some(
      (section) => section.sectionCode === newSectionCode
    );

    if (existingSection) {
      alert("This section is already added.");
      return;
    }

    updateSelectedBatch((batch) => ({
      ...batch,
      sectionPlans: [
        ...(batch.sectionPlans || []),
        {
          id: `${newSectionCode}-${Date.now()}`,
          sectionCode: newSectionCode,
          capacity,
        },
      ],
    }));

    setNewSectionCode("");
    setNewSectionCapacity("");
  };

  const handleRemoveSectionPlan = (sectionCode) => {
    updateSelectedBatch((batch) => ({
      ...batch,
      sectionPlans: (batch.sectionPlans || []).filter(
        (section) => section.sectionCode !== sectionCode
      ),
      students: (batch.students || []).map((student) =>
        student.sectionCode === sectionCode
          ? { ...student, yearLevel: "", sectionCode: "" }
          : student
      ),
    }));
  };

  const handleAutoDistribute = () => {
    if (!selectedBatch) {
      alert("Please select a forwarded student list first.");
      return;
    }

    if (!sectionPlans.length) {
      alert("Please create at least one section plan first.");
      return;
    }

    const totalCapacity = sectionPlans.reduce(
      (sum, section) => sum + Number(section.capacity || 0),
      0
    );

    if (totalCapacity < (selectedBatch.students || []).length) {
      alert("Total section capacity is smaller than the number of students.");
      return;
    }

    let currentIndex = 0;

    updateSelectedBatch((batch) => {
      const distributedStudents = (batch.students || []).map((student) => ({
        ...student,
        yearLevel: "",
        sectionCode: "",
      }));

      const nextStudents = [...distributedStudents];

      sectionPlans.forEach((section) => {
        const seats = Number(section.capacity || 0);

        for (let seat = 0; seat < seats; seat += 1) {
          if (!nextStudents[currentIndex]) break;

          nextStudents[currentIndex] = {
            ...nextStudents[currentIndex],
            yearLevel: "1st Year",
            sectionCode: section.sectionCode,
          };
          currentIndex += 1;
        }
      });

      return {
        ...batch,
        lastSectionedAt: new Date().toISOString(),
        students: nextStudents,
      };
    });
  };

  const handleMoveStudent = (studentId, sectionCode) => {
    updateSelectedBatch((batch) => ({
      ...batch,
      lastSectionedAt: new Date().toISOString(),
      students: (batch.students || []).map((student) =>
        student.studentId === studentId
          ? {
              ...student,
              yearLevel: sectionCode ? "1st Year" : "",
              sectionCode,
            }
          : student
      ),
    }));
  };

  const handleSaveSectioning = () => {
    localStorage.setItem(STUDENT_BATCHES_KEY, JSON.stringify(batches));
    syncSectionedStudentsToStorage(batches);
    onSectioningSaved?.();
    alert("Student sectioning saved successfully.");
  };

  const filteredStudents = (() => {
    if (!selectedBatch) return [];

    const searchValue = studentSearch.trim().toLowerCase();

    if (!searchValue) return selectedBatch.students || [];

    return (selectedBatch.students || []).filter((student) => {
      const fullName =
        `${student.lastName} ${student.firstName} ${student.middleInitial}`.toLowerCase();

      return (
        student.studentId.toLowerCase().includes(searchValue) ||
        fullName.includes(searchValue)
      );
    });
  })();

  const totalStudents = selectedBatch?.students?.length || 0;
  const totalSectionedStudents = selectedBatch
    ? (selectedBatch.students || []).filter(
        (student) => student.yearLevel && student.sectionCode
      ).length
    : 0;
  const totalCapacity = sectionPlans.reduce(
    (sum, section) => sum + Number(section.capacity || 0),
    0
  );
  const remainingStudents = Math.max(totalStudents - totalSectionedStudents, 0);

  const sectionCounts = selectedBatch
    ? sectionPlans.map((section) => {
        const assigned = (selectedBatch.students || []).filter(
          (student) => student.sectionCode === section.sectionCode
        ).length;

        return {
          ...section,
          assigned,
        };
      })
    : [];

  const availableSectionOptions = AVAILABLE_SECTION_CODES.filter(
    (sectionCode) =>
      !sectionPlans.some((section) => section.sectionCode === sectionCode)
  );

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-2xl font-bold text-[#003366]">Student Sectioning</h3>
        <p className="mt-1 text-sm text-slate-500">
          Review the forwarded first-year list, create sections with capacities,
          auto-distribute the students, then adjust only the exceptions.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-[#003366]">
              Forwarded Student Lists
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              These lists were forwarded by the registrar for {chairpersonDepartment}.
            </p>
          </div>

          <div className="space-y-3">
            {departmentBatches.length > 0 ? (
              departmentBatches.map((batch) => (
                <button
                  key={batch.key}
                  onClick={() => handleSelectBatch(batch.key)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    selectedBatchKey === batch.key
                      ? "border-[#003366] bg-[#003366]/5 shadow-sm"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <p className="text-lg font-bold text-[#003366]">
                    {batch.program}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Batch {batch.batchYear}
                  </p>
                  <p className="text-sm text-slate-500">
                    Forwarded {new Date(batch.submittedAt).toLocaleString("en-US")}
                  </p>
                  <div className="mt-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    Students: {(batch.students || []).length}
                  </div>
                </button>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                No forwarded student lists yet for this department.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {selectedBatch ? (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Department</p>
                  <p className="mt-2 text-lg font-bold text-[#003366]">
                    {selectedBatch.program}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Batch Year</p>
                  <p className="mt-2 text-lg font-bold text-[#003366]">
                    {selectedBatch.batchYear}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Imported Year Level</p>
                  <p className="mt-2 text-lg font-bold text-[#003366]">
                    1st Year
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Sectioned Students</p>
                  <p className="mt-2 text-lg font-bold text-[#003366]">
                    {totalSectionedStudents} / {totalStudents}
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-[#003366]">
                      Received CSV
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      The registrar-submitted list stays available here as CSV
                      while you prepare section CSVs for faculty.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadReceivedCsv}
                    className="rounded-2xl border border-[#003366] px-5 py-3 text-sm font-semibold text-[#003366] transition hover:bg-[#003366] hover:text-white"
                  >
                    Download Received CSV
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Original File</p>
                    <p className="mt-1 font-semibold text-slate-800">
                      {selectedBatch.fileName || "--"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Forwarded At</p>
                    <p className="mt-1 font-semibold text-slate-800">
                      {new Date(selectedBatch.submittedAt).toLocaleString("en-US")}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Total Students</p>
                    <p className="mt-1 font-semibold text-slate-800">
                      {totalStudents}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-[#003366]">
                      Section Setup
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Create the first-year sections and set the maximum number
                      of students for each section before auto-distribution.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAutoDistribute}
                    className="rounded-2xl bg-[#003366] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#00264d]"
                  >
                    Auto-Distribute Students
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_220px_auto]">
                  <select
                    value={newSectionCode}
                    onChange={(e) => setNewSectionCode(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#003366]"
                  >
                    <option value="">Choose section</option>
                    {availableSectionOptions.map((sectionCode) => (
                      <option key={sectionCode} value={sectionCode}>
                        {sectionCode}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="1"
                    value={newSectionCapacity}
                    onChange={(e) => setNewSectionCapacity(e.target.value)}
                    placeholder="Capacity"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#003366]"
                  />

                  <button
                    type="button"
                    onClick={handleAddSectionPlan}
                    className="rounded-2xl border border-[#003366] px-5 py-3 text-sm font-semibold text-[#003366] transition hover:bg-[#003366] hover:text-white"
                  >
                    Add Section
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Total Capacity</p>
                    <p className="mt-1 text-lg font-bold text-[#003366]">
                      {totalCapacity}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Students Waiting</p>
                    <p className="mt-1 text-lg font-bold text-[#003366]">
                      {remainingStudents}
                    </p>
                  </div>
                </div>

                <div className="mt-6 overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-[#003366] text-white">
                        <th className="px-4 py-3 text-left text-sm">Section</th>
                        <th className="px-4 py-3 text-left text-sm">Capacity</th>
                        <th className="px-4 py-3 text-left text-sm">Assigned</th>
                        <th className="px-4 py-3 text-left text-sm">Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {sectionCounts.length > 0 ? (
                        sectionCounts.map((section) => (
                          <tr key={section.id} className="border-b bg-white">
                            <td className="px-4 py-3 font-medium text-slate-700">
                              1st Year {section.sectionCode}
                            </td>
                            <td className="px-4 py-3">{section.capacity}</td>
                            <td className="px-4 py-3">
                              {section.assigned} / {section.capacity}
                            </td>
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                onClick={() =>
                                  handleDownloadSectionCsv(section.sectionCode)
                                }
                                className="mr-2 rounded-lg border border-[#003366]/20 px-3 py-1 text-sm font-medium text-[#003366] hover:bg-[#003366]/5"
                              >
                                Export CSV
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveSectionPlan(section.sectionCode)
                                }
                                className="rounded-lg border border-red-200 px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-50"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="py-8 text-center text-slate-500">
                            No sections created yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-[#003366]">
                      Student Roster
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Review the imported first-year list after auto-distribution
                      and manually move only students that need adjustment.
                    </p>
                  </div>

                  <button
                    onClick={handleSaveSectioning}
                    className="rounded-2xl bg-[#003366] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#00264d]"
                  >
                    Save Sectioning
                  </button>
                </div>

                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Search by student ID or name..."
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#003366]"
                />

                <div className="mt-6 overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-[#003366] text-white">
                        <th className="px-4 py-3 text-left text-sm">Student ID</th>
                        <th className="px-4 py-3 text-left text-sm">Sex</th>
                        <th className="px-4 py-3 text-left text-sm">Last Name</th>
                        <th className="px-4 py-3 text-left text-sm">First Name</th>
                        <th className="px-4 py-3 text-left text-sm">M.I.</th>
                        <th className="px-4 py-3 text-left text-sm">Year Level</th>
                        <th className="px-4 py-3 text-left text-sm">Section</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredStudents.length > 0 ? (
                        filteredStudents.map((student) => (
                          <tr key={student.studentId} className="border-b bg-white">
                            <td className="px-4 py-3 font-medium text-slate-700">
                              {student.studentId}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {student.sex || "--"}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {student.lastName || "--"}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {student.firstName || "--"}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {student.middleInitial || "--"}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              1st Year
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={student.sectionCode || ""}
                                onChange={(e) =>
                                  handleMoveStudent(
                                    student.studentId,
                                    e.target.value
                                  )
                                }
                                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                              >
                                <option value="">Not Assigned</option>
                                {sectionPlans.map((section) => (
                                  <option
                                    key={section.sectionCode}
                                    value={section.sectionCode}
                                  >
                                    1st Year {section.sectionCode}
                                  </option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="py-8 text-center text-slate-500">
                            {studentSearch
                              ? "No matching student IDs found."
                              : "No students in this batch."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 shadow-sm">
              Select one forwarded student list to start sectioning students.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentSectioning;
