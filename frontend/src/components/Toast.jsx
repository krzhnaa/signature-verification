function Toast({ type = "info", message, onClose }) {
  if (!message) {
    return null;
  }

  const toneClasses =
    type === "error"
      ? "border-rose-200 bg-rose-50/95 text-rose-700"
      : type === "success"
        ? "border-emerald-200 bg-emerald-50/95 text-emerald-700"
        : "border-cyan-200 bg-cyan-50/95 text-cyan-700";

  return (
    <div className="fixed right-4 top-4 z-50 w-[min(92vw,24rem)] animate-toastIn">
      <div className={`rounded-2xl border px-4 py-4 shadow-xl backdrop-blur-xl ${toneClasses}`}>
        <div className="flex items-start gap-3">
          <div className="mt-1 h-2.5 w-2.5 rounded-full bg-current opacity-80" />
          <div className="flex-1">
            <p className="text-sm font-semibold">
              {type === "error" ? "Action needed" : type === "success" ? "Completed" : "Notice"}
            </p>
            <p className="mt-1 text-sm leading-6">{message}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-2 py-1 text-sm font-semibold transition hover:bg-black/5"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}

export default Toast;
