"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Check, Loader2, RefreshCw, X } from "lucide-react";

export default function CoachingRequests({ role }) {
  const [requests, setRequests] = useState([]);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user) {
      setError("Connectez-vous pour consulter vos demandes.");
      setLoading(false);
      return;
    }
    setUserId(authData.user.id);

    const { data, error: requestError } = await supabase.rpc("list_coaching_requests");
    if (requestError) {
      setError("Impossible de charger les demandes. Vérifiez que la migration de test est appliquée.");
      setLoading(false);
      return;
    }
    setRequests((data || []).filter((item) =>
      item.sender_role !== item.receiver_role &&
      (item.sender_role === role || item.receiver_role === role)
    ));
    setLoading(false);
  }, [role]);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  const respond = async (requestId, decision) => {
    setBusyId(requestId);
    setError("");
    setNotice("");
    const { error: responseError } = await supabase.rpc("respond_to_coaching_request", {
      request_id: requestId,
      decision,
    });
    if (responseError) {
      setError(responseError.message || "La réponse n'a pas pu être enregistrée.");
    } else {
      setNotice(decision === "accepted" ? "Demande acceptée : le lien coach–élève est créé." : "Demande refusée.");
      await loadRequests();
    }
    setBusyId(null);
  };

  const displayName = (item) =>
    item.sender_id === userId ? item.receiver_name : item.sender_name;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">Demandes de mise en relation</h1>
          <p className="text-sm text-slate-400 mt-1">Acceptez ou refusez les demandes entrantes.</p>
        </div>
        <button onClick={loadRequests} className="rounded-xl border border-slate-700 p-2 text-slate-300 hover:text-amber-400" aria-label="Actualiser">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {error && <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}
      {notice && <p role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">{notice}</p>}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-7 h-7 animate-spin text-amber-400" /></div>
      ) : requests.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-sm text-slate-400">
          Aucune demande pour le moment.
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((item) => {
            const incoming = item.receiver_id === userId;
            return (
              <article key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="font-semibold text-white">{displayName(item) || "Profil"}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {incoming ? "Demande reçue" : "Demande envoyée"} · {new Date(item.created_at).toLocaleDateString("fr-FR")}
                    </p>
                    <span className={"inline-flex mt-2 rounded-full border px-2.5 py-1 text-xs " + (
                      item.status === "accepted" ? "border-emerald-500/30 text-emerald-300" :
                      item.status === "rejected" ? "border-rose-500/30 text-rose-300" :
                      "border-amber-500/30 text-amber-300"
                    )}>
                      {item.status === "accepted" ? "Acceptée" : item.status === "rejected" ? "Refusée" : "En attente"}
                    </span>
                  </div>
                  {incoming && item.status === "pending" && (
                    <div className="flex gap-2">
                      <button disabled={busyId === item.id} onClick={() => respond(item.id, "accepted")} className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-3 py-2 text-sm font-bold text-slate-950 disabled:opacity-50">
                        {busyId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Accepter
                      </button>
                      <button disabled={busyId === item.id} onClick={() => respond(item.id, "rejected")} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-200 disabled:opacity-50">
                        <X className="w-4 h-4" /> Refuser
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
