"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { 
  Loader2, User, Users, ChevronRight, LogOut, ShieldCheck 
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CoachDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [coachProfile, setCoachProfile] = useState(null);

  useEffect(() => {
    fetchCoachData();
  }, []);

  const fetchCoachData = async () => {
    try {
      setLoading(true);

      // 1. Vérification de l'utilisateur connecté
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) {
        router.replace("/login");
        return;
      }

      // 2. Profil du coach
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setCoachProfile(profile);

      // 3. Récupération des élèves assignés au coach via la table student_coaches
      const { data: assignments, error: assignErr } = await supabase
        .from("student_coaches")
        .select("student_id")
        .eq("coach_id", user.id);

      if (assignErr) throw assignErr;

      const studentIds = (assignments || []).map((a) => a.student_id);

      if (studentIds.length > 0) {
        // 4. Récupération des profils des élèves
        const { data: studentProfiles, error: studErr } = await supabase
          .from("profiles")
          .select("*")
          .in("id", studentIds)
          .order("full_name", { ascending: true });

        if (studErr) throw studErr;
        setStudents(studentProfiles || []);
      } else {
        setStudents([]);
      }
    } catch (err) {
      console.error("Erreur de chargement du dashboard coach :", err);
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-6 max-w-4xl mx-auto pb-24">
      {/* En-tête Coach */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20 flex items-center gap-1.5 w-fit">
            <ShieldCheck className="w-3.5 h-3.5" /> Espace Coach
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-2">
            Bonjour, {coachProfile?.full_name || "Coach"}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Gère tes élèves et leurs programmes d'entraînement.
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

      {/* Liste des Élèves */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Users className="w-4 h-4 text-amber-400" />
          <span>Mes Élèves ({students.length})</span>
        </h2>

        {students.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-xs">
            Aucun élève ne t'est attribué pour le moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {students.map((student) => (
              <Link
                key={student.id}
                href={`/coach/students/${student.id}`}
                className="block bg-slate-900 border border-slate-800 hover:border-amber-400/50 rounded-2xl p-5 shadow-md transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 font-bold text-sm">
                      {student.full_name ? student.full_name.charAt(0).toUpperCase() : "E"}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                        {student.full_name || "Élève sans nom"}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        {student.email || "Pas d'email"}
                      </p>
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
