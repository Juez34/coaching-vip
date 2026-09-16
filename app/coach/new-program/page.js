"use client";
import React, { useState, useEffect, Suspense } from "react";
import { supabase } from "../../../lib/supabase";
import { 
  ArrowLeft, Loader2, Plus, Trash2, Dumbbell, Save, MessageSquare 
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function NewProgramForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStudentId = searchParams.get("student");

  const [loading, setLoading] = useState(false);
  const [fetchingStudents, setFetchingStudents] = useState(true);
  const [students, setStudents] = useState([]);

  const [title, setTitle] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState(initialStudentId || "");
  const [exercises, setExercises] = useState([
    { name: "", sets: "3", reps: "10", target_weight: "", coach_comment: "" }
  ]);

  useEffect(() => {
    fetchCoachStudents();
  }, []);

  const fetchCoachStudents = async () => {
    try {
      setFetchingStudents(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: assignments, error: assignErr } = await supabase
        .from("student_coaches")
        .select("student_id")
        .eq("coach_id", user.id);

      if (assignErr) throw assignErr;

      const studentIds = (assignments || []).map((a) => a.student_id);

      if (studentIds.length > 0) {
        const { data: studentProfiles } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", studentIds)
          .order("full_name", { ascending: true });

        setStudents(studentProfiles || []);
        if (!initialStudentId && studentProfiles && studentProfiles.length > 0) {
          setSelectedStudentId(studentProfiles[0].id);
        }
      }
    } catch (err) {
      console.error("Erreur chargement élèves :", err);
    } finally {
      setFetchingStudents(false);
    }
  };

  const handleAddExercise = () => {
    setExercises([
      ...exercises,
      { name: "", sets: "3", reps: "10", target_weight: "", coach_comment: "" }
    ]);
  };

  const handleRemoveExercise = (index) => {
    if (exercises.length === 1) return;
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleExerciseChange = (index, field, value) => {
    const updated = [...exercises];
    updated[index][field] = value;
    setExercises(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("Veuillez saisir un titre pour la séance.");
      return;
    }
    if (!selectedStudentId) {
      alert("Veuillez sélectionner un élève.");
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      // 1. Création du programme
      const { data: program, error: progErr } = await supabase
        .from("programs")
        .select("id")
        .insert({
          title: title.trim(),
          student_id: selectedStudentId,
          coach_id: user.id
        })
        .select()
        .single();

      if (progErr) throw progErr;

      // 2. Création des exercices avec consignes/commentaires
      const exercisesToInsert = exercises.map((exo, index) => ({
        program_id: program.id,
        name: exo.name.trim() || `Exercice #${index + 1}`,
        sets: exo.sets ? parseInt(exo.sets) : 3,
        reps: exo.reps || "10",
        target_weight: exo.target_weight ? parseFloat(exo.target_weight) : null,
        coach_comment: exo.coach_comment ? exo.coach_comment.trim() : null,
        order_index: index
      }));

      const { error: exoErr } = await supabase
        .from("exercises")
        .insert(exercisesToInsert);

      if (exoErr) throw exoErr;

      router.push(`/coach/students/${selectedStudentId}`);
    } catch (err) {
      console.error("Erreur lors de la création de la séance :", err);
      alert("Erreur lors de la création de la séance.");
    } finally {
      setLoading(false);
    }
  };

  if (fetchingStudents) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-6 max-w-3xl mx-auto pb-24">
      <Link
        href={selectedStudentId ? `/coach/students/${selectedStudentId}` : "/coach"}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-amber-400 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Retour au dossier élève</span>
      </Link>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mb-8">
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
          Nouveau Programme
        </span>
        <h1 className="text-2xl font-black text-white mt-2">Créer une séance</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Titre et Élève */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
              Attribuer à l'élève
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name || s.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
              Titre de la séance
            </label>
            <input
              type="text"
              placeholder="Ex: Séance Pecs / Triceps - Prise de masse"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
              required
            />
          </div>
        </div>

        {/* Exercices */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-amber-400" />
              <span>Exercices ({exercises.length})</span>
            </h2>
            <button
              type="button"
              onClick={handleAddExercise}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 px-3 py-1.5 rounded-xl border border-amber-400/20 flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter un exercice</span>
            </button>
          </div>

          {exercises.map((exo, index) => (
            <div
              key={index}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3 relative"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                <span className="text-xs font-bold text-amber-400">
                  Exercice #{index + 1}
                </span>
                {exercises.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveExercise(index)}
                    className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Nom de l'exercice
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Développé couché"
                    value={exo.name}
                    onChange={(e) => handleExerciseChange(index, "name", e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Séries
                  </label>
                  <input
                    type="number"
                    placeholder="3"
                    value={exo.sets}
                    onChange={(e) => handleExerciseChange(index, "sets", e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Répétitions / Durée
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 10-12 ou 45s"
                    value={exo.reps}
                    onChange={(e) => handleExerciseChange(index, "reps", e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Poids cible (kg) - Optionnel
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="Ex: 60"
                    value={exo.target_weight}
                    onChange={(e) => handleExerciseChange(index, "target_weight", e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Nouveau champ : Consignes & Commentaires coach */}
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3 text-amber-400" />
                    <span>Consignes & Remarques du coach</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ex: Tempo 3-0-1, bien contrôler la descente et garder les coudes rentrés."
                    value={exo.coach_comment}
                    onChange={(e) => handleExerciseChange(index, "coach_comment", e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400 resize-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold p-3.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Enregistrer la séance</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default function NewProgramPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    }>
      <NewProgramForm />
    </Suspense>
  );
}
