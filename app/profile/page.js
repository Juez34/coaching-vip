"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { User, Mail, Trash2, Save, ArrowLeft, Loader2 } from "lucide-react";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState(null);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return (window.location.href = "/login");

      setUserId(user.id);
      setEmail(user.email);

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        setFirstName(profile.first_name || "");
        setLastName(profile.last_name || "");
        setRole(profile.role || "client");
      }
    } catch (err) {
      console.error("Erreur de chargement du profil:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    const fullName = `${firstName} ${lastName}`.trim();

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: firstName,
          last_name: lastName,
          full_name: fullName
        })
        .eq("id", userId);

      if (error) throw error;
      alert("Profil mis à jour avec succès !");
    } catch (err) {
      alert("Erreur lors de la mise à jour : " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = confirm("Attention ! Ton compte et tes données seront définitivement supprimés. Continuer ?");
    if (!confirmation) return;

    try {
      // 1. Suppression dans la table profiles
      const { error: profileError } = await supabase.from("profiles").delete().eq("id", userId);
      if (profileError) throw profileError;

      // 2. Déconnexion
      await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();

      alert("Ton compte a bien été supprimé.");
      window.location.href = "/login";
    } catch (err) {
      alert("Erreur lors de la suppression du compte : " + err.message);
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-6 max-w-xl mx-auto">
      <button
        onClick={() => window.history.back()}
        className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-amber-400 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Retour</span>
      </button>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div>
          <span className="text-[10px] font-extrabold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20 uppercase">
            Rôle : {role}
          </span>
          <h1 className="text-2xl font-black text-white mt-2">Mon Profil</h1>
          <p className="text-xs text-slate-400">Modifie tes informations personnelles</p>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Prénom</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Nom</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Email (non modifiable)</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full bg-slate-950/50 border border-slate-800/50 rounded-xl py-2.5 px-3 text-sm text-slate-500 cursor-not-allowed"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all mt-4"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "ENREGISTREMENT..." : "ENREGISTRER LES MODIFICATIONS"}</span>
          </button>
        </form>

        <div className="border-t border-slate-800 pt-6">
          <h2 className="text-xs font-bold uppercase text-rose-500 mb-2">Zone Dangereuse</h2>
          <button
            onClick={handleDeleteAccount}
            className="w-full py-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            <span>Supprimer mon compte</span>
          </button>
        </div>
      </div>
    </div>
  );
}
