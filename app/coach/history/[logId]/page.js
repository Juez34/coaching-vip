"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabase";
import { ArrowLeft, Loader2, Dumbbell, MessageSquare, Calendar, Clock, Check, X, CheckCircle2, Home } from "lucide-react";
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

      const { data: logData, error: logErr } = await supabase
        .from("workout_logs")
        .select("*")
        .eq("id", logId)
        .single();

      if (logErr) throw logErr;
      setLog(logData);

      if (logData?.program_id) {
        const { data: progData } = await supabase
          .from("programs")
          .select("*")
          .eq("id", logData.program_id)
          .maybeSingle();
        setProgram(progData);

        const { data: exData } = await supabase
          .from("exercises")
          .select("id, name, sets, order_index")
          .eq("program_id", logData.program_id)
          .order("order_index", { ascending: true });
        setExercisesList(exData || []);
      }

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

  const handleToggleReview = async () => {
    try {
      setUpdating(true);
      const newStatus = !log?.coach_reviewed;

      const { data, error } = await supabase
        .from("workout_logs")
        .update({ coach_reviewed: newStatus })
        .eq("id", logId)
        .select();

      if (error) {
        console.error("Erreur Supabase RLS/Update:", error);
        alert("Erreur de mise à jour (Vérifie les droits RLS Supabase) : " + error.message);
        setUpdating(false);
        return;
      }

      console.log("Mise à jour réussie :", data);

      // Redirection vers la page de l'élève une fois validé
      if (log?.user_id) {
        router.push(`/coach/students/${log.user_id}`);
      } else {
        router.back();
      }
    } catch (err) {
      alert("Erreur inattendue : " + err.message);
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
      {/* Barre de navigation rapide */}
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={() => router.back()} 
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-amber-400 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour</span>
        </button>

        <Link 
          href="/coach"
          className="inline-flex items-center gap-1.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-amber-400 px-3 py-1.5 rounded-xl border border-slate-800 transition-colors"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Accueil Gestion Élèves</span>
        </Link>
      </div>

      {/* En-tête de la séance de l'élève */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mb-6 space-y-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/25">
            Rapport d'entraînement
          </span>
          <h1 className="text-2xl font-black text-white mt-2">{program?.title || "Séance libre"}</h1>
          <p className="text-xs text-slate-400 mt-1">
            Élève : <span className="text-white font-bold">{studentProfile?.full_name || studentProfile?.email || "Client"}</span>
          </p>
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

        {log?.student_comment && (
          <div className="bg-amber-400/10 p-4 rounded-2xl border border-amber-400/25 space-y-1.5 shadow-lg">
            <span className="font-bold text-amber-400 uppercase text-xs flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4" /> Commentaire global de l'élève :
            </span>
            <p className="text-amber-100/90 text-xs italic">"{log.student_comment}"</p>
          </div>
        )}

        {/* 🌟 BOUTON DE VALIDATION DÉPLACÉ EN BAS DE LA SÉANCE */}
        <div className="pt-4">
          <button
            onClick={handleToggleReview}
            disabled={updating}
            className={`w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-xl cursor-pointer ${
              log?.coach_reviewed 
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30" 
                : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 border border-emerald-400 shadow-emerald-500/20"
            }`}
          >
            {updating ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
            <span>{log?.coach_reviewed ? "Séance déjà validée (Marquer comme non lue)" : "Valider la lecture de la séance"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
