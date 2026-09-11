"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { Plus, Users, Dumbbell, TrendingUp, Calendar, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

export default function CoachDashboard() {
  const [stats, setStats] = useState({ clients: 0, programs: 0, logs: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCoachStats();
  }, []);

  const fetchCoachStats = async () => {
    try {
      setLoading(true);

      const { count: programsCount } = await supabase
        .from("programs")
        .select("*", { count: "exact", head: true });

      const { count: logsCount } = await supabase
        .from("workout_logs")
        .select("*", { count: "exact", head: true });

      const { count: clientsCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "client");

      setStats({
        clients: clientsCount || 0,
        programs: programsCount || 0,
        logs: logsCount || 0,
      });
    } catch (err) {
      console.error("Erreur stats:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 max-w-5xl mx-auto pb-16">
      {/* Header avec lien vers création de programme */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-slate-800">
        <div>
          <span className="text-xs font-extrabold tracking-widest text-amber-400 uppercase bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
            ESPACE COACH
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-2">
            Tableau de bord
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Gère tes élèves, leurs programmes et suis leurs progrès en direct.
          </p>
        </div>

        <Link
          href="/coach/new-program"
          className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-5 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-amber-400/10 active:scale-95"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>Créer un Programme</span>
        </Link>
      </header>

      {/* Cartes de statistiques */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase">Élèves Suivis</span>
              <div className="p-2 bg-amber-400/10 rounded-xl text-amber-400">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-black text-white">{stats.clients}</p>
          </div>

          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase">Programmes Actifs</span>
              <div className="p-2 bg-amber-400/10 rounded-xl text-amber-400">
                <Dumbbell className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-black text-white">{stats.programs}</p>
          </div>

          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase">Séances Validées</span>
              <div className="p-2 bg-amber-400/10 rounded-xl text-amber-400">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-black text-white">{stats.logs}</p>
          </div>
        </div>
      )}

      {/* Raccourcis rapides */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-base font-bold text-white mb-4">Actions Rapides</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/coach/new-program"
            className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800/80 hover:border-amber-400/50 rounded-xl transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-400/10 text-amber-400 rounded-xl">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-white">Nouveau programme</p>
                <p className="text-xs text-slate-400">Attribuer une séance d'entraînement</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
          </Link>

          <Link
            href="/"
            className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800/80 hover:border-slate-700 rounded-xl transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-800 text-slate-300 rounded-xl">
                <Dumbbell className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-white">Vue Élève</p>
                <p className="text-xs text-slate-400">Prévisualiser l'interface pratiquant</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
          </Link>
        </div>
      </div>
    </div>
  );
}
