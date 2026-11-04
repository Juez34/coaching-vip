"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data, error: authError }) => {
      if (!active) return;
      if (authError || !data.user) {
        router.replace("/login");
        return;
      }
      setSignedIn(true);
      setChecking(false);
    }).catch(() => {
      if (!active) return;
      router.replace("/login");
    });
    return () => { active = false; };
  }, [router]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirmation) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setSaving(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setPassword("");
      setConfirmation("");
      setMessage("Ton mot de passe a été modifié.");
    } catch (err) {
      const rawMessage = String(err?.message || "").toLowerCase();
      setError(rawMessage.includes("password") || rawMessage.includes("weak")
        ? "Choisis un mot de passe d'au moins 8 caractères qui respecte les exigences de sécurité."
        : "La modification a échoué. Reconnecte-toi puis réessaie.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <Link href="/profile" className="mb-5 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-amber-400">
          <ArrowLeft className="h-4 w-4" /> Retour au profil
        </Link>
        <h1 className="text-xl font-black text-white">Modifier mon mot de passe</h1>
        <p className="mt-2 text-sm text-slate-400">Choisis un nouveau mot de passe pour ton compte.</p>
        {checking ? <p className="mt-5 text-sm text-slate-400"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Vérification du compte…</p> : signedIn && (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="new-password" className="mb-1 block text-xs font-bold uppercase text-slate-400">Nouveau mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                <input id="new-password" type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-9 pr-11 text-sm text-white focus:border-amber-400 focus:outline-none" />
                <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-400">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
              </div>
            </div>
            <div>
              <label htmlFor="confirm-password" className="mb-1 block text-xs font-bold uppercase text-slate-400">Confirmer le nouveau mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                <input id="confirm-password" type={showConfirmation ? "text" : "password"} autoComplete="new-password" minLength={8} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-9 pr-11 text-sm text-white focus:border-amber-400 focus:outline-none" />
                <button type="button" onClick={() => setShowConfirmation((value) => !value)} aria-label={showConfirmation ? "Masquer la confirmation" : "Afficher la confirmation"} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-400">{showConfirmation ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
              </div>
            </div>
            {confirmation && <p className={password === confirmation ? "text-xs text-emerald-300" : "text-xs text-red-300"}>{password === confirmation ? "Les mots de passe correspondent." : "Les mots de passe ne correspondent pas."}</p>}
            {error && <p role="alert" className="rounded-xl border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">{error}</p>}
            {message && <p role="status" className="rounded-xl border border-emerald-900 bg-emerald-950/40 p-3 text-sm text-emerald-200">{message}</p>}
            <button type="submit" disabled={saving || !!message} className="w-full rounded-xl bg-amber-400 py-3 font-black text-slate-950 hover:bg-amber-300 disabled:opacity-50">{saving ? "ENREGISTREMENT…" : "ENREGISTRER LE NOUVEAU MOT DE PASSE"}</button>
          </form>
        )}
      </section>
    </main>
  );
}
