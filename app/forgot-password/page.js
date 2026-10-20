"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
      if (resetError) throw resetError;
      setMessage("Si un compte correspond à cette adresse, un e-mail de réinitialisation va être envoyé. Vérifie aussi les courriers indésirables.");
    } catch (err) {
      setError(err?.message || "Impossible d'envoyer le lien pour le moment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <h1 className="text-xl font-black text-white">Mot de passe oublié</h1>
        <p className="mt-2 text-sm text-slate-400">Saisis l’adresse e-mail associée à ton compte Coaching VIP pour recevoir un lien de réinitialisation.</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-xs font-bold uppercase text-slate-400">Adresse e-mail</label>
            <input id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm text-white focus:border-amber-400 focus:outline-none" placeholder="exemple@email.com" />
          </div>
          {message && <p role="status" className="rounded-xl border border-emerald-900 bg-emerald-950/40 p-3 text-sm text-emerald-200">{message}</p>}
          {error && <p role="alert" className="rounded-xl border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">{error}</p>}
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-amber-400 py-3 font-black text-slate-950 hover:bg-amber-300 disabled:opacity-50">{loading ? "ENVOI..." : "ENVOYER LE LIEN"}</button>
        </form>
        <p className="mt-6 text-center text-sm"><Link href="/login" className="font-medium text-amber-400 hover:text-amber-300">Retour à la connexion</Link></p>
      </section>
    </main>
  );
}
