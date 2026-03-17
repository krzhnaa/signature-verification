function LoadingOverlay({ isVisible, stageText }) {
  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-md">
      <div className="w-full max-w-md overflow-hidden rounded-[2rem] border border-white/15 bg-slate-950/85 p-8 text-white shadow-[0_35px_120px_rgba(15,23,42,0.55)]">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/5">
          <div className="relative h-12 w-12">
            <span className="absolute inset-0 animate-spin rounded-full border-[3px] border-cyan-300/20 border-t-cyan-300" />
            <span className="absolute inset-2 animate-pulse rounded-full bg-gradient-to-br from-cyan-300 to-teal-400 opacity-70 blur-sm" />
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200/80">
            Signature Analysis
          </p>
          <h3 className="mt-3 text-2xl font-black tracking-tight">Verifying Signature Pattern</h3>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            {stageText || "Preparing references, extracting features, and comparing writing style."}
          </p>
        </div>

        <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-2/3 animate-shimmer rounded-full bg-gradient-to-r from-cyan-300 via-teal-300 to-emerald-300 bg-[length:200%_100%]" />
        </div>
      </div>
    </div>
  );
}

export default LoadingOverlay;
