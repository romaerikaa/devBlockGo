export const formatName = (student) => {
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

export const getGradeEquivalent = (grade) => {
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

export const computeFinal = (grades, studentId, activeTerm) => {
  const mid = grades[studentId]?.midterm;
  const fin = grades[studentId]?.finals;

  if (["INC", "UD", "D", "W"].includes(mid)) return mid;
  if (["INC", "UD", "D", "W"].includes(fin)) return fin;

  const midterm = Number(mid);
  const finals = Number(fin);

  if (activeTerm === "midterm") return "-";

  if (activeTerm === "finals") {
    if (!midterm || !finals) return "-";
    return ((midterm + finals) / 2).toFixed(2);
  }

  return "-";
};

export const getStatus = (final, activeTerm) => {
  if (activeTerm === "midterm") return "Pending Finals";

  if (["INC", "UD", "D", "W"].includes(final)) return final;
  if (final === "-") return "Incomplete";

  return Number(final) >= 75 ? "Passed" : "Failed";
};