"use client";
import React, { useState, useEffect, Suspense } from "react";
import { supabase } from "../../../../../lib/supabase";
import { ArrowLeft, Loader2, Plus, Trash2, Dumbbell, Save, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

function EditProgramForm() {
  const { id: programId } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [title, setTitle] = useState("");
  const [studentId, setStudentId] = useState(null);
  const [exercises, setExercises] = useState([]);

  useEffect(() => {
    if (programId) {
      fetchProgramData();
    }
  }, [programId]);

  const fetchProgramData = async () => {
    try {
      setLoading(true);

      // 1. Vérifier si une séance enregistrée (workout_log) existe déjà pour ce programme
      const { data: logs, error: logErr } = await supabase
        .from("workout_logs")
        .select("id")
        .eq("program_id", programId);

      if (logErr) throw logErr;

      if (logs && logs.length > 0) {
        setIsLocked(true);
      }

      // 2. Récupérer le programme et ses exercices
      const { data: program, error: programErr } = await supabase
        .from("programs")
        .select("*, exercises(*)")
        .eq("id", programId)
        .single();

      if (programErr) throw programErr;

      setTitle(program.title);
      setStudentId(program.student_id);

      // Tri des exercices par order_index ou id
      const sortedExercises = (program.exercises || []).sort(
        (a, b) => (a.order_index ?? a.id) - (b.order_index ?? b.id)
      );

      setExercises(
        sortedExercises.length > 0
          ? sortedExercises.map((ex) => ({
              id: ex.id,
              name: ex.name,
              sets: ex.sets,
              reps: ex.reps,
            }))
          : [{ name: "", sets: 3, reps: "10-12" }]
      );
    } catch (err) {
      console.error("Erreur de chargement du programme :", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExercise = () => {
    setExercises([...exercises, { name: "", sets: 3, reps: "10-12" }]);
  };

  const handleRemoveExercise = (index) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleExerciseChange = (index, field, value) => {
    const updated = [...exercises];
    updated[index][field] = value;
    setExercises(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isLocked) {
      alert("Cette séance a déjà été réalisée par l'élève et ne peut plus être modifiée.");
      return;
    }

    if (!title.trim()) {
      alert("Veuillez donner un titre au programme.");
      return;
    }

    try {
      setSaving(true);

      // 1. Mise à jour du titre du programme
      const { error: updateErr } = await supabase
        .from("programs")
        .update({ title: title.trim() })
        .eq("id", programId);

      if (updateErr) throw updateErr;

      // 2. Re-synchronisation des exercices : suppression puis ré-insertion
      const { error: deleteErr } = await supabase
        .from("exercises")
        .delete()
        .eq("program_id", programId);

      if (deleteErr) throw deleteErr;

      const validExercises = exercises.filter((ex) => ex.name.trim() !== "");
      if (validExercises.length > 0) {
        const exercisesToInsert = validExercises.map((ex, idx) => ({
          program_id: programId,
          name: ex.name.trim(),
          sets: parseInt(ex.sets, 10) || 1,
          reps: ex.reps || "",
          order_index: idx,
        }));

        const { error: insertErr } = await supabase
          .from("exercises")
          .insert(exercisesToInsert);

        if (insertErr) throw insertErr;
      }

      router.refresh();
      router.push(`/coach/students/${studentId}`);
    } catch (err) {
      console.error("Erreur lors de la modification :", err);
      alert(`Erreur : ${err.message || "Modification impossible"}`);
    } finally {
      setSaving(false);
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
      <Link
        href={studentId ? `/coach/students/${studentId}` : "/coach"}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-amber-400 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Retour au dossier élève</span>
      </Link>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mb-6 space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/25">
          Édition
        </span>
        <h1 className="text-2xl font-black text-white mt-1">Modifier la séance</h1>
      </div>

      {isLocked ? (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
          <h2 className="text-base font-bold text-white">Séance déjà effectuée</h2>
          <p className="text-xs text-slate-400">
            L'élève a déjà réalisé cet entraînement et soumis son bilan. La modification est verrouillée.
          </p>
          <Link
            href={studentId ? `/coach/students/${studentId}` : "/coach"}
            className="inline-block bg-slate-900 border border-slate-800 text-xs font-bold px-4 py-2 rounded-xl text-slate-300 hover:text-white"
          >
            Retourner au dossier
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-2">
                Titre du programme / Séance
              </label>
              <input
                type="text"
                placeholder="Ex: Leg Day Intense..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xs font-bold uppercase text-slate-400 flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-amber-400" />
                <span>Exercices du programme</span>
              </h2>

              <button
                type="button"
                onClick={handleAddExercise}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter un exercice</span>
              </button>
            </div>

            <div className="space-y-3">
              {exercises.map((ex, index) => (
                <div
                  key={index}
                  className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 relative"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold uppercase text-slate-500">
                      Exercice #{index + 1}
                    </span>
                    {exercises.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveExercise(index)}
                        className="text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-1">
                      <input
                        type="text"
                        placeholder="Nom de l'exercice"
                        value={ex.name}
                        onChange={(e) =>
                          handleExerciseChange(index, "name", e.target.value)
                        }
                        required
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        placeholder="Séries"
                        min="1"
                        value={ex.sets}
                        onChange={(e) =>
                          handleExerciseChange(index, "sets", e.target.value)
                        }
                        required
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Répétitions"
                        value={ex.reps}
                        onChange={(e) =>
                          handleExerciseChange(index, "reps", e.target.value)
                        }
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Enregistrer les modifications</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}

export default function EditProgramPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
        </div>
      }
    >
      <EditProgramForm />
    </Suspense>
  );
}
