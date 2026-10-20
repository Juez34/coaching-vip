"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Search, UserRound, Send, CheckCircle2 } from "lucide-react";
import { supabase } from "../../../lib/supabase";

const FEATURED_COACH_ID = "6aff5f48-44ec-4ddd-8dc4-4a77a05629dc";

export default function FindCoachesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [coaches, setCoaches] = useState([]);
  const [requests, setRequests] = useState([]);
  const [connectedIds, setConnectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadCoaches = useCallback(async (term = "") => {
    setLoading(true);
    setError("");
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user) {
      router.replace("/login");
      return;
    }

    const [{ data: coachData, error: coachError }, { data: requestData, error: requestError }, { data: links, error: linkError }] = await Promise.all([
      supabase.rpc("search_coaches", { search_text: term || null }),
      supabase.rpc("list_coaching_requests"),
      supabase.from("student_coaches").select("coach_id").eq("student_id", authData.user.id),
    ]);

    if (coachError || requestError || linkError) {
      setError("La recherche des coachs n'est pas encore disponible. Vérifiez que la migration de test est appliquée.");
      setLoading(false);
      return;
    }

    setCoaches((coachData || []).sort((a, b) => {
      if (a.id === FEATURED_COACH_ID) return -1;
      if (b.id === FEATURED_COACH_ID) return 1;
      return (a.full_name || "").localeCompare(b.full_name || "", "fr");
    }));
    setRequests(requestData || []);
    setConnectedIds((links || []).map((link) => link.coach_id));
    setLoading(false);
  }, [router]);

  useEffect(() => { loadCoaches(); }, [loadCoaches]);

  const sendRequest = async (coachId) => {
    setBusyId(coachId);
    setError("");
    setNotice("");
    const { error: requestError } = await supabase.rpc("create_coaching_request", { target_user_id: coachId });
    if (requestError) {
      setError(requestError.message === "Request already pending"
        ? "Une demande est déjà en attente pour ce coach."
        : requestError.message === "Already connected"
          ? "Vous êtes déjà relié à ce coach."
          : "Impossible d'envoyer la demande. " + requestError.message);
    } else {
      setNotice("Demande envoyée. Vous pourrez suivre sa réponse dans « Mes demandes ».");
      await loadCoaches(search);
    }
    setBusyId("");
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 max-w-5xl mx-auto pb-24 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-amber-400">Coaching VIP</p>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">Trouver un coach</h1>
          <p className="text-sm text-slate-400 mt-2">Comparez les profils et envoyez une demande de mise en relation.</p>
        </div>
        <Link href="/client/requests" className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-amber-400">Mes demandes</Link>
      </header>

      <form onSubmit={(event) => { event.preventDefault(); loadCoaches(search); }} className="flex gap-2">
        <label className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nom, spécialité, objectif…" className="w-full rounded-xl border border-slate-800 bg-slate-900 py-3 pl-10 pr-3 text-sm text-white outline-none focus:border-amber-400" />
        </label>
        <button type="submit" className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-bold text-slate-950">Rechercher</button>
      </form>

      {error && <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}
      {notice && <p role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">{notice}</p>}

      {loading ? <div className="flex justify-center py-12"><Loader2 className="w-7 h-7 animate-spin text-amber-400" /></div> :
        coaches.length === 0 ? <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-sm text-slate-400">Aucun coach trouvé.</div> :
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {coaches.map((coach) => {
            const outgoing = requests.some((item) => item.sender_id && item.receiver_id === coach.id && item.status === "pending");
            const incoming = requests.some((item) => item.sender_id === coach.id && item.status === "pending");
            const linked = connectedIds.includes(coach.id);
            return <article key={coach.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/10 text-amber-400"><UserRound className="w-5 h-5" /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold text-white">{coach.full_name || "Coach"}</h2>
                    {coach.id === FEATURED_COACH_ID && <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold text-amber-300">Coach à la une</span>}
                  </div>
                  {coach.specialties && <p className="mt-1 text-xs text-amber-300">{coach.specialties}</p>}
                  {coach.years_experience != null && <p className="mt-1 text-xs text-slate-500">{coach.years_experience} an(s) d'expérience</p>}
                </div>
              </div>
              {coach.bio && <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-line">{coach.bio}</p>}
              {coach.certifications && <p className="text-xs text-slate-500">Certifications : {coach.certifications}</p>}
              <button disabled={busyId === coach.id || linked || outgoing || incoming} onClick={() => sendRequest(coach.id)} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">
                {busyId === coach.id ? <Loader2 className="w-4 h-4 animate-spin" /> : linked ? <CheckCircle2 className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                {linked ? "Déjà votre coach" : outgoing ? "Demande en attente" : incoming ? "Demande reçue — voir mes demandes" : "Demander à être accompagné"}
              </button>
            </article>;
          })}
        </section>
      }
    </main>
  );
}
