"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabase";
import { ArrowLeft, Loader2, CheckCircle2, Clock, History, Plus, Dumbbell } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function CoachStudentDetailPage() {
  const params = useParams();
  const studentId = params?.id;

  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (studentId) {
      fetchStudentDetails();
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

  const fetchStudentDetails = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Profil de l'élève
      const { data: studentData, error: studentErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", studentId)
        .single();

      if (studentErr) throw studentErr;
      setStudent(studentData);

      // 2. Programmes assignés à cet élève par ce coach
      const { data: progData } = await supabase
        .from("programs")
        .select("*, exercises(*)")
        .or(`student_id.eq.${studentId},user_id.eq.${studentId}`)
        .eq("coach_id", user.id);

      setPrograms(progData || []);

      // 3. Historique des séances réalisées
      const progIds = (progData || []).map((p) => p.id);
      if (progIds.length > 0) {
        const { data: logsData } = await supabase
          .from("workout_logs")
          .select("*, programs(title)")
          .in("program_id", progIds)
          .order("created_at", { ascending: false });

        setHistory(logsData || []);
      }
    } catch (err) {
      console.error("Erreur de chargement:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAssignedProgram = async (programId) => {
    const confirmDelete = confirm("Voulez-vous supprimer ce programme pour cet élève ?");
    if (!confirmDelete) return;

    try {
      await supabase.from("exercises").delete().eq("program_id", programId);
      const { error } = await supabase.from("programs").delete().eq("id", programId);
      if (error) throw error;

      setPrograms(programs.filter(p => p.id !== programId));
      alert("Programme supprimé avec succès.");
    } catch (err) {
      alert("Erreur lors de la suppression : " + err.message);
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-6 max-w-4xl mx-auto pb-24">
      <Link href="/coach" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-amber-400 mb-6">
        <ArrowLeft className="w-4 h-4" />
        <span>Retour au tableau de bord</span>
      </Link>

      {/* En-tête de l'élève */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
            Fiche Élève
          </span>
          <h1 className="text-2xl font-black text-white mt-2">{student?.full_name || "Élève"}</h1>
          <p className="text-xs text-slate-400">{student?.email} • {student?.phone || "Pas de téléphone"}</p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          {age !== null && <span className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">🎂 {age} ans</span>}
          {student?.height && <span className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">📏 {student.height} cm</span>}
          {student?.weight && <span className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">⚖️ {student.weight} kg</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SÉANCES ATTRIBUÉES AVEC STATUT */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Programmes assignés ({programs.length})</span>
            </h3>
            <Link href="/coach/new-program" className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Assigner
            </Link>
          </div>

          {programs.length === 0 ? (
            <p className="text-xs text-slate-500 italic bg-slate-950 p-3 rounded-xl border border-slate-800">
              Aucun programme assigné pour le moment.
            </p>
          ) : (
            <div className="space-y-2">
              {programs.map((prog) => {
                const isCompleted = history.some(log => log.program_id === prog.id);
                return (
                  <div key={prog.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-white block">{prog.title}</span>
                      <span className="text-[10px] text-slate-400">{prog.exercises?.length || 0} exercice(s)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isCompleted ? (
                        <span className="text-[10px] bg-emerald-400/10 text-emerald-400 px-2 py-1 rounded-md border border-emerald-400/20 font-bold">
                          Réalisée ✅
                        </span>
                      ) : (
                        <span className="text-[10px] bg-amber-400/10 text-amber-400 px-2 py-1 rounded-md border border-amber-400/20 font-bold">
                          En attente ⏳
                        </span>
                      )}
                      <button
                        onClick={() => handleDeleteAssignedProgram(prog.id)}
                        className="text-slate-500 hover:text-rose-400 p-1.5 transition-colors"
                        title="Supprimer ce programme"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* HISTORIQUE ET EXÉCUTIONS AVEC COMMENTAIRES D'EXERCICES */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <History className="w-4 h-4 text-emerald-400" />
            <span>Historique des entraînements ({history.length})</span>
          </h3>

          {history.length === 0 ? (
            <p className="text-xs text-slate-500 italic bg-slate-950 p-3 rounded-xl border border-slate-800">
              Aucune séance terminée par cet élève.
            </p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {history.map((log) => (
                <div key={log.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      {log.programs?.title || "Séance"}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      ⏱️ {Math.floor((log.duration_seconds || 0) / 60)} min
                    </span>
                  </div>

                  {log.student_comment && (
                    <p className="text-[11px] text-amber-300 bg-amber-400/10 p-2 rounded-lg border border-amber-400/20 italic">
                      💬 Commentaire global : "{log.student_comment}"
                    </p>
                  )}

                  {/* Commentaires par exercice de l'élève */}
                  {log.exercise_comments && Object.keys(log.exercise_comments).length > 0 && (
                    <div className="text-[10px] text-slate-300 space-y-0.5 pt-1 border-t border-slate-900">
                      <span className="font-bold text-slate-400 uppercase">Commentaires par exercice :</span>
                      {Object.entries(log.exercise_comments).map(([exId, comment], i) => (
                        <p key={i} className="text-slate-400 italic">
                          • {comment}
                        </p>
                      ))}
                    </div>
                  )}

                  {log.actual_performances && (
                    <div className="text-[10px] text-slate-400 space-y-1 pt-1 border-t border-slate-900">
                      <span className="font-bold text-slate-300 uppercase">Performances réelles :</span>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(log.actual_performances).map(([k, p], i) => (
                          <span key={i} className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            {p.reps} reps @ {p.weight}
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
      </div>
    </div>
  );
}
