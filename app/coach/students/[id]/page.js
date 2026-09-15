"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabase";
import { 
  ArrowLeft, Loader2, Plus, Trash2, Dumbbell, Calendar, 
  Pencil, CheckCircle2, Clock, AlertCircle, ChevronRight, User
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function StudentDetailPage() {
  const { id: studentId } = useParams();

  const [student, setStudent] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (studentId) {
      fetchStudentFullData();
    }
  }, [studentId]);

  const calculateAge = (dateString) => {
    if (!dateString) return null;
    const today = new Date();
    const birth = new Date(dateString);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const fetchStudentFullData = async () => {
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

      // 2. Programmes attribués avec exercices
      const { data: programsData, error: programsErr } = await supabase
        .from("programs")
        .select("*, exercises(*)")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });

      if (programsErr) throw programsErr;
      setPrograms(programsData || []);

      // 3. Historique complet des séances enregistrées (workout_logs)
      const { data: logsData, error: logsErr } = await supabase
        .from("workout_logs")
        .select("*, programs(title)")
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

  // Suppression d'un programme
  const handleDeleteProgram = async (programId, programTitle) => {
    const confirmDelete = window.confirm(
      `Es-tu sûr de vouloir supprimer la séance "${programTitle}" ? Cette action est irréversible.`
    );

    if (!confirmDelete) return;

    try {
      setDeletingId(programId);

      await supabase
        .from("exercises")
        .delete()
        .eq("program_id", programId);

      const { error } = await supabase
        .from("programs")
        .delete()
        .eq("id", programId);

      if (error) throw error;

      setPrograms(programs.filter((p) => p.id !== programId));
    } catch (err) {
      console.error("Erreur lors de la suppression :", err);
      alert(`Erreur : ${err.message || "Suppression impossible"}`);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  const age = calculateAge(student?.birth_date);
  const reviewedLogsCount = logs.filter((l) => l.coach_reviewed).length;
  const pendingLogsCount = logs.length - reviewedLogsCount;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-6 max-w-5xl mx-auto pb-24">
      {/* Retour dashboard */}
      <Link
        href="/coach"
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-amber-400 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Retour au tableau de bord</span>
      </Link>

      {/* En-tête avec profil complet de l'élève */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
              Fiche Élève
            </span>
            {pendingLogsCount > 0 && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/20 px-2.5 py-1 rounded-full border border-amber-400/40 animate-pulse">
                {pendingLogsCount} séance(s) à réviser
              </span>
            )}
          </div>

          <h1 className="text-3xl font-black text-white">
            {student?.full_name || "Élève sans nom"}
          </h1>
          <p className="text-xs text-slate-400">{student?.email}</p>

          {/* Métriques physiques */}
          <div className="flex flex-wrap gap-2 text-xs text-slate-300 pt-2">
            {age !== null && (
              <span className="bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 font-medium">
                🎂 {age} ans
              </span>
            )}
            {student?.height && (
              <span className="bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 font-medium">
                📏 {student.height} cm
              </span>
            )}
            {student?.weight && (
              <span className="bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 font-medium">
                ⚖️ {student.weight} kg
              </span>
            )}
          </div>
        </div>

        {/* Bouton pour lui ajouter une séance */}
        <Link
          href={`/coach/new-program?student=${studentId}`}
          className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-5 py-3.5 rounded-2xl flex items-center gap-2 text-xs shadow-lg transition-all w-full md:w-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          <span>Créer une nouvelle séance</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* COLONNE 1 : Programmes assignés */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-amber-400" />
            <span>Programmes assignés ({programs.length})</span>
          </h2>

          {programs.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 text-xs">
              Aucune séance assignée.
            </div>
          ) : (
            <div className="space-y-4">
              {programs.map((program) => (
                <div
                  key={program.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-md"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <h3 className="text-base font-bold text-white">{program.title}</h3>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3" />
                        Créé le {new Date(program.created_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>

                    {/* Actions sur le programme */}
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/coach/programs/${program.id}/edit`}
                        className="p-2 bg-slate-950 hover:bg-amber-400/10 text-slate-500 hover:text-amber-400 border border-slate-800 hover:border-amber-400/30 rounded-xl transition-all"
                        title="Modifier la séance"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>

                      <button
                        onClick={() => handleDeleteProgram(program.id, program.title)}
                        disabled={deletingId === program.id}
                        className="p-2 bg-slate-950 hover:bg-red-500/10 text-slate-500 hover:text-red-400 border border-slate-800 hover:border-red-500/30 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                        title="Supprimer la séance"
                      >
                        {deletingId === program.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Exercices */}
                  {program.exercises && program.exercises.length > 0 && (
                    <div className="bg-slate-950 rounded-xl p-3 border border-slate-800/60 space-y-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Exercices ({program.exercises.length})
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {program.exercises.map((ex) => (
                          <span
                            key={ex.id}
                            className="text-xs bg-slate-900 border border-slate-800 text-slate-300 px-2.5 py-1 rounded-lg"
                          >
                            {ex.name} — <strong className="text-amber-400">{ex.sets}x{ex.reps}</strong>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* COLONNE 2 : Historique des sessions réalisées par l'élève */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Historique des entraînements ({logs.length})</span>
          </h2>

          {logs.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 text-xs">
              L'élève n'a pas encore validé de séance.
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => {
                const isReviewed = log.coach_reviewed;

                return (
                  <Link
                    key={log.id}
                    href={`/coach/history/${log.id}`}
                    className={`block bg-slate-900 border rounded-2xl p-4 transition-all hover:border-amber-400/50 shadow-md ${
                      isReviewed
                        ? "border-slate-800 opacity-80"
                        : "border-amber-400/40 bg-gradient-to-r from-slate-900 to-amber-950/10"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-white text-sm">
                          {log.programs?.title || "Séance libre"}
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          {new Date(log.created_at).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "long",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      {isReviewed ? (
                        <span className="text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Examen terminé
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase bg-amber-400/15 text-amber-400 px-2.5 py-1 rounded-full border border-amber-400/30 flex items-center gap-1 animate-pulse">
                          <AlertCircle className="w-3 h-3" /> À réviser
                        </span>
                      )}
                    </div>

                    <div className="flex justify-end items-center text-xs text-amber-400 font-bold pt-2 border-t border-slate-800/80">
                      <span className="flex items-center gap-1">
                        Consulter le bilan
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
