"use client";
import React, { useState } from "react";
import { supabase } from "../../lib/supabase";
import { Dumbbell, ArrowRight, Lock, Mail } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState("client");
  const [loading, setLoading] = useState(false);

  const redirectUser = (userRole) => {
    if (userRole === "admin") window.location.assign("/admin");
    else if (userRole === "coach") window.location.assign("/coach");
    else window.location.assign("/client");
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        // INSCRIPTION
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        if (data.user) {
          const { error: profileError } = await supabase.from("profiles").upsert([
            {
              id: data.user.id,
              role: role,
            },
          ]);
          if (profileError) console.error("Erreur profil:", profileError);
        }

        alert("Compte créé avec succès ! Tu peux maintenant te connecter.");
        setIsSignUp(false);
      } else {
        // CONNEXION
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        // On récupère le profil
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .maybeSingle();

        const userRole = profile?.role || "client";
        
        // Redirection directe vers le bon espace
        redirectUser(userRole);
      }
    } catch (err) {
      alert(err.message || "Erreur d'authentification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-amber-400/10 border border-amber-400/20 rounded-2xl flex items-center justify-center mb-3">
            <Dumbbell className="w-6 h-6 text-amber-400" />
          </div>
          <h1 className="text-xl font-black text-white">COACHING VIP</h1>
          <p className="text-xs text-slate-400 mt-1">
            {isSignUp ? "Crée ton compte pour démarrer" : "Accède à ton espace personnel"}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-2">
                Je suis :
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole("client")}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    role === "client"
                      ? "bg-amber-400 text-slate-950 border-amber-400"
                      : "bg-slate-950 text-slate-400 border-slate-800"
                  }`}
                >
                  Élève
                </button>
                <button
                  type="button"
                  onClick={() => setRole("coach")}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    role === "coach"
                      ? "bg-amber-400 text-slate-950 border-amber-400"
                      : "bg-slate-950 text-slate-400 border-slate-800"
                  }`}
                >
                  Coach
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Email</label>
            <input
              type="email"
              placeholder="exemple@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-3 text-sm text-white focus:outline-none focus:border-amber-400"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Mot de passe</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-3 text-sm text-white focus:outline-none focus:border-amber-400"
              required
            />
          </div>

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
