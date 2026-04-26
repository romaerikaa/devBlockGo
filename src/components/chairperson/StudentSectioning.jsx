import React, { useEffect, useMemo, useState } from "react";
import {
  AVAILABLE_YEAR_LEVELS,
  STUDENT_BATCHES_KEY,
  YEAR_LEVEL_PREFIXES,
  downloadStudentCsvFile,
  getDefaultSectionName,
  parseStudentIdSpreadsheet,
  syncSectionedStudentsToStorage,
} from "../../utils/studentSectioningHelpers";

const buildStudentName = (student) =>
  [student.lastName, student.firstName, student.middleInitial]
    .filter(Boolean)
    .join(", ")
    .replace(", ,", ",");

const compareStudentsByName = (left, right) => {
  const leftName = [
    left.lastName,
    left.firstName,
    left.middleInitial,
    left.studentId,
  ]
    .join(" ")
    .toLowerCase();
  const rightName = [
    right.lastName,
    right.firstName,
    right.middleInitial,
    right.studentId,
  ]
    .join(" ")
    .toLowerCase();

  return leftName.localeCompare(rightName);
};

const buildGeneratedSections = ({
  program,
  yearLevel,
  sectionCount,
}) => {
  const resolvedSectionCount = Math.max(sectionCount, 1);
  const yearPrefix = YEAR_LEVEL_PREFIXES[yearLevel] || "1";

  return Array.from({ length: resolvedSectionCount }, (_, index) => {
    const sectionCode = `${yearPrefix}-${index + 1}`;

    return {
      id: `${sectionCode}-${Date.now()}-${index}`,
      sectionCode,
      sectionName: getDefaultSectionName(program, sectionCode),
      yearLevel,
    };
  });
};

const sectionMatchesYearLevel = (section = {}, yearLevel = "1st Year") => {
  const yearPrefix = YEAR_LEVEL_PREFIXES[yearLevel] || "";

  if (section.yearLevel) {
    return section.yearLevel === yearLevel;
  }

  return !!yearPrefix && section.sectionCode?.startsWith(`${yearPrefix}-`);
};

const REMOVAL_REASONS = [
  "Duplicate student record",
  "Wrong program",
  "Not in final enrolled list",
  "Encoding error",
  "Other",
];

