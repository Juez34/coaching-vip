"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
      await supabase.auth.signOut();
    } catch (err) {
      setError(err?.message || "La modification du mot de passe a échoué. Demande un nouveau lien si nécessaire.");
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
                <input id="password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm text-white focus:border-amber-400 focus:outline-none" />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="mb-1 block text-xs font-bold uppercase text-slate-400">Confirmer le mot de passe</label>
                <input id="confirmPassword" type="password" autoComplete="new-password" required minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm text-white focus:border-amber-400 focus:outline-none" />
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
