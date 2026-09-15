"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "../../../../../lib/supabase";
import { ArrowLeft, Loader2, Dumbbell, Calendar, Clock, Check, X, CheckCircle2, Home, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";

export default function CoachProgramHistoryPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const programId = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : null;
  const studentId = searchParams.get("student");

  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState(null);
  const [exercisesList, setExercisesList] = useState([]);
  const [logs, setLogs] = useState([]);
  const [studentProfile, setStudentProfile] = useState(null);

  const [openLogIds, setOpenLogIds] = useState({});

  useEffect(() => {
    if (programId) {
      fetchProgramHistory();
    }
  }, [programId, studentId]);

  const fetchProgramHistory = async () => {
    try {
      setLoading(true);

      const { data: progData } = await supabase
        .from("programs")
        .select("*")
        .eq("id", programId)
        .single();
      setProgram(progData);

      const { data: exData } = await supabase
        .from("exercises")
        .select("id, name, sets, order_index")
        .eq("program_id", programId)
        .order("order_index", { ascending: true });
      setExercisesList(exData || []);

      let query = supabase
        .from("workout_logs")
        .select("*")
        .eq("program_id", programId)
        .order("created_at", { ascending: false });

      if (studentId) {
        query = query.eq("user_id", studentId);
      }

      const { data: logsData } = await query;
      setLogs(logsData || []);

      if (logsData && logsData.length > 0) {
        setOpenLogIds({ [logsData[0].id]: true });
      }

      if (studentId) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", studentId)
          .maybeSingle();
        setStudentProfile(profileData);
      }
    } catch (err) {
      console.error("Erreur de chargement :", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAccordion = (logId) => {
    setOpenLogIds((prev) => ({
      ...prev,
      [logId]: !prev[logId]
    }));
  };

  // Calcul du résumé global des séances pour affichage sous le titre
  const totalSessions = logs.length;
  const lastSessionDate = totalSessions > 0 && logs[0].created_at 
    ? new Date(logs[0].created_at).toLocaleDateString("fr-FR", { day: 'numeric', month: 'long', year: 'numeric' })
    : null;
  const avgDuration = totalSessions > 0 
    ? Math.round(logs.reduce((acc, curr) => acc + (curr.duration_seconds || 0), 0) / totalSessions / 60)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-6 max-w-2xl mx-auto pb-24">
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={() => router.back()} 
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-amber-400 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour au dossier</span>
        </button>

        <Link 
          href="/coach"
          className="inline-flex items-center gap-1.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-amber-400 px-3 py-1.5 rounded-xl border border-slate-800 transition-colors"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Accueil Coach</span>
        </Link>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mb-6 space-y-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/25">
            Historique des itérations
          </span>
          <h1 className="text-2xl font-black text-white mt-2">{program?.title || "Programme"}</h1>
          {studentProfile && (
            <p className="text-xs text-slate-400 mt-1">
              Élève : <span className="text-white font-bold">{studentProfile.full_name || studentProfile.email}</span>
            </p>
          )}
        </div>

        {/* 🌟 Résumé de la séance sous le titre (similaire à l'élève) */}
        {totalSessions > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800 text-[11px]">
            <span className="bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 text-slate-300 flex items-center gap-1.5">
              🏋️‍♂️ <strong className="text-white">{totalSessions}</strong> session{totalSessions > 1 ? "s" : ""} réalisée{totalSessions > 1 ? "s" : ""}
            </span>
            {lastSessionDate && (
              <span className="bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 text-slate-300 flex items-center gap-1.5">
                📅 Dernier : <strong className="text-white">{lastSessionDate}</strong>
              </span>
            )}
            <span className="bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 text-slate-300 flex items-center gap-1.5">
              ⏱️ Moy. : <strong className="text-amber-400">{avgDuration} min</strong>
            </span>
          </div>
        )}
      </div>

      {logs.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-xs">
          Aucune session n'a encore été enregistrée pour ce programme.
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log, index) => {
            const isOpen = !!openLogIds[log.id];
            const performances = log.actual_performances || {};
            const completedSets = log.completed_sets || {};
            const exerciseComments = log.exercise_comments || {};

            return (
              <div key={log.id || index} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg transition-all">
                <button
                  onClick={() => toggleAccordion(log.id)}
                  className="w-full p-4 flex flex-wrap justify-between items-center bg-slate-900 hover:bg-slate-850 transition-colors text-left cursor-pointer gap-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold bg-emerald-400/10 text-emerald-400 px-2.5 py-1 rounded-lg border border-emerald-400/20 text-xs flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {log.created_at ? new Date(log.created_at).toLocaleDateString("fr-FR", { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "Date inconnue"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {log.coach_reviewed ? (
                      <span className="text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Lue
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase bg-amber-400/10 text-amber-400 px-2 py-0.5 rounded border border-amber-400/20">
                        À examiner
                      </span>
                    )}

                    <span className="font-mono text-xs text-slate-300 bg-slate-950 px-2 py-1 rounded-md border border-slate-800 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      {Math.floor((log.duration_seconds || 0) / 60)} min
                    </span>

                    <div className="w-7 h-7 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-amber-400">
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="p-4 pt-0 space-y-4 border-t border-slate-800/80 bg-slate-950/40">
                    <div className="space-y-3 pt-3">
                      <h3 className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
                        <Dumbbell className="w-3.5 h-3.5 text-amber-400" />
                        <span>Détail des exercices de cette itération</span>
                      </h3>
                      
                      <div className="space-y-3">
                        {exercisesList.map((ex) => {
                          const exComment = exerciseComments[ex.id];
                          
                          return (
                            <div key={ex.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
                              <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                                <span className="font-bold text-white text-xs">{ex.name}</span>
                              </div>

                              <div className="space-y-1.5">
                                {Array.from({ length: ex.sets || 1 }).map((_, sIdx) => {
                                  const key = `${ex.id}-${sIdx}`;
                                  const isChecked = completedSets[key] === true;
                                  const perf = performances[key] || {};

                                  return (
                                    <div 
                                      key={sIdx} 
                                      className={`flex justify-between items-center text-xs p-2 rounded-lg border ${
                                        isChecked 
                                          ? "bg-amber-400/5 border-amber-400/20" 
                                          : "bg-slate-900/50 border-slate-800/50 opacity-60"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        {isChecked ? (
                                          <span className="p-0.5 bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30">
                                            <Check className="w-3 h-3" />
                                          </span>
                                        ) : (
                                          <span className="p-0.5 bg-slate-800 text-slate-500 rounded-full border border-slate-700">
                                            <X className="w-3 h-3" />
                                          </span>
                                        )}
                                        <span className="text-[11px] font-bold uppercase text-slate-400">Série {sIdx + 1}</span>
                                      </div>

                                      <span className={`font-mono font-bold px-2 py-0.5 rounded-md border text-xs ${
                                        isChecked 
                                          ? "text-amber-400 bg-amber-400/10 border-amber-400/20" 
                                          : "text-slate-500 bg-slate-900 border-slate-800"
                                      }`}>
                                        {isChecked ? `${perf.reps || "0"} reps @ ${perf.weight || "0"}` : "Non validée"}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>

                              {exComment && (
                                <p className="text-[11px] text-slate-400 bg-slate-900 p-2 rounded-lg border border-slate-800 italic">
                                  💬 Note exercice : "{exComment}"
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {log.student_comment && (
                      <div className="bg-amber-400/10 p-3 rounded-xl border border-amber-400/20 text-xs space-y-1">
                        <span className="font-bold text-amber-400 uppercase text-[10px]">Commentaire global de l'élève :</span>
                        <p className="text-amber-200/90 italic">"{log.student_comment}"</p>
                      </div>
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
