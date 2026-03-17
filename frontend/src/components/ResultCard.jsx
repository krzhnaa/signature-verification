function getConfidenceLabel(maxSimilarityPercent) {
  if (maxSimilarityPercent >= 85) {
    return "High confidence";
  }

  if (maxSimilarityPercent >= 70) {
    return "Medium confidence";
  }

  return "Low confidence";
}

function ResultCard({ result, selectedUser }) {
  if (!result) {
    return null;
  }

  const averagePercent = Math.round(result.average_similarity * 100);
  const maxPercent = Math.round(result.max_similarity * 100);
  const isGenuine = result.result === "Genuine";
  const confidenceLabel = getConfidenceLabel(maxPercent);
  const finalSimilarityPercent = Math.round((result.details?.final_similarity ?? result.max_similarity) * 100);
  const adaptiveThresholdPercent = Math.round((result.details?.adaptive_threshold ?? 0.7) * 100);

  return (
    <div className="animate-fadeUp rounded-[2rem] border border-white/60 bg-white/85 p-6 shadow-soft backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:shadow-[0_35px_120px_rgba(15,23,42,0.18)] md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Verification Result
          </p>
          <h3 className="mt-2 text-3xl font-black text-slate-900">{result.result}</h3>
          <p className="mt-2 text-sm text-slate-600">
            Compared against stored signature references for{" "}
            <span className="font-semibold capitalize text-slate-800">{selectedUser}</span>.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <span
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              isGenuine ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
            }`}
          >
            {isGenuine ? "Genuine match" : "Forged risk"}
          </span>
          <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
            {confidenceLabel}
          </span>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl bg-[linear-gradient(180deg,#f8fafc,#f1f5f9)] p-5 transition duration-500 hover:scale-[1.01]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Average Similarity
            </p>
            <span className="text-2xl font-black text-slate-900">{averagePercent}%</span>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isGenuine
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                  : "bg-gradient-to-r from-rose-500 to-orange-400"
              }`}
              style={{ width: `${averagePercent}%` }}
            />
          </div>
        </div>

        <div className="rounded-3xl bg-[linear-gradient(180deg,#f8fafc,#f1f5f9)] p-5 transition duration-500 hover:scale-[1.01]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Max Similarity
            </p>
            <span className="text-2xl font-black text-slate-900">{maxPercent}%</span>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isGenuine
                  ? "bg-gradient-to-r from-emerald-500 to-cyan-500"
                  : "bg-gradient-to-r from-rose-500 to-yellow-500"
              }`}
              style={{ width: `${maxPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl bg-[linear-gradient(180deg,#f8fafc,#f1f5f9)] p-5 transition duration-500 hover:scale-[1.01]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Final Style Match
            </p>
            <span className="text-2xl font-black text-slate-900">{finalSimilarityPercent}%</span>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-slate-900 to-teal-600 transition-all duration-700"
              style={{ width: `${finalSimilarityPercent}%` }}
            />
          </div>
        </div>

        <div className="rounded-3xl bg-[linear-gradient(180deg,#f8fafc,#f1f5f9)] p-5 transition duration-500 hover:scale-[1.01]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Adaptive Threshold
            </p>
            <span className="text-2xl font-black text-slate-900">{adaptiveThresholdPercent}%</span>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-700"
              style={{ width: `${adaptiveThresholdPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-3xl bg-[linear-gradient(180deg,#f8fafc,#f1f5f9)] p-5">
        {result.details ? (
          <div className="mb-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            <span className="font-semibold text-slate-800">Scoring:</span> {result.details.scoring}
          </div>
        ) : null}

        {result.details?.user_profile ? (
          <div className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 md:grid-cols-3">
            <span>Reference count: {result.details.user_profile.reference_count}</span>
            <span>Intra-user avg: {Math.round(result.details.user_profile.intra_user_average * 100)}%</span>
            <span>Intra-user min: {Math.round(result.details.user_profile.intra_user_minimum * 100)}%</span>
          </div>
        ) : null}

        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Individual Scores
          </p>
          <span className="text-sm font-medium text-slate-500">{result.all_scores.length} references</span>
        </div>

        <div className="mt-4 grid gap-3">
          {result.all_scores.map((score, index) => {
            const scorePercent = Math.round(score * 100);
            const referenceDetails = result.details?.references?.[index];

            return (
              <div
                key={`${score}-${index}`}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 transition duration-500 hover:-translate-y-1 hover:border-cyan-200 hover:shadow-lg"
              >
                <div className="flex items-center justify-between text-sm font-medium text-slate-700">
                  <span>{referenceDetails?.reference_file || `Reference Signature ${index + 1}`}</span>
                  <span>{scorePercent}%</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-slate-900 to-cyan-600 transition-all duration-700"
                    style={{ width: `${scorePercent}%` }}
                  />
                </div>
                {referenceDetails ? (
                  <div className="mt-3 grid gap-2 text-xs text-slate-500 md:grid-cols-5">
                    <span>Embedding: {Math.round(referenceDetails.embedding_similarity * 100)}%</span>
                    <span>Projection: {Math.round(referenceDetails.projection_similarity * 100)}%</span>
                    <span>Shape: {Math.round(referenceDetails.shape_similarity * 100)}%</span>
                    <span>Density: {Math.round(referenceDetails.density_similarity * 100)}%</span>
                    <span>Aspect: {Math.round(referenceDetails.aspect_similarity * 100)}%</span>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ResultCard;
