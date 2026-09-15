"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { 
  Plus, LogOut, User, Users, Loader2, Dumbbell, Calendar 
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CoachDashboard() {
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
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

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const coachId = user.user.id;

      // Récupération des élèves liés
      const { data: multiCoachData } = await supabase
        .from("student_coaches")
        .select("student_id, profiles!student_coaches_student_id_fkey(*)")
        .eq("coach_id", coachId);

      let studentList = (multiCoachData || []).map((item) => item.profiles).filter(Boolean);

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

      setStudents(studentList);
    } catch (err) {
      console.error("Erreur de chargement des élèves:", err);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-6 max-w-5xl mx-auto pb-16">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-slate-800">
        <div>
          <span className="text-[11px] font-extrabold tracking-widest text-amber-400 uppercase bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20 shadow-sm inline-block mb-2">
            ESPACE COACH
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight">Tableau de bord</h1>
          <p className="text-sm text-slate-400 mt-0.5">Sélectionne un élève pour suivre son dossier et ses entraînements.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/coach/new-program"
            className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-all text-xs shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Créer un Programme</span>
          </Link>

          <Link
            href="/profile"
            className="text-xs font-bold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-800 flex items-center gap-2 transition-colors"
          >
            <User className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Mon Profil</span>
          </Link>

          <button
            onClick={handleLogout}
            className="text-xs font-bold text-slate-400 hover:text-rose-400 bg-slate-900 hover:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-800 flex items-center gap-2 transition-colors"
            title="Déconnexion"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="space-y-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Users className="w-4 h-4 text-amber-400" />
          <span>Mes Élèves ({students.length})</span>
        </h2>

        {students.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
            Aucun élève ne t'a encore sélectionné comme coach.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {students.map((st) => {
              const age = calculateAge(st.birth_date);
              return (
                <Link
                  key={st.id}
                  href={`/coach/students/${st.id}`}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-amber-400/50 hover:bg-slate-850/50 transition-all group cursor-pointer shadow-md"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-amber-400">
                        Élève Actif
                      </span>
                      <span className="text-xs text-slate-400">{st.email}</span>
                    </div>
                    <h3 className="text-lg font-bold text-white tracking-tight group-hover:text-amber-400 transition-colors">
                      {st.full_name || "Élève"}
                    </h3>
                    
                    <div className="flex flex-wrap gap-2 text-[11px] text-slate-300 mt-3">
                      {age !== null && (
                        <span className="bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
                          🎂 {age} ans
                        </span>
                      )}
                      {st.height && (
                        <span className="bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
                          📏 {st.height} cm
                        </span>
                      )}
                      {st.weight && (
                        <span className="bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
                          ⚖️ {st.weight} kg
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 group-hover:text-amber-400 font-bold transition-colors pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span>Cliquez pour voir le dossier et l'historique</span>
                    <span>→</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
