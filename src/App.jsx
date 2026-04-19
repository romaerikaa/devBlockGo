import { useEffect, useState } from "react";
import LoginPage from "./pages/LoginPage";
import FacultyHeader from "./components/faculty/FacultyHeader";
import EncodingBanner from "./components/faculty/EncodingBanner";
import YearTabs from "./components/faculty/YearTabs";
import SearchWithDropdown from "./components/faculty/SearchWithDropdown";
import ProgramCard from "./components/faculty/ProgramCard";
import GradingTable from "./components/faculty/GradingTable";
import StudentPortal from "./pages/StudentPortal";

function App() {
  const [userRole, setUserRole] = useState(localStorage.getItem("userRole"));
  const [activeTab, setActiveTab] = useState("All Sections");
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedSection, setSelectedSection] = useState(null);

  const [systemSettings] = useState({
    semester: "2nd Semester",
    term: "midterm", // change to "finals" if needed
  });

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
    setSelectedSection(null);
  };

  const facultyData = {
    firstName: "Alice",
    lastName: "Martin",
    facultyId: "FAC-001",
    department: "IT Department",
    Classification: "Full-Time",
    sex: "Female",
  };

  const sections = {
    "BSIT 2-1": {
      year: "2nd Year",
      subjectCode: "GE 101",
      subjectTitle: "Understanding the Self",
      sectionCourse: "BSIT",
      units: 3,
      schedule: "3:00 PM - 5:00 PM",
      day: "Friday",
      semester: "2nd Semester",
      students: [
        { id: "23-0011", firstName: "Juan", lastName: "Dela Cruz" },
        { id: "23-0022", firstName: "Maria", lastName: "Santos" },
      ],
    },
    "BSIT 3-1": {
      year: "3rd Year",
      subjectCode: "IT 23",
      subjectTitle: "Web Development",
      sectionCourse: "BSIT",
      units: 3,
      schedule: "1:00 PM - 3:00 PM",
      day: "Wednesday",
      semester: "2nd Semester",
      students: [
        { id: "23-1011", firstName: "Carlos", lastName: "Reyes" },
        { id: "23-1022", firstName: "Anne", lastName: "Cruz" },
      ],
    },
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

  const activeGradeKey = systemSettings.semester;

  const getSectionProgress = (sectionName, sectionData) => {
    const currentSectionGrades = allGrades[activeGradeKey]?.[sectionName] || {};

    const encodedCount = sectionData.students.filter((student) => {
      const record = currentSectionGrades[student.id];
      if (!record) return false;

      if (systemSettings.term === "midterm") return !!record.midterm;
      if (systemSettings.term === "finals") return !!record.finals;

      return false;
    }).length;

    return Math.round((encodedCount / sectionData.students.length) * 100);
  };

  const filteredSections = Object.entries(sections).filter(
    ([sectionName, sectionData]) => {
      const matchesYear =
        activeTab === "All Sections" || sectionData.year === activeTab;

      const searchValue = selectedProgram.toLowerCase();

      const matchesSearch =
        selectedProgram === "" ||
        sectionName.toLowerCase().includes(searchValue) ||
        sectionData.subjectTitle.toLowerCase().includes(searchValue) ||
        sectionData.sectionCourse.toLowerCase().includes(searchValue);

      return matchesYear && matchesSearch;
    }
  );

  const ENCODING_START = new Date("2026-04-20T00:00:00");
  const ENCODING_END = new Date("2026-04-21T23:59:59");

  const now = new Date();
  const msLeft = ENCODING_END - now;
  const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
  const isClosed = now < ENCODING_START || now > ENCODING_END;
  const isUrgent = !isClosed && daysLeft <= 3;

  const getBannerState = () => {
    if (now > ENCODING_END) return "closed_after";
    if (now < ENCODING_START) return "closed_before";
    if (isUrgent) return "urgent";
    return "open";
  };

  const formatDate = (date) =>
    date.toLocaleDateString("en-US", {
      month: "long",
      day: "2-digit",
      year: "numeric",
    });

  if (!userRole) {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (userRole === "student") {
  return (
    <StudentPortal
      studentData={studentData}
      onLogout={handleLogout}
    />
  );
}


if (userRole === "student") {
  return <StudentPortal studentData={studentData} onLogout={handleLogout} />;
}

  return (
    <div className="min-h-screen bg-slate-100">
      <FacultyHeader
        facultyData={facultyData}
        totalSections={Object.keys(sections).length}
        onLogout={handleLogout}
      />

      <EncodingBanner
        bannerState={getBannerState()}
        daysLeft={daysLeft}
        formatDate={formatDate}
        startDate={ENCODING_START}
        endDate={ENCODING_END}
      />

      {!selectedSection ? (
        <>
          <div className="mt-6 flex items-center gap-4 px-6">
            <YearTabs
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              sections={sections}
            />

            <div className="flex max-w-xl flex-1 items-center">
              <SearchWithDropdown
                selectedProgram={selectedProgram}
                setSelectedProgram={setSelectedProgram}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 px-6 pb-8 pt-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredSections.map(([sectionName, sectionData]) => (
              <ProgramCard
                key={sectionName}
                sectionName={sectionName}
                sectionData={sectionData}
                progress={getSectionProgress(sectionName, sectionData)}
                onClick={() =>
                  setSelectedSection({ sectionName, ...sectionData })
                }
              />
            ))}
          </div>
        </>
      ) : (
        <GradingTable
          selectedSection={selectedSection}
          onBack={() => setSelectedSection(null)}
          systemTerm={systemSettings.term}
          activeGradeKey={activeGradeKey}
          grades={
            allGrades[activeGradeKey]?.[selectedSection.sectionName] || {}
          }
          setAllGrades={setAllGrades}
        />
      )}
    </div>
  );
}

export default App;