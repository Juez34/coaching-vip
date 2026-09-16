"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { 
  Dumbbell, Play, CheckCircle2, Clock, Loader2, History 
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ClientDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [workoutLogs, setWorkoutLogs] = useState([]);

  useEffect(() => {
    fetchClientData();
  }, []);

  const fetchClientData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      // 1. Profil client
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setUserProfile(profile);

      // 2. Programmes assignés avec aperçu des exercices
      const { data: progsData, error: progsErr } = await supabase
        .from("programs")
        .select("*, exercises(id, name, sets, reps)")
        .eq("student_id", user.id)
        .order("created_at", { ascending: false });

      if (progsErr) throw progsErr;
      setPrograms(progsData || []);

      // 3. Historique des logs du client
      const { data: logsData, error: logsErr } = await supabase
        .from("workout_logs")
        .select("id, program_id, created_at, coach_reviewed")
        .eq("user_id", user.id);

      if (logsErr) throw logsErr;
      setWorkoutLogs(logsData || []);

    } catch (err) {
      console.error("Erreur chargement espace client :", err);
    } finally {
      setLoading(false);
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
      {/* En-tête Profil Client */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mb-8 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
            Espace Élève
          </span>
          <h1 className="text-2xl font-black text-white mt-2">
            Bonjour, {userProfile?.full_name || "Sportif"} 👋
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Retrouvez vos séances et suivez vos progrès d'entraînement.
          </p>
        </div>
      </div>

      {/* Section des Séances */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Dumbbell className="w-4 h-4 text-amber-400" />
          <span>Vos séances d'entraînement ({programs.length})</span>
        </h2>

        {programs.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-xs">
            Aucun programme assigné pour le moment. Votre coach prépare votre séance !
          </div>
        ) : (
          <div className="space-y-4">
            {programs.map((prog) => {
              const programLogs = workoutLogs.filter((l) => l.program_id === prog.id);
              const isDone = programLogs.length > 0;
              const exercisesList = prog.exercises || [];

              return (
                <div
                  key={prog.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-md transition-all space-y-4"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-white">
                          {prog.title}
                        </h3>

                        {isDone ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Réalisée ({programLogs.length})
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-400/10 text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-400/20 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> À faire
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {exercisesList.length} exercice{exercisesList.length > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>

                  {/* Aperçu des exercices */}
                  {exercisesList.length > 0 && (
                    <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block mb-1">
                        Exercices au programme :
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

                  {/* Boutons d'actions directes */}
                  <div className="pt-1">
                    {isDone ? (
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/client/history/${prog.id}`}
                          className="flex-1 bg-slate-950 hover:bg-slate-800 text-slate-300 text-center font-bold py-2.5 rounded-xl text-xs border border-slate-800 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <History className="w-3.5 h-3.5" />
                          <span>Historique</span>
                        </Link>
                        <Link
                          href={`/client/workout/${prog.id}`}
                          className="flex-1 bg-amber-400 hover:bg-amber-300 text-slate-950 text-center font-black py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md"
                        >
                          <Play className="w-3.5 h-3.5 fill-slate-950" />
                          <span>Refaire</span>
                        </Link>
                      </div>
                    ) : (
                      /* Bouton direct pour lancer une séance jamais faite */
                      <Link
                        href={`/client/workout/${prog.id}`}
                        className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 text-center font-black py-3 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg"
                      >
                        <Play className="w-4 h-4 fill-slate-950" />
                        <span>DÉMARRER LA SÉANCE</span>
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