function StudentSectioning({ chairpersonDepartment, onSectioningSaved }) {
  const [batches, setBatches] = useState(() => {
    const saved = localStorage.getItem(STUDENT_BATCHES_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedBatchKey, setSelectedBatchKey] = useState("");
  const [sectioningBatchYear, setSectioningBatchYear] = useState(() =>
    String(new Date().getFullYear())
  );
  const [selectedYearLevel, setSelectedYearLevel] = useState("1st Year");
  const [manualSectionCount, setManualSectionCount] = useState("1");
  const [selectedSectionCode, setSelectedSectionCode] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [pendingRemoval, setPendingRemoval] = useState(null);
  const [lateStudent, setLateStudent] = useState({
    studentId: "",
    sex: "",
    lastName: "",
    firstName: "",
    middleInitial: "",
  });

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

  const departmentWorkspaces = useMemo(
    () => batches.filter((batch) => batch.program === chairpersonDepartment),
    [batches, chairpersonDepartment]
  );

  const savedSectioningWorkspace = departmentWorkspaces.find((batch) =>
    (batch.sectionPlans || []).some((section) =>
      sectionMatchesYearLevel(section, selectedYearLevel)
    )
  );
  const fallbackSectioningWorkspace =
    savedSectioningWorkspace ||
    departmentWorkspaces.find((batch) => (batch.sectionPlans || []).length > 0) ||
    null;
  const selectedBatch =
    departmentWorkspaces.find((batch) => batch.key === selectedBatchKey) ||
    (!selectedBatchKey ? fallbackSectioningWorkspace : null) ||
    null;
  const activeBatchKey = selectedBatchKey || selectedBatch?.key || "";
  const displayedBatchYear = selectedBatch?.batchYear || sectioningBatchYear;

  const sectionPlans = selectedBatch?.sectionPlans || [];
  const yearSectionPlans = sectionPlans.filter(
    (section) => sectionMatchesYearLevel(section, selectedYearLevel)
  );
  const students = selectedBatch?.students || [];
  const removedStudents = selectedBatch?.removedStudents || [];
  const selectedSection =
    yearSectionPlans.find((section) => section.sectionCode === selectedSectionCode) ||
    yearSectionPlans[0] ||
    null;

  const sectionSummaries = yearSectionPlans.map((section) => {
    const sectionStudents = students
      .filter(
        (student) =>
          student.sectionCode === section.sectionCode &&
          student.yearLevel === selectedYearLevel
      )
      .sort(compareStudentsByName);
    return {
      ...section,
      sectionName:
        section.sectionName ||
        getDefaultSectionName(selectedBatch?.program, section.sectionCode),
      assigned: sectionStudents.length,
      students: sectionStudents,
    };
  });

  const searchValue = studentSearch.trim().toLowerCase();
  const visibleSectionStudents = selectedSection
    ? students
        .filter(
          (student) =>
            student.sectionCode === selectedSection.sectionCode &&
            student.yearLevel === selectedYearLevel
        )
        .sort(compareStudentsByName)
        .filter((student) => {
          if (!searchValue) return true;

          const fullName = buildStudentName(student).toLowerCase();

          return (
            student.studentId.toLowerCase().includes(searchValue) ||
            fullName.includes(searchValue)
          );
        })
    : [];

  useEffect(() => {
    localStorage.setItem(STUDENT_BATCHES_KEY, JSON.stringify(batches));
  }, [batches]);

  const updateSelectedBatch = (updater) => {
    if (!activeBatchKey) return;

    setBatches((previousBatches) =>
      previousBatches.map((batch) =>
        batch.key === activeBatchKey ? updater(batch) : batch
      )
    );
  };

  const handleDownloadRegistrarCsv = (batch) => {
    const csvContent = batch.receivedCsvContent;

    if (!csvContent) {
      alert("This imported list has no registrar CSV content saved.");
      return;
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.setAttribute(
      "download",
      batch.fileName || `${batch.program}-${batch.batchYear}-registrar-list.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleGenerateSections = () => {
    if (!chairpersonDepartment) {
      alert("Please choose a department first.");
      return;
    }

    if (!/^\d{4}$/.test(sectioningBatchYear)) {
      alert("Enter a valid 4-digit batch year.");
      return;
    }

    const requestedSectionCount = Number(manualSectionCount);

    if (!Number.isInteger(requestedSectionCount) || requestedSectionCount <= 0) {
      alert("Enter how many sections to create.");
      return;
    }

    const workspaceKey = selectedBatch
      ? activeBatchKey
      : [chairpersonDepartment, sectioningBatchYear, "sectioning"].join("|");
    const createdAt = new Date().toISOString();
    const workspaceId = Number(createdAt.replace(/\D/g, "").slice(0, 13));
    const workspace =
      selectedBatch ||
      departmentWorkspaces.find((batch) => batch.key === workspaceKey) || {
        id: workspaceId,
        key: workspaceKey,
        program: chairpersonDepartment,
        batchYear: sectioningBatchYear,
        submittedTo: `${chairpersonDepartment} Chairperson`,
        fileName: "Chairperson sectioning workspace",
        submittedAt: createdAt,
        status: "Sectioning",
        students: [],
        sectionPlans: [],
        removedStudents: [],
      };
    const generatedSections = buildGeneratedSections({
      program: workspace.program,
      yearLevel: selectedYearLevel,
      sectionCount: requestedSectionCount,
    });

    const nextWorkspace = {
      ...workspace,
      importedCount: workspace.importedCount || workspace.students?.length || 0,
      sectionPlans: [
        ...(workspace.sectionPlans || []).filter(
          (section) => (section.yearLevel || "") !== selectedYearLevel
        ),
        ...generatedSections,
      ],
      students: workspace.students || [],
      lastSectionedAt: new Date().toISOString(),
    };

    setBatches((previousBatches) => [
      ...previousBatches.filter((batch) => batch.key !== workspaceKey),
      nextWorkspace,
    ]);
    setSelectedBatchKey(workspaceKey);
    setSectioningBatchYear(workspace.batchYear || sectioningBatchYear);
    setSelectedSectionCode(generatedSections[0]?.sectionCode || "");
  };

  const handleSectionNameChange = (sectionCode, sectionName) => {
    updateSelectedBatch((batch) => {
      const nextSectionPlans = (batch.sectionPlans || []).map((section) =>
        section.sectionCode === sectionCode ? { ...section, sectionName } : section
      );

      return {
        ...batch,
        sectionPlans: nextSectionPlans,
        students: (batch.students || []).map((student) =>
          student.sectionCode === sectionCode
            ? { ...student, sectionName }
            : student
        ),
      };
    });
  };

  const handleDeleteSection = (sectionCode) => {
    const section = sectionPlans.find((plan) => plan.sectionCode === sectionCode);
    const sectionName =
      section?.sectionName ||
      getDefaultSectionName(selectedBatch?.program, sectionCode);

    const confirmed = window.confirm(
      `Delete ${sectionName}? Students in this section will become unassigned.`
    );

    if (!confirmed) return;

    updateSelectedBatch((batch) => ({
      ...batch,
      sectionPlans: (batch.sectionPlans || []).filter(
        (plan) => plan.sectionCode !== sectionCode
      ),
      students: (batch.students || []).map((student) =>
        student.sectionCode === sectionCode
          ? {
              ...student,
              sectionCode: "",
              sectionName: "",
            }
          : student
      ),
      lastSectionedAt: new Date().toISOString(),
    }));

    if (selectedSectionCode === sectionCode) {
      const nextSection = yearSectionPlans.find(
        (plan) => plan.sectionCode !== sectionCode
      );
      setSelectedSectionCode(nextSection?.sectionCode || "");
    }
  };

  const handleMoveStudent = (studentId, sectionCode) => {
    const targetSection = sectionPlans.find(
      (section) => section.sectionCode === sectionCode
    );

    updateSelectedBatch((batch) => ({
      ...batch,
      students: (batch.students || []).map((student) =>
        student.studentId === studentId
          ? {
              ...student,
              yearLevel: sectionCode ? targetSection?.yearLevel || selectedYearLevel : "",
              sectionCode,
              sectionName: targetSection
                ? targetSection.sectionName ||
                  getDefaultSectionName(batch.program, targetSection.sectionCode)
                : "",
            }
          : student
      ),
      lastSectionedAt: new Date().toISOString(),
    }));
  };

  const handleStartRemoveStudent = (student) => {
    setPendingRemoval({
      studentId: student.studentId,
      studentName: buildStudentName(student),
      reason: REMOVAL_REASONS[0],
      note: "",
    });
  };

  const handleCancelRemoveStudent = () => {
    setPendingRemoval(null);
  };

  const handleConfirmRemoveStudent = () => {
    if (!pendingRemoval?.reason) {
      alert("Please choose a removal reason before removing a student.");
      return;
    }

    updateSelectedBatch((batch) => {
      const studentToRemove = (batch.students || []).find(
        (student) => student.studentId === pendingRemoval.studentId
      );

      if (!studentToRemove) return batch;

      return {
        ...batch,
        students: (batch.students || []).filter(
          (student) => student.studentId !== pendingRemoval.studentId
        ),
        removedStudents: [
          {
            ...studentToRemove,
            removedAt: new Date().toISOString(),
            removalReason: pendingRemoval.reason,
            removalNote: pendingRemoval.note.trim(),
            removedFromSectionCode: studentToRemove.sectionCode || "",
            removedFromSectionName: studentToRemove.sectionName || "",
          },
          ...(batch.removedStudents || []),
        ],
        lastSectionedAt: new Date().toISOString(),
      };
    });

    setPendingRemoval(null);
  };

  const handleRestoreStudent = (studentId) => {
    updateSelectedBatch((batch) => {
      const removedStudent = (batch.removedStudents || []).find(
        (student) => student.studentId === studentId
      );

      if (!removedStudent) return batch;

      const alreadyActive = (batch.students || []).some(
        (student) =>
          student.studentId.toLowerCase() === removedStudent.studentId.toLowerCase()
      );

      if (alreadyActive) {
        alert("This student ID already exists in the active roster.");
        return batch;
      }

      const originalSectionExists = (batch.sectionPlans || []).some(
        (section) => section.sectionCode === removedStudent.removedFromSectionCode
      );

      const restoredStudent = {
        studentId: removedStudent.studentId,
        sex: removedStudent.sex || "",
        lastName: removedStudent.lastName || "",
        firstName: removedStudent.firstName || "",
        middleInitial: removedStudent.middleInitial || "",
        yearLevel: originalSectionExists
          ? removedStudent.yearLevel || selectedYearLevel
          : "",
        sectionCode: originalSectionExists
          ? removedStudent.removedFromSectionCode
          : "",
        sectionName: originalSectionExists
          ? removedStudent.removedFromSectionName
          : "",
        isLateEnrollee: removedStudent.isLateEnrollee || false,
      };

      return {
        ...batch,
        students: [...(batch.students || []), restoredStudent],
        removedStudents: (batch.removedStudents || []).filter(
          (student) => student.studentId !== studentId
        ),
        lastSectionedAt: new Date().toISOString(),
      };
    });
  };

  const handleLateStudentChange = (field, value) => {
    setLateStudent((current) => ({ ...current, [field]: value }));
  };

  const handleAddLateStudent = () => {
    if (!selectedBatch) return;

    const studentId = lateStudent.studentId.trim();

    if (
      !studentId ||
      !lateStudent.sex ||
      !lateStudent.lastName.trim() ||
      !lateStudent.firstName.trim() ||
      !lateStudent.middleInitial.trim()
    ) {
      alert("Complete all late enrollee fields before adding the student.");
      return;
    }

    const duplicateStudent = students.some(
      (student) => student.studentId.toLowerCase() === studentId.toLowerCase()
    );

    if (duplicateStudent) {
      alert("This student ID is already in the roster.");
      return;
    }

    const targetSection = selectedSection || yearSectionPlans[0] || null;
    const nextStudent = {
      studentId,
      sex: lateStudent.sex,
      lastName: lateStudent.lastName.trim(),
      firstName: lateStudent.firstName.trim(),
      middleInitial: lateStudent.middleInitial.trim().slice(0, 2),
      yearLevel: targetSection ? targetSection.yearLevel || selectedYearLevel : "",
      sectionCode: targetSection?.sectionCode || "",
      sectionName: targetSection
        ? targetSection.sectionName ||
          getDefaultSectionName(selectedBatch.program, targetSection.sectionCode)
        : "",
      isLateEnrollee: true,
    };

    updateSelectedBatch((batch) => ({
      ...batch,
      students: [...(batch.students || []), nextStudent],
      lastSectionedAt: new Date().toISOString(),
    }));

    setLateStudent({
      studentId: "",
      sex: "",
      lastName: "",
      firstName: "",
      middleInitial: "",
    });
  };

  const handleDownloadSectionCsv = (sectionCode) => {
    if (!selectedBatch) return;

    const section = sectionPlans.find((plan) => plan.sectionCode === sectionCode);
    const sectionStudents = students
      .filter((student) => student.sectionCode === sectionCode)
      .sort(compareStudentsByName);

    if (!sectionStudents.length) {
      alert("No students are assigned to this section yet.");
      return;
    }

    downloadStudentCsvFile(
      sectionStudents,
      `${section?.sectionName || sectionCode}-${selectedBatch.batchYear}.csv`
    );
  };

  const handleUploadSectionCsv = (sectionCode, file) => {
    if (!selectedBatch || !file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      alert("Please upload the section roster in CSV format.");
      return;
    }

    const targetSection = sectionPlans.find(
      (section) => section.sectionCode === sectionCode
    );

    if (!targetSection) {
      alert("Selected section was not found.");
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

      const parsedById = new Map(
        parsedStudents.map((student) => [
          student.studentId.toLowerCase(),
          student,
        ])
      );
      const targetSectionName =
        targetSection.sectionName ||
        getDefaultSectionName(selectedBatch.program, targetSection.sectionCode);
      const targetYearLevel = targetSection.yearLevel || selectedYearLevel;
      const existingAssignedSectionById = new Map(
        (selectedBatch.students || []).map((student) => [
          student.studentId.toLowerCase(),
          student.sectionCode || "",
        ])
      );
      const skippedAssignedStudents = parsedStudents.filter((student) => {
        const assignedSection = existingAssignedSectionById.get(
          student.studentId.toLowerCase()
        );

        return assignedSection && assignedSection !== targetSection.sectionCode;
      });

      updateSelectedBatch((batch) => {
        const existingIds = new Set(
          (batch.students || []).map((student) => student.studentId.toLowerCase())
        );
        const updatedStudents = (batch.students || []).map((student) => {
          const parsedStudent = parsedById.get(student.studentId.toLowerCase());

          if (parsedStudent) {
            const isAlreadyInAnotherSection =
              student.sectionCode && student.sectionCode !== targetSection.sectionCode;

            if (isAlreadyInAnotherSection) {
              return student;
            }

            return {
              ...student,
              ...parsedStudent,
              yearLevel: targetYearLevel,
              sectionCode: targetSection.sectionCode,
              sectionName: targetSectionName,
            };
          }

          return student;
        });

        const newStudents = parsedStudents
          .filter(
            (student) => !existingIds.has(student.studentId.toLowerCase())
          )
          .map((student) => ({
            ...student,
            yearLevel: targetYearLevel,
            sectionCode: targetSection.sectionCode,
            sectionName: targetSectionName,
            addedFromSectionCsv: true,
          }));

        return {
          ...batch,
          students: [...updatedStudents, ...newStudents],
          lastSectionedAt: new Date().toISOString(),
        };
      });

      if (skippedAssignedStudents.length) {
        alert(
          `Section roster updated from CSV. ${skippedAssignedStudents.length} student ID(s) were already assigned to another section, so they were not moved.`
        );
        return;
      }

      alert("Section roster updated from CSV.");
    };

    reader.readAsText(file);
  };

  const handleSaveSectioning = () => {
    localStorage.setItem(STUDENT_BATCHES_KEY, JSON.stringify(batches));
    syncSectionedStudentsToStorage(batches);
    onSectioningSaved?.();
    alert("Final section rosters saved successfully.");
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              IT Chairperson Section Generator
            </p>
            <h3 className="mt-1 text-2xl font-bold text-[#003366]">
              Year-Level Sectioning
            </h3>
            <p className="mt-2 max-w-3xl text-sm text-slate-500">
              Work from the enrolled list forwarded by the registrar, generate
              sections per year level, update each roster from CSV, and save the
              final rosters for academic assignment.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSaveSectioning}
            disabled={!selectedBatch || !sectionPlans.length}
            className="rounded-xl bg-[#003366] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#00264d] disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Save Final Rosters
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[300px_1fr]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-[#003366]">Imported Lists</h3>
          <p className="mt-1 text-sm text-slate-500">
            Download the registrar-forwarded CSV file and arrange sections in
            Excel before uploading section rosters here.
          </p>

          <div className="mt-4 space-y-3">
            {departmentBatches.length > 0 ? (
              departmentBatches.map((batch) => (
                <article
                  key={batch.key}
                  className="rounded-xl border border-slate-200 bg-white p-4"
                >
                  <p className="font-bold text-[#003366]">{batch.program}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Batch {batch.batchYear}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    {new Date(batch.submittedAt).toLocaleString("en-US")}
                  </p>
                  <span className="mt-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {(batch.students || []).length} imported
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDownloadRegistrarCsv(batch)}
                    className="mt-3 w-full rounded-lg border border-[#003366] px-3 py-2 text-sm font-semibold text-[#003366] hover:bg-[#003366] hover:text-white"
                  >
                    Download CSV
                  </button>
                </article>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm text-slate-500">
                No imported student list is available for this department.
              </div>
            )}
          </div>
        </aside>

        <main className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_170px_170px_170px_auto] lg:items-end">
                <div>
                  <h3 className="text-xl font-bold text-[#003366]">
                    Section Generator
                  </h3>
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Year level
                  </span>
                  <select
                    value={selectedYearLevel}
                    onChange={(event) => {
                      const nextYearLevel = event.target.value;
                      const workspaceWithYear =
                        (selectedBatch?.sectionPlans || []).some((section) =>
                          sectionMatchesYearLevel(section, nextYearLevel)
                        )
                          ? selectedBatch
                          : departmentWorkspaces.find((batch) =>
                              (batch.sectionPlans || []).some((section) =>
                                sectionMatchesYearLevel(section, nextYearLevel)
                              )
                            );
                      const nextYearSection = (
                        workspaceWithYear?.sectionPlans || []
                      ).find((section) =>
                        sectionMatchesYearLevel(section, nextYearLevel)
                      );

                      setSelectedYearLevel(nextYearLevel);
                      if (workspaceWithYear?.key) {
                        setSelectedBatchKey(workspaceWithYear.key);
                        setSectioningBatchYear(
                          workspaceWithYear.batchYear || sectioningBatchYear
                        );
                      }
                      setSelectedSectionCode(nextYearSection?.sectionCode || "");
                    }}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#003366]"
                  >
                    {AVAILABLE_YEAR_LEVELS.map((yearLevel) => (
                      <option key={yearLevel} value={yearLevel}>
                        {yearLevel}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Batch year
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={displayedBatchYear}
                    onChange={(event) =>
                      setSectioningBatchYear(
                        event.target.value.replace(/\D/g, "").slice(0, 4)
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#003366]"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Number of sections
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={manualSectionCount}
                    onChange={(event) => setManualSectionCount(event.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#003366]"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleGenerateSections}
                  className="rounded-xl bg-[#003366] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#00264d]"
                >
                  Generate Sections
                </button>
              </div>

            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-xl font-bold text-[#003366]">
                    Section Preview
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Review each generated section separately and edit section
                    names before saving the final rosters. Uploading a CSV here
                    replaces that section roster.
                  </p>
                </div>
              </div>

              {sectionSummaries.length ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
                  {sectionSummaries.map((section) => (
                    <article
                      key={section.sectionCode}
                      className={`rounded-xl border p-4 transition ${
                        selectedSection?.sectionCode === section.sectionCode
                          ? "border-[#003366] bg-[#003366]/5"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedSectionCode(section.sectionCode)}
                          className="text-left"
                        >
                          <p className="text-sm font-semibold text-slate-500">
                            Section {section.sectionCode}
                          </p>
                          <p className="mt-1 text-xl font-bold text-[#003366]">
                            {section.sectionName}
                          </p>
                        </button>

                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                          {section.assigned} student
                          {section.assigned === 1 ? "" : "s"}
                        </span>
                      </div>

                      <input
                        type="text"
                        value={section.sectionName}
                        onChange={(event) =>
                          handleSectionNameChange(
                            section.sectionCode,
                            event.target.value
                          )
                        }
                        className="mt-4 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#003366]"
                        aria-label={`Edit ${section.sectionCode} section name`}
                      />

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedSectionCode(section.sectionCode)}
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          View Roster
                        </button>
                        <label className="cursor-pointer rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                          Upload CSV
                          <input
                            type="file"
                            accept=".csv"
                            onChange={(event) => {
                              handleUploadSectionCsv(
                                section.sectionCode,
                                event.target.files?.[0]
                              );
                              event.target.value = "";
                            }}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => handleDownloadSectionCsv(section.sectionCode)}
                          className="rounded-lg border border-[#003366] px-3 py-2 text-sm font-semibold text-[#003366] hover:bg-[#003366] hover:text-white"
                        >
                          Export CSV
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSection(section.sectionCode)}
                          className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                  Generate sections to preview students by section.
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="text-xl font-bold text-[#003366]">
                    {selectedSection
                      ? selectedSection.sectionName ||
                        getDefaultSectionName(
                          selectedBatch.program,
                          selectedSection.sectionCode
                        )
                      : "Section Roster"}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Move students between generated sections, add late
                    enrollees, and remove duplicates or wrong entries.
                  </p>
                </div>

                <input
                  type="text"
                  value={studentSearch}
                  onChange={(event) => setStudentSearch(event.target.value)}
                  placeholder="Search this section..."
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#003366] lg:max-w-xs"
                />
              </div>

              {pendingRemoval ? (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-red-700">
                        Remove {pendingRemoval.studentName}
                      </p>
                      <p className="mt-1 text-sm text-red-600">
                        This student will move to the removed students audit list.
                      </p>
                    </div>

                    <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-[220px_1fr_auto_auto] xl:max-w-4xl">
                      <select
                        value={pendingRemoval.reason}
                        onChange={(event) =>
                          setPendingRemoval((current) => ({
                            ...current,
                            reason: event.target.value,
                          }))
                        }
                        className="rounded-xl border border-red-200 bg-white px-4 py-3 text-sm outline-none focus:border-red-500"
                        aria-label="Removal reason"
                      >
                        {REMOVAL_REASONS.map((reason) => (
                          <option key={reason} value={reason}>
                            {reason}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={pendingRemoval.note}
                        onChange={(event) =>
                          setPendingRemoval((current) => ({
                            ...current,
                            note: event.target.value,
                          }))
                        }
                        placeholder="Optional note"
                        className="rounded-xl border border-red-200 bg-white px-4 py-3 text-sm outline-none focus:border-red-500"
                      />
                      <button
                        type="button"
                        onClick={handleCancelRemoveStudent}
                        className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmRemoveStudent}
                        className="rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700"
                      >
                        Confirm Remove
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-[#003366] text-white">
                      <th className="px-4 py-3 text-left text-sm">Student ID</th>
                      <th className="px-4 py-3 text-left text-sm">Name</th>
                      <th className="px-4 py-3 text-left text-sm">Sex</th>
                      <th className="px-4 py-3 text-left text-sm">Section</th>
                      <th className="px-4 py-3 text-left text-sm">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleSectionStudents.length > 0 ? (
                      visibleSectionStudents.map((student) => (
                        <tr key={student.studentId} className="border-b bg-white">
                          <td className="px-4 py-3 font-semibold text-slate-800">
                            {student.studentId}
                            {student.isLateEnrollee ? (
                              <span className="ml-2 rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                                Late
                              </span>
                            ) : null}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {buildStudentName(student)}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {student.sex || "--"}
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={student.sectionCode || ""}
                              onChange={(event) =>
                                handleMoveStudent(student.studentId, event.target.value)
                              }
                              className="w-full min-w-44 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#003366]"
                            >
                              <option value="">Unassigned</option>
                              {sectionSummaries.map((section) => (
                                <option
                                  key={section.sectionCode}
                                  value={section.sectionCode}
                                >
                                  {section.sectionName}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => handleStartRemoveStudent(student)}
                              className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-slate-500">
                          {selectedSection
                            ? "No students found in this section."
                            : "Generate sections to view section rosters."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-bold text-[#003366]">
                Add Student
              </h3>
              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
                <input
                  type="text"
                  value={lateStudent.studentId}
                  onChange={(event) =>
                    handleLateStudentChange("studentId", event.target.value)
                  }
                  placeholder="Student ID"
                  className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#003366]"
                />
                <select
                  value={lateStudent.sex}
                  onChange={(event) =>
                    handleLateStudentChange("sex", event.target.value)
                  }
                  className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#003366]"
                >
                  <option value="">Sex</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                <input
                  type="text"
                  value={lateStudent.lastName}
                  onChange={(event) =>
                    handleLateStudentChange("lastName", event.target.value)
                  }
                  placeholder="Last name"
                  className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#003366]"
                />
                <input
                  type="text"
                  value={lateStudent.firstName}
                  onChange={(event) =>
                    handleLateStudentChange("firstName", event.target.value)
                  }
                  placeholder="First name"
                  className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#003366]"
                />
                <input
                  type="text"
                  value={lateStudent.middleInitial}
                  onChange={(event) =>
                    handleLateStudentChange("middleInitial", event.target.value)
                  }
                  placeholder="M.I."
                  className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#003366]"
                />
                <button
                  type="button"
                  onClick={handleAddLateStudent}
                  disabled={!sectionPlans.length}
                  className="rounded-xl bg-[#003366] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#00264d] disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  Add Student
                </button>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <h3 className="text-xl font-bold text-[#003366]">
                  Removed Students
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Students removed from the final rosters stay here for audit
                  review and can be restored if needed.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-slate-800 text-white">
                      <th className="px-4 py-3 text-left text-sm">Student ID</th>
                      <th className="px-4 py-3 text-left text-sm">Name</th>
                      <th className="px-4 py-3 text-left text-sm">Previous Section</th>
                      <th className="px-4 py-3 text-left text-sm">Reason</th>
                      <th className="px-4 py-3 text-left text-sm">Removed At</th>
                      <th className="px-4 py-3 text-left text-sm">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {removedStudents.length > 0 ? (
                      removedStudents.map((student) => (
                        <tr key={`${student.studentId}-${student.removedAt}`} className="border-b bg-white">
                          <td className="px-4 py-3 font-semibold text-slate-800">
                            {student.studentId}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {buildStudentName(student)}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {student.removedFromSectionName || "Unassigned"}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            <p>{student.removalReason || "--"}</p>
                            {student.removalNote ? (
                              <p className="mt-1 text-xs text-slate-500">
                                {student.removalNote}
                              </p>
                            ) : null}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {student.removedAt
                              ? new Date(student.removedAt).toLocaleString("en-US")
                              : "--"}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => handleRestoreStudent(student.studentId)}
                              className="rounded-lg border border-[#003366] px-3 py-2 text-sm font-semibold text-[#003366] hover:bg-[#003366] hover:text-white"
                            >
                              Restore
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-slate-500">
                          No students have been removed from this batch.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </main>
      </div>
    </div>
  );
}

export default StudentSectioning;
