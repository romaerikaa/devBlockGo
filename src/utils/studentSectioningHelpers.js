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

export const YEAR_LEVEL_PREFIXES = {
  "1st Year": "1",
  "2nd Year": "2",
  "3rd Year": "3",
  "4th Year": "4",
};

const PROGRAM_SECTION_PREFIXES = {
  "Bachelor of Science in Information Technology": "BSIT",
  "Bachelor of Science in Accountancy": "BSA",
  "Bachelor of Science in Civil Engineering": "BSCE",
  "Bachelor of Science in Electrical Engineering": "BSEE",
  "Bachelor of Arts in Communication": "BAC",
  "Bachelor of Science in Psychology": "BSP",
  "Bachelor of Science in Social Work": "BSSW",
  "Bachelor of Public Administration": "BPA",
  "Bachelor of Early Childhood Education": "BECEd",
  "Bachelor of Secondary Education major in English": "BSEd English",
  "Bachelor of Secondary Education major in Filipino": "BSEd Filipino",
  "Bachelor of Secondary Education major in Mathematics": "BSEd Mathematics",
  "Bachelor of Secondary Education major in Science": "BSEd Science",
  "Bachelor of Secondary Education major in Social Studies": "BSEd Social Studies",
  "Bachelor of Science in Business Administration major in Financial Management":
    "BSBA FM",
  "Bachelor of Science in Business Administration major in Human Resource Management":
    "BSBA HRM",
  "Bachelor of Science in Business Administration major in Marketing Management":
    "BSBA MM",
};

export const getProgramSectionPrefix = (program = "") =>
  PROGRAM_SECTION_PREFIXES[program] ||
  String(program)
    .split(/\s+/)
    .filter((word) => /^[A-Z]/.test(word))
    .map((word) => word[0])
    .join("") ||
  "SECTION";

export const getDefaultSectionName = (program = "", sectionCode = "") =>
  `${getProgramSectionPrefix(program)} ${sectionCode}`.trim();

const normalizeHeader = (value = "") =>
  String(value).trim().toLowerCase().replace(/\s+/g, " ");

const escapeCsvValue = (value = "") => {
  const stringValue = String(value ?? "");

  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
};

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
  const yearLevelIndex = headers.indexOf("year level");

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
        yearLevel: yearLevelIndex === -1 ? "" : values[yearLevelIndex] || "",
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

export const buildStudentCsvContent = (students = []) => {
  const header = [
    "Student ID",
    "Sex",
    "Last Name",
    "First Name",
    "Middle Initial",
    "Year Level",
  ];

  const rows = students.map((student) =>
    [
      student.studentId,
      student.sex,
      student.lastName,
      student.firstName,
      student.middleInitial,
      student.yearLevel || "",
    ]
      .map(escapeCsvValue)
      .join(",")
  );

  return [header.join(","), ...rows].join("\n");
};

export const downloadStudentCsvFile = (students = [], fileName = "students.csv") => {
  const csvContent = buildStudentCsvContent(students);
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
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
      section: student.sectionCode
        ? student.sectionName ||
          getDefaultSectionName(batch.program, student.sectionCode)
        : "",
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
