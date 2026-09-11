"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Users, Dumbbell, TrendingUp, Plus, Search, Check, UserPlus, Loader2 } from "lucide-react";
import Link from "next/link";

export default function CoachDashboard() {
  const [clients, setClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Recherche dynamique des élèves par email/nom
  const handleSearchClient = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setLoadingSearch(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("role", "client")
      .ilike("id", `%${query}%`); // Recherche par identifiant/email

    if (!error) setSearchResults(data || []);
    setLoadingSearch(false);
  };

  const assignClient = async (clientId) => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return alert("Session expirée.");

    const { error } = await supabase
      .from("profiles")
      .update({ coach_id: user.user.id })
      .eq("id", clientId);

    if (error) {
      alert("Erreur lors de l'assignation.");
    } else {
      alert("Élève ajouté avec succès à ta liste !");
      setShowAddModal(false);
      setSearchQuery("");
      setSearchResults([]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 max-w-6xl mx-auto pb-16">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Tableau de bord Coach</h1>
          <p className="text-sm text-slate-400">Gère tes élèves et leur suivi.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 border border-slate-700 transition-all text-sm"
          >
            <UserPlus className="w-4 h-4 text-amber-400" />
            <span>Ajouter un Élève</span>
          </button>
          <Link
            href="/coach/new-program"
            className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Créer un Programme</span>
          </Link>
        </div>
      </header>

      {/* Modal de recherche / ajout d'élève */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Rechercher un élève</h2>
              <button onClick={() => setShowAddModal(false)} className="text-xs text-slate-400 hover:text-white">Fermer</button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              <input
                type="text"
                placeholder="Tape le nom ou l'ID de l'élève..."
                value={searchQuery}
                onChange={(e) => handleSearchClient(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {loadingSearch && <Loader2 className="w-5 h-5 animate-spin text-amber-400 mx-auto py-2" />}
              {searchResults.map((client) => (
                <div key={client.id} className="flex justify-between items-center p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-xs font-mono text-slate-300 truncate max-w-[200px]">{client.id}</span>
                  <button
                    onClick={() => assignClient(client.id)}
                    className="bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" /> Ajouter
                  </button>
                </div>
              ))}
              {!loadingSearch && searchQuery.length >= 2 && searchResults.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-2">Aucun élève trouvé.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
