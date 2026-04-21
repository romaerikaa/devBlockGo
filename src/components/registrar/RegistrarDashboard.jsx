import React from "react";

function RegistrarDashboard() {
  const overviewCards = [
    {
      title: "Total Faculty",
      value: 18,
      subtitle: "Active faculty accounts",
    },
    {
      title: "Total Sections",
      value: 42,
      subtitle: "Available sections this semester",
    },
    {
      title: "Encoded Sections",
      value: 26,
      subtitle: "Sections with submitted grades",
    },
    {
      title: "Pending Sections",
      value: 16,
      subtitle: "Sections not yet completed",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {overviewCards.map((card, index) => (
          <div
            key={index}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-500">{card.title}</p>
            <h3 className="mt-2 text-3xl font-bold text-[#003366]">
              {card.value}
            </h3>
            <p className="mt-2 text-sm text-slate-400">{card.subtitle}</p>
          </div>
        ))}
      </div>

      {/* Encoding Status Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-xl font-bold text-[#003366]">
              Grade Encoding Status
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              The current encoding period is active for all assigned faculty.
            </p>
          </div>

          <div className="inline-flex w-fit rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
            Encoding Open
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Start Date</p>
            <p className="mt-1 font-semibold text-slate-800">May 01, 2026</p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Deadline</p>
            <p className="mt-1 font-semibold text-slate-800">May 15, 2026</p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Semester</p>
            <p className="mt-1 font-semibold text-slate-800">2nd Semester</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegistrarDashboard;