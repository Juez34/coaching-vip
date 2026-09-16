"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProfileRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    checkUserRoleAndRedirect();
  }, []);

  const checkUserRoleAndRedirect = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      // Récupérer le rôle dans la table profiles
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role === "coach") {
        router.replace("/coach/profile");
      } else {
        router.replace("/client/profile");
      }
    } catch (err) {
      console.error("Erreur de redirection profil :", err);
      router.replace("/");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
    </div>
  );
}
