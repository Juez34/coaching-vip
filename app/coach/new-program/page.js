"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { ArrowLeft, Plus, Trash2, Save, Dumbbell, UserCheck, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NewProgramPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [title, setTitle] = useState("");
  const [coachNote, setCoachNote] = useState("");
  
  const [exercises, setExercises] = useState([
    { name: "", sets: 4, reps: "10-12", target_weight: "20kg" }
  ]);

  useEffect(() => {
    fetchCoachStudents();
  }, []);

  // Récupérer les élèves du coach connecté
  const fetchCoachStudents = async () => {
    try {
      setLoading(true);
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return router.push("/login");

      // Récupération des élèves associés via student_coaches
      const { data: multiCoachData } = await supabase
        .from("student_coaches")
        .select("student_id, profiles!student_coaches_student_id_fkey(*)")
        .eq("coach_id", user.user.id);

      let studentList = (multiCoachData || []).map((item) => item.profiles).filter(Boolean);

      // Rétrocompatibilité : élèves avec coach_id direct
      const { data: directData } = await supabase
        .from("profiles")
        .select("*")
        .eq("coach_id", user.user.id);

      if (directData) {
        const existingIds = new Set(studentList.map((s) => s.id));
        directData.forEach((st) => {
          if (!existingIds.has(st.id)) studentList.push(st);
        });
      }

      setStudents(studentList);
      if (studentList.length > 0) {
        setSelectedStudentId(studentList[0].id);
      }
    } catch (err) {
      console.error("Erreur de chargement des élèves:", err);
    } finally {
      setLoading(false);
    }
  };

  const addExercise = () => {
    setExercises([...exercises, { name: "", sets: 3, reps: "10", target_weight: "15kg" }]);
  };

  const removeExercise = (index) => {
    if (exercises.length === 1) return alert("Le programme doit contenir au moins un exercice.");
    setExercises(exercises.filter((_, idx) => idx !== index));
  };

  const handleExerciseChange = (index, field, value) => {
    const updated = [...exercises];
    updated[index][field] = value;
    setExercises(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return alert("Veuillez entrer un titre de programme.");
    if (!selectedStudentId) return alert("Veuillez sélectionner un élève.");

    setSaving(true);
    try {
      const { data: user } = await supabase.auth.getUser();

      // 1. Création du programme
      const { data: newProgram, error: programError } = await supabase
        .from("programs")
        .insert([
          {
            title: title,
            coach_note: coachNote,
            coach_id: user.user.id,
            student_id: selectedStudentId
          }
        ])
        .select()
        .single();

      if (programError) throw programError;

      // 2. Insertion des exercices liés
      const exercisesToInsert = exercises
        .filter((ex) => ex.name.trim() !== "")
        .map((ex, idx) => ({
          program_id: newProgram.id,
          name: ex.name,
          sets: parseInt(ex.sets),
          reps: ex.reps,
          target_weight: ex.target_weight,
          order_index: idx
        }));

      if (exercisesToInsert.length > 0) {
        const { error: exercisesError } = await supabase
          .from("exercises")
          .insert(exercisesToInsert);

        if (exercisesError) throw exercisesError;
      }

      alert("Programme créé et assigné avec succès !");
      router.push("/coach");
    } catch (err) {
      alert("Erreur lors de la création du programme : " + err.message);
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-6 max-w-3xl mx-auto pb-16">
      <Link
        href="/coach"
        className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-amber-400 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Retour au Tableau de bord Coach</span>
      </Link>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div>
          <span className="text-[10px] font-extrabold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20 uppercase">
            Création de séance
          </span>
          <h1 className="text-2xl font-black text-white mt-2">Nouveau Programme Élève</h1>
          <p className="text-xs text-slate-400">Conçois et attribue un entraînement personnalisé.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Sélection de l'élève */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Attribuer à l'Élève *</label>
            {students.length === 0 ? (
              <p className="text-xs text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                Tu n'as aucun élève associé pour le moment.
              </p>
            ) : (
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-amber-400"
                required
              >
                {students.map((st) => (
                  <option key={st.id} value={st.id}>
                    👤 {st.full_name || st.email}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Titre & Notes */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Titre de la Séance *</label>
              <input
                type="text"
                placeholder="Ex: Séance Hypertrophie Jambes / Épaules"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Conseils / Note du Coach</label>
              <textarea
                placeholder="Ex: Pense à bien contrôler la phase négative sur chaque rep..."
                rows={2}
                value={coachNote}
                onChange={(e) => setCoachNote(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400 resize-none"
              />
            </div>
          </div>

          {/* Liste des Exercices */}
          <div className="pt-4 border-t border-slate-800/80 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">Exercices du programme</h3>
              <button
                type="button"
                onClick={addExercise}
                className="text-xs bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 font-bold px-3 py-1.5 rounded-xl border border-amber-400/30 flex items-center gap-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter un exercice</span>
              </button>
            </div>

            <div className="space-y-3">
              {exercises.map((ex, idx) => (
                <div key={idx} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 relative space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Exercice #{idx + 1}
                    </span>
                    {exercises.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeExercise(idx)}
                        className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                        title="Supprimer cet exercice"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Nom de l'exercice (ex: Développé Couché Halthères)"
                      value={ex.name}
                      onChange={(e) => handleExerciseChange(idx, "name", e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Séries</label>
                      <input
                        type="number"
                        value={ex.sets}
                        onChange={(e) => handleExerciseChange(idx, "sets", e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Répétitions</label>
                      <input
                        type="text"
                        placeholder="10-12"
                        value={ex.reps}
                        onChange={(e) => handleExerciseChange(idx, "reps", e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Charge cible</label>
                      <input
                        type="text"
                        placeholder="25kg"
                        value={ex.target_weight}
                        onChange={(e) => handleExerciseChange(idx, "target_weight", e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || students.length === 0}
            className="w-full py-3.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 transition-all mt-6 shadow-xl"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "PUBLICATION..." : "PUBLIER LE PROGRAMME POUR L'ÉLÈVE"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
