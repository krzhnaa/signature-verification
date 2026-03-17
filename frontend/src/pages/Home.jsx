import { useEffect, useState } from "react";
import axios from "axios";
import UploadBox from "../components/UploadBox";
import UserSelector from "../components/UserSelector";
import ResultCard from "../components/ResultCard";
import LoadingOverlay from "../components/LoadingOverlay";
import Toast from "../components/Toast";

const API_BASE_URL = "http://127.0.0.1:8000";

function Home() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [signatureFile, setSignatureFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUsersLoading, setIsUsersLoading] = useState(true);
  const [loadingStage, setLoadingStage] = useState("");

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setIsUsersLoading(true);
        const response = await axios.get(`${API_BASE_URL}/users/`);
        setUsers(response.data.users || []);
        setSuccessMessage("Account holders loaded successfully.");
      } catch (requestError) {
        const message =
          requestError.response?.data?.error ||
          requestError.response?.data?.detail ||
          "Unable to load account holders from the verification server.";
        setError(message);
      } finally {
        setIsUsersLoading(false);
      }
    };

    loadUsers();
  }, []);

  const canVerify = Boolean(selectedUser && signatureFile && !isLoading && !isUsersLoading);

  const handleReset = () => {
    setSelectedUser("");
    setSignatureFile(null);
    setResult(null);
    setError("");
    setSuccessMessage("Form reset successfully.");
  };

  const handleVerify = async () => {
    if (!selectedUser || !signatureFile) {
      setError("Please select an account holder and upload a signature image.");
      return;
    }

    const formData = new FormData();
    formData.append("user", selectedUser);
    formData.append("file", signatureFile);

    try {
      setIsLoading(true);
      setError("");
      setSuccessMessage("");
      setResult(null);
      setLoadingStage("Preparing the uploaded signature for deep analysis...");

      window.setTimeout(() => {
        setLoadingStage("Comparing your upload with stored user signature patterns...");
      }, 700);

      const response = await axios.post(`${API_BASE_URL}/verify/`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setResult(response.data);
      setSuccessMessage("Verification complete. Review the score breakdown below.");
    } catch (requestError) {
      const message =
        requestError.response?.data?.error ||
        requestError.response?.data?.detail ||
        "Unable to verify this signature right now. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
      setLoadingStage("");
    }
  };

  const systemReady = users.length > 0 && !isUsersLoading;

  return (
    <>
      <LoadingOverlay isVisible={isLoading} stageText={loadingStage} />
      <Toast
        type="error"
        message={error}
        onClose={() => setError("")}
      />
      {!error ? (
        <Toast
          type="success"
          message={successMessage}
          onClose={() => setSuccessMessage("")}
        />
      ) : null}

      <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <div className="absolute left-[-4rem] top-[-2rem] h-48 w-48 animate-float rounded-full bg-teal-300/30 blur-3xl md:h-72 md:w-72" />
          <div className="absolute bottom-[-3rem] right-[-2rem] h-52 w-52 animate-float rounded-full bg-cyan-300/30 blur-3xl [animation-delay:1s] md:h-80 md:w-80" />
          <div className="absolute right-[18%] top-[10%] h-32 w-32 rounded-full bg-amber-200/20 blur-3xl" />
        </div>

        <section className="relative z-10 w-full max-w-7xl rounded-[2.4rem] border border-white/60 bg-white/65 p-6 shadow-soft backdrop-blur-xl md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
            <div className="animate-fadeUp">
              <div className="inline-flex animate-float items-center rounded-full border border-cyan-200 bg-white/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-700 shadow-sm">
                ML-based banking demo
              </div>
              <h1 className="mt-6 max-w-3xl text-4xl font-black tracking-tight text-slate-900 md:text-6xl">
                Advanced Signature Verification Experience
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
                A premium interface for signature intelligence with drag-and-drop upload, animated
                scoring, adaptive analysis, and live account-holder verification feedback.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-[1.6rem] border border-white/70 bg-white/80 p-5 shadow-lg backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:shadow-xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    System Status
                  </p>
                  <p className="mt-3 text-2xl font-black text-slate-900">
                    {systemReady ? "Online" : "Loading"}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">Backend-linked verification pipeline</p>
                </div>
                <div className="rounded-[1.6rem] border border-white/70 bg-white/80 p-5 shadow-lg backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:shadow-xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Profiles Ready
                  </p>
                  <p className="mt-3 text-2xl font-black text-slate-900">{users.length}</p>
                  <p className="mt-1 text-sm text-slate-500">Detected from your dataset folders</p>
                </div>
                <div className="rounded-[1.6rem] border border-white/70 bg-white/80 p-5 shadow-lg backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:shadow-xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Current Mode
                  </p>
                  <p className="mt-3 text-2xl font-black text-slate-900">Style-Aware</p>
                  <p className="mt-1 text-sm text-slate-500">Adaptive same-person analysis</p>
                </div>
              </div>
            </div>

            <div className="animate-fadeUp rounded-[2rem] border border-white/60 bg-[linear-gradient(145deg,rgba(255,255,255,0.92),rgba(236,254,255,0.76))] p-6 shadow-[0_25px_90px_rgba(15,23,42,0.15)] backdrop-blur-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Quick Controls
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-slate-900">Run a New Verification</h2>
                </div>
                <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
                  Live
                </span>
              </div>

              <div className="mt-6 space-y-6">
                <UserSelector
                  users={users}
                  selectedUser={selectedUser}
                  onChange={setSelectedUser}
                  disabled={isUsersLoading || isLoading}
                />

                <div className="rounded-[1.7rem] border border-white/60 bg-white/80 p-5 shadow-lg backdrop-blur-xl">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Verification Intelligence
                  </p>
                  <div className="mt-4 grid gap-3">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3 transition duration-300 hover:bg-slate-100">
                      <p className="text-sm font-semibold text-slate-800">Feature Fusion</p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        Embedding, projection, shape, density, and aspect cues are analyzed together.
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3 transition duration-300 hover:bg-slate-100">
                      <p className="text-sm font-semibold text-slate-800">Adaptive Thresholding</p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        Each user’s natural signature variation is used to decide the final result.
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3 transition duration-300 hover:bg-slate-100">
                      <p className="text-sm font-semibold text-slate-800">Centered Normalization</p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        Strokes are isolated, denoised, centered, and resized to a stable input space.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <UploadBox
              label="Upload Signature"
              file={signatureFile}
              onFileChange={setSignatureFile}
            />

            <div className="animate-fadeUp rounded-[2rem] border border-white/60 bg-white/80 p-6 shadow-lg backdrop-blur-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Action Center
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-slate-900">Trigger Verification</h2>
                </div>
                <div className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                  {canVerify ? "Ready to run" : "Waiting for input"}
                </div>
              </div>

              <div className="mt-6 rounded-[1.6rem] bg-[linear-gradient(135deg,#0f172a,#155e75)] p-5 text-white shadow-[0_25px_80px_rgba(15,23,42,0.28)]">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-100/80">
                    Session Summary
                  </p>
                  <span className="h-3 w-3 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.9)]" />
                </div>
                <div className="mt-5 grid gap-3 text-sm text-slate-200">
                  <div className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
                    <span>Selected user</span>
                    <span className="font-semibold text-white">{selectedUser || "Not selected"}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
                    <span>Signature upload</span>
                    <span className="font-semibold text-white">{signatureFile ? "Attached" : "Missing"}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
                    <span>Reference profiles</span>
                    <span className="font-semibold text-white">{users.length}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-4 md:flex-row">
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={!canVerify}
                  className={`group inline-flex min-w-56 items-center justify-center rounded-full px-8 py-4 text-base font-semibold text-white transition-all duration-500 ${
                    canVerify
                      ? "bg-gradient-to-r from-slate-900 via-teal-700 to-cyan-600 shadow-[0_18px_50px_rgba(8,145,178,0.35)] hover:-translate-y-1.5 hover:shadow-[0_28px_70px_rgba(8,145,178,0.4)]"
                      : "cursor-not-allowed bg-slate-400"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <span className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <span className="transition duration-500 group-hover:translate-x-0.5">Verify Signature</span>
                      <span className="ml-3 transition duration-500 group-hover:translate-x-1">→</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isLoading}
                  className="inline-flex min-w-40 items-center justify-center rounded-full border border-slate-300 bg-white/85 px-6 py-4 text-base font-semibold text-slate-700 transition duration-500 hover:-translate-y-1 hover:border-slate-400 hover:bg-white hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Reset
                </button>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  Smooth loading overlay with live analysis messaging.
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  Toast alerts for success, errors, and reset events.
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <ResultCard result={result} selectedUser={selectedUser} />
          </div>
        </section>
      </main>
    </>
  );
}

export default Home;
