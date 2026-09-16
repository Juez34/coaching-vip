"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { 
  Dumbbell, Play, CheckCircle2, Clock, Loader2, ChevronRight, User 
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

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setUserProfile(profile);

      const { data: progsData, error: progsErr } = await supabase
        .from("programs")
        .select("*, exercises(id, name, sets, reps)")
        .eq("student_id", user.id)
        .order("created_at", { ascending: false });

      if (progsErr) throw progsErr;
      setPrograms(progsData || []);

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
      {/* En-tête Profil Client avec bouton d'accès au Profil */}
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

        {/* Bouton d'accès au profil */}
        <Link
          href="/client/profile"
          className="bg-slate-950 hover:bg-slate-800 border border-slate-800 text-amber-400 p-3 rounded-xl transition-all shadow-md flex items-center justify-center cursor-pointer"
          title="Mon profil"
        >
          <User className="w-5 h-5" />
        </Link>
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

              const targetUrl = isDone 
                ? `/client/history/${prog.id}` 
                : `/client/workout/${prog.id}`;

              return (
                <Link
                  key={prog.id}
                  href={targetUrl}
                  className="block bg-slate-900 border border-slate-800 hover:border-amber-400/50 rounded-2xl p-5 shadow-md transition-all group cursor-pointer space-y-3"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
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

                    <div className="flex items-center gap-2">
                      <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>

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
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
