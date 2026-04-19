import { useEffect, useState } from "react";
import LoginPage from "./pages/LoginPage";
import StudentPortal from "./pages/StudentPortal";
import FacultyPortal from "./pages/FacultyPortal";

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
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    setUserRole(null);
  };

  const studentData = {
    firstName: "Erika",
    lastName: "Alapar",
    middleName: "M.",
    studentId: "2023-0001",
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
        midterm: 90,
        finals: 92,
      },
      {
        code: "IT 102",
        name: "Programming 1",
        units: 3,
        midterm: 88,
        finals: 90,
      },
      {
        code: "GE 101",
        name: "Understanding the Self",
        units: 3,
        midterm: 91,
        finals: 93,
      },
    ],
  };

  if (!userRole) {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (userRole === "student") {
    return <StudentPortal studentData={studentData} onLogout={handleLogout} />;
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

  return <LoginPage onLogin={handleLogin} />;
}

export default App;