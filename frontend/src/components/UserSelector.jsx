function formatUserLabel(user) {
  return user
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function UserSelector({ users, selectedUser, onChange, disabled }) {
  return (
    <div className="animate-fadeUp">
      <label
        htmlFor="user-selector"
        className="mb-3 block text-sm font-semibold uppercase tracking-[0.2em] text-slate-500"
      >
        Select Account Holder
      </label>
      <div className="rounded-[2rem] border border-white/60 bg-white/80 p-2 shadow-[0_20px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:shadow-[0_26px_80px_rgba(15,23,42,0.16)]">
        <select
          id="user-selector"
          value={selectedUser}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-[1.35rem] border-none bg-[linear-gradient(180deg,#f8fafc,#eef6ff)] px-5 py-4 text-base font-medium text-slate-800 outline-none transition focus:ring-2 focus:ring-teal-400 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <option value="">Choose an account holder</option>
          {users.map((user) => (
            <option key={user} value={user}>
              {formatUserLabel(user)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default UserSelector;
