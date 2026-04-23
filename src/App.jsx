import { useEffect, useState } from "react";
import LoginPage from "./pages/LoginPage";
import StudentPortal from "./pages/StudentPortal";
import FacultyPortal from "./pages/FacultyPortal";
import RegistrarPortal from "./pages/RegistrarPortal";
import ChairpersonPortal from "./pages/ChairpersonPortal";

function App() {
  const [userRole, setUserRole] = useState(localStorage.getItem("userRole"));

  const [allGrades, setAllGrades] = useState(() => {
    const saved = localStorage.getItem("blockgo-allGrades");
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem("blockgo-allGrades", JSON.stringify(allGrades));
  }, [allGrades]);

  const handleLogin = (email) => {
    if (email === "faculty@gmail.com") {
      localStorage.setItem("userRole", "faculty");
      setUserRole("faculty");
    } else if (email === "student@gmail.com") {
      localStorage.setItem("userRole", "student");
      setUserRole("student");
    } else if (email === "registrar@gmail.com") {
      localStorage.setItem("userRole", "registrar");
      setUserRole("registrar");
    } else if (email === "chairperson@gmail.com") {
      localStorage.setItem("userRole", "chairperson");
      setUserRole("chairperson");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    setUserRole(null);
  };

  const studentData = {
    firstName: "Roma",
    lastName: "Alapar",
    middleName: "M.",
    studentId: "23-0001",
    dateOfBirth: "January 01, 2005",
    phone: "09123456789",
    sex: "Female",
    email: "student@gmail.com",
    address: "Valenzuela City",
    subjects: [
      {
        code: "IT 101",
        name: "Introduction to Computing",
        units: 3,
        midterm: 70,
        finals: 70,
      },
       {
        code: "IT 201",
        name: "Web Design",
        units: 3,
        midterm: 90,
        finals: 90,
      },
      {
        code: "IT 201",
        name: "App Dev",
        units: 3,
        midterm: 70,
        finals: 70,
      },
    ],
  };

  console.log("Student Data in App.jsx:", studentData);
  // Helper function to calculate failed subjects
  const calculateFailedSubjects = (subjects) => {
    let failedCount = 0;
    subjects.forEach(sub => {
      const finalNumeric = (sub.midterm + sub.finals) / 2; // Assuming average of midterm and finals
      if (finalNumeric < 75) { // Assuming 75 is the passing grade threshold
        failedCount++;
      }
    });
    return failedCount;
  };


  if (!userRole) {
    return <LoginPage onLogin={handleLogin} />;
  }
  if (userRole === "student") {
    const failedSubjectsCount = calculateFailedSubjects(studentData.subjects);
    return <StudentPortal studentData={studentData} onLogout={handleLogout} failedSubjectsCount={failedSubjectsCount} />;
    console.log("Calculated failedSubjectsCount in App.jsx:", failedSubjectsCount); // This console.log will not execute because of the return statement above it.
  }

  if (userRole === "faculty") {
    return (
      <FacultyPortal
        onLogout={handleLogout}
        allGrades={allGrades}
        setAllGrades={setAllGrades}
      />
    );
  }

  if (userRole === "registrar") {
    return <RegistrarPortal onLogout={handleLogout} />;
  }

  if (userRole === "chairperson") {
    return (
      <ChairpersonPortal
        onLogout={handleLogout}
        allGrades={allGrades}
      />
    );
  }

  return <LoginPage onLogin={handleLogin} />;
}

export default App;
