"use client";
import React, { useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Dumbbell, ArrowRight, Shield, Zap, TrendingUp, Users, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function Home() {
  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "admin") window.location.href = "/admin";
    else if (profile?.role === "coach") window.location.href = "/coach";
    else if (profile?.role === "client") window.location.href = "/client";
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* Barre de navigation */}
      <nav className="border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md fixed top-0 w-full z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-amber-400/10 border border-amber-400/20 rounded-xl flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-amber-400" />
            </div>
            <span className="font-black text-lg text-white tracking-tight">COACHING VIP</span>
          </div>
          <Link
            href="/login"
            className="text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 px-4 py-2.5 rounded-xl transition-all shadow-md shadow-amber-400/10"
          >
            Se Connecter
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 max-w-4xl mx-auto text-center">
        <span className="text-xs font-extrabold tracking-widest text-amber-400 uppercase bg-amber-400/10 px-3.5 py-1.5 rounded-full border border-amber-400/20 inline-block mb-6">
          Plateforme All-in-One pour Coachs & Elèves
        </span>
        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight mb-6">
          Suivi sportif <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">sur mesure</span> & résultats maximaux.
        </h1>
        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
          Créez des programmes d'entraînement d'exception, suivez les performances en direct et offrez une expérience VIP à vos clients.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/login"
            className="w-full sm:w-auto bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-8 py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-amber-400/10"
          >
            <span>DÉMARRER MAINTENANT</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Grille de fonctionnalités */}
      <section className="py-16 px-6 max-w-6xl mx-auto border-t border-slate-800/60">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
            <Zap className="w-8 h-8 text-amber-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Programmes Sur-Mesure</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Concevez des séances personnalisées pour chaque élève, ajustez les charges, séries et consignes en quelques clics.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
            <TrendingUp className="w-8 h-8 text-amber-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Suivi des Performances</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Validation des séries en temps réel par l'élève et remontée automatique du compte-rendu au coach.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
            <Shield className="w-8 h-8 text-amber-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Espace Sécurisé</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Gestion stricte des données et des accès entre coaches, élèves et administration globale.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
