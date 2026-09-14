"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { User, Mail, Trash2, Save, ArrowLeft, Loader2, Phone, Award } from "lucide-react";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState(null);
  
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");

  // Remplacement de l'âge par la date de naissance
  const [birthDate, setBirthDate] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");

  const [specialties, setSpecialties] = useState("");
  const [certifications, setCertifications] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [bio, setBio] = useState("");

  // Calcul automatique de l'âge
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
        setPhone(profile.phone || "");
        setRole(profile.role || "client");

        setBirthDate(profile.birth_date || "");
        setHeight(profile.height || "");
        setWeight(profile.weight || "");

        setSpecialties(profile.specialties || "");
        setCertifications(profile.certifications || "");
        setYearsExperience(profile.years_experience || "");
        setBio(profile.bio || "");
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

    const updates = {
      first_name: firstName,
      last_name: lastName,
      full_name: fullName,
      phone: phone || null,
    };

    if (role === "client") {
      updates.birth_date = birthDate || null;
      updates.height = height ? parseFloat(height) : null;
      updates.weight = weight ? parseFloat(weight) : null;
    } else if (role === "coach") {
      updates.specialties = specialties || null;
      updates.certifications = certifications || null;
      updates.years_experience = yearsExperience ? parseInt(yearsExperience) : null;
      updates.bio = bio || null;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update(updates)
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
    const confirmation = confirm("Attention ! Ton profil et tes données seront définitivement supprimés. Continuer ?");
    if (!confirmation) return;

    try {
      const { error: profileError } = await supabase.from("profiles").delete().eq("id", userId);
      if (profileError) throw profileError;

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

  const computedAge = calculateAge(birthDate);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-6 max-w-xl mx-auto pb-12">
      <button
        onClick={() => window.history.back()}
        className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-amber-400 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Retour au tableau de bord</span>
      </button>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div>
          <span className="text-[10px] font-extrabold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20 uppercase">
            Rôle : {role}
          </span>
          <h1 className="text-2xl font-black text-white mt-2">Mon Profil</h1>
          <p className="text-xs text-slate-400">Gère tes informations personnelles</p>
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
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Téléphone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Section Élève avec calcul automatique de l'âge */}
          {role === "client" && (
            <div className="pt-2 border-t border-slate-800/80">
              <p className="text-[11px] font-bold uppercase text-amber-400 mb-2">
                Données physiques {computedAge !== null && `(${computedAge} ans)`}
              </p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Date de naissance</label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-2 text-[11px] text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Taille (cm)</label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Poids (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section Coach */}
          {role === "coach" && (
            <div className="pt-2 border-t border-slate-800/80 space-y-3">
              <p className="text-[11px] font-bold uppercase text-amber-400">Profil Professionnel</p>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Domaines de compétence</label>
                <input
                  type="text"
                  value={specialties}
                  onChange={(e) => setSpecialties(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Diplômes / Certifications</label>
                  <input
                    type="text"
                    value={certifications}
                    onChange={(e) => setCertifications(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Années d'expérience</label>
                  <input
                    type="number"
                    value={yearsExperience}
                    onChange={(e) => setYearsExperience(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Bio / Présentation</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>
            </div>
          )}

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
            className="w-full py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all mt-4"
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
