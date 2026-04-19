import { getPLVPoint } from "../../utils/studentHelpers";

const StudentGradesTable = ({ subjects }) => {
  return (
    <div className="mx-6 mt-5 overflow-hidden rounded-xl bg-white shadow">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-sm">
          <thead className="bg-[#003366] text-white">
            <tr>
              <th className="p-4 text-left">Code</th>
              <th className="p-4 text-left">Subject Title</th>
              <th className="p-4 text-center">Units</th>
              <th className="p-4 text-center">Midterm</th>
              <th className="p-4 text-center">Finals</th>
              <th className="p-4 text-center">Final Grade</th>
              <th className="p-4 text-center">Remarks</th>
            </tr>
          </thead>

          <tbody>
            {subjects.map((sub, index) => {
              const finalPoint = getPLVPoint(sub.midterm, sub.finals);
              const passed = finalPoint <= 3.0;

              return (
                <tr key={index} className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="p-4 font-semibold text-[#003366]">{sub.code}</td>
                  <td className="p-4">{sub.name}</td>
                  <td className="p-4 text-center">{sub.units}</td>
                  <td className="p-4 text-center">{sub.midterm}</td>
                  <td className="p-4 text-center">{sub.finals}</td>
                  <td className="p-4 text-center font-bold text-[#003366]">
                    {finalPoint.toFixed(2)}
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