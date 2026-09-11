"use client";
import React, { useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Dumbbell, ArrowRight } from "lucide-react";
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 bg-amber-400/10 border border-amber-400/20 rounded-2xl flex items-center justify-center mb-6">
        <Dumbbell className="w-8 h-8 text-amber-400" />
      </div>
      <h1 className="text-3xl font-black text-white tracking-tight mb-2">COACHING VIP</h1>
      <p className="text-sm text-slate-400 max-w-sm mb-8">
        La plateforme haute performance pour la gestion et le suivi des entraînements sur mesure.
      </p>

      <Link
        href="/login"
        className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-6 py-3.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-amber-400/10"
      >
        <span>Accéder à mon espace</span>
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
