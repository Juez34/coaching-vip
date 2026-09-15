"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Loader2, Users, Calendar, AlertCircle, CheckCircle2, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function CoachDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // 1. Récupération de l'ID du coach connecté
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // 2. Récupération des élèves via la table de liaison students_coaches
        const { data: relationData, error: relationErr } = await supabase
          .from("students_coaches")
          .select("student_id, profiles!student_id(*)")
          .eq("coach_id", user.id);

        if (relationErr) throw relationErr;

        // Extraction des profils depuis le résultat imbriqué
        const myStudents = (relationData || [])
          .map((item) => item.profiles)
          .filter(Boolean);

        setStudents(myStudents);
      }

      // 3. Récupération des dernières séances
      const { data: logsData, error: logsErr } = await supabase
        .from("workout_logs")
        .select("id, program_id, user_id, created_at, coach_reviewed, profiles(full_name, email), programs(title)")
        .order("created_at", { ascending: false })
        .limit(6);

      if (logsErr) throw logsErr;
      setRecentLogs(logsData || []);
    } catch (err) {
      console.error("Erreur de chargement du tableau de bord :", err);
    } finally {
      setLoading(false);
    }
  };

  const pendingCount = recentLogs.filter((log) => !log.coach_reviewed).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-6 max-w-5xl mx-auto pb-24">
      {/* En-tête du tableau de bord */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
            Espace E-Coaching
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-2">Tableau de Bord</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Suivi des activités et gestion du programme de tes élèves.
          </p>
        </div>

        {pendingCount > 0 && (
          <div className="bg-amber-400/10 border border-amber-400/25 rounded-xl px-3.5 py-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="text-xs font-bold text-amber-400">
              {pendingCount} séance{pendingCount > 1 ? "s" : ""} à examiner
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* COLONNE 1 : Liste de tes élèves uniquement */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            <span>Mes Élèves ({students.length})</span>
          </h2>

          {students.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 text-xs">
              Aucun élève ne t'est rattaché pour le moment.
            </div>
          ) : (
            <div className="space-y-3">
              {students.map((student) => (
                <Link
                  key={student.id}
                  href={`/coach/students/${student.id}`}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between hover:border-amber-400/50 hover:bg-slate-850/50 transition-all group shadow-md block"
                >
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                      {student.full_name || "Élève sans nom"}
                    </h3>
                    <p className="text-xs text-slate-500">{student.email}</p>
                  </div>

                  <div className="flex items-center gap-2 text-slate-400 group-hover:text-amber-400 transition-colors">
                    <span className="text-xs font-bold">Voir dossier</span>
                    <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* COLONNE 2 : Activité récente globale */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>Dernières séances enregistrées</span>
          </h2>

          {recentLogs.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 text-xs">
              Aucun entraînement soumis récemment.
            </div>
          ) : (
            <div className="space-y-3">
              {recentLogs.map((log) => {
                const isReviewed = log.coach_reviewed;

                return (
                  <Link
                    key={log.id}
                    href={`/coach/history/${log.id}`}
                    className={`block bg-slate-900 border rounded-2xl p-4 transition-all hover:border-amber-400/50 shadow-md ${
                      isReviewed ? "border-slate-800 opacity-80" : "border-amber-400/40 bg-gradient-to-r from-slate-900 to-amber-950/10"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          {log.profiles?.full_name || log.profiles?.email || "Élève"}
                        </span>
                        <h4 className="font-bold text-white text-sm mt-0.5">
                          {log.programs?.title || "Séance libre"}
                        </h4>
                      </div>

                      {isReviewed ? (
                        <span className="text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Lue
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase bg-amber-400/15 text-amber-400 px-2.5 py-1 rounded-full border border-amber-400/30 flex items-center gap-1 animate-pulse">
                          <AlertCircle className="w-3 h-3" /> À examiner
                        </span>
                      )}
                    </div>

                    <div className="flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                      <span>
                        {new Date(log.created_at).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className="flex items-center gap-1 text-amber-400 font-bold">
                        <span>Consulter</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
