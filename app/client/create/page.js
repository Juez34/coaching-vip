"use client";
import React, { useState } from "react";
import { supabase } from "../../../lib/supabase";
import { Plus, ArrowLeft, Loader2, Dumbbell, Trash2 } from "lucide-react";
import Link from "next/link";

export default function ClientCreateWorkoutPage() {
  const [title, setTitle] = useState("");
  const [coachNote, setCoachNote] = useState("");
  const [exercises, setExercises] = useState([
    { name: "", sets: 4, reps: "10-12", target_weight: "20kg" }
  ]);
  const [loading, setLoading] = useState(false);

  // Ajouter dynamiquement un champ d'exercice
  const addExerciseField = () => {
    setExercises([
      ...exercises,
      { name: "", sets: 4, reps: "10-12", target_weight: "20kg" }
    ]);
  };

  // Supprimer un champ d'exercice de la liste
  const removeExerciseField = (index) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  // Sauvegarde de la séance personnelle de l'élève
  const handleCreatePersonalWorkout = async (e) => {
    e.preventDefault();
    if (!title.trim()) return alert("Le titre de la séance est obligatoire.");

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return (window.location.href = "/login");

      // 1. Enregistrer le programme avec user_id (séance perso)
      const { data: progData, error: progErr } = await supabase
        .from("programs")
        .insert([{
          title,
          coach_note: coachNote,
          user_id: user.id // Marque la séance comme appartenant à l'élève
        }])
        .select()
        .single();

      if (progErr) throw progErr;

      // 2. Insérer les exercices associés
      const exToInsert = exercises
        .filter((ex) => ex.name.trim() !== "")
        .map((ex, idx) => ({
          program_id: progData.id,
          name: ex.name,
          sets: parseInt(ex.sets) || 3,
          reps: ex.reps,
          target_weight: ex.target_weight,
          order_index: idx
        }));

      if (exToInsert.length > 0) {
        const { error: exErr } = await supabase.from("exercises").insert(exToInsert);
        if (exErr) throw exErr;
      }

      alert("Séance personnelle créée avec succès ! 💪");
      window.location.href = "/client";
    } catch (err) {
      alert("Erreur lors de la création : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-6 max-w-2xl mx-auto pb-24">
      {/* Bouton de retour */}
      <Link href="/client" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-amber-400 mb-6">
        <ArrowLeft className="w-4 h-4" />
        <span>Retour à mes séances</span>
      </Link>

      <div className="mb-6">
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
          Espace Élève
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-white mt-2">Créer ma séance libre</h1>
      </div>

      <form onSubmit={handleCreatePersonalWorkout} className="space-y-6">
        {/* Infos principales */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Titre de la séance *</label>
            <input
              type="text"
              placeholder="Ex: Leg Day personnel, Haut du corps..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-400"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Notes / Objectifs personnels</label>
            <textarea
              rows={2}
              placeholder="Ex: Essayer d'augmenter le poids sur les squats..."
              value={coachNote}
              onChange={(e) => setCoachNote(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white resize-none focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* Liste des exercices */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-amber-400" />
              <span>Exercices</span>
            </h2>
          </div>

          {exercises.map((ex, idx) => (
            <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg relative">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-amber-400 uppercase">Exercice {idx + 1}</span>
                {exercises.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeExerciseField(idx)}
                    className="text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <input
                type="text"
                placeholder="Nom de l'exercice (ex: Squat barre)"
                value={ex.name}
                onChange={(e) => {
                  const updated = [...exercises];
                  updated[idx].name = e.target.value;
                  setExercises(updated);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-400"
                required
              />

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[9px] uppercase text-slate-400 mb-1">Séries</label>
                  <input
                    type="number"
                    value={ex.sets}
                    onChange={(e) => {
                      const updated = [...exercises];
                      updated[idx].sets = e.target.value;
                      setExercises(updated);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 px-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase text-slate-400 mb-1">Répétitions</label>
                  <input
                    type="text"
                    value={ex.reps}
                    onChange={(e) => {
                      const updated = [...exercises];
                      updated[idx].reps = e.target.value;
                      setExercises(updated);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 px-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase text-slate-400 mb-1">Charge cible</label>
                  <input
                    type="text"
                    value={ex.target_weight}
                    onChange={(e) => {
                      const updated = [...exercises];
                      updated[idx].target_weight = e.target.value;
                      setExercises(updated);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 px-2 text-xs text-white"
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addExerciseField}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 border border-dashed border-slate-700 text-slate-300 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4 text-amber-400" /> Ajouter un autre exercice
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all"
        >
          <span>{loading ? "ENREGISTREMENT..." : "ENREGISTRER MA SÉANCE"}</span>
        </button>
      </form>
    </div>
  );
}
