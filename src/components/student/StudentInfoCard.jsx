const StudentInfoCard = ({ studentData }) => {
  return (
    <div className="mx-4 mt-5 rounded-xl border border-[#003366] bg-gray-100 p-4 md:mx-6 md:p-6">
      <h3 className="mb-4 text-base font-bold text-[#003366] md:text-lg">
        Student Personal Information
      </h3>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 text-sm">

        <div>
          <p className="text-gray-500">First Name</p>
          <p className="font-semibold">{studentData.firstName}</p>
        </div>

        <div>
          <p className="text-gray-500">Last Name</p>
          <p className="font-semibold">{studentData.lastName}</p>
        </div>

        <div>
          <p className="text-gray-500">Middle Name</p>
          <p className="font-semibold">{studentData.middleName}</p>
        </div>

        <div>
          <p className="text-gray-500">Student ID</p>
          <p className="font-semibold">{studentData.studentId}</p>
        </div>

        <div>
          <p className="text-gray-500">Date of Birth</p>
          <p className="font-semibold">{studentData.dateOfBirth}</p>
        </div>

        <div>
          <p className="text-gray-500">Sex</p>
          <p className="font-semibold">{studentData.sex}</p>
        </div>

        <div>
          <p className="text-gray-500">Phone</p>
          <p className="font-semibold">{studentData.phone}</p>
        </div>

        <div>
          <p className="text-gray-500">Email</p>
          <p className="font-semibold break-words">{studentData.email}</p>
        </div>

        <div className="col-span-2 md:col-span-3">
          <p className="text-gray-500">Address</p>
          <p className="font-semibold">{studentData.address}</p>
        </div>

      </div>
    </div>
  );
};

export default StudentInfoCard;