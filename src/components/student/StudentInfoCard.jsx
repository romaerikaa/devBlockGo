const StudentInfoCard = ({ studentData }) => {
  return (
    <div className="mx-6 mt-5 rounded-xl border border-[#003366] bg-gray-100 p-6">
      <h3 className="mb-4 font-bold text-[#003366]">
        Student Personal Information
      </h3>

      <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
        <div>
          <p className="text-gray-500">First Name</p>
          <p className="font-semibold">{studentData.firstName || "—"}</p>
        </div>

        <div>
          <p className="text-gray-500">Last Name</p>
          <p className="font-semibold">{studentData.lastName || "—"}</p>
        </div>

        <div>
          <p className="text-gray-500">Middle Name</p>
          <p className="font-semibold">{studentData.middleName || "—"}</p>
        </div>

        <div>
          <p className="text-gray-500">Student ID</p>
          <p className="font-semibold">{studentData.studentId || "—"}</p>
        </div>

        <div>
          <p className="text-gray-500">Date of Birth</p>
          <p className="font-semibold">{studentData.dateOfBirth || "—"}</p>
        </div>

        <div>
          <p className="text-gray-500">Sex</p>
          <p className="font-semibold">{studentData.sex || "—"}</p>
        </div>

        <div>
          <p className="text-gray-500">Phone Number</p>
          <p className="font-semibold">{studentData.phone || "—"}</p>
        </div>

        <div>
          <p className="text-gray-500">Email Address</p>
          <p className="font-semibold">{studentData.email || "—"}</p>
        </div>

        <div className="md:col-span-3">
          <p className="text-gray-500">Home Address</p>
          <p className="font-semibold">{studentData.address || "—"}</p>
        </div>
      </div>
    </div>
  );
};

export default StudentInfoCard;