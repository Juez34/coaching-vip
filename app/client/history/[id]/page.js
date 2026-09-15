"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabase";
import { 
  ArrowLeft, Loader2, Calendar, Clock, Dumbbell, 
  ChevronDown, ChevronUp, CheckCircle2, AlertCircle 
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function StudentWorkoutHistoryPage() {
  const params = useParams();
  const logOrProgramId = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : null;

  const [loading, setLoading] = useState(true);
  const [programTitle, setProgramTitle] = useState("");
  const [sessions, setSessions] = useState([]);
  const [openSessionId, setOpenSessionId] = useState(null);

  useEffect(() => {
    if (logOrProgramId) {
      fetchWorkoutHistory();
    }
  }, [logOrProgramId]);

  const fetchWorkoutHistory = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Déterminer si l'ID reçu est un log_id précis ou un program_id
      let targetProgramId = logOrProgramId;

      const { data: initialLog } = await supabase
        .from("workout_logs")
        .select("program_id")
        .eq("id", logOrProgramId)
        .single();

      if (initialLog?.program_id) {
        targetProgramId = initialLog.program_id;
      }

      // 2. Récupérer les informations du programme
      const { data: programData } = await supabase
        .from("programs")
        .select("title")
        .eq("id", targetProgramId)
        .single();

      if (programData) {
        setProgramTitle(programData.title);
      }

      // 3. Récupérer TOUTES les sessions (workout_logs) réalisées par cet élève pour ce programme
      const { data: logsData, error: logsErr } = await supabase
        .from("workout_logs")
        .select("*, workout_log_entries(*)")
        .eq("program_id", targetProgramId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (logsErr) throw logsErr;

      setSessions(logsData || []);

      // Ouvrir automatiquement la première session (ou celle ciblée par l'URL)
      if (logsData && logsData.length > 0) {
        const matchingSession = logsData.find((s) => s.id === logOrProgramId);
        setOpenSessionId(matchingSession ? matchingSession.id : logsData[0].id);
      }
    } catch (err) {
      console.error("Erreur lors du chargement de l'historique :", err);
    } finally {
      setLoading(false);
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
      {/* Retour dashboard client */}
      <Link
        href="/client"
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-amber-400 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Retour à mon espace</span>
      </Link>

      {/* En-tête */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mb-8">
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
          Historique des entraînements
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-white mt-2">
          {programTitle || "Séance d'entraînement"}
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          {sessions.length} session{sessions.length > 1 ? "s" : ""} réalisée{sessions.length > 1 ? "s" : ""} au total.
        </p>
      </div>

      {/* Accordéon des sessions */}
      {sessions.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-xs">
          Aucune session enregistrée pour cette séance.
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

            return (
              <div
                key={session.id}
                className={`border rounded-2xl transition-all shadow-md overflow-hidden ${
                  isOpen ? "bg-slate-900 border-amber-400/50" : "bg-slate-900/60 border-slate-800"
                }`}
              >
                {/* En-tête de l'accordéon (Cliquable) */}
                <button
                  onClick={() => toggleSession(session.id)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left cursor-pointer hover:bg-slate-850 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-amber-400">
                        Session #{sessions.length - index}
                      </span>
                      {session.coach_reviewed ? (
                        <span className="text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Vue par le coach
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase bg-amber-400/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-400/20 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> En attente de révision
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-white capitalize">{sessionDate}</h3>
                  </div>

                  <div className="flex items-center gap-3">
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
                </button>

                {/* Contenu de l'accordéon */}
                {isOpen && (
                  <div className="p-4 sm:p-5 border-t border-slate-800 space-y-4 bg-slate-950/50">
                    <div className="flex justify-between items-center text-xs text-slate-400 sm:hidden pb-2 border-b border-slate-800">
                      <span>Durée de l'effort :</span>
                      <strong className="text-white">{formatDuration(session.duration_seconds)}</strong>
                    </div>

                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <Dumbbell className="w-4 h-4 text-amber-400" />
                      <span>Détail des exercices</span>
                    </h4>

                    {session.workout_log_entries && session.workout_log_entries.length > 0 ? (
                      <div className="space-y-3">
                        {session.workout_log_entries.map((entry, idx) => (
                          <div
                            key={entry.id || idx}
                            className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex justify-between items-center text-xs"
                          >
                            <span className="font-bold text-white">{entry.exercise_name || `Exercice #${idx + 1}`}</span>
                            <div className="flex gap-3 text-slate-300">
                              <span className="bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
                                <strong className="text-amber-400">{entry.sets_completed || "-"}</strong> séries
                              </span>
                              <span className="bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
                                <strong className="text-amber-400">{entry.reps_completed || "-"}</strong> reps
                              </span>
                              {entry.weight_used && (
                                <span className="bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
                                  <strong className="text-amber-400">{entry.weight_used}</strong> kg
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">Aucune donnée détaillée enregistrée pour cette session.</p>
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
