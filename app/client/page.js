"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { 
  Play, Dumbbell, UserCheck, LogOut, Search, User, Plus, Loader2, Trash2, CheckCircle2, History 
} from "lucide-react";
import Link from "next/link";

export default function StudentDashboard() {
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  const [myCoaches, setMyCoaches] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [completedProgramIds, setCompletedProgramIds] = useState(new Set());

  // Recherche & Ajout de Coach
  const [showCoachSearch, setShowCoachSearch] = useState(false);
  const [coachQuery, setCoachQuery] = useState("");
  const [featuredCoach, setFeaturedCoach] = useState(null);

  useEffect(() => {
    initData();
  }, []);

  const initData = async () => {
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
    // 1. Charger les coachs
    const { data: coachesData } = await supabase
      .from("student_coaches")
      .select("coach_id, profiles!student_coaches_coach_id_fkey(id, full_name, email)")
      .eq("student_id", userId);

    const formattedCoaches = (coachesData || []).map(c => c.profiles);
    setMyCoaches(formattedCoaches);

    // 2. Charger les programmes
    let query = supabase.from("programs").select("*, exercises(count)");
    if (formattedCoaches.length > 0) {
      const coachIds = formattedCoaches.map(c => c.id);
      query = query.or(`student_id.eq.${userId},coach_id.in.(${coachIds.join(",")}),user_id.eq.${userId}`);
    } else {
      query = query.or(`student_id.eq.${userId},user_id.eq.${userId}`);
    }

    const { data: programData } = await query;
    setPrograms(programData || []);

    // 3. Charger les logs d'entraînement
    const { data: logsData } = await supabase
      .from("workout_logs")
      .select("program_id, user_id")
      .eq("user_id", userId);

    const logProgramIds = (logsData || []).map(l => String(l.program_id));
    const currentProgIds = (programData || []).map(p => String(p.id));

    // 📱 Alerte de débogage pour voir les IDs sur le téléphone
    alert(`IDs Logs: [${logProgramIds.join(", ")}] \nIDs Programmes: [${currentProgIds.join(", ")}]`);

    // Utilisation de String() pour s'assurer de comparer le même format
    const completedSet = new Set(logProgramIds);
    setCompletedProgramIds(completedSet);
  };
    
    if (logsError) {
      console.error("Erreur chargement workout_logs :", logsError);
    } else {
      console.log("Logs récupérés pour l'utilisateur :", logsData);
      const completedSet = new Set((logsData || []).map(l => Number(l.program_id)));
      setCompletedProgramIds(completedSet);
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

  const handleDeleteProgram = async (programId) => {
    const confirmDelete = confirm("Voulez-vous vraiment supprimer cette séance ?");
    if (!confirmDelete) return;

    try {
      await supabase.from("exercises").delete().eq("program_id", programId);
      const { error } = await supabase.from("programs").delete().eq("id", programId);
      if (error) throw error;

      setPrograms(programs.filter(p => p.id !== programId));
      alert("Séance supprimée avec succès.");
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-6 max-w-4xl mx-auto pb-28">
      {/* Header */}
      <header className="flex justify-between items-center mb-6 pb-6 border-b border-slate-800">
        <div>
          <span className="text-[11px] font-extrabold tracking-widest text-amber-400 uppercase bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20 mb-2 inline-block">
            ESPACE ÉLÈVE
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Mes Séances</h1>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/profile" className="text-xs font-bold text-slate-300 bg-slate-900 hover:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-800 flex items-center gap-2 transition-colors">
            <User className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Mon Profil</span>
          </Link>
          <button onClick={handleLogout} className="text-xs font-bold text-slate-400 hover:text-rose-400 bg-slate-900 hover:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-800 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Liste des programmes */}
      <div className="space-y-4 mb-8">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Programmes Disponibles</h2>
        
        {programs.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
            Aucune séance disponible.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {programs.map((prog) => {
              // Vérification stricte en convertissant en Number pour éviter les problèmes de type (ID en string vs number)
              const isCompleted = completedProgramIds.has(Number(prog.id));

              return (
                <div key={prog.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-amber-400/50 transition-all">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-amber-400">
                        {prog.user_id ? "Séance Perso" : "Programme Coach"}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-medium">
                          {prog.exercises?.[0]?.count || 0} exercices
                        </span>
                        {prog.user_id && (
                          <button
                            onClick={() => handleDeleteProgram(prog.id)}
                            className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                            title="Supprimer la séance"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-white tracking-tight">{prog.title}</h3>
                    {prog.coach_note && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">💡 {prog.coach_note}</p>
                    )}
                  </div>

                  {/* Actions dynamiques */}
                  {isCompleted ? (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold uppercase text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md border border-emerald-400/20 block text-center flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Séance Terminée
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <Link
                          href={`/client/history/${prog.id}`}
                          className="py-2.5 bg-slate-950 hover:bg-slate-800 text-emerald-400 border border-emerald-400/30 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
                        >
                          <History className="w-3.5 h-3.5" />
                          <span>Historique</span>
                        </Link>
                        <Link
                          href={`/client/workout/${prog.id}`}
                          className="py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md"
                        >
                          <Play className="w-3.5 h-3.5 fill-slate-950" />
                          <span>Refaire</span>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <Link
                      href={`/client/workout/${prog.id}`}
                      className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md"
                    >
                      <Play className="w-4 h-4 fill-slate-950" />
                      <span>DÉMARRER LA SÉANCE</span>
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bouton de création de séance libre */}
      <div className="pt-4 border-t border-slate-800">
        <Link
          href="/client/create"
          className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-400/30 font-extrabold text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2.5 transition-all"
        >
          <Plus className="w-5 h-5 text-amber-400" />
          <span>CRÉER UNE SÉANCE LIBRE</span>
        </Link>
      </div>
    </div>
  );
}
