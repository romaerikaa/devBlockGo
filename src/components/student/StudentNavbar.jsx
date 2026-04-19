import plvlogo from "../../assets/plvlogo.png";

const StudentNavbar = ({ onLogout }) => {
  return (
    <div className="flex items-center justify-between bg-[#003366] px-6 py-3">
      <div className="flex items-center gap-3">
        <img src={plvlogo} alt="PLV Logo" className="h-10 w-10 object-contain" />
        <h1 className="text-sm font-semibold text-white">Welcome, PLVian!</h1>
      </div>

      <button
        onClick={onLogout}
        className="rounded-lg border border-yellow-400 px-4 py-2 text-sm font-bold text-yellow-400 transition hover:bg-yellow-400 hover:text-[#003366]"
      >
        LOGOUT
      </button>
    </div>
  );
};

export default StudentNavbar;