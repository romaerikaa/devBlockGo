import { useMemo, useState } from "react";
import FacultyHeader from "../components/faculty/FacultyHeader";
import EncodingBanner from "../components/faculty/EncodingBanner";
import YearTabs from "../components/faculty/YearTabs";
import SearchWithDropdown from "../components/faculty/SearchWithDropdown";
import ProgramCard from "../components/faculty/ProgramCard";
import GradingTable from "../components/faculty/GradingTable";
import { CHAIRPERSON_REVIEW_KEY } from "../utils/chairpersonHelpers";
import { buildReviewKey } from "../utils/chairpersonHelpers";

const FacultyPortal = ({ onLogout, allGrades, setAllGrades }) => {
  const [activeTab, setActiveTab] = useState("All Sections");
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedSection, setSelectedSection] = useState(null);

  const [systemSettings] = useState({
    semester: "2nd Semester",
    term: "finals",
  });

  const facultyData = {
    firstName: "Juan",
    lastName: "Dela Cruz",
    sex: "Male",
    facultyId: "FAC-001",
    department: "IT Department",
    Classification: "Full-Time",
  };

  const facultyFullName = `${facultyData.firstName} ${facultyData.lastName}`;

  const reviewData = useMemo(() => {
    const saved = localStorage.getItem(CHAIRPERSON_REVIEW_KEY);
    return saved ? JSON.parse(saved) : {};
  }, []);

  const encodingData = useMemo(() => {
    const saved = localStorage.getItem("encodingPeriod");
    return saved ? JSON.parse(saved) : null;
  }, []);

  const assignments = useMemo(() => {
    const saved = localStorage.getItem("registrarAssignments");
    return saved ? JSON.parse(saved) : [];
  }, []);

  const studentSections = useMemo(() => {
    const saved = localStorage.getItem("studentSections");
    return saved ? JSON.parse(saved) : [];
  }, []);

  const myAssignments = useMemo(() => {
    return assignments.filter(
      (assignment) => assignment.facultyName === facultyFullName
    );
  }, [assignments, facultyFullName]);

  const sections = useMemo(() => {
    return myAssignments.reduce((acc, assign) => {
      const matchedSection = studentSections.find(
        (section) =>
          section.section === assign.sectionName &&
          section.program === assign.program &&
          section.schoolYear === assign.schoolYear &&
          section.semester === assign.semester
      );

      acc[assign.sectionName] = {
        year: assign.yearLevel,
        subjectCode: assign.subjectCode,
        subjectTitle: assign.subjectTitle,
        sectionCourse: assign.program,
        units: 3,
        schedule: assign.schedule || "TBA",
        day: assign.day || "TBA",
        semester: assign.semester,
        schoolYear: assign.schoolYear,
        students: (matchedSection?.students || []).map((student) => ({
          id: student.studentId,
          firstName: student.firstName,
          lastName: student.lastName,
        })),
      };

      return acc;
    }, {});
  }, [myAssignments, studentSections]);

  const activeGradeKey = systemSettings.semester;

  const getSectionProgress = (sectionName, sectionData) => {
    const currentSectionGrades =
      allGrades?.[activeGradeKey]?.[sectionName] || {};

    if (!sectionData.students.length) return 0;

    const encodedCount = sectionData.students.filter((student) => {
      const record = currentSectionGrades[student.id];
      if (!record) return false;

      if (systemSettings.term === "midterm") return !!record.midterm;
      if (systemSettings.term === "finals") return !!record.finals;

      return false;
    }).length;

    return Math.round((encodedCount / sectionData.students.length) * 100);
  };

  const getReviewKey = (sectionName, schoolYear) =>
    [1, sectionName, schoolYear, systemSettings.semester].join("__");

  const filteredSections = Object.entries(sections).filter(
    ([sectionName, sectionData]) => {
      const matchesYear =
        activeTab === "All Sections" || sectionData.year === activeTab;

      const searchValue = selectedProgram.toLowerCase();

      const matchesSearch =
        selectedProgram === "" ||
        sectionName.toLowerCase().includes(searchValue) ||
        sectionData.subjectTitle.toLowerCase().includes(searchValue) ||
        sectionData.sectionCourse.toLowerCase().includes(searchValue) ||
        sectionData.subjectCode.toLowerCase().includes(searchValue);

      return matchesYear && matchesSearch;
    }
  );

  const ENCODING_START = encodingData?.startDate
    ? new Date(`${encodingData.startDate}T00:00:00`)
    : null;

  const ENCODING_END = encodingData?.endDate
    ? new Date(`${encodingData.endDate}T23:59:59`)
    : null;

  const now = new Date();

  const getBannerState = () => {
    if (!ENCODING_START || !ENCODING_END) return "closed_before";
    if (now > ENCODING_END) return "closed_after";
    if (now < ENCODING_START) return "closed_before";

    const msLeft = ENCODING_END - now;
    const computedDaysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));

    if (computedDaysLeft <= 3) return "urgent";
    return "open";
  };

  const daysLeft =
    ENCODING_END && now <= ENCODING_END
      ? Math.ceil((ENCODING_END - now) / (1000 * 60 * 60 * 24))
      : 0;

  const formatDate = (date) => {
    if (!date) return "No schedule set";

    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <FacultyHeader
        facultyData={facultyData}
        totalSections={Object.keys(sections).length}
        onLogout={onLogout}
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
          <div className="mt-6 flex flex-col gap-4 px-4 md:flex-row md:items-center">
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

          <div className="grid grid-cols-1 gap-6 px-4 pb-8 pt-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSections.length > 0 ? (
              filteredSections.map(([sectionName, sectionData]) => {
                const reviewRecord =
                  reviewData[
                    getReviewKey(sectionName, sectionData.schoolYear)
                  ] || {
                    status: "pending",
                    note: "",
                  };

                return (
                  <ProgramCard
                    key={sectionName}
                    sectionName={sectionName}
                    sectionData={sectionData}
                    progress={getSectionProgress(sectionName, sectionData)}
                    reviewStatus={reviewRecord.status}
                    reviewNote={reviewRecord.note}
                    onClick={() =>
                      setSelectedSection({ sectionName, ...sectionData })
                    }
                  />
                );
              })
            ) : (
              <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
                No assigned sections yet.
              </div>
            )}
          </div>
        </>
      ) : (
        <GradingTable
          selectedSection={selectedSection}
          onBack={() => setSelectedSection(null)}
          systemTerm={systemSettings.term}
          activeGradeKey={activeGradeKey}
          grades={
            allGrades?.[activeGradeKey]?.[selectedSection.sectionName] || {}
          }
          setAllGrades={setAllGrades}
        />
      )}
    </div>
  );
};

export default FacultyPortal;