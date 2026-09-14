"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Loader2 } from "lucide-react";

export default function Home() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserAndRedirect = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          window.location.href = "/login";
          return;
        }

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (error || !profile) {
          console.error("Profil non trouvé:", error);
          window.location.href = "/login";
          return;
        }

        if (profile.role === "admin") {
          window.location.href = "/admin";
        } else if (profile.role === "coach") {
          window.location.href = "/coach";
        } else {
          window.location.href = "/client";
        }
      } catch (err) {
        console.error("Erreur redirection:", err);
        window.location.href = "/login";
      }
    };

    checkUserAndRedirect();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-sans">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
          Redirection vers ton espace...
        </p>
      </div>
    </div>
  );
}
