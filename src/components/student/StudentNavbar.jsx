import plvlogo from "../../assets/plvlogo.png";

const StudentNavbar = ({ onLogout }) => {
  return (
    <div className="w-full bg-[#003366]">
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <img
            src={plvlogo}
            alt="PLV Logo"
            className="h-10 w-10 object-contain"
          />
          <h1 className="text-xs font-semibold text-white md:text-sm">
            Welcome, PLVian!
          </h1>
        </div>

        <button
          onClick={onLogout}
          className="rounded-lg border border-yellow-400 px-3 py-2 text-xs font-bold text-yellow-400 transition hover:bg-yellow-400 hover:text-[#003366] md:px-4 md:text-sm"
        >
          LOGOUT
        </button>
      </div>
    </div>
  );
};

export default StudentNavbar;