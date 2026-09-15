"use client";
import React, { useState, useEffect, Suspense } from "react";
import { supabase } from "../../../lib/supabase";
import { ArrowLeft, Loader2, Plus, Trash2, Dumbbell, Save, UserCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function NewProgramForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentIdFromUrl = searchParams.get("student");

  const [loading, setLoading] = useState(false);
  const [student, setStudent] = useState(null);
  const [title, setTitle] = useState("");

  const [exercises, setExercises] = useState([
    { name: "", sets: 3, reps: "10-12" }
  ]);

  useEffect(() => {
    if (studentIdFromUrl) {
      fetchStudentProfile();
    }
  }, [studentIdFromUrl]);

  const fetchStudentProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("id", studentIdFromUrl)
        .single();

      if (error) throw error;
      setStudent(data);
    } catch (err) {
      console.error("Erreur lors de la récupération de l'élève :", err);
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

    if (!title.trim()) {
      alert("Veuillez donner un titre au programme.");
      return;
    }

    if (!studentIdFromUrl) {
      alert("Erreur : aucun élève n'est associé à la création de cette séance.");
      return;
    }

    try {
      setLoading(true);

      // 1. Insertion du programme forcé sur l'ID de l'élève de l'URL
      const { data: programData, error: programErr } = await supabase
        .from("programs")
        .insert([
          {
            title: title.trim(),
            student_id: studentIdFromUrl,
          }
        ])
        .select()
        .single();

      if (programErr) throw programErr;

      // 2. Insertion des exercices associés
      const validExercises = exercises.filter(ex => ex.name.trim() !== "");
      if (validExercises.length > 0) {
        const exercisesToInsert = validExercises.map((ex, idx) => ({
          program_id: programData.id,
          name: ex.name.trim(),
          sets: parseInt(ex.sets, 10) || 1,
          reps: ex.reps || "",
          order_index: idx
        }));

        const { error: exErr } = await supabase
          .from("exercises")
          .insert(exercisesToInsert);

        if (exErr) throw exErr;
      }

      router.refresh();
      router.push(`/coach/students/${studentIdFromUrl}`);
    } catch (err) {
      console.error("Erreur Supabase :", err);
      alert(`Erreur : ${err.message || "Création impossible"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-6 max-w-2xl mx-auto pb-24">
      <Link 
        href={`/coach/students/${studentIdFromUrl}`} 
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-amber-400 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Retour au dossier élève</span>
      </Link>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mb-6 space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/25">
          Nouveau Programme
        </span>
        <h1 className="text-2xl font-black text-white mt-1">Créer une séance</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rappel fixe de l'élève (aucun choix possible) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">
                  Élève destinataire
                </span>
                <span className="text-sm font-bold text-white">
                  {student?.full_name || student?.email || "Chargement..."}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase bg-amber-400/10 text-amber-400 px-2.5 py-1 rounded-full border border-amber-400/20">
              Assignation directe
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-2">
              Titre du programme / Séance
            </label>
            <input
              type="text"
              placeholder="Ex: Leg Day Intense, Upper Body A..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* Liste des exercices */}
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
              <div key={index} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 relative">
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
                      onChange={(e) => handleExerciseChange(index, "name", e.target.value)}
                      required
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Séries (ex: 4)"
                      min="1"
                      value={ex.sets}
                      onChange={(e) => handleExerciseChange(index, "sets", e.target.value)}
                      required
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Répétitions (ex: 10-12)"
                      value={ex.reps}
                      onChange={(e) => handleExerciseChange(index, "reps", e.target.value)}
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
          disabled={loading}
          className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>Enregistrer et assigner le programme</span>
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
