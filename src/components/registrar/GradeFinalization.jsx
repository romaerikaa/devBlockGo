import React, { useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  buildAssignmentStorageKey,
  CHAIRPERSON_REVIEW_KEY,
  getSectionStudents,
  normalizeText,
} from "../../utils/chairpersonHelpers";
import { computeFinal, getGradeEquivalent, getStatus } from "../../utils/gradingHelpers";
import { upsertPublishedStudentGrades } from "../../utils/publishedGradesHelpers";

const getStudentId = (student = {}) => student.studentId || student.id || "";

const getStudentName = (student = {}) =>
  [student.lastName, student.firstName, student.middleInitial]
    .filter(Boolean)
    .join(", ")
    .replace(", ,", ",");

const getGradeRecord = (section, student) =>
  section.grades[getStudentId(student)] ||
  section.grades[student.studentId] ||
  section.grades[student.id] ||
  {};

const getDisplayGrade = (section, student) => {
  const record = getGradeRecord(section, student);
  const finalGrade =
    section.term === "finals"
      ? computeFinal(section.grades, getStudentId(student), "finals")
      : record.midterm || "-";
  const equivalent =
    finalGrade !== "-" && !Number.isNaN(Number(finalGrade))
      ? getGradeEquivalent(finalGrade)
      : finalGrade;
  const remarks =
    section.term === "finals"
      ? getStatus(finalGrade, "finals")
      : finalGrade === "-"
      ? "Pending"
      : "Saved for Finals";

  return {
    midterm: record.midterm || "-",
    finals: record.finals || "-",
    finalGrade,
    equivalent,
    remarks,
    standing: record.standing || "active",
  };
};

const findSavedSectionRoster = ({ studentSections = [], assignment }) => {
  const matchedSection = studentSections.find((section) => {
    const sameProgram = normalizeText(section.program) === normalizeText(assignment.program);
    const sameSection =
      normalizeText(section.section) === normalizeText(assignment.sectionName);
    const sameSchoolYear =
      normalizeText(section.schoolYear) === normalizeText(assignment.schoolYear);
    const sameSemester =
      !normalizeText(section.semester) ||
      !normalizeText(assignment.semester) ||
      normalizeText(section.semester) === normalizeText(assignment.semester);

    return sameProgram && sameSection && sameSchoolYear && sameSemester;
  });

  return matchedSection?.students || [];
};

const resolveSectionStudents = ({
  assignment,
  gradeStudentIds,
  studentMasterlist,
  studentSections,
}) => {
  if (Array.isArray(assignment.rosterStudents) && assignment.rosterStudents.length) {
    return assignment.rosterStudents;
  }

  const savedSectionStudents = findSavedSectionRoster({
    studentSections,
    assignment,
  });

  if (savedSectionStudents.length) {
    return savedSectionStudents;
  }

  const masterlistStudents = getSectionStudents({
    students: studentMasterlist,
    assignment,
  });

  if (masterlistStudents.length) {
    return masterlistStudents;
  }

  return gradeStudentIds.map((studentId) => {
    const masterlistStudent = studentMasterlist.find(
      (student) => normalizeText(student.studentId) === normalizeText(studentId)
    );

    return {
      studentId,
      firstName: masterlistStudent?.firstName || "",
      lastName: masterlistStudent?.lastName || "",
      middleInitial: masterlistStudent?.middleInitial || "",
    };
  });
};

