import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const exportGradingSheet = (
  selectedSection,
  grades,
  systemTerm,
  semester = "2nd Semester"
) => {
  const doc = new jsPDF();

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

  const totalStudents = selectedSection.students.length;

  let passed = 0;
  let failed = 0;

  const getPLVGrade = (grade) => {
    if (grade === "INC") return "INC";
    if (grade === "UD") return "UD";
    if (grade === "D") return "D";
    if (grade === "W") return "W";

    const g = Number(grade);

    if (isNaN(g)) return "-";
    if (g >= 97 && g <= 100) return "1.00";
    if (g >= 94 && g <= 96.99) return "1.25";
    if (g >= 91 && g <= 93.99) return "1.50";
    if (g >= 88 && g <= 90.99) return "1.75";
    if (g >= 85 && g <= 87.99) return "2.00";
    if (g >= 82 && g <= 84.99) return "2.25";
    if (g >= 79 && g <= 81.99) return "2.50";
    if (g >= 76 && g <= 78.99) return "2.75";
    if (g === 75) return "3.00";
    if (g < 75) return "5.00";

    return "-";
  };

  const tableRows = selectedSection.students.map((student, index) => {
    const midRaw = grades[student.id]?.midterm;
    const finRaw = grades[student.id]?.finals;
    
    const displayName = grades[student.id]?.flagged
  ? ` ${formatName(student)}`
  : formatName(student);
    let displayGrade = "-";
    let plvGrade = "-";
    let status = "Incomplete";

    if (systemTerm === "midterm") {
      if (["INC", "UD", "D", "W"].includes(midRaw)) {
        displayGrade = midRaw;
        plvGrade = midRaw;
        status = midRaw;
      } else {
        const midterm = Number(midRaw);

        if (midterm > 0) {
          displayGrade = midterm.toFixed(2);
          plvGrade = getPLVGrade(midterm);
          status = midterm >= 75 ? "Passed" : "Failed";

          if (status === "Passed") passed++;
          else failed++;
        }
      }
    }

    if (systemTerm === "finals") {
      if (["INC", "UD", "D", "W"].includes(midRaw)) {
        displayGrade = midRaw;
        plvGrade = midRaw;
        status = midRaw;
      } else if (["INC", "UD", "D", "W"].includes(finRaw)) {
        displayGrade = finRaw;
        plvGrade = finRaw;
        status = finRaw;
      } else {
        const midterm = Number(midRaw);
        const finals = Number(finRaw);

        if (midterm > 0 && finals > 0) {
          const finalNumeric = (midterm + finals) / 2;
          displayGrade = finalNumeric.toFixed(2);
          plvGrade = getPLVGrade(finalNumeric);
          status = finalNumeric >= 75 ? "Passed" : "Failed";

          if (status === "Passed") passed++;
          else failed++;
        }
      }
    }

    return [
  index + 1,
  student.id,
  displayName,
  displayGrade,
  plvGrade,
  status,
];
  });

  const graded = passed + failed;
  const passRate = graded > 0 ? ((passed / graded) * 100).toFixed(1) : "0.0";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("UNIVERSITY OFFICIAL GRADING SHEET", 105, 20, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  doc.text("Academic Year: 2025-2026", 14, 35);
  doc.text(`Semester: ${selectedSection.semester || semester}`, 14, 43);
  doc.text(`Term: ${systemTerm === "midterm" ? "Midterm" : "Finals"}`, 14, 51);
  doc.text(`Course Code: ${selectedSection.subjectCode}`, 14, 59);
  doc.text(`Course Name: ${selectedSection.subjectTitle}`, 14, 67);
  doc.text(`Section: ${selectedSection.sectionName}`, 14, 75);
  doc.text(`Program: ${selectedSection.sectionCourse}`, 14, 83);
  doc.text(`Year Level: ${selectedSection.year}`, 14, 91);

  doc.text(`Total Students: ${totalStudents}`, 125, 35);
  doc.text(`Graded: ${graded}`, 125, 43);
  doc.text(`Passed: ${passed}`, 125, 51);
  doc.text(`Failed: ${failed}`, 125, 59);
  doc.text(`Pass Rate: ${passRate}%`, 125, 67);

  autoTable(doc, {
    startY: 103,
    head: [[
      "No.",
      "Student ID",
      "Student Name",
      "Grade\n(60-100)",
      "PLV Grade",
      "Status",
    ]],
    body: tableRows,
    theme: "grid",
    headStyles: {
      fillColor: [0, 51, 102],
      textColor: 255,
      fontStyle: "bold",
      halign: "center",
    },
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 12 },
      1: { halign: "center", cellWidth: 28 },
      2: { cellWidth: 55 },
      3: { halign: "center", cellWidth: 25 },
      4: { halign: "center", cellWidth: 25 },
      5: { halign: "center", cellWidth: 25 },
    },
    didParseCell: (data) => {
  const student = selectedSection.students[data.row.index];

  if (data.section === "body" && grades[student?.id]?.flagged) {
    data.cell.styles.fillColor = [255, 235, 238];
  }

  if (data.section === "body" && data.column.index === 5) {
    if (data.cell.raw === "Passed") {
      data.cell.styles.textColor = [34, 139, 34];
      data.cell.styles.fontStyle = "bold";
    } else if (data.cell.raw === "Failed") {
      data.cell.styles.textColor = [220, 53, 69];
      data.cell.styles.fontStyle = "bold";
    }
  }
},
  });

  doc.save(`${selectedSection.sectionName}_${systemTerm}_grading_sheet.pdf`);
};