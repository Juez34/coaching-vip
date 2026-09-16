"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabase";
import { 
  ArrowLeft, Loader2, User, Dumbbell, Calendar, 
  Plus, Trash2, Pencil, CheckCircle2, Clock, History, AlertCircle 
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export default function CoachStudentDetailPage() {
  const params = useParams();
  const router = useRouter();
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

      // 1. Profil de l'élève
      const { data: studentData, error: studentErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", studentId)
        .single();

      if (studentErr) throw studentErr;
      setStudent(studentData);

      // 2. Programmes attribués avec le résumé succinct de leurs exercices
      const { data: progData, error: progErr } = await supabase
        .from("programs")
        .select("*, exercises(id, name, sets, reps)")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });

      if (progErr) throw progErr;
      setPrograms(progData || []);

      // 3. Récupération des séances effectuées par cet élève
      const { data: logsData, error: logsErr } = await supabase
        .from("workout_logs")
        .select("id, program_id, created_at, coach_reviewed")
        .eq("user_id", studentId)
        .order("created_at", { ascending: false });

      if (logsErr) throw logsErr;
      setLogs(logsData || []);

    } catch (err) {
      console.error("Erreur de chargement du dossier élève :", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProgram = async (programId) => {
    if (!confirm("Es-tu sûr de vouloir supprimer cette séance ?")) return;

    try {
      const { error } = await supabase
        .from("programs")
        .delete()
        .eq("id", programId);

      if (error) throw error;
      setPrograms((prev) => prev.filter((p) => p.id !== programId));
    } catch (err) {
      console.error("Erreur lors de la suppression :", err);
      alert("Impossible de supprimer cette séance.");
    }
  };

  const completedProgramIds = new Set(logs.map((l) => l.program_id));

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

      {/* Section : Programmes attribués avec aperçu succinct */}
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
              const isDone = completedProgramIds.has(prog.id);
              const exercisesList = prog.exercises || [];

              return (
                <div
                  key={prog.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-3"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white">
                          {prog.title}
                        </h3>
                        {isDone ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Réalisée
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-400/10 text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-400/20 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> À faire
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {exercisesList.length} exercice{exercisesList.length > 1 ? "s" : ""}
                      </p>
                    </div>

                    {/* Actions coach */}
                    <div className="flex items-center gap-2">
                      {isDone ? (
                        <Link
                          href={`/coach/history/program/${prog.id}`}
                          className="bg-slate-950 hover:bg-slate-800 text-amber-400 font-bold px-3 py-1.5 rounded-xl text-xs border border-slate-800 flex items-center gap-1.5 transition-colors"
                        >
                          <History className="w-3.5 h-3.5" />
                          <span>Historique</span>
                        </Link>
                      ) : (
                        <>
                          <Link
                            href={`/coach/programs/${prog.id}/edit`}
                            className="p-2 text-slate-400 hover:text-amber-400 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl transition-colors"
                            title="Modifier la séance"
                          >
                            <Pencil className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDeleteProgram(prog.id)}
                            className="p-2 text-slate-400 hover:text-rose-400 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl transition-colors cursor-pointer"
                            title="Supprimer la séance"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Résumé succinct des exercices dans la carte */}
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
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
