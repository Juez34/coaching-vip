"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabase";
import { ArrowLeft, Loader2, Calendar, Clock, Dumbbell, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function WorkoutHistoryPage() {
  const params = useParams();
  const programId = params?.id;

  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState(null);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (programId) {
      fetchWorkoutHistory();
    }
  }, [programId]);

  const fetchWorkoutHistory = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Récupérer le programme
      const { data: progData } = await supabase
        .from("programs")
        .select("*")
        .eq("id", programId)
        .single();
      setProgram(progData);

      // 2. Récupérer les logs
      const { data: logsData } = await supabase
        .from("workout_logs")
        .select("*")
        .eq("program_id", programId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      console.log("Logs chargés :", logsData);
      setLogs(logsData || []);
    } catch (err) {
      console.error("Erreur :", err);
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-6 max-w-2xl mx-auto pb-24">
      <Link href="/client" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-amber-400 mb-6">
        <ArrowLeft className="w-4 h-4" />
        <span>Retour à mes séances</span>
      </Link>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mb-6">
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full border border-emerald-400/20">
          Historique des performances
        </span>
        <h1 className="text-2xl font-black text-white mt-2">{program?.title || "Séance"}</h1>
        <p className="text-xs text-slate-400 mt-1">
          {logs.length} session{logs.length > 1 ? "s" : ""} trouvée{logs.length > 1 ? "s" : ""}
        </p>
      </div>

      {logs.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
          Aucun historique à afficher.
        </div>
      ) : (
        <div className="space-y-6">
          {logs.map((log, index) => (
            <div key={log.id || index} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
              {/* En-tête de session */}
              <div className="flex justify-between items-center pb-3 border-b border-slate-800 text-xs">
                <span className="font-black bg-emerald-400/10 text-emerald-400 px-2.5 py-1 rounded-lg border border-emerald-400/20">
                  Session du {new Date(log.created_at).toLocaleDateString("fr-FR")} à {new Date(log.created_at).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="font-mono text-slate-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                  ⏱️ {Math.floor((log.duration_seconds || 0) / 60)} min
                </span>
              </div>

              {/* Performances brutes sécurisées */}
              {log.actual_performances && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
                    <Dumbbell className="w-3.5 h-3.5 text-amber-400" />
                    <span>Performances</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Object.entries(log.actual_performances).map(([k, perf], i) => (
                      <div key={i} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs flex justify-between">
                        <span className="text-slate-400">Série / ID: {k}</span>
                        <span className="font-bold text-white">
                          {perf?.reps || "?"} reps @ {perf?.weight || "?"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Commentaire global */}
              {log.student_comment && (
                <div className="bg-amber-400/10 p-3 rounded-xl border border-amber-400/20 text-xs space-y-1">
                  <span className="font-bold text-amber-400 uppercase text-[10px] flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" /> Commentaire :
                  </span>
                  <p className="text-amber-200/90 italic">"{log.student_comment}"</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
