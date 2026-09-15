"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { LogOut, User, Shield, Users, Dumbbell, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const router = useRouter();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllProfiles();
  }, []);

  const fetchAllProfiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      setProfiles(data || []);
    } catch (err) {
      console.error("Erreur de chargement des profils:", err);
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
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 max-w-6xl mx-auto">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-slate-800">
        <div>
          <span className="text-[11px] font-extrabold tracking-widest text-emerald-400 uppercase bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20 shadow-sm inline-block mb-2">
            SUPER ADMIN
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight">Administration Globale</h1>
          <p className="text-sm text-slate-400 mt-0.5">Supervise l'ensemble des comptes, coaches, élèves et programmes.</p>
        </div>

        {/* Menu utilisateur */}
        <div className="flex items-center gap-2">
          <Link
            href="/profile"
            className="text-xs font-bold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-800 flex items-center gap-2 transition-colors shrink-0"
          >
            <User className="w-4 h-4 text-emerald-400" />
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
          <Users className="w-5 h-5 text-emerald-400" />
          <span>Comptes enregistrés ({profiles.length})</span>
        </h2>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
                <tr>
                  <th className="p-4">Nom / Prénom</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Rôle</th>
                  <th className="p-4">Téléphone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {profiles.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/50">
                    <td className="p-4 font-bold text-white">{p.full_name || "—"}</td>
                    <td className="p-4 text-slate-400">{p.email || p.id}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                        p.role === "admin"
                          ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/20"
                          : p.role === "coach"
                          ? "bg-amber-400/10 text-amber-400 border-amber-400/20"
                          : "bg-blue-400/10 text-blue-400 border-blue-400/20"
                      }`}>
                        {p.role}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400">{p.phone || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
