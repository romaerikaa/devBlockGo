export const STUDENT_BATCHES_KEY = "chairpersonStudentBatches";
export const STUDENT_SUBMISSION_LOGS_KEY = "chairpersonSubmissionLogs";
export const AVAILABLE_YEAR_LEVELS = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
];
export const AVAILABLE_SECTION_CODES = [
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

const normalizeHeader = (value = "") =>
  String(value).trim().toLowerCase().replace(/\s+/g, " ");

export const parseStudentIdSpreadsheet = (text = "") => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((header) => normalizeHeader(header));
  const studentIdIndex = headers.indexOf("student id");
  const sexIndex = headers.indexOf("sex");
  const lastNameIndex = headers.indexOf("last name");
  const firstNameIndex = headers.indexOf("first name");
  const middleInitialIndex = headers.indexOf("middle initial");

  if (
    studentIdIndex === -1 ||
    sexIndex === -1 ||
    lastNameIndex === -1 ||
    firstNameIndex === -1 ||
    middleInitialIndex === -1
  ) {
    return [];
  }

  return lines
    .slice(1)
    .map((line) => {
      const values = line.split(",").map((value) => value.trim());

      return {
        studentId: values[studentIdIndex] || "",
        sex: values[sexIndex] || "",
        lastName: values[lastNameIndex] || "",
        firstName: values[firstNameIndex] || "",
        middleInitial: values[middleInitialIndex] || "",
        yearLevel: "",
        sectionCode: "",
      };
    })
    .filter(
      (student) =>
        student.studentId &&
        student.sex &&
        student.lastName &&
        student.firstName &&
        student.middleInitial
    );
};

export const buildStudentMasterlistFromBatches = (batches = []) =>
  batches.flatMap((batch) =>
    (batch.students || []).map((student) => ({
      studentId: student.studentId,
      sex: student.sex || "",
      firstName: student.firstName || "",
      lastName: student.lastName || "",
      middleInitial: student.middleInitial || "",
      program: batch.program,
      yearLevel: student.yearLevel || "",
      section: student.sectionCode ? `${batch.program} ${student.sectionCode}` : "",
      schoolYear: batch.batchYear,
      semester: "",
    }))
  );

export const buildGroupedSectionLists = (students = []) => {
  const grouped = {};

  students.forEach((student) => {
    if (!student.section || !student.yearLevel) return;

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
        semester: "",
        students: [],
      };
    }

    grouped[key].students.push({
      studentId: student.studentId,
      sex: student.sex || "",
      firstName: student.firstName || "",
      lastName: student.lastName || "",
      middleInitial: student.middleInitial || "",
    });
  });

  return Object.values(grouped);
};

export const syncSectionedStudentsToStorage = (batches = []) => {
  const studentMasterlist = buildStudentMasterlistFromBatches(batches);
  const groupedSections = buildGroupedSectionLists(studentMasterlist);

  localStorage.setItem("studentMasterlist", JSON.stringify(studentMasterlist));
  localStorage.setItem("studentSections", JSON.stringify(groupedSections));
};
