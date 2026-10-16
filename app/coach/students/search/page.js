"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Search, UserRound, Send, Inbox } from "lucide-react";
import { supabase } from "../../../../lib/supabase";

export default function FindStudentsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadStudents = useCallback(async (term = "") => {
    setLoading(true);
    setError("");
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user) {
      router.replace("/login");
      return;
    }

    const [{ data: studentData, error: studentError }, { data: requestData, error: requestError }] = await Promise.all([
      supabase.rpc("search_students", { search_text: term || null }),
      supabase.rpc("list_coaching_requests"),
    ]);

    if (studentError || requestError) {
      setError("La recherche des élèves n'est pas encore disponible. Vérifiez que la migration de test est appliquée.");
      setLoading(false);
      return;
    }
    setStudents(studentData || []);
    setRequests(requestData || []);
    setLoading(false);
  }, [router]);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  const sendRequest = async (studentId) => {
    setBusyId(studentId);
    setError("");
    setNotice("");
    const { error: requestError } = await supabase.rpc("create_coaching_request", { target_user_id: studentId });
    if (requestError) {
      setError(requestError.message === "Request already pending"
        ? "Une demande est déjà en attente pour cet élève."
        : requestError.message === "Already connected"
          ? "Vous êtes déjà relié à cet élève."
          : "Impossible d'envoyer la demande. " + requestError.message);
    } else {
      setNotice("Demande envoyée. L'élève pourra l'accepter ou la refuser depuis « Mes demandes ».");
      await loadStudents(search);
    }
    setBusyId("");
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 max-w-5xl mx-auto pb-24 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-amber-400">Coaching VIP</p>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">Trouver un élève</h1>
          <p className="text-sm text-slate-400 mt-2">Recherchez un profil et proposez une mise en relation.</p>
        </div>
        <Link href="/coach/requests" className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-amber-400"><Inbox className="w-4 h-4" /> Mes demandes</Link>
      </header>

      <form onSubmit={(event) => { event.preventDefault(); loadStudents(search); }} className="flex gap-2">
        <label className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nom, objectif, niveau…" className="w-full rounded-xl border border-slate-800 bg-slate-900 py-3 pl-10 pr-3 text-sm text-white outline-none focus:border-amber-400" />
        </label>
        <button type="submit" className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-bold text-slate-950">Rechercher</button>
      </form>

      {error && <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}
      {notice && <p role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">{notice}</p>}

      {loading ? <div className="flex justify-center py-12"><Loader2 className="w-7 h-7 animate-spin text-amber-400" /></div> :
        students.length === 0 ? <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-sm text-slate-400">Aucun élève disponible pour cette recherche.</div> :
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {students.map((student) => {
            const pending = requests.some((item) => item.sender_id === student.id && item.receiver_id && item.status === "pending");
            const requestToMe = requests.some((item) => item.sender_id === student.id && item.status === "pending");
            return <article key={student.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/10 text-amber-400"><UserRound className="w-5 h-5" /></div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-bold text-white">{student.full_name || "Élève"}</h2>
                  {student.fitness_goal && <p className="mt-1 text-xs text-amber-300">Objectif : {student.fitness_goal}</p>}
                  {student.experience_level && <p className="mt-1 text-xs text-slate-500">Niveau : {student.experience_level}</p>}
                </div>
              </div>
              <button disabled={busyId === student.id || pending || requestToMe} onClick={() => sendRequest(student.id)} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">
                {busyId === student.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {pending ? "Demande en attente" : requestToMe ? "Demande reçue — voir mes demandes" : "Proposer un accompagnement"}
              </button>
            </article>;
          })}
        </section>
      }
    </main>
  );
}
