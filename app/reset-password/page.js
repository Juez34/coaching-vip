"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { Eye, EyeOff, Lock } from "lucide-react";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const queryParams = new URLSearchParams(window.location.search);
    const linkError = hashParams.get("error_description") || queryParams.get("error_description");
    if (linkError && active) {
      setError("Ce lien de réinitialisation est invalide ou a expiré. Demande un nouveau lien.");
      setChecking(false);
    }

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" || session) setHasSession(true);
      setChecking(false);
    });

    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      if (sessionError) setError("Impossible de vérifier le lien. Demande un nouveau lien de réinitialisation.");
      if (data.session) setHasSession(true);
      setChecking(false);
    }).catch(() => {
      if (active) {
        setError("Impossible de vérifier le lien. Demande un nouveau lien de réinitialisation.");
        setChecking(false);
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setMessage("Mot de passe modifié. Tu peux maintenant te connecter avec ton nouveau mot de passe.");
      setPassword("");
      setConfirmPassword("");
      try {
        await supabase.auth.signOut();
      } catch (signOutError) {
        // Le changement du mot de passe a réussi : une erreur de déconnexion ne doit pas l'annuler.
        console.warn("Le mot de passe a été modifié, mais la déconnexion automatique a échoué.", signOutError);
      }
    } catch (err) {
      const rawMessage = String(err?.message || "").toLowerCase();
      if (rawMessage.includes("session") || rawMessage.includes("expired") || rawMessage.includes("invalid")) {
        setError("Le lien de réinitialisation a expiré ou n'est plus valide. Demande un nouveau lien.");
      } else if (rawMessage.includes("password") || rawMessage.includes("weak")) {
        setError("Ce mot de passe ne respecte pas les exigences de sécurité. Choisis-en un autre d'au moins 8 caractères.");
      } else {
        setError("La modification du mot de passe a échoué. Réessaie ou demande un nouveau lien.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <h1 className="text-xl font-black text-white">Nouveau mot de passe</h1>
        {checking ? (
          <p className="mt-4 text-sm text-slate-400">Vérification du lien…</p>
        ) : hasSession ? (
          <>
            <p className="mt-2 text-sm text-slate-400">Choisis un nouveau mot de passe pour ton compte Coaching VIP.</p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="password" className="mb-1 block text-xs font-bold uppercase text-slate-400">Nouveau mot de passe</label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                  <input id="password" type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-9 pr-11 text-sm text-white focus:border-amber-400 focus:outline-none" />
                  <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"} aria-pressed={showPassword} className="absolute right-3 top-1/2 -translate-y-1/2 rounded text-slate-400 hover:text-amber-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                </div>
              </div>
              <div>
                <label htmlFor="confirmPassword" className="mb-1 block text-xs font-bold uppercase text-slate-400">Confirmer le mot de passe</label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                  <input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} autoComplete="new-password" required minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-9 pr-11 text-sm text-white focus:border-amber-400 focus:outline-none" />
                  <button type="button" onClick={() => setShowConfirmPassword((visible) => !visible)} aria-label={showConfirmPassword ? "Masquer la confirmation du mot de passe" : "Afficher la confirmation du mot de passe"} aria-pressed={showConfirmPassword} className="absolute right-3 top-1/2 -translate-y-1/2 rounded text-slate-400 hover:text-amber-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400">{showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                </div>
                {confirmPassword && <p className={password === confirmPassword ? "mt-1 text-xs text-emerald-300" : "mt-1 text-xs text-red-300"}>{password === confirmPassword ? "Les mots de passe correspondent." : "Les mots de passe ne correspondent pas."}</p>}
              </div>
              {message && <p role="status" className="rounded-xl border border-emerald-900 bg-emerald-950/40 p-3 text-sm text-emerald-200">{message}</p>}
              {error && <p role="alert" className="rounded-xl border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">{error}</p>}
              <button type="submit" disabled={loading || !!message} className="w-full rounded-xl bg-amber-400 py-3 font-black text-slate-950 hover:bg-amber-300 disabled:opacity-50">{loading ? "ENREGISTREMENT..." : "MODIFIER LE MOT DE PASSE"}</button>
            </form>
          </>
        ) : (
          <div className="mt-4 space-y-4">
            <p role="alert" className="text-sm text-red-200">{error || "Le lien de réinitialisation est invalide ou a expiré. Demande un nouveau lien."}</p>
            <Link href="/forgot-password" className="inline-block rounded-xl bg-amber-400 px-4 py-3 font-black text-slate-950 hover:bg-amber-300">Demander un nouveau lien</Link>
          </div>
        )}
        <p className="mt-6 text-center text-sm"><Link href="/login" className="font-medium text-amber-400 hover:text-amber-300">Retour à la connexion</Link></p>
      </section>
    </main>
  );
}
