"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { LogOut, User, Shield, Users, Dumbbell, Loader2, CheckCircle, Bell, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const router = useRouter();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPendingOnly, setShowPendingOnly] = useState(false);

  const pendingCoachRequests = profiles.filter(
    (profile) => profile.requested_role === "coach" && profile.role !== "coach"
  );
  const displayedProfiles = showPendingOnly
    ? profiles.filter((profile) => profile.requested_role === "coach" && profile.role !== "coach")
    : profiles;

  useEffect(() => {
    fetchAllProfiles();
  }, []);

  const fetchAllProfiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from("profiles").select("*, requested_role");
      if (error) throw error;
      setProfiles(data || []);
    } catch (err) {
      console.error("Erreur de chargement des profils:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCoach = async (profile) => {
    if (!confirm(`Valider l'accès coach pour ${profile.full_name || profile.email || "ce compte"} ?`)) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: "coach" })
        .eq("id", profile.id);

      if (error) throw error;
      setProfiles((current) =>
        current.map((item) => item.id === profile.id ? { ...item, role: "coach" } : item)
      );

      const { error: notificationError } = await supabase.functions.invoke("coach-email-notifications", {
        body: { action: "coach-approved", user_id: profile.id },
      });
      if (notificationError) {
        console.error("Accès coach validé, mais e-mail de confirmation non envoyé :", notificationError);
        alert("Accès coach validé, mais l'e-mail de confirmation n'a pas pu être envoyé. Vérifie la configuration Resend.");
      }
    } catch (err) {
      console.error("Erreur validation coach :", err);
      alert("Impossible de valider ce compte coach. Vérifie que tu es connecté avec un compte administrateur.");
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

        {/* Menu utilisateur et notification des demandes coach */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setShowPendingOnly((current) => !current);
              document.getElementById("admin-accounts")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            aria-label={`${pendingCoachRequests.length} demande(s) coach en attente`}
            className={`relative inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-colors ${
              pendingCoachRequests.length > 0
                ? "border-orange-400/40 bg-orange-400/10 text-orange-200 hover:bg-orange-400/20"
                : "border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Bell className="h-4 w-4" />
            <span>Demandes coach</span>
            <span className={`min-w-5 rounded-full px-1.5 py-0.5 text-[10px] ${pendingCoachRequests.length > 0 ? "bg-orange-400 text-slate-950" : "bg-slate-700 text-slate-300"}`}>
              {pendingCoachRequests.length}
            </span>
          </button>
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
        <div id="admin-accounts" className="flex flex-wrap items-center justify-between gap-3 scroll-mt-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <span>{showPendingOnly ? `Demandes coach en attente (${pendingCoachRequests.length})` : `Comptes enregistrés (${profiles.length})`}</span>
          </h2>
          {showPendingOnly && (
            <button type="button" onClick={() => setShowPendingOnly(false)} className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800">
              <X className="h-3.5 w-3.5" /> Voir tous les comptes
            </button>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
                <tr>
                  <th className="p-4">Nom / Prénom</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Rôle</th>
                  <th className="p-4">Demande d'accès</th>
                  <th className="p-4">Téléphone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {displayedProfiles.map((p) => (
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
                    <td className="p-4">
                      {p.role === "coach" ? (
                        <span className="text-[10px] font-bold uppercase text-emerald-400">Coach activé</span>
                      ) : p.requested_role === "coach" ? (
                        <div className="flex flex-col items-start gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border bg-orange-400/10 text-orange-300 border-orange-400/20">
                            Demande coach à valider
                          </span>
                          <button
                            type="button"
                            onClick={() => handleApproveCoach(p)}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1.5 text-[10px] font-bold uppercase text-emerald-300 hover:bg-emerald-400/20"
                          >
                            <CheckCircle className="h-3 w-3" />
                            Valider
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-400">{p.phone || "—"}</td>
                  </tr>
                ))}
                {displayedProfiles.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-sm text-slate-500">
                      {showPendingOnly ? "Aucune demande coach en attente." : "Aucun compte enregistré."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
