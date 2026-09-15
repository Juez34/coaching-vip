"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { 
  Loader2, Dumbbell, Calendar, CheckCircle2, Clock, 
  LogOut, User, ChevronRight, AlertCircle, Check 
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

      // 1. Utilisateur connecté
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) {
        router.replace("/login");
        return;
      }

      // 2. Profil élève
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setUserProfile(profile);

      // 3. Programmes attribués à CET élève
      const { data: progData, error: progErr } = await supabase
        .from("programs")
        .select("*, exercises(count)")
        .eq("student_id", user.id)
        .order("created_at", { ascending: false });

      if (progErr) throw progErr;
      setPrograms(progData || []);

      // 4. Historique des séances réalisées
      const { data: logsData, error: logsErr } = await supabase
        .from("workout_logs")
        .select("id, program_id, created_at, duration_seconds, coach_reviewed, programs(title)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

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

  const unreviewedLogs = logs.filter((l) => !l.coach_reviewed);
  const reviewedLogs = logs.filter((l) => l.coach_reviewed);
  
  let displayedLogs = [...unreviewedLogs];
  if (displayedLogs.length < 3) {
    const needed = 3 - displayedLogs.length;
    displayedLogs = [...displayedLogs, ...reviewedLogs.slice(0, needed)];
  }

  const completedProgramIds = new Set(logs.map((l) => l.program_id));

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-6 max-w-4xl mx-auto pb-24">
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
            Retrouve tes programmes d'entraînement personnels et ton historique.
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* COLONNE 1 : Mes programmes attribués */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-amber-400" />
            <span>Mes Programmes ({programs.length})</span>
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
                  <Link
                    key={prog.id}
                    href={`/client/workout/${prog.id}`}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex justify-between items-center hover:border-amber-400/50 transition-all group shadow-md block"
                  >
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                        {prog.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {prog.exercises?.[0]?.count || 0} exercice(s)
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
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* COLONNE 2 : Derniers entraînements à suivre */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>Derniers entraînements à suivre</span>
          </h2>

          {logs.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 text-xs">
              Aucune séance réalisée pour le moment.
            </div>
          ) : (
            <div className="space-y-3">
              {displayedLogs.map((log) => {
                const isReviewed = log.coach_reviewed;

                return (
                  <div
                    key={log.id}
                    onClick={() => router.push(`/client/history/${log.id}`)}
                    className={`block cursor-pointer bg-slate-900 border rounded-2xl p-4 transition-all hover:border-amber-400/50 shadow-md ${
                      isReviewed 
                        ? "border-slate-800 opacity-80" 
                        : "border-amber-400/40 bg-gradient-to-r from-slate-900 to-amber-950/10"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-white text-sm">
                        {log.programs?.title || "Séance libre"}
                      </span>

                      {isReviewed ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Lue par le coach
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-400/15 text-amber-400 px-2.5 py-1 rounded-full border border-amber-400/30 flex items-center gap-1 animate-pulse">
                          <AlertCircle className="w-3 h-3" /> En attente de révision
                        </span>
                      )}
                    </div>

                    <div className="flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                      <span>
                        {new Date(log.created_at).toLocaleDateString("fr-FR", { 
                          day: 'numeric', 
                          month: 'short', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/client/history/${log.id}`);
                        }}
                        className="flex items-center gap-1 text-amber-400 hover:text-amber-300 font-bold bg-transparent border-0 p-0 cursor-pointer"
                      >
                        <span>Voir le rapport</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
