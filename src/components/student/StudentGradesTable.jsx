import { getPLVPoint } from "../../utils/studentHelpers";

const StudentGradesTable = ({ subjects }) => {
  return (
    <div className="mx-4 mt-5 md:mx-6">
      <div className="space-y-3 md:hidden">
        {subjects.map((sub, index) => {
          const finalNumeric = ((sub.midterm + sub.finals) / 2).toFixed(2);
          const finalEquivalent = getPLVPoint(sub.midterm, sub.finals);
          const passed = finalEquivalent <= 3.0;

          return (
            <div
              key={index}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="mb-3">
                <p className="text-sm text-slate-500">Code</p>
                <p className="font-semibold text-[#003366]">{sub.code}</p>
              </div>

              <div className="mb-3">
                <p className="text-sm text-slate-500">Subject Title</p>
                <p className="font-semibold">{sub.name}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-slate-500">Units</p>
                  <p className="font-semibold">{sub.units}</p>
                </div>

                <div>
                  <p className="text-slate-500">Midterm</p>
                  <p className="font-semibold">{sub.midterm}</p>
                </div>

                <div>
                  <p className="text-slate-500">Finals</p>
                  <p className="font-semibold">{sub.finals}</p>
                </div>

                <div>
                  <p className="text-slate-500">Final Grade</p>
                  <p className="font-semibold text-[#003366]">{finalNumeric}</p>
                </div>

                <div>
                  <p className="text-slate-500">Grade Equivalent</p>
                  <p className="font-semibold text-[#003366]">
                    {finalEquivalent.toFixed(2)}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500">Remarks</p>
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
                      passed
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {passed ? "PASSED" : "FAILED"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto rounded-xl bg-white shadow md:block">
        <table className="w-full min-w-[800px] text-sm">
          <thead className="bg-[#003366] text-white">
            <tr>
              <th className="p-4 text-left">Code</th>
              <th className="p-4 text-left">Subject Title</th>
              <th className="p-4 text-center">Units</th>
              <th className="p-4 text-center">Midterm</th>
              <th className="p-4 text-center">Finals</th>
              <th className="p-4 text-center">Final Grade</th>
              <th className="p-4 text-center">Grade Equivalent</th>
              <th className="p-4 text-center">Remarks</th>
            </tr>
          </thead>

          <tbody>
            {subjects.map((sub, index) => {
              const finalNumeric = ((sub.midterm + sub.finals) / 2).toFixed(2);
              const finalEquivalent = getPLVPoint(sub.midterm, sub.finals);
              const passed = finalEquivalent <= 3.0;

              return (
                <tr
                  key={index}
                  className="border-b border-slate-200 hover:bg-slate-50"
                >
                  <td className="p-4 font-semibold text-[#003366]">{sub.code}</td>
                  <td className="p-4">{sub.name}</td>
                  <td className="p-4 text-center">{sub.units}</td>
                  <td className="p-4 text-center">{sub.midterm}</td>
                  <td className="p-4 text-center">{sub.finals}</td>
                  <td className="p-4 text-center font-bold">{finalNumeric}</td>
                  <td className="p-4 text-center font-bold text-[#003366]">
                    {finalEquivalent.toFixed(2)}
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        passed
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {passed ? "PASSED" : "FAILED"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentGradesTable;