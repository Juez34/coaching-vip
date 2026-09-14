"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { 
  Plus, LogOut, User, Users, Loader2, Calendar, 
  CheckCircle2, Clock, Dumbbell, History 
} from "lucide-react";
import Link from "next/link";

export default function CoachDashboard() {
  const [studentsData, setStudentsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentsAndWorkouts();
  }, []);

  const calculateAge = (dateString) => {
    if (!dateString) return null;
    const today = new Date();
    const birth = new Date(dateString);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const fetchStudentsAndWorkouts = async () => {
    try {
      setLoading(true);
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const coachId = user.user.id;

      // 1. Récupération des élèves liés dans student_coaches
      const { data: multiCoachData } = await supabase
        .from("student_coaches")
        .select("student_id, profiles!student_coaches_student_id_fkey(*)")
        .eq("coach_id", coachId);

      let studentList = (multiCoachData || []).map((item) => item.profiles).filter(Boolean);

      // Rétrocompatibilité
      const { data: directData } = await supabase
        .from("profiles")
        .select("*")
        .eq("coach_id", coachId);

      if (directData) {
        const existingIds = new Set(studentList.map((s) => s.id));
        directData.forEach((st) => {
          if (!existingIds.has(st.id)) studentList.push(st);
        });
      }

      // 2. Pour chaque élève, charger ses programmes attribués et son historique
      const fullStudentsData = await Promise.all(
        studentList.map(async (student) => {
          // Charger les programmes assignés à cet élève par ce coach
          const { data: assignedPrograms } = await supabase
            .from("programs")
            .select("*, exercises(*)")
            .or(`student_id.eq.${student.id},user_id.eq.${student.id}`)
            .eq("coach_id", coachId);

          const programIds = (assignedPrograms || []).map((p) => p.id);

          // Charger l'historique des séances réalisées
          let logs = [];
          if (programIds.length > 0) {
            const { data: workoutLogs } = await supabase
              .from("workout_logs")
              .select("*, programs(title)")
              .in("program_id", programIds)
              .order("created_at", { ascending: false });
            logs = workoutLogs || [];
          }

          return {
            ...student,
            programs: assignedPrograms || [],
            history: logs
          };
        })
      );

      setStudentsData(fullStudentsData);
    } catch (err) {
      console.error("Erreur de chargement des données coach:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    sessionStorage.clear();
    window.location.replace("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-6 max-w-6xl mx-auto pb-16">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-slate-800">
        <div>
          <span className="text-[11px] font-extrabold tracking-widest text-amber-400 uppercase bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20 shadow-sm inline-block mb-2">
            ESPACE COACH
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight">Suivi des Élèves</h1>
          <p className="text-sm text-slate-400 mt-0.5">Consulte les séances assignées et l'historique des entraînements.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/coach/new-program"
            className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-all text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Créer un Programme</span>
          </Link>

          <Link
            href="/profile"
            className="text-xs font-bold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-800 flex items-center gap-2 transition-colors shrink-0"
          >
            <User className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Mon Profil</span>
          </Link>

          <button
            onClick={handleLogout}
            className="text-xs font-bold text-slate-400 hover:text-rose-400 bg-slate-900 hover:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-800 flex items-center gap-2 transition-colors shrink-0"
            title="Déconnexion"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>
      </header>

      <main className="space-y-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-amber-400" />
          <span>Mes Élèves ({studentsData.length})</span>
        </h2>

        {studentsData.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
            Aucun élève ne t'a encore sélectionné comme coach.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {studentsData.map((st) => {
              const age = calculateAge(st.birth_date);
              return (
                <div key={st.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                  {/* En-tête de l'élève */}
                  <div className="flex justify-between items-start border-b border-slate-800/80 pb-3">
                    <div>
                      <h3 className="font-bold text-lg text-white">{st.full_name || "Élève"}</h3>
                      <p className="text-xs text-slate-400">{st.email}</p>
                      <div className="flex flex-wrap gap-2 text-[10px] text-slate-300 mt-2">
                        {age !== null && (
                          <span className="bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                            🎂 {age} ans
                          </span>
                        )}
                        {st.height && (
                          <span className="bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                            📏 {st.height} cm
                          </span>
                        )}
                        {st.weight && (
                          <span className="bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                            ⚖️ {st.weight} kg
                          </span>
                        )}
                      </div>
                    </div>
                    <Link
                      href="/coach/new-program"
                      className="text-[11px] font-bold text-amber-400 bg-amber-400/10 hover:bg-amber-400/20 px-2.5 py-1.5 rounded-lg border border-amber-400/20 transition-all flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Attribuer séance</span>
                    </Link>
                  </div>

                  {/* Section 1 : Séances assignées / À venir */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Séances attribuées ({st.programs.length})</span>
                    </h4>
                    {st.programs.length === 0 ? (
                      <p className="text-xs text-slate-500 italic bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/50">
                        Aucune séance attribuée à cet élève.
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {st.programs.map((prog) => (
                          <div key={prog.id} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 flex justify-between items-center text-xs">
                            <span className="font-semibold text-slate-200">{prog.title}</span>
                            <span className="text-[10px] text-amber-400/80 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                              {prog.exercises?.length || 0} exo(s)
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Section 2 : Historique des séances réalisées */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
                      <History className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Historique des séances ({st.history.length})</span>
                    </h4>
                    {st.history.length === 0 ? (
                      <p className="text-xs text-slate-500 italic bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/50">
                        Aucune séance encore validée par l'élève.
                      </p>
                    ) : (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {st.history.map((log) => (
                          <div key={log.id} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 flex justify-between items-center text-xs">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span className="font-semibold text-slate-200">{log.programs?.title || "Séance terminée"}</span>
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {new Date(log.created_at).toLocaleDateString("fr-FR", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
