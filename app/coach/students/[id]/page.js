"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabase";
import { ArrowLeft, Loader2, Dumbbell, Calendar, Clock, CheckCircle2, AlertCircle, ChevronRight, Check, Plus } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export default function CoachStudentDetailPage() {
  const params = useParams();
  const studentId = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : null;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (studentId) {
      fetchStudentDetails();
    }
  }, [studentId]);

  const fetchStudentDetails = async () => {
    try {
      setLoading(true);

      const { data: studentData, error: studentErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", studentId)
        .single();

      if (studentErr) throw studentErr;
      setStudent(studentData);

      const { data: logsData } = await supabase
        .from("workout_logs")
        .select("id, program_id, created_at, duration_seconds, coach_reviewed, programs(title)")
        .eq("user_id", studentId)
        .order("created_at", { ascending: false });

      setLogs(logsData || []);

      const { data: progData } = await supabase
        .from("programs")
        .select("*, exercises(count)")
        .eq("student_id", studentId);
      
      setPrograms(progData || []);
    } catch (err) {
      console.error("Erreur de chargement du dossier élève :", err);
    } finally {
      setLoading(false);
    }
  };

  const unreviewedLogs = logs.filter((l) => !l.coach_reviewed);
  const reviewedLogs = logs.filter((l) => l.coach_reviewed);
  
  let displayedLogs = [...unreviewedLogs];
  if (displayedLogs.length < 3) {
    const needed = 3 - displayedLogs.length;
    displayedLogs = [...displayedLogs, ...reviewedLogs.slice(0, needed)];
  }

  const completedProgramIds = new Set(logs.map(l => l.program_id));

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-6 max-w-4xl mx-auto pb-24">
      <Link href="/coach" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-amber-400 mb-6">
        <ArrowLeft className="w-4 h-4" />
        <span>Retour au tableau de bord</span>
      </Link>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
            Dossier Élève
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-2">{student?.full_name || "Élève"}</h1>
          <p className="text-xs text-slate-400 mt-0.5">{student?.email}</p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          {student?.height && (
            <span className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-slate-300">
              📏 {student.height} cm
            </span>
          )}
          {student?.weight && (
            <span className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-slate-300">
              ⚖️ {student.weight} kg
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* COLONNE 1 : Programmes assignés avec bouton d'ajout direct */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-amber-400" />
              <span>Programmes ({programs.length})</span>
            </h2>

            {/* 🌟 Bouton d'ajout avec ID de l'élève pré-rempli */}
            <Link
              href={`/coach/new-program?student=${studentId}`}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 text-xs transition-colors shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter</span>
            </Link>
          </div>

          {programs.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 text-xs">
              Aucun programme pour cet élève.
            </div>
          ) : (
            <div className="space-y-3">
              {programs.map((prog) => {
                const isRealised = completedProgramIds.has(prog.id);

                return (
                  <Link
                    key={prog.id}
                    href={`/coach/history/program/${prog.id}?student=${studentId}`}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-amber-400/50 hover:bg-slate-850/50 transition-all group cursor-pointer shadow-md block"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">{prog.title}</h3>
                        <span className="text-[10px] text-slate-500 font-medium">{prog.exercises?.[0]?.count || 0} exercices</span>
                      </div>

                      {isRealised ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Réalisée
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-400/10 text-amber-400 px-2.5 py-1 rounded-full border border-amber-400/20 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> À faire
                        </span>
                      )}
                    </div>
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
                  <Link
                    key={log.id}
                    href={`/coach/history/${log.id}`}
                    className={`block bg-slate-900 border rounded-2xl p-4 transition-all hover:border-amber-400/50 shadow-md ${
                      isReviewed ? "border-slate-800 opacity-80" : "border-amber-400/40 bg-gradient-to-r from-slate-900 to-amber-950/10"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-white text-sm">
                        {log.programs?.title || "Séance libre"}
                      </span>

                      {isReviewed ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Lue
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-400/15 text-amber-400 px-2.5 py-1 rounded-full border border-amber-400/30 flex items-center gap-1 animate-pulse">
                          <AlertCircle className="w-3 h-3" /> À examiner
                        </span>
                      )}
                    </div>

                    <div className="flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                      <span>{new Date(log.created_at).toLocaleDateString("fr-FR", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="flex items-center gap-1 text-amber-400 font-bold">
                        <span>Voir le rapport</span>
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