function GradeFinalization({ allGrades = {} }) {
  const [expandedFacultyKey, setExpandedFacultyKey] = useState("");
  const [expandedSubjectKeys, setExpandedSubjectKeys] = useState({});
  const [publishedAtByKey, setPublishedAtByKey] = useState({});

  const toggleSubjectGrades = (reviewKey) => {
    setExpandedSubjectKeys((current) => ({
      ...current,
      [reviewKey]: !current[reviewKey],
    }));
  };

  const forwardedSections = useMemo(() => {
    const savedReviews = localStorage.getItem(CHAIRPERSON_REVIEW_KEY);
    const reviewData = savedReviews ? JSON.parse(savedReviews) : {};
    const savedAssignments = localStorage.getItem("registrarAssignments");
    const assignments = savedAssignments ? JSON.parse(savedAssignments) : [];
    const savedStudentMasterlist = localStorage.getItem("studentMasterlist");
    const studentMasterlist = savedStudentMasterlist
      ? JSON.parse(savedStudentMasterlist)
      : [];
    const savedStudentSections = localStorage.getItem("studentSections");
    const studentSections = savedStudentSections
      ? JSON.parse(savedStudentSections)
      : [];

    return Object.entries(reviewData)
      .filter(([, review]) => review.status === "forwarded")
      .map(([reviewKey, review]) => {
        const assignment =
          assignments.find(
            (item) =>
              buildAssignmentStorageKey(item) === review.assignmentKey ||
              item.assignmentKey === review.assignmentKey
          ) || {};
        const gradeKey = review.semester || assignment.semester || "2nd Semester";
        const assignmentKey =
          review.assignmentKey || buildAssignmentStorageKey(assignment);
        const sectionGrades =
          allGrades?.[gradeKey]?.[assignmentKey] ||
          allGrades?.["2nd Semester"]?.[assignmentKey] ||
          {};
        const resolvedAssignment = {
          ...assignment,
          facultyId: assignment.facultyId || review.facultyId,
          facultyName: assignment.facultyName || review.facultyName,
          program: assignment.program || review.department,
          sectionName: assignment.sectionName || review.sectionName,
          subjectCode: assignment.subjectCode || review.subjectCode,
          schoolYear: assignment.schoolYear || review.schoolYear,
          semester: assignment.semester || review.semester,
        };
        const students = resolveSectionStudents({
          assignment: resolvedAssignment,
          gradeStudentIds: Object.keys(sectionGrades),
          studentMasterlist,
          studentSections,
        });

        return {
          reviewKey,
          assignmentKey,
          facultyId: resolvedAssignment.facultyId || "",
          facultyName: resolvedAssignment.facultyName || "--",
          department: resolvedAssignment.program || "--",
          sectionName: resolvedAssignment.sectionName || "--",
          subjectCode: resolvedAssignment.subjectCode || "--",
          subjectTitle: assignment.subjectTitle || review.subjectCode || "--",
          units: Number(assignment.units || 3),
          schoolYear: resolvedAssignment.schoolYear || "--",
          semester: resolvedAssignment.semester || "--",
          term: review.term || "finals",
          forwardedAt: review.lastUpdated,
          students,
          grades: sectionGrades,
        };
      });
  }, [allGrades]);

  const groupedDepartments = useMemo(() => {
    const departmentMap = new Map();

    forwardedSections.forEach((section) => {
      const department = section.department || "Unassigned Department";
      const facultyKey = [
        section.department,
        section.facultyId,
        section.facultyName,
      ].join("|");
      const departmentEntry = departmentMap.get(department) || {
        department,
        faculties: new Map(),
      };
      const facultyEntry = departmentEntry.faculties.get(facultyKey) || {
        facultyKey,
        facultyId: section.facultyId,
        facultyName: section.facultyName,
        sections: [],
      };

      facultyEntry.sections.push(section);
      departmentEntry.faculties.set(facultyKey, facultyEntry);
      departmentMap.set(department, departmentEntry);
    });

    return Array.from(departmentMap.values()).map((department) => ({
      ...department,
      faculties: Array.from(department.faculties.values()).map((faculty) => ({
        ...faculty,
        sections: [...faculty.sections].sort((left, right) => {
          if (left.term !== right.term) return left.term === "finals" ? -1 : 1;
          return left.sectionName.localeCompare(right.sectionName);
        }),
      })),
    }));
  }, [forwardedSections]);

  const buildPublishedRecords = (section) =>
    section.students.map((student) => {
      const studentId = getStudentId(student);
      const record = getGradeRecord(section, student);
      const finalGrade = computeFinal(section.grades, studentId, "finals");

      return {
        studentId,
        studentName: getStudentName(student),
        subjectCode: section.subjectCode,
        subjectTitle: section.subjectTitle,
        sectionName: section.sectionName,
        facultyName: section.facultyName,
        units: section.units,
        semester: section.semester,
        schoolYear: section.schoolYear,
        term: "finals",
        midterm: record.midterm || "",
        finals: record.finals || "",
        standing: record.standing || "active",
        finalGrade,
        equivalent:
          finalGrade !== "-" && !Number.isNaN(Number(finalGrade))
            ? getGradeEquivalent(finalGrade)
            : finalGrade,
        remarks: getStatus(finalGrade, "finals"),
        publishedAt: new Date().toISOString(),
      };
    });

  const handlePublishSections = (sections = []) => {
    const finalSections = sections.filter((section) => section.term === "finals");
    const records = finalSections.flatMap(buildPublishedRecords);

    if (!records.length) {
      alert("No finals sections are ready to publish.");
      return;
    }

    upsertPublishedStudentGrades(records);
    const publishedAt = new Date().toISOString();

    setPublishedAtByKey((current) => ({
      ...current,
      ...finalSections.reduce((acc, section) => {
        acc[section.reviewKey] = publishedAt;
        return acc;
      }, {}),
    }));
    alert("All ready final grades published to student accounts.");
  };

  const handleExportFacultyPdf = (faculty) => {
    const doc = new jsPDF({ orientation: "landscape" });
    const firstSection = faculty.sections[0] || {};

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("REGISTRAR GRADE FINALIZATION REPORT", 148, 16, {
      align: "center",
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Department: ${firstSection.department || "--"}`, 14, 28);
    doc.text(`Faculty: ${faculty.facultyName}`, 14, 35);
    doc.text(`Generated: ${new Date().toLocaleString("en-US")}`, 14, 42);

    let startY = 52;

    faculty.sections.forEach((section, sectionIndex) => {
      if (sectionIndex > 0) startY += 8;

      doc.setFont("helvetica", "bold");
      doc.text(
        `${section.subjectCode} | ${section.subjectTitle} | ${section.sectionName} | ${
          section.term === "midterm" ? "Midterms" : "Finals"
        }`,
        14,
        startY
      );

      const rows = section.students.map((student, index) => {
        const display = getDisplayGrade(section, student);

        return [
          index + 1,
          getStudentId(student),
          getStudentName(student),
          display.midterm,
          display.finals,
          display.finalGrade,
          display.equivalent,
          display.remarks,
        ];
      });

      autoTable(doc, {
        startY: startY + 4,
        head: [[
          "No.",
          "Student ID",
          "Student Name",
          "Midterm",
          "Finals",
          "Final Grade",
          "Equivalent",
          "Remarks",
        ]],
        body: rows,
        theme: "grid",
        headStyles: { fillColor: [0, 51, 102], textColor: 255 },
        styles: { fontSize: 8, cellPadding: 2 },
      });

      startY = doc.lastAutoTable.finalY;

      if (startY > 170 && sectionIndex < faculty.sections.length - 1) {
        doc.addPage();
        startY = 16;
      }
    });

    doc.save(`${faculty.facultyName}_grade_finalization.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-bold text-[#003366]">Grade Finalization</h3>
        <p className="mt-1 text-sm text-slate-500">
          Midterm grades are kept in the system. Student grade release becomes
          available only after finals grades are encoded, approved, and forwarded
          by the chairperson.
        </p>
      </div>

      {groupedDepartments.length ? (
        groupedDepartments.map((department) => (
          <section
            key={department.department}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#003366]">
                  {department.department}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {department.faculties.length} faculty with forwarded grades
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  handlePublishSections(
                    department.faculties.flatMap((faculty) => faculty.sections)
                  )
                }
                className="rounded-xl bg-[#003366] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#00264d]"
              >
                Publish All Finals to Students
              </button>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-[#003366] text-white">
                    <th className="px-4 py-3 text-left text-sm">Faculty</th>
                    <th className="px-4 py-3 text-left text-sm">Forwarded Sections</th>
                    <th className="px-4 py-3 text-left text-sm">Release Status</th>
                    <th className="px-4 py-3 text-left text-sm">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {department.faculties.map((faculty) => {
                    const isExpanded = expandedFacultyKey === faculty.facultyKey;
                    const finalsCount = faculty.sections.filter(
                      (section) => section.term === "finals"
                    ).length;
                    const midtermCount = faculty.sections.filter(
                      (section) => section.term === "midterm"
                    ).length;

                    return (
                      <React.Fragment key={faculty.facultyKey}>
                        <tr className="border-b bg-white">
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-800">
                              {faculty.facultyName}
                            </p>
                            <p className="text-xs text-slate-500">
                              Faculty ID: {faculty.facultyId || "--"}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-800">
                              {faculty.sections.length} total
                            </p>
                            <p className="text-xs text-slate-500">
                              {midtermCount} midterm, {finalsCount} finals
                            </p>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {finalsCount
                              ? "Final release available per finals section"
                              : "Midterms saved; waiting for finals"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedFacultyKey(
                                    isExpanded ? "" : faculty.facultyKey
                                  )
                                }
                                className="rounded-xl bg-[#003366] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#00264d]"
                              >
                                {isExpanded ? "Hide Grades" : "View Grades"}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleExportFacultyPdf(faculty)}
                                className="rounded-xl border border-[#003366] px-4 py-2 text-sm font-semibold text-[#003366] transition hover:bg-[#003366] hover:text-white"
                              >
                                Export PDF
                              </button>
                            </div>
                          </td>
                        </tr>

                        {isExpanded ? (
                          <tr className="border-b bg-slate-50">
                            <td colSpan="4" className="px-4 py-4">
                              <div className="space-y-4">
                                {faculty.sections.map((section) => {
                                  const publishedAt =
                                    publishedAtByKey[section.reviewKey];
                                  const canPublish = section.term === "finals";
                                  const isSubjectExpanded =
                                    !!expandedSubjectKeys[section.reviewKey];

                                  return (
                                    <div
                                      key={section.reviewKey}
                                      className="rounded-xl border border-slate-200 bg-white p-4"
                                    >
                                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                        <div>
                                          <p className="font-semibold text-slate-800">
                                            {section.subjectCode} |{" "}
                                            {section.subjectTitle}
                                          </p>
                                          <p className="text-sm text-slate-500">
                                            {section.sectionName} |{" "}
                                            {section.schoolYear} |{" "}
                                            {section.semester} |{" "}
                                            {section.term === "midterm"
                                              ? "Midterms"
                                              : "Finals"}
                                          </p>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                          <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                              canPublish
                                                ? "bg-emerald-100 text-emerald-700"
                                                : "bg-amber-100 text-amber-700"
                                            }`}
                                          >
                                            {canPublish
                                              ? "Ready for student release"
                                              : "Saved until finals"}
                                          </span>
                                          {publishedAt ? (
                                            <span className="text-xs text-slate-500">
                                              Published{" "}
                                              {new Date(
                                                publishedAt
                                              ).toLocaleString("en-US")}
                                            </span>
                                          ) : null}
                                          <button
                                            type="button"
                                            onClick={() =>
                                              toggleSubjectGrades(section.reviewKey)
                                            }
                                            className="rounded-lg border border-[#003366] px-3 py-2 text-xs font-semibold text-[#003366] transition hover:bg-[#003366] hover:text-white"
                                          >
                                            {isSubjectExpanded
                                              ? "Hide Students"
                                              : "View Students"}
                                          </button>
                                        </div>
                                      </div>

                                      {isSubjectExpanded ? (
                                      <div className="mt-4 max-h-[420px] overflow-auto rounded-xl border border-slate-200">
                                        <table className="min-w-full text-sm">
                                          <thead className="sticky top-0 z-10">
                                            <tr className="bg-slate-100 text-slate-700">
                                              <th className="px-3 py-2 text-left">Student ID</th>
                                              <th className="px-3 py-2 text-left">Student</th>
                                              <th className="px-3 py-2 text-left">Midterm</th>
                                              <th className="px-3 py-2 text-left">Finals</th>
                                              <th className="px-3 py-2 text-left">Final Grade</th>
                                              <th className="px-3 py-2 text-left">Equivalent</th>
                                              <th className="px-3 py-2 text-left">Remarks</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {section.students.map((student) => {
                                              const display = getDisplayGrade(
                                                section,
                                                student
                                              );

                                              return (
                                                <tr
                                                  key={getStudentId(student)}
                                                  className="border-b last:border-b-0"
                                                >
                                                  <td className="px-3 py-2 font-semibold text-slate-700">
                                                    {getStudentId(student)}
                                                  </td>
                                                  <td className="px-3 py-2">
                                                    {getStudentName(student)}
                                                  </td>
                                                  <td className="px-3 py-2">
                                                    {display.midterm}
                                                  </td>
                                                  <td className="px-3 py-2">
                                                    {display.finals}
                                                  </td>
                                                  <td className="px-3 py-2 font-semibold">
                                                    {display.finalGrade}
                                                  </td>
                                                  <td className="px-3 py-2">
                                                    {display.equivalent}
                                                  </td>
                                                  <td className="px-3 py-2">
                                                    {display.remarks}
                                                  </td>
                                                </tr>
                                              );
                                            })}
                                          </tbody>
                                        </table>
                                      </div>
                                      ) : null}
                                    </div>
                                  );
                                })}
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ))
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 shadow-sm">
          No chairperson-forwarded grades are ready for registrar finalization.
        </div>
      )}
    </div>
  );
}

export default GradeFinalization;
