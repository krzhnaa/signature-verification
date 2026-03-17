import { useEffect, useRef, useState } from "react";

function UploadBox({ label, file, onFileChange }) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const handleFile = (selectedFile) => {
    if (selectedFile && selectedFile.type.startsWith("image/")) {
      onFileChange(selectedFile);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files?.[0]);
  };

  return (
    <div className="animate-fadeUp">
      <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
        {label}
      </p>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => event.key === "Enter" && inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`group relative flex min-h-[24rem] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[2rem] border border-dashed p-6 text-center transition-all duration-500 ${
          isDragging
            ? "border-teal-400 bg-teal-50/90 shadow-[0_24px_80px_rgba(45,212,191,0.28)]"
            : "border-white/60 bg-white/75 hover:-translate-y-1.5 hover:border-cyan-300 hover:shadow-[0_30px_90px_rgba(14,165,233,0.18)]"
        }`}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.7),transparent_42%),linear-gradient(160deg,rgba(255,255,255,0.28),rgba(255,255,255,0.02))]" />
        <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => handleFile(event.target.files?.[0])}
        />

        {previewUrl ? (
          <div className="relative z-10 w-full">
            <img
              src={previewUrl}
              alt={`${label} preview`}
              className="h-56 w-full rounded-[1.5rem] border border-white/70 bg-white object-contain shadow-[0_20px_60px_rgba(15,23,42,0.12)] transition duration-500 group-hover:scale-[1.01]"
            />
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1 text-left">
                <p className="text-sm font-semibold text-slate-800">{file.name}</p>
                <p className="text-xs text-slate-500">Click or drop another image to replace it</p>
              </div>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                Ready
              </span>
            </div>
          </div>
        ) : (
          <div className="relative z-10">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.7rem] bg-gradient-to-br from-slate-900 via-cyan-900 to-teal-600 text-3xl text-white shadow-[0_20px_50px_rgba(15,23,42,0.28)] transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
              +
            </div>
            <div className="mt-6 space-y-2">
              <p className="text-xl font-bold text-slate-900">Upload signature image</p>
              <p className="mx-auto max-w-sm text-sm leading-6 text-slate-500">
                Drag and drop a signature here, or click to browse from your device.
              </p>
            </div>
            <div className="mt-6 inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 shadow-sm">
              PNG, JPG, JPEG
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UploadBox;
