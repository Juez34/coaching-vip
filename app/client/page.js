"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { 
  Loader2, Dumbbell, Clock, LogOut, User, Check 
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function StudentDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState([]);
  const [logs, setLogs] = useState([]);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      setLoading(true);

      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) {
        router.replace("/login");
        return;
      }

      // 1. Profil utilisateur
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setUserProfile(profile);

      // 2. Programmes attribués avec le résumé des exercices
      const { data: progData, error: progErr } = await supabase
        .from("programs")
        .select("*, exercises(id, name, sets, reps)")
        .eq("student_id", user.id)
        .order("created_at", { ascending: false });

      if (progErr) throw progErr;
      setPrograms(progData || []);

      // 3. Récupération des logs pour repérer les séances déjà réalisées
      const { data: logsData, error: logsErr } = await supabase
        .from("workout_logs")
        .select("id, program_id")
        .eq("user_id", user.id);

      if (logsErr) throw logsErr;
      setLogs(logsData || []);

    } catch (err) {
      console.error("Erreur de chargement du tableau de bord élève :", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    sessionStorage.clear();
    router.replace("/login");
  };

  const completedProgramIds = new Set(logs.map((l) => l.program_id));

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-6 max-w-3xl mx-auto pb-24">
      {/* En-tête Élève */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
            Espace Athlète
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-2">
            Bienvenue, {userProfile?.full_name || "Sportif"}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Retrouve tes séances d'entraînement.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/profile"
            className="text-xs font-bold text-slate-300 hover:text-white bg-slate-950 hover:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-800 flex items-center gap-2 transition-colors"
          >
            <User className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Mon Profil</span>
          </Link>
          <button
            onClick={handleLogout}
            className="text-xs font-bold text-slate-400 hover:text-rose-400 bg-slate-950 hover:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
            title="Déconnexion"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Liste des séances */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Dumbbell className="w-4 h-4 text-amber-400" />
          <span>Mes Séances ({programs.length})</span>
        </h2>

        {programs.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 text-xs">
            Aucun programme ne t'a été assigné pour le moment.
          </div>
        ) : (
          <div className="space-y-4">
            {programs.map((prog) => {
              const isDone = completedProgramIds.has(prog.id);
              const exercisesList = prog.exercises || [];

              return (
                <Link
                  key={prog.id}
                  href={`/client/history/${prog.id}`}
                  className="block bg-slate-900 border border-slate-800 hover:border-amber-400/50 rounded-2xl p-5 shadow-md transition-all group cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                        {prog.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {exercisesList.length} exercice{exercisesList.length > 1 ? "s" : ""}
                      </p>
                    </div>

                    {isDone ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Réalisée
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-400/10 text-amber-400 px-2.5 py-1 rounded-full border border-amber-400/20 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> À faire
                      </span>
                    )}
                  </div>

                  {/* Aperçu des exercices dans la carte */}
                  {exercisesList.length > 0 && (
                    <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block mb-1">
                        Aperçu des exercices :
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {exercisesList.map((exo) => (
                          <span
                            key={exo.id}
                            className="text-[11px] bg-slate-900 border border-slate-800 text-slate-300 px-2.5 py-1 rounded-lg"
                          >
                            <strong className="text-white">{exo.name}</strong> 
                            {exo.sets && exo.reps && (
                              <span className="text-slate-500 ml-1">({exo.sets}x{exo.reps})</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
