"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { 
  Play, Dumbbell, UserCheck, LogOut, Search, User, Plus, Loader2, Star, ChevronRight 
} from "lucide-react";
import Link from "next/link";

export default function StudentDashboard() {
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  const [myCoaches, setMyCoaches] = useState([]);
  const [programs, setPrograms] = useState([]);

  // Recherche & Ajout de Coach
  const [showCoachSearch, setShowCoachSearch] = useState(false);
  const [coachQuery, setCoachQuery] = useState("");
  const [coachesSearchResults, setCoachesSearchResults] = useState([]);
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
    const { data: coachesData } = await supabase
      .from("student_coaches")
      .select("coach_id, profiles!student_coaches_coach_id_fkey(id, full_name, email)")
      .eq("student_id", userId);

    const formattedCoaches = (coachesData || []).map(c => c.profiles);
    setMyCoaches(formattedCoaches);

    let query = supabase.from("programs").select("*, exercises(count)");
    if (formattedCoaches.length > 0) {
      const coachIds = formattedCoaches.map(c => c.id);
      query = query.or(`student_id.eq.${userId},coach_id.in.(${coachIds.join(",")}),user_id.eq.${userId}`);
    } else {
      query = query.or(`student_id.eq.${userId},user_id.eq.${userId}`);
    }

    const { data: programData } = await query;
    setPrograms(programData || []);
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

  const addCoach = async (coachId) => {
    const { error } = await supabase
      .from("student_coaches")
      .insert([{ student_id: currentUserId, coach_id: coachId }]);

    if (error && error.code !== "23505") {
      alert("Erreur lors de l'ajout du coach.");
    } else {
      alert("Coach ajouté avec succès !");
      setShowCoachSearch(false);
      loadCoachesAndPrograms(currentUserId);
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
      {/* Header */}
      <header className="flex justify-between items-center mb-6 pb-6 border-b border-slate-800">
        <div>
          <span className="text-[11px] font-extrabold tracking-widest text-amber-400 uppercase bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20 mb-2 inline-block">
            ESPACE ÉLÈVE
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Mes Séances</h1>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/profile" className="text-xs font-bold text-slate-300 bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-800 flex items-center gap-2">
            <User className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Mon Profil</span>
          </Link>
          <button onClick={handleLogout} className="text-xs font-bold text-slate-400 hover:text-rose-400 bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-800">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Mes Coachs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Mes Coachs</h3>
            {myCoaches.length === 0 ? (
              <p className="text-xs font-semibold text-amber-400 mt-1">Vous n'avez pas encore choisi de coach.</p>
            ) : (
              <div className="flex flex-wrap gap-2 mt-1">
                {myCoaches.map((c) => (
                  <span key={c.id} className="text-xs bg-slate-950 text-slate-300 px-3 py-1 rounded-lg border border-slate-800">
                    👤 {c.full_name || c.email}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => setShowCoachSearch(!showCoachSearch)}
            className="bg-amber-400/10 text-amber-400 border border-amber-400/30 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-2"
          >
            <UserCheck className="w-4 h-4" />
            <span>{myCoaches.length === 0 ? "Trouver un Coach" : "Ajouter Coach"}</span>
          </button>
        </div>

        {showCoachSearch && (
          <div className="pt-3 border-t border-slate-800 space-y-3">
            <input
              type="text"
              placeholder="Rechercher Pauline Marion..."
              value={coachQuery}
              onChange={(e) => searchCoach(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white"
            />
            {featuredCoach && coachQuery.length < 2 && (
              <div className="bg-slate-950 p-3 rounded-xl border border-amber-400/30 flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-bold text-white">{featuredCoach.full_name}</h4>
                  <span className="text-[10px] text-slate-400">{featuredCoach.email}</span>
                </div>
                <button onClick={() => addCoach(featuredCoach.id)} className="bg-amber-400 text-slate-950 text-xs font-bold px-3 py-1 rounded-lg">
                  Ajouter
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Liste des cartes de programmes */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Programmes Disponibles</h2>
        
        {programs.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
            Aucune séance disponible.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {programs.map((prog) => (
              <div key={prog.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-amber-400/50 transition-all">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-amber-400">
                      {prog.user_id ? "Séance Perso" : "Programme Coach"}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {prog.exercises?.[0]?.count || 0} exercices
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight">{prog.title}</h3>
                  {prog.coach_note && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">💡 {prog.coach_note}</p>
                  )}
                </div>

                <Link
                  href={`/client/workout/${prog.id}`}
                  className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>DÉMARRER LA SÉANCE</span>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
