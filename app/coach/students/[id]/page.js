"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabase";
import { ArrowLeft, Loader2, Plus, Trash2, Dumbbell, Calendar, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export default function StudentDetailPage() {
  const { id: studentId } = useParams();
  const router = useRouter();

  const [student, setStudent] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (studentId) {
      fetchStudentData();
    }
  }, [studentId]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);

      // 1. Charger le profil de l'élève
      const { data: studentData, error: studentErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", studentId)
        .single();

      if (studentErr) throw studentErr;
      setStudent(studentData);

      // 2. Charger les programmes attribués à cet élève
      const { data: programsData, error: programsErr } = await supabase
        .from("programs")
        .select("*, exercises(*)")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });

      if (programsErr) throw programsErr;
      setPrograms(programsData || []);
    } catch (err) {
      console.error("Erreur de chargement du dossier élève :", err);
    } finally {
      setLoading(false);
    }
  };

  // 🗑️ FONCTION DE SUPPRESSION DE SÉANCE
  const handleDeleteProgram = async (programId, programTitle) => {
    const confirmDelete = window.confirm(
      `Es-tu sûr de vouloir supprimer la séance "${programTitle}" ? Cette action est irréversible.`
    );

    if (!confirmDelete) return;

    try {
      setDeletingId(programId);

      // Supprimer d'abord les exercices liés (si la clé étrangère SQL n'est pas en CASCADE)
      await supabase
        .from("exercises")
        .delete()
        .eq("program_id", programId);

      // Supprimer le programme
      const { error } = await supabase
        .from("programs")
        .delete()
        .eq("id", programId);

      if (error) throw error;

      // Mettre à jour la liste locale
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-6 max-w-4xl mx-auto pb-24">
      {/* Retour dashboard */}
      <Link
        href="/coach"
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-amber-400 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Retour au tableau de bord</span>
      </Link>

      {/* En-tête Élève */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
            Dossier Élève
          </span>
          <h1 className="text-2xl font-black text-white mt-2">
            {student?.full_name || "Élève sans nom"}
          </h1>
          <p className="text-xs text-slate-400">{student?.email}</p>
        </div>

        {/* Bouton de création directe attribué à cet élève */}
        <Link
          href={`/coach/new-program?student=${studentId}`}
          className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-4 py-3 rounded-xl flex items-center gap-2 text-xs shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Créer une séance</span>
        </Link>
      </div>

      {/* Liste des programmes de l'élève */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Dumbbell className="w-4 h-4 text-amber-400" />
          <span>Programmes assignés ({programs.length})</span>
        </h2>

        {programs.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-xs">
            Aucune séance attribuée pour l'instant. Clique sur "Créer une séance" pour lui en assigner une.
          </div>
        ) : (
          <div className="space-y-4">
            {programs.map((program) => (
              <div
                key={program.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-md"
              >
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="text-base font-bold text-white">{program.title}</h3>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3" />
                      Créé le {new Date(program.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>

                  {/* Bouton de suppression */}
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

                {/* Liste résumé des exercices */}
                {program.exercises && program.exercises.length > 0 && (
                  <div className="bg-slate-950 rounded-xl p-3 border border-slate-800/60 space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Exercices inclus ({program.exercises.length})
                    </span>
                    <div className="flex flex-wrap gap-2">
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
    </div>
  );
}
