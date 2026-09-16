"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import Avatar from "../../../components/Avatar";
import { Camera, Loader2, ArrowLeft, Save, User } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [user, setUser] = useState(null);
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    getProfile();
  }, []);

  const getProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setUser(user);
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) throw error;
        if (profile) {
          setFullName(profile.full_name || "");
          setAvatarUrl(profile.avatar_url || "");
        }
      }
    } catch (err) {
      console.error("Erreur chargement profil :", err);
    } finally {
      setLoading(false);
    }
  };

  // 3. Fonction d'upload de l'avatar vers Supabase Storage
  const handleAvatarUpload = async (e) => {
    try {
      setUploading(true);
      const file = e.target.files[0];
      if (!file) return;

      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}-${Math.random()}.${fileExt}`;

      // Envoi du fichier dans le bucket "avatars"
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Récupération de l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // Mise à jour de l'état local et de la BDD
      setAvatarUrl(publicUrl);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;
      alert("Photo de profil mise à jour !");
    } catch (error) {
      alert("Erreur lors de l'upload : " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", user.id);

      if (error) throw error;
      alert("Profil mis à jour avec succès !");
    } catch (err) {
      alert("Erreur enregistrement : " + err.message);
    } finally {
      setSaving(false);
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-6 max-w-xl mx-auto pb-24">
      <Link
        href="/client"
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-amber-400 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Retour au tableau de bord</span>
      </Link>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mb-6">
        <h1 className="text-xl font-black text-white">Mon Profil</h1>
        <p className="text-xs text-slate-400 mt-1">Gérez vos informations personnelles et votre photo de profil.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        {/* Zone Photo de profil avec bouton d'upload overlay */}
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="relative group">
            <Avatar url={avatarUrl} name={fullName} size="xl" />

            <label
              htmlFor="avatar-upload"
              className="absolute bottom-0 right-0 bg-amber-400 hover:bg-amber-300 text-slate-950 p-2 rounded-full cursor-pointer shadow-lg transition-transform group-hover:scale-110"
              title="Changer la photo"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </label>

            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              disabled={uploading}
              className="hidden"
            />
          </div>
          <span className="text-[11px] text-slate-500">
            Cliquez sur l'icône caméra pour modifier la photo
          </span>
        </div>

        {/* Formulaire Informations */}
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
              Nom complet
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-400"
              placeholder="Ex: Jean Dupont"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              Adresse e-mail
            </label>
            <input
              type="email"
              value={user?.email || ""}
              disabled
              className="w-full bg-slate-950/50 border border-slate-850 rounded-xl p-3 text-xs text-slate-500 cursor-not-allowed"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold p-3.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50 mt-4"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Enregistrer les modifications</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
