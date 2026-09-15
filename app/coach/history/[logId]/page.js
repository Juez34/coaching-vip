"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Loader2, Dumbbell, MessageSquare, Calendar, Clock, Check, X, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export default function CoachWorkoutDetailView() {
  const params = useParams();
  const logId = params?.logId ? (Array.isArray(params.logId) ? params.logId[0] : params.logId) : null;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [log, setLog] = useState(null);
  const [program, setProgram] = useState(null);
  const [exercisesList, setExercisesList] = useState([]);
  const [studentProfile, setStudentProfile] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (logId) {
      fetchLogDetails();
    }
  }, [logId]);

  const fetchLogDetails = async () => {
    try {
      setLoading(true);

      // 1. Récupérer le log d'entraînement spécifique
      const { data: logData, error: logErr } = await supabase
        .from("workout_logs")
        .select("*")
        .eq("id", logId)
        .single();

      if (logErr) throw logErr;
      setLog(logData);

      // 2. Récupérer le programme associé
      if (logData?.program_id) {
        const { data: progData } = await supabase
          .from("programs")
          .select("*")
          .eq("id", logData.program_id)
          .maybeSingle();
        setProgram(progData);

        // 3. Récupérer la liste des exercices du programme
        const { data: exData } = await supabase
          .from("exercises")
          .select("id, name, sets, order_index")
          .eq("program_id", logData.program_id)
          .order("order_index", { ascending: true });
        setExercisesList(exData || []);
      }

      // 4. Récupérer le profil de l'élève
      if (logData?.user_id) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", logData.user_id)
          .maybeSingle();
        setStudentProfile(profileData);
      }
    } catch (err) {
      console.error("Erreur de chargement :", err);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour valider la lecture par le coach
  const handleToggleReview = async () => {
    try {
      setUpdating(true);
      const newStatus = !log.coach_reviewed;

      const { error } = await supabase
        .from("workout_logs")
        .update({ coach_reviewed: newStatus })
        .eq("id", logId);

      if (error) throw error;

      setLog({ ...log, coach_reviewed: newStatus });
      alert(newStatus ? "Séance marquée comme lue ! ✅" : "Séance marquée comme non lue.");
    } catch (err) {
      alert("Erreur lors de la mise à jour : " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-6 max-w-2xl mx-auto pb-24">
      {/* Bouton de retour vers l'espace coach */}
      <button 
        onClick={() => router.back()} 
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-amber-400 mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Retour aux élèves</span>
      </button>

      {/* En-tête de la séance de l'élève */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mb-6 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/25">
              Rapport d'entraînement
            </span>
            <h1 className="text-2xl font-black text-white mt-2">{program?.title || "Séance libre"}</h1>
            <p className="text-xs text-slate-400 mt-1">
              Élève : <span className="text-white font-bold">{studentProfile?.full_name || studentProfile?.email || "Client"}</span>
            </p>
          </div>

          {/* Bouton de validation de lecture pour le coach */}
          <button
            onClick={handleToggleReview}
            disabled={updating}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md ${
              log?.coach_reviewed 
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30" 
                : "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{log?.coach_reviewed ? "Séance validée (Lue)" : "Valider la lecture"}</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-800 text-xs">
          <span className="text-slate-300 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            {log?.created_at ? new Date(log.created_at).toLocaleDateString("fr-FR", { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ""}
          </span>
          <span className="font-mono text-slate-300 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            {Math.floor((log?.duration_seconds || 0) / 60)} min
          </span>
        </div>
      </div>

      {/* Détail des performances de l'élève */}
      <div className="space-y-6">
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Dumbbell className="w-3.5 h-3.5 text-amber-400" />
            <span>Détail des exercices réalisés</span>
          </h3>
          
          <div className="space-y-3">
            {exercisesList.map((ex) => {
              const performances = log?.actual_performances || {};
              const completedSets = log?.completed_sets || {};
              const exerciseComments = log?.exercise_comments || {};
              const exComment = exerciseComments[ex.id];

              return (
                <div key={ex.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3 shadow-lg">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="font-bold text-white text-sm">{ex.name}</span>
                  </div>

                  <div className="space-y-1.5">
                    {Array.from({ length: ex.sets || 1 }).map((_, sIdx) => {
                      const key = `${ex.id}-${sIdx}`;
                      const isChecked = completedSets[key] === true;
                      const perf = performances[key] || {};

                      return (
                        <div 
                          key={sIdx} 
                          className={`flex justify-between items-center text-xs p-2.5 rounded-xl border ${
                            isChecked 
                              ? "bg-amber-400/5 border-amber-400/20" 
                              : "bg-slate-950 border-slate-800/80 opacity-50"
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
                            <span className="font-bold uppercase text-slate-400 text-[11px]">Série {sIdx + 1}</span>
                          </div>

                          <span className={`font-mono font-bold px-2.5 py-1 rounded-lg border text-xs ${
                            isChecked 
                              ? "text-amber-400 bg-amber-400/10 border-amber-400/25" 
                              : "text-slate-500 bg-slate-900 border-slate-800"
                          }`}>
                            {isChecked ? `${perf.reps || "0"} reps @ ${perf.weight || "0"}` : "Non validée"}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {exComment && (
                    <p className="text-xs text-slate-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800 italic">
                      💬 Note de l'élève : "{exComment}"
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Commentaire global de la séance */}
        {log?.student_comment && (
          <div className="bg-amber-400/10 p-4 rounded-2xl border border-amber-400/25 space-y-1.5 shadow-lg">
            <span className="font-bold text-amber-400 uppercase text-xs flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4" /> Commentaire global de l'élève :
            </span>
            <p className="text-amber-100/90 text-xs italic">"{log.student_comment}"</p>
          </div>
        )}
      </div>
    </div>
  );
}
