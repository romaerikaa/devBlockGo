import {
  formatName,
  getGradeEquivalent,
  computeFinal,
  getStatus,
} from "../utils/gradingHelpers";

const StudentRow = ({
  student,
  grades,
  activeTerm,
  handleChange,
  toggleFlagStudent,
}) => {
  const final = computeFinal(grades, student.id, activeTerm);
  const status = getStatus(final, activeTerm);
  const isFlagged = grades[student.id]?.flagged;

  return (
    <tr className={`border-b ${isFlagged ? "bg-red-50" : ""}`}>
      <td className="px-6 py-4">{student.id}</td>

      <td className="px-6 py-4">
        <span className="flex gap-2">
          {isFlagged && <span className="text-red-500">🚩</span>}
          {formatName(student)}
        </span>
      </td>

      <td className="text-center">
        <input
          value={grades[student.id]?.midterm || ""}
          onChange={(e) =>
            handleChange(student.id, "midterm", e.target.value)
          }
          disabled={activeTerm !== "midterm"}
        />
      </td>

      <td className="text-center">
        <input
          value={grades[student.id]?.finals || ""}
          onChange={(e) =>
            handleChange(student.id, "finals", e.target.value)
          }
          disabled={activeTerm !== "finals"}
        />
      </td>

      <td className="text-center font-bold">{final}</td>

      <td className="text-center font-bold">
        {final !== "-" ? getGradeEquivalent(final) : "-"}
      </td>

      <td
        className={`text-center font-semibold ${
          status === "Passed"
            ? "text-green-600"
            : status === "Failed"
            ? "text-red-600"
            : "text-amber-600"
        }`}
      >
        {status}
      </td>

      <td className="text-center">
        <button onClick={() => toggleFlagStudent(student.id)}>
          {isFlagged ? "Unflag" : "Flag"}
        </button>
      </td>
    </tr>
  );
};

export default StudentRow;