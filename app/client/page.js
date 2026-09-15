"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { 
  Loader2, Dumbbell, Clock, LogOut, User, Check, Play, History 
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

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setUserProfile(profile);

      const { data: progData, error: progErr } = await supabase
        .from("programs")
        .select("*, exercises(count)")
        .eq("student_id", user.id)
        .order("created_at", { ascending: false });

      if (progErr) throw progErr;
      setPrograms(progData || []);

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
            Retrouve tes programmes d'entraînement personnels.
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
          <div className="space-y-3">
            {programs.map((prog) => {
              const isDone = completedProgramIds.has(prog.id);

              return (
                <div
                  key={prog.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-md"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">
                        {prog.title}
                      </h3>
                      {isDone ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Déjà faite
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-400/10 text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-400/20 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> À faire
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {prog.exercises?.[0]?.count || 0} exercice(s)
                    </p>
                  </div>

                  {/* Boutons d'action */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {/* Bouton pour relancer la séance */}
                    <Link
                      href={`/client/workout/${prog.id}`}
                      className="flex-1 sm:flex-none bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
                    >
                      <Play className="w-3.5 h-3.5 fill-slate-950" />
                      <span>{isDone ? "Refaire" : "Démarrer"}</span>
                    </Link>

                    {/* Bouton pour voir l'historique des sessions (uniquement si au moins 1 réalisation) */}
                    {isDone && (
                      <Link
                        href={`/client/history/${prog.id}`}
                        className="flex-1 sm:flex-none bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white font-bold px-3.5 py-2.5 rounded-xl text-xs border border-slate-800 flex items-center justify-center gap-1.5 transition-all"
                        title="Consulter l'historique des sessions"
                      >
                        <History className="w-3.5 h-3.5 text-amber-400" />
                        <span>Historique</span>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
