"use client";
import React, { useState } from "react";
import { supabase } from "../../../lib/supabase";
import { Plus, Trash2, ArrowLeft, Save, Dumbbell } from "lucide-react";
import Link from "next/link";

export default function NewProgram() {
  const [title, setTitle] = useState("");
  const [coachNote, setCoachNote] = useState("");
  const [exercises, setExercises] = useState([
    { name: "", sets: 4, reps: "10-12", target_weight: "12 kg" }
  ]);
  const [loading, setLoading] = useState(false);

  const addExercise = () => {
    setExercises([
      ...exercises,
      { name: "", sets: 4, reps: "10-12", target_weight: "10 kg" }
    ]);
  };

  const removeExercise = (index) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const updateExercise = (index, field, value) => {
    const updated = [...exercises];
    updated[index][field] = value;
    setExercises(updated);
  };

  const handleSaveProgram = async (e) => {
    e.preventDefault();
    if (!title.trim()) return alert("Merci d'indiquer un titre pour ce programme.");

    setLoading(true);
    try {
      const { data: program, error: progError } = await supabase
        .from("programs")
        .insert([
          {
            title: title,
            coach_note: coachNote,
            is_custom: false
          }
        ])
        .select()
        .single();

      if (progError) throw progError;

      const formattedExercises = exercises.map((ex, idx) => ({
        program_id: program.id,
        name: ex.name || `Exercice ${idx + 1}`,
        sets: parseInt(ex.sets) || 1,
        reps: ex.reps,
        target_weight: ex.target_weight,
        order_index: idx
      }));

      const { error: exError } = await supabase
        .from("exercises")
        .insert(formattedExercises);

      if (exError) throw exError;

      alert("Programme publié avec succès !");
      window.location.href = "/coach";
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la publication du programme.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 max-w-2xl mx-auto pb-16">
      <header className="flex items-center justify-between py-4 mb-8 border-b border-slate-800">
        <Link href="/coach" className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-all">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-black text-white">Créer un Programme VIP</h1>
        <div className="w-9" />
      </header>

      <form onSubmit={handleSaveProgram} className="space-y-6">
        <div>
          <label className="block text-xs font-bold uppercase text-slate-400 mb-2">
            Titre de la séance
          </label>
          <input
            type="text"
            placeholder="Ex: Séance 1 - Pectoraux & Triceps"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 text-sm font-medium"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-400 mb-2">
            Consignes & Notes du Coach
          </label>
          <textarea
            placeholder="Ex: Temps de repos : 90 secondes entre chaque série."
            value={coachNote}
            onChange={(e) => setCoachNote(e.target.value)}
            rows={3}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 text-sm font-medium resize-none"
          />
        </div>

        <div className="space-y-4 pt-2">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-amber-400" />
              <span>Exercices du programme</span>
            </h2>
            <button
              type="button"
              onClick={addExercise}
              className="text-xs font-bold text-amber-400 flex items-center gap-1.5 bg-amber-400/10 px-3.5 py-2 rounded-xl border border-amber-400/20 hover:bg-amber-400/20 transition-all"
            >
              <Plus className="w-4 h-4" /> Ajouter un exercice
            </button>
          </div>

          {exercises.map((ex, index) => (
            <div key={index} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-black text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-lg">
                  #{index + 1}
                </span>
                <input
                  type="text"
                  placeholder="Nom de l'exercice"
                  value={ex.name}
                  onChange={(e) => updateExercise(index, "name", e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white font-bold w-full focus:outline-none focus:border-amber-400"
                  required
                />
                {exercises.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeExercise(index)}
                    className="p-2.5 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block mb-1 font-medium">Séries</span>
                  <input
                    type="number"
                    min="1"
                    value={ex.sets}
                    onChange={(e) => updateExercise(index, "sets", e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-center text-white font-bold"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-1 font-medium">Répétitions</span>
                  <input
                    type="text"
                    value={ex.reps}
                    onChange={(e) => updateExercise(index, "reps", e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-center text-white font-bold"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-1 font-medium">Charge</span>
                  <input
                    type="text"
                    value={ex.target_weight}
                    onChange={(e) => updateExercise(index, "target_weight", e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-center text-amber-400 font-bold"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-black rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-amber-400/10 mt-8"
        >
          <Save className="w-5 h-5" />
          <span>{loading ? "PUBLICATION..." : "PUBLIER LE PROGRAMME"}</span>
        </button>
      </form>
    </div>
  );
}
