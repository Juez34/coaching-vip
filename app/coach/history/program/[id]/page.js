"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "../../../../../lib/supabase";
import { 
  ArrowLeft, Loader2, Clock, Dumbbell, 
  ChevronDown, ChevronUp, CheckCircle2, AlertCircle, MessageSquare, Check 
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";

export default function CoachProgramHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const programId = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : null;

  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [programTitle, setProgramTitle] = useState("");
  const [studentName, setStudentName] = useState("");
  const [sessions, setSessions] = useState([]);
  const [openSessionId, setOpenSessionId] = useState(null);

  useEffect(() => {
    if (programId) {
      fetchProgramHistory();
    }
  }, [programId]);

  const fetchProgramHistory = async () => {
    try {
      setLoading(true);

      const { data: programData } = await supabase
        .from("programs")
        .select("title, profiles!programs_student_id_fkey(full_name)")
        .eq("id", programId)
        .maybeSingle();

      if (programData) {
        setProgramTitle(programData.title);
        setStudentName(programData.profiles?.full_name || "Élève");
      }

      const { data: logsData, error: logsErr } = await supabase
        .from("workout_logs")
        .select("*")
        .eq("program_id", programId)
        .order("created_at", { ascending: false });

      if (logsErr) throw logsErr;

      setSessions(logsData || []);

      if (logsData && logsData.length > 0) {
        setOpenSessionId(logsData[0].id);
      }
    } catch (err) {
      console.error("Erreur chargement historique coach :", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsReviewed = async (e, logId) => {
    e.stopPropagation();
    try {
      setUpdatingId(logId);

      const { error } = await supabase
        .from("workout_logs")
        .update({ coach_reviewed: true })
        .eq("id", logId);

      if (error) throw error;

      setSessions((prev) =>
        prev.map((s) => (s.id === logId ? { ...s, coach_reviewed: true } : s))
      );
    } catch (err) {
      console.error("Erreur lors de la validation de la séance :", err);
      alert("Impossible de valider cette séance.");
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleSession = (sessionId) => {
    setOpenSessionId((prev) => (prev === sessionId ? null : sessionId));
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "Non mesurée";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} min ${secs > 0 ? `${secs}s` : ""}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-6 max-w-3xl mx-auto pb-24">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-amber-400 mb-6 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Retour au dossier élève</span>
      </button>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mb-8">
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
          Suivi de séance • {studentName}
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-white mt-2">
          {programTitle || "Séance d'entraînement"}
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          {sessions.length} session{sessions.length > 1 ? "s" : ""} réalisée{sessions.length > 1 ? "s" : ""} au total.
        </p>
      </div>

      <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
        <Clock className="w-4 h-4 text-amber-400" />
        <span>Historique des sessions</span>
      </h2>

      {sessions.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-xs">
          Aucune session enregistrée pour cette séance par l'élève.
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session, index) => {
            const isOpen = openSessionId === session.id;
            const sessionDate = new Date(session.created_at).toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            let rawPerf = session.actual_performances;
            if (typeof rawPerf === "string") {
              try { rawPerf = JSON.parse(rawPerf); } catch (e) {}
            }

            let performancesList = Array.isArray(rawPerf) ? rawPerf : [];

            return (
              <div
                key={session.id}
                className={`border rounded-2xl transition-all shadow-md overflow-hidden ${
                  isOpen ? "bg-slate-900 border-amber-400/50" : "bg-slate-900/60 border-slate-800"
                }`}
              >
                <div
                  onClick={() => toggleSession(session.id)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left cursor-pointer hover:bg-slate-850 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-amber-400">
                        Session #{sessions.length - index}
                      </span>

                      {session.coach_reviewed ? (
                        <span className="text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Validée par le coach
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase bg-amber-400/10 text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-400/20 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> À réviser
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-white capitalize">{sessionDate}</h3>
                  </div>

                  <div className="flex items-center gap-3">
                    {!session.coach_reviewed && (
                      <button
                        onClick={(e) => handleMarkAsReviewed(e, session.id)}
                        disabled={updatingId === session.id}
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 transition-all shadow-sm cursor-pointer"
                        title="Valider cette séance"
                      >
                        {updatingId === session.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span className="hidden sm:inline">Valider</span>
                          </>
                        )}
                      </button>
                    )}

                    <span className="text-xs text-slate-400 flex items-center gap-1 hidden sm:flex">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      {formatDuration(session.duration_seconds)}
                    </span>

                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 text-amber-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-500" />
                    )}
                  </div>
                </div>

                {isOpen && (
                  <div className="p-4 sm:p-5 border-t border-slate-800 space-y-4 bg-slate-950/50">
                    <div className="flex justify-between items-center text-xs text-slate-400 sm:hidden pb-2 border-b border-slate-800">
                      <span>Durée de l'effort :</span>
                      <strong className="text-white">{formatDuration(session.duration_seconds)}</strong>
                    </div>

                    {session.student_comment && (
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs space-y-1">
                        <span className="font-bold text-amber-400 flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Remarque globale de l'élève :</span>
                        </span>
                        <p className="text-slate-300 italic pl-5">{session.student_comment}</p>
                      </div>
                    )}

                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <Dumbbell className="w-4 h-4 text-amber-400" />
                      <span>Performances réelles enregistrées</span>
                    </h4>

                    {performancesList.length > 0 ? (
                      <div className="space-y-3">
                        {performancesList.map((exo, idx) => {
                          const exoName = exo.name || `Exercice #${idx + 1}`;
                          const setsArr = Array.isArray(exo.sets) ? exo.sets : [];

                          return (
                            <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-white text-xs">{exoName}</span>
                                {exo.comment && (
                                  <span className="text-[11px] text-amber-300 italic">
                                    "{exo.comment}"
                                  </span>
                                )}
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                {setsArr.map((set, setIdx) => (
                                  <div
                                    key={setIdx}
                                    className={`px-3 py-1.5 rounded-lg border flex justify-between items-center text-xs ${
                                      set.completed ? "bg-slate-950 border-emerald-500/30" : "bg-slate-950/50 border-slate-800"
                                    }`}
                                  >
                                    <span className="text-slate-400 font-medium">Série {setIdx + 1}</span>
                                    <div className="flex gap-2">
                                      <span className="text-amber-400 font-bold">{set.reps} reps</span>
                                      {set.weight && (
                                        <span className="text-slate-300">({set.weight} kg)</span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center text-xs text-slate-400">
                        Session enregistrée sans détail d'exercice.
                      </div>
                    )}

                    {!session.coach_reviewed && (
                      <button
                        onClick={(e) => handleMarkAsReviewed(e, session.id)}
                        disabled={updatingId === session.id}
                        className="w-full mt-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold p-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                      >
                        {updatingId === session.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="w-4 h-4 stroke-[3]" />
                            <span>Marquer cette session comme revue & validée</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
