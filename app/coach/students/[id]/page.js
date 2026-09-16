"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabase";
import { 
  ArrowLeft, Loader2, Dumbbell, Plus, Trash2, Pencil, 
  CheckCircle2, Clock, AlertCircle, ChevronRight 
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function CoachStudentDetailPage() {
  const params = useParams();
  const studentId = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : null;

  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (studentId) {
      fetchStudentDetails();
    }
  }, [studentId]);

  const fetchStudentDetails = async () => {
    try {
      setLoading(true);

      // 1. Profil élève
      const { data: studentData, error: studentErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", studentId)
        .single();

      if (studentErr) throw studentErr;
      setStudent(studentData);

      // 2. Programmes attribués avec aperçu des exercices
      const { data: progData, error: progErr } = await supabase
        .from("programs")
        .select("*, exercises(id, name, sets, reps)")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });

      if (progErr) throw progErr;
      setPrograms(progData || []);

      // 3. Logs de l'élève pour connaître les réalisations et l'état de révision
      const { data: logsData, error: logsErr } = await supabase
        .from("workout_logs")
        .select("id, program_id, created_at, coach_reviewed")
        .eq("user_id", studentId)
        .order("created_at", { ascending: false });

      if (logsErr) throw logsErr;
      setLogs(logsData || []);

    } catch (err) {
      console.error("Erreur chargement dossier élève :", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProgram = async (e, programId) => {
    e.preventDefault();
    e.stopPropagation(); // Évite de déclencher la redirection de la carte

    if (!confirm("Es-tu sûr de vouloir supprimer cette séance ?")) return;

    try {
      const { error } = await supabase
        .from("programs")
        .delete()
        .eq("id", programId);

      if (error) throw error;
      setPrograms((prev) => prev.filter((p) => p.id !== programId));
    } catch (err) {
      console.error("Erreur suppression séance :", err);
      alert("Impossible de supprimer cette séance.");
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-6 max-w-4xl mx-auto pb-24">
      {/* Bouton Retour */}
      <Link
        href="/coach"
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-amber-400 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Retour à la liste des élèves</span>
      </Link>

      {/* En-tête Profil Élève */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 font-black text-xl">
            {student?.full_name ? student.full_name.charAt(0).toUpperCase() : "E"}
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">
              {student?.full_name || "Élève sans nom"}
            </h1>
            <p className="text-xs text-slate-400">{student?.email || "Pas d'email"}</p>
            <div className="flex gap-3 text-[11px] text-slate-500 mt-1">
              <span>Poids: <strong className="text-slate-300">{student?.weight ? `${student.weight} kg` : "N/C"}</strong></span>
              <span>•</span>
              <span>Taille: <strong className="text-slate-300">{student?.height ? `${student.height} cm` : "N/C"}</strong></span>
            </div>
          </div>
        </div>

        <Link
          href={`/coach/new-program?student=${studentId}`}
          className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Créer une séance</span>
        </Link>
      </div>

      {/* Section des Séances */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Dumbbell className="w-4 h-4 text-amber-400" />
          <span>Séances attribuées ({programs.length})</span>
        </h2>

        {programs.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-xs">
            Aucune séance assignée à cet élève pour le moment.
          </div>
        ) : (
          <div className="space-y-4">
            {programs.map((prog) => {
              // Récupérer les logs liés à ce programme
              const programLogs = logs.filter((l) => l.program_id === prog.id);
              const isDone = programLogs.length > 0;
              
              // Détecter s'il existe au moins un log non révisé par le coach
              const hasUnreviewedLog = programLogs.some((l) => !l.coach_reviewed);

              const exercisesList = prog.exercises || [];
              const targetUrl = isDone 
                ? `/coach/history/program/${prog.id}` 
                : `/coach/programs/${prog.id}/edit`;

              return (
                <Link
                  key={prog.id}
                  href={targetUrl}
                  className="block bg-slate-900 border border-slate-800 hover:border-amber-400/50 rounded-2xl p-5 shadow-md transition-all group cursor-pointer space-y-3"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                          {prog.title}
                        </h3>

                        {/* Badges d'état */}
                        {isDone ? (
                          hasUnreviewedLog ? (
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-400/10 text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-400/20 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> À réviser
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Réalisée & revue
                            </span>
                          )
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 px-2.5 py-0.5 rounded-full border border-slate-700 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Non réalisée
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {exercisesList.length} exercice{exercisesList.length > 1 ? "s" : ""}
                      </p>
                    </div>

                    {/* Actions contextuelles */}
                    <div className="flex items-center gap-2">
                      {!isDone && (
                        <button
                          onClick={(e) => handleDeleteProgram(e, prog.id)}
                          className="p-2 text-slate-500 hover:text-rose-400 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl transition-colors"
                          title="Supprimer la séance"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>

                  {/* Résumé des exercices */}
                  {exercisesList.length > 0 && (
                    <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block mb-1">
                        Aperçu des exercices :
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {exercisesList.map((exo) => (
                          <span
                            key={exo.id}
                            className="text-[11px] bg-slate-900 border border-slate-800 text-slate-300 px-2.5 py-1 rounded-lg"
                          >
                            <strong className="text-white">{exo.name}</strong> 
                            {exo.sets && exo.reps && (
                              <span className="text-slate-500 ml-1">({exo.sets}x{exo.reps})</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
