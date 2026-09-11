"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Users, Shield, Dumbbell, Activity, Search, ShieldCheck, UserCheck } from "lucide-react";

export default function AdminDashboard() {
  const [profiles, setProfiles] = useState([]);
  const [stats, setStats] = useState({ total: 0, coaches: 0, clients: 0, programs: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);

      // 1. Récupération des profils
      const { data: usersData, error: usersError } = await supabase
        .from("profiles")
        .select("*");

      if (usersError) throw usersError;

      // 2. Compte du nombre de programmes
      const { count: programsCount } = await supabase
        .from("programs")
        .select("*", { count: "exact", head: true });

      setProfiles(usersData || []);
      setStats({
        total: usersData?.length || 0,
        coaches: usersData?.filter((u) => u.role === "coach").length || 0,
        clients: usersData?.filter((u) => u.role === "client").length || 0,
        programs: programsCount || 0,
      });
    } catch (err) {
      console.error("Erreur Admin:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProfiles = profiles.filter((profile) =>
    profile.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 max-w-6xl mx-auto pb-16">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-slate-800">
        <div>
          <span className="text-xs font-black tracking-widest text-emerald-400 uppercase bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">
            SUPER ADMIN
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight mt-2">
            Administration Globale
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Supervise l'ensemble des comptes, coaches, élèves et programmes actifs.
          </p>
        </div>
      </header>

      {/* Cartes Métriques */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Utilisateurs</span>
            <Users className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-3xl font-black text-white">{stats.total}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Coaches</span>
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-white">{stats.coaches}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Élèves</span>
            <UserCheck className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-3xl font-black text-white">{stats.clients}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Programmes</span>
            <Dumbbell className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-3xl font-black text-white">{stats.programs}</p>
        </div>
      </div>

      {/* Liste des comptes */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
          <h2 className="text-lg font-bold text-white">Gestion des Comptes</h2>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Rechercher par ID ou Rôle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-amber-400 w-full sm:w-64"
            />
          </div>
        </div>

        {loading ? (
          <p className="text-xs text-slate-500 text-center py-8">Chargement des données...</p>
        ) : filteredProfiles.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-8">Aucun profil trouvé.</p>
        ) : (
          <div className="space-y-3">
            {filteredProfiles.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl"
              >
                <div>
                  <p className="font-mono text-xs text-slate-300 font-bold">{p.id}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Créé le : {new Date(p.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full uppercase border ${
                    p.role === "admin"
                      ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/20"
                      : p.role === "coach"
                      ? "bg-amber-400/10 text-amber-400 border-amber-400/20"
                      : "bg-blue-400/10 text-blue-400 border-blue-400/20"
                  }`}
                >
                  {p.role}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
