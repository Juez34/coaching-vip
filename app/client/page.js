"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { 
  Check, Play, Dumbbell, UserCheck, LogOut, ChevronRight, 
  Star, Search, User, Plus, Loader2, Sparkles, BookOpen 
} from "lucide-react";
import Link from "next/link";

export default function StudentWorkout() {
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  // État des programmes et coachs
  const [myCoaches, setMyCoaches] = useState([]);
  const [selectedCoachId, setSelectedCoachId] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [activeProgramIndex, setActiveProgramIndex] = useState(0);
  const [completedSets, setCompletedSets] = useState({});

  // Recherche & Ajout de Coach
  const [showCoachSearch, setShowCoachSearch] = useState(false);
  const [coachQuery, setCoachQuery] = useState("");
  const [coachesSearchResults, setCoachesSearchResults] = useState([]);
  const [featuredCoach, setFeaturedCoach] = useState(null);

  // Modal de création de séance autonome
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customNote, setCustomNote] = useState("");
  const [customExercises, setCustomExercises] = useState([
    { name: "", sets: 3, reps: "10", target_weight: "20kg" }
  ]);

  useEffect(() => {
    initStudentData();
  }, []);

  const initStudentData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return (window.location.href = "/login");

      setCurrentUserId(user.id);
      await loadCoachesAndPrograms(user.id);
      fetchFeaturedCoach();
    } catch (err) {
      console.error("Erreur d'initialisation:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadCoachesAndPrograms = async (userId) => {
    // 1. Charger les coachs associés à l'élève
    const { data: coachesData } = await supabase
      .from("student_coaches")
      .select("coach_id, profiles!student_coaches_coach_id_fkey(id, full_name, email)")
      .eq("student_id", userId);

    const formattedCoaches = (coachesData || []).map(c => c.profiles);
    setMyCoaches(formattedCoaches);

    // 2. Charger tous les programmes (du coach sélectionné ou créés par soi-même)
    let query = supabase.from("programs").select("*");
    
    if (formattedCoaches.length > 0) {
      const coachIds = formattedCoaches.map(c => c.id);
      query = query.or(`coach_id.in.(${coachIds.join(",")}),user_id.eq.${userId}`);
    } else {
      query = query.eq("user_id", userId);
    }

    const { data: programData } = await query;

    if (programData && programData.length > 0) {
      // Pour chaque programme, charger ses exercices
      const fullPrograms = await Promise.all(
        programData.map(async (prog) => {
          const { data: exData } = await supabase
            .from("exercises")
            .select("*")
            .eq("program_id", prog.id)
            .order("order_index", { ascending: true });
          return { ...prog, exercises: exData || [] };
        })
      );
      setPrograms(fullPrograms);
    } else {
      setPrograms([]);
    }
  };

  const fetchFeaturedCoach = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", "pauline.marion@hotmail.fr")
      .maybeSingle();

    if (data) setFeaturedCoach(data);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    sessionStorage.clear();
    window.location.replace("/login");
  };

  // Recherche Multi-Critères de Coachs
  const searchCoach = async (query) => {
    setCoachQuery(query);
    if (query.length < 2) return setCoachesSearchResults([]);

    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, email, phone, specialties")
      .eq("role", "coach")
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%,specialties.ilike.%${query}%`);

    setCoachesSearchResults(data || []);
  };

  // Ajouter un coach à sa liste
  const addCoach = async (coachId) => {
    const { error } = await supabase
      .from("student_coaches")
      .insert([{ student_id: currentUserId, coach_id: coachId }]);

    if (error && error.code !== "23505") { // Ignorer si déjà ajouté
      alert("Erreur lors de l'ajout du coach.");
    } else {
      alert("Coach ajouté avec succès !");
      setShowCoachSearch(false);
      loadCoachesAndPrograms(currentUserId);
    }
  };

  // Création d'une séance autonome par l'élève
  const handleCreateCustomWorkout = async (e) => {
    e.preventDefault();
    if (!customTitle.trim()) return alert("Merci d'indiquer un titre.");

    try {
      // 1. Créer le programme autonome
      const { data: newProg, error: progErr } = await supabase
        .from("programs")
        .insert([{
          title: customTitle,
          coach_note: customNote || "Séance perso",
          user_id: currentUserId
        }])
        .select()
        .single();

      if (progErr) throw progErr;

      // 2. Insérer les exercices
      const exToInsert = customExercises
        .filter(ex => ex.name.trim() !== "")
        .map((ex, idx) => ({
          program_id: newProg.id,
          name: ex.name,
          sets: parseInt(ex.sets),
          reps: ex.reps,
          target_weight: ex.target_weight,
          order_index: idx
        }));

      if (exToInsert.length > 0) {
        const { error: exErr } = await supabase.from("exercises").insert(exToInsert);
        if (exErr) throw exErr;
      }

      alert("Ta séance personnalisée a été créée !");
      setShowCustomModal(false);
      setCustomTitle("");
      setCustomNote("");
      setCustomExercises([{ name: "", sets: 3, reps: "10", target_weight: "20kg" }]);
      loadCoachesAndPrograms(currentUserId);
    } catch (err) {
      alert("Erreur lors de la création : " + err.message);
    }
  };

  const addCustomExerciseField = () => {
    setCustomExercises([...customExercises, { name: "", sets: 3, reps: "10", target_weight: "20kg" }]);
  };

  const toggleSet = (exerciseId, setIndex) => {
    const key = `${exerciseId}-${setIndex}`;
    setCompletedSets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const saveWorkout = async () => {
    const activeProg = programs[activeProgramIndex];
    if (!activeProg) return;

    try {
      const { error } = await supabase.from("workout_logs").insert([
        {
          program_id: activeProg.id,
          completed_sets: completedSets
        }
      ]);
      if (error) throw error;
      alert("Séance enregistrée avec succès ! Bravo 💪");
    } catch (err) {
      alert("Erreur lors de l'enregistrement de la séance.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  const currentProgram = programs[activeProgramIndex];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-6 max-w-6xl mx-auto pb-24">
      {/* En-tête Navigation & Mon Profil */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-slate-800">
        <div>
          <span className="text-[11px] font-extrabold tracking-widest text-amber-400 uppercase bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20 shadow-sm inline-block mb-2">
            ESPACE ÉLÈVE
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Mes Entraînements</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">Suis tes programmes et crée tes propres séances.</p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/profile"
            className="text-xs font-bold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-800 flex items-center gap-2 transition-colors shrink-0"
          >
            <User className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Mon Profil</span>
          </Link>
          <button
            onClick={handleLogout}
            className="text-xs font-bold text-slate-400 hover:text-rose-400 bg-slate-900 hover:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-800 flex items-center gap-2 transition-colors shrink-0"
            title="Déconnexion"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>
      </header>

      {/* BLOC 1 : Message "Vous n'avez pas choisi de coach" & Gestion des Coachs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Mes Coachs</h3>
            {myCoaches.length === 0 ? (
              <p className="text-sm font-semibold text-amber-400 mt-1">Vous n'avez pas encore choisi de coach.</p>
            ) : (
              <div className="flex flex-wrap gap-2 mt-1.5">
                {myCoaches.map((c) => (
                  <span key={c.id} className="text-xs bg-slate-950 text-slate-300 px-3 py-1 rounded-lg border border-slate-800 font-medium">
                    👤 {c.full_name || c.email}
                  </span>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setShowCoachSearch(!showCoachSearch)}
            className="bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 border border-amber-400/30 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-2 transition-all shrink-0"
          >
            <UserCheck className="w-4 h-4" />
            <span>{myCoaches.length === 0 ? "Trouver un Coach" : "Ajouter un autre Coach"}</span>
          </button>
        </div>

        {/* Formulaire / Modal de Recherche de Coach */}
        {showCoachSearch && (
          <div className="pt-3 border-t border-slate-800/80 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Rechercher par nom, mail, téléphone ou domaine
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Ex: Pauline Marion, Perte de poids..."
                  value={coachQuery}
                  onChange={(e) => searchCoach(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Coach à la une */}
            {featuredCoach && coachQuery.length < 2 && (
              <div className="bg-slate-950 border border-amber-400/30 rounded-xl p-3 space-y-2">
                <span className="text-[10px] font-black uppercase text-amber-400 flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> Coach à la une
                </span>
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-white">{featuredCoach.full_name}</h4>
                    <span className="text-[10px] text-slate-400 block">{featuredCoach.email}</span>
                  </div>
                  <button
                    onClick={() => addCoach(featuredCoach.id)}
                    className="bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            )}

            {/* Résultats de recherche */}
            {coachQuery.length >= 2 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {coachesSearchResults.map((c) => (
                  <div key={c.id} className="flex justify-between items-center p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                    <div>
                      <h4 className="text-xs font-bold text-white">{c.full_name || "Coach"}</h4>
                      <span className="text-[10px] text-slate-400 block">{c.email}</span>
                    </div>
                    <button
                      onClick={() => addCoach(c.id)}
                      className="bg-amber-400 text-slate-950 text-xs font-bold px-2.5 py-1 rounded-md"
                    >
                      Sélectionner
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* BLOC 2 : Navigation entre les programmes & Création de séances autonomes */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        {/* Onglets de sélection des programmes */}
        {programs.length > 0 ? (
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1">
            {programs.map((prog, idx) => (
              <button
                key={prog.id}
                onClick={() => setActiveProgramIndex(idx)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${
                  activeProgramIndex === idx
                    ? "bg-amber-400 text-slate-950 border-amber-400 shadow-md"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                }`}
              >
                {prog.title} {prog.user_id ? "(Perso)" : ""}
              </button>
            ))}
          </div>
        ) : (
          <span className="text-xs text-slate-400">Aucun programme disponible pour l'instant.</span>
        )}

        {/* Bouton Créer sa propre séance */}
        <button
          onClick={() => setShowCustomModal(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 border border-slate-800 transition-all shrink-0"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>Créer ma Séance</span>
        </button>
      </div>

      {/* BLOC 3 : Contenu du programme actif */}
      {currentProgram ? (
        <main className="space-y-5 max-w-2xl mx-auto">
          {currentProgram.coach_note && (
            <div className="text-xs text-slate-300 bg-slate-900 p-3.5 rounded-2xl border border-slate-800 flex gap-2.5 items-start">
              <span className="text-base leading-none">💡</span>
              <div>
                <span className="font-bold text-amber-400">Note : </span>
                {currentProgram.coach_note}
              </div>
            </div>
          )}

          {currentProgram.exercises.map((ex) => (
            <div key={ex.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-base text-white tracking-tight">{ex.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Objectif : <span className="text-amber-400 font-semibold">{ex.target_weight}</span> • {ex.reps} reps
                  </p>
                </div>
                <button className="p-2 bg-amber-400/10 border border-amber-400/20 hover:bg-amber-400/20 rounded-xl text-amber-400 transition-colors">
                  <Play className="w-4 h-4 fill-amber-400" />
                </button>
              </div>

              <div className="space-y-2">
                {Array.from({ length: ex.sets }).map((_, setIdx) => {
                  const isDone = completedSets[`${ex.id}-${setIdx}`];
                  return (
                    <div
                      key={setIdx}
                      onClick={() => toggleSet(ex.id, setIdx)}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 cursor-pointer select-none ${
                        isDone
                          ? "bg-amber-400/10 border-amber-400/50 text-amber-300"
                          : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <span className="text-xs font-bold uppercase tracking-wider">Série {setIdx + 1}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-slate-400">{ex.reps} reps @ {ex.target_weight}</span>
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                            isDone
                              ? "bg-amber-400 border-amber-400 text-slate-950"
                              : "border-slate-700 bg-slate-900"
                          }`}
                        >
                          {isDone && <Check className="w-4 h-4 stroke-[3]" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <button
            onClick={saveWorkout}
            className="w-full py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-6"
          >
            <span>TERMINER LA SÉANCE</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </main>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center max-w-md mx-auto space-y-3">
          <Dumbbell className="w-10 h-10 text-amber-400/50 mx-auto" />
          <h3 className="text-sm font-bold text-white">Aucun exercice trouvé</h3>
          <p className="text-xs text-slate-400">
            Crée ta première séance autonome ci-dessus ou sélectionne un coach pour recevoir un programme.
          </p>
        </div>
      )}

      {/* MODAL : CRÉER SA PROPRE SÉANCE */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white">Créer ma séance sur-mesure</h3>

            <form onSubmit={handleCreateCustomWorkout} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Titre de la séance *</label>
                <input
                  type="text"
                  placeholder="Ex: Pecs / Triceps maison"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Note / Rappel</label>
                <input
                  type="text"
                  placeholder="Ex: Pause de 90s entre les séries..."
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-3 pt-2">
                <label className="block text-xs font-bold uppercase text-amber-400">Exercices</label>
                {customExercises.map((ex, idx) => (
                  <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                    <input
                      type="text"
                      placeholder={`Nom de l'exercice ${idx + 1}`}
                      value={ex.name}
                      onChange={(e) => {
                        const updated = [...customExercises];
                        updated[idx].name = e.target.value;
                        setCustomExercises(updated);
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[9px] text-slate-400 uppercase">Séries</label>
                        <input
                          type="number"
                          value={ex.sets}
                          onChange={(e) => {
                            const updated = [...customExercises];
                            updated[idx].sets = e.target.value;
                            setCustomExercises(updated);
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1 px-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-slate-400 uppercase">Répétitions</label>
                        <input
                          type="text"
                          value={ex.reps}
                          onChange={(e) => {
                            const updated = [...customExercises];
                            updated[idx].reps = e.target.value;
                            setCustomExercises(updated);
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1 px-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-slate-400 uppercase">Charge</label>
                        <input
                          type="text"
                          value={ex.target_weight}
                          onChange={(e) => {
                            const updated = [...customExercises];
                            updated[idx].target_weight = e.target.value;
                            setCustomExercises(updated);
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1 px-2 text-xs text-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addCustomExerciseField}
                  className="w-full py-2 bg-slate-950 hover:bg-slate-800 border border-dashed border-slate-700 text-slate-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Ajouter un exercice
                </button>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="w-1/2 py-2.5 bg-slate-950 text-slate-400 font-bold text-xs rounded-xl border border-slate-800"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl"
                >
                  Créer la séance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
