"use client";
import React, { useState } from "react";
import { supabase } from "../../lib/supabase";
import { Dumbbell, ArrowRight, Lock, Mail, User, Phone, Activity } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState("client");
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();

    if (isSignUp) {
      if (password !== confirmPassword) {
        alert("Les mots de passe ne correspondent pas.");
        return;
      }
      if (!agreeTerms) {
        alert("Veuillez accepter les conditions d'utilisation.");
        return;
      }
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const fullName = `${firstName} ${lastName}`.trim();
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { 
              role: role,
              first_name: firstName,
              last_name: lastName,
              full_name: fullName,
              phone: phone || null,
              age: age ? parseInt(age) : null,
              height: height ? parseFloat(height) : null,
              weight: weight ? parseFloat(weight) : null
            }
          }
        });
        if (error) throw error;

        if (data.user) {
          await supabase.from("profiles").upsert([
            {
              id: data.user.id,
              role: role,
              email: email,
              first_name: firstName,
              last_name: lastName,
              full_name: fullName,
              phone: phone || null,
              age: age ? parseInt(age) : null,
              height: height ? parseFloat(height) : null,
              weight: weight ? parseFloat(weight) : null
            },
          ]);
        }

        alert("Compte créé avec succès ! Tu peux maintenant te connecter.");
        setIsSignUp(false);
      } else {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) throw authError;

        if (authData?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", authData.user.id)
            .maybeSingle();

          const userRole = profile?.role || "client";
          if (userRole === "admin") window.location.href = "/admin";
          else if (userRole === "coach") window.location.href = "/coach";
          else window.location.href = "/client";
        }
      }
    } catch (err) {
      alert(err.message || "Erreur d'authentification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl my-8">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-amber-400/10 border border-amber-400/20 rounded-2xl flex items-center justify-center mb-3">
            <Dumbbell className="w-6 h-6 text-amber-400" />
          </div>
          <h1 className="text-xl font-black text-white">COACHING VIP</h1>
          <p className="text-xs text-slate-400 mt-1">
            {isSignUp ? "Création de ton compte" : "Accède à ton espace personnel"}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Je suis :</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole("client")}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      role === "client" ? "bg-amber-400 text-slate-950 border-amber-400" : "bg-slate-950 text-slate-400 border-slate-800"
                    }`}
                  >
                    Élève
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("coach")}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      role === "coach" ? "bg-amber-400 text-slate-950 border-amber-400" : "bg-slate-950 text-slate-400 border-slate-800"
                    }`}
                  >
                    Coach
                  </button>
                </div>
              </div>

              {/* Nom & Prénom */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Prénom *</label>
                  <input
                    type="text"
                    placeholder="Jean"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Nom *</label>
                  <input
                    type="text"
                    placeholder="Dupont"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>
              </div>

              {/* Téléphone */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Téléphone *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="tel"
                    placeholder="06 12 34 56 78"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>
              </div>

              {/* Informations physiologiques facultatives */}
              <div className="pt-2 border-t border-slate-800/60">
                <p className="text-[11px] font-bold uppercase text-amber-400/80 mb-2">Informations physiques (facultatif)</p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Âge</label>
                    <input
                      type="number"
                      placeholder="25"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Taille (cm)</label>
                    <input
                      type="number"
                      placeholder="175"
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
                      placeholder="70"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Email *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              <input
                type="email"
                placeholder="exemple@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-amber-400"
                required
              />
            </div>
          </div>

          {/* Mot de passe */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Mot de passe *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-amber-400"
                required
              />
            </div>
          </div>

          {/* Confirmation du Mot de passe (Inscription seulement) */}
          {isSignUp && (
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Confirmer le mot de passe *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-amber-400"
                  required
                />
              </div>
            </div>
          )}

          {/* Case à cocher d'acceptation */}
          {isSignUp && (
            <div className="flex items-start gap-2 pt-2">
              <input
                type="checkbox"
                id="terms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-1 rounded bg-slate-950 border-slate-800 text-amber-400 focus:ring-amber-400"
                required
              />
              <label htmlFor="terms" className="text-xs text-slate-400 leading-tight">
                J'accepte les conditions d'utilisation et la politique de confidentialité.
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-black text-sm rounded-xl flex items-center justify-center gap-2 transition-all mt-6"
          >
            <span>{loading ? "CHARGEMENT..." : isSignUp ? "S'INSCRIRE" : "SE CONNECTER"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs text-slate-400 hover:text-amber-400 font-medium transition-colors"
          >
            {isSignUp ? "Déjà un compte ? Se connecter" : "Pas encore de compte ? S'inscrire"}
          </button>
        </div>
      </div>
    </div>
  );
}
