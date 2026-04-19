const StudentSummary = ({ totalUnits, gwa, isDeansLister }) => {
  return (
    <div className="mx-4 mt-5 flex flex-col gap-4 rounded-xl bg-[#003366] p-4 text-white md:mx-6 md:flex-row md:items-center md:justify-between md:p-6">
      <div>
        <h2 className="text-base font-bold md:text-lg">School Year: 2025-2026</h2>
        <p className="text-sm opacity-80">1st Semester Grades</p>
      </div>

      <div className="flex flex-wrap gap-3 md:gap-4">
        {isDeansLister && (
          <div className="rounded-lg bg-green-600 px-4 py-2 font-bold">
            Dean&apos;s Lister
          </div>
        )}

        <div className="rounded-lg bg-white/20 px-4 py-2 text-center">
          <p className="text-xs">Total Units</p>
          <p className="font-bold">{totalUnits}</p>
        </div>

        <div className="rounded-lg bg-yellow-400 px-4 py-2 text-center font-bold text-[#003366]">
          <p className="text-xs">GWA</p>
          <p>{gwa}</p>
        </div>
      </div>
    </div>
  );
};

export default StudentSummary;