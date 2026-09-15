"use client";
import React, { useState } from "react";
import { supabase } from "../../../lib/supabase";
import { Plus, ArrowLeft, Loader2, Dumbbell, Trash2 } from "lucide-react";
import Link from "next/link";

export default function NewProgramPage() {
  const [title, setTitle] = useState("");
  const [coachNote, setCoachNote] = useState("");
  const [studentId, setStudentId] = useState("");
  const [exercises, setExercises] = useState([
    { name: "", sets: 4, reps: "10-12", target_weight: "20kg", coach_comment: "" }
  ]);
  const [loading, setLoading] = useState(false);

  const addExerciseField = () => {
    setExercises([
      ...exercises,
      { name: "", sets: 4, reps: "10-12", target_weight: "20kg", coach_comment: "" }
    ]);
  };

  const removeExerciseField = (index) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleCreateProgram = async (e) => {
    e.preventDefault();
    if (!title.trim()) return alert("Le titre du programme est obligatoire.");

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Créer le programme
      const { data: progData, error: progErr } = await supabase
        .from("programs")
        .insert([{
          title,
          coach_note: coachNote,
          coach_id: user.id,
          student_id: studentId || null
        }])
        .select()
        .single();

      if (progErr) throw progErr;

      // 2. Insérer les exercices associés (avec leur coach_comment)
      const exToInsert = exercises
        .filter((ex) => ex.name.trim() !== "")
        .map((ex, idx) => ({
          program_id: progData.id,
          name: ex.name,
          sets: parseInt(ex.sets) || 3,
          reps: ex.reps,
          target_weight: ex.target_weight,
          coach_comment: ex.coach_comment || "",
          order_index: idx
        }));

      if (exToInsert.length > 0) {
        const { error: exErr } = await supabase.from("exercises").insert(exToInsert);
        if (exErr) throw exErr;
      }

      alert("Programme créé et assigné avec succès !");
      window.location.href = "/coach";
    } catch (err) {
      alert("Erreur lors de la création : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-6 max-w-2xl mx-auto pb-24">
      <Link href="/coach" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-amber-400 mb-6">
        <ArrowLeft className="w-4 h-4" />
        <span>Retour au tableau de bord</span>
      </Link>

      <div className="mb-6">
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
          Espace Coach
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-white mt-2">Créer un Programme</h1>
      </div>

      <form onSubmit={handleCreateProgram} className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Titre de la séance *</label>
            <input
              type="text"
              placeholder="Ex: Fullbody Force & Hypertrophie"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-400"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Note globale du coach</label>
            <textarea
              rows={2}
              placeholder="Ex: Bien s'échauffer avant d'attaquer les mouvements lourds..."
              value={coachNote}
              onChange={(e) => setCoachNote(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white resize-none focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* EXERCICES */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-amber-400" />
              <span>Exercices du programme</span>
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
                placeholder="Nom de l'exercice (ex: Développé couché)"
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

              {/* Consigne / Commentaire du coach pour cet exercice */}
              <div>
                <label className="block text-[9px] uppercase text-slate-400 mb-1">Consigne / Instruction pour cet exercice</label>
                <input
                  type="text"
                  placeholder="Ex: Garder les coudes serrés, 90s de repos..."
                  value={ex.coach_comment}
                  onChange={(e) => {
                    const updated = [...exercises];
                    updated[idx].coach_comment = e.target.value;
                    setExercises(updated);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 px-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
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
          <span>{loading ? "Création en cours..." : "ENREGISTRER ET ASSIGNER"}</span>
        </button>
      </form>
    </div>
  );
}
