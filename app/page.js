"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Dumbbell, ArrowRight, Shield, Users, Zap, Loader2 } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [userSession, setUserSession] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          setUserSession(user);
          // Si déjà connecté, on redirige vers son espace
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle();

          const role = profile?.role || "client";
          if (role === "admin") window.location.href = "/admin";
          else if (role === "coach") window.location.href = "/coach";
          else window.location.href = "/client";
        } else {
          // Si non connecté, on arrête le chargement et on affiche la vitrine
          setLoading(false);
        }
      } catch (err) {
        console.error("Erreur vérification session:", err);
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between p-6 max-w-5xl mx-auto">
      <header className="flex justify-between items-center py-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-amber-400/10 border border-amber-400/20 rounded-xl flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-amber-400" />
          </div>
          <span className="font-black text-lg text-white tracking-tight">COACHING VIP</span>
        </div>
        <Link
          href="/login"
          className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-all"
        >
          Se connecter
        </Link>
      </header>

      <main className="py-16 text-center max-w-2xl mx-auto space-y-6">
        <span className="text-xs font-extrabold tracking-widest text-amber-400 uppercase bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
          PLATEFORME HAUT DE GAMME
        </span>
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
          Le suivi sportif personnalisé, réinventé.
        </h1>
        <p className="text-slate-400 text-sm sm:text-base">
          Connectez coaches et élèves sur une interface dédiée. Programmes sur-mesure, suivi en direct et analyse des performances.
        </p>

        <div className="pt-4 flex justify-center gap-4">
          <Link
            href="/login"
            className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-6 py-3.5 rounded-2xl text-sm flex items-center gap-2 transition-all shadow-lg shadow-amber-400/10"
          >
            <span>DÉMARRER MAINTENANT</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      <footer className="py-6 border-t border-slate-800 text-center text-xs text-slate-500">
        © Coaching VIP — Tous droits réservés.
      </footer>
    </div>
  );
}
