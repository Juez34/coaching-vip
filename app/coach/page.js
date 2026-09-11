"use client";
import React, { useState } from "react";
import { Users, Dumbbell, TrendingUp, Plus, Search, ChevronRight, CheckCircle2, Clock } from "lucide-react";


export default function CoachDashboard() {
  const [activeTab, setActiveTab] = useState("clients");

  const clients = [
    { id: 1, name: "Thomas Durand", plan: "VIP Suivi Total", lastWorkout: "Aujourd'hui (Séance 1)", status: "Completed", avatar: "TD" },
    { id: 2, name: "Sophie Martin", plan: "VIP Performance", lastWorkout: "Hier (Jambes)", status: "Completed", avatar: "SM" },
    { id: 3, name: "Alexandre Petit", plan: "VIP Suivi Total", lastWorkout: "En attente (Séance 2)", status: "Pending", avatar: "AP" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex">
      {/* Barre de navigation latérale */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col justify-between hidden md:flex">
        <div>
          <div className="flex items-center gap-2 mb-8">
            <span className="text-xs font-black tracking-widest text-amber-400 uppercase bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
              COACHING VIP
            </span>
          </div>
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab("clients")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                activeTab === "clients" ? "bg-amber-400 text-slate-950 font-bold" : "text-slate-400 hover:bg-slate-800"
              }`}
            >
              <Users className="w-5 h-5" />
              <span>Mes Élèves</span>
            </button>
            <button
              onClick={() => setActiveTab("programs")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                activeTab === "programs" ? "bg-amber-400 text-slate-950 font-bold" : "text-slate-400 hover:bg-slate-800"
              }`}
            >
              <Dumbbell className="w-5 h-5" />
              <span>Programmes</span>
            </button>
          </nav>
        </div>
        <div className="border-t border-slate-800 pt-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center">
              PRO
            </div>
            <div>
              <p className="text-sm font-bold text-white">Espace Coach</p>
              <p className="text-xs text-slate-500">Abonnement Actif</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Contenu principal */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Tableau de bord</h1>
            <p className="text-sm text-slate-400">Gère tes élèves et leurs séances en temps réel.</p>
          </div>
          <button className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all">
            <Plus className="w-5 h-5" />
            <span>Nouveau Client</span>
          </button>
        </header>

        {/* Métriques clés */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Élèves Actifs</span>
              <Users className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-3xl font-black text-white">12</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Séances Validées (Semaine)</span>
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-3xl font-black text-white">28</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Revenu Mensuel Estimé</span>
              <TrendingUp className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-3xl font-black text-white">1 440 €</p>
          </div>
        </div>

        {/* Liste des Élèves */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Suivi des Élèves</h2>
          <div className="space-y-3">
            {clients.map((client) => (
              <div key={client.id} className="flex items-center justify-between p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl hover:border-slate-700 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 font-bold text-amber-400 flex items-center justify-center text-sm">
                    {client.avatar}
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{client.name}</h3>
                    <p className="text-xs text-slate-400">{client.plan}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-slate-300 font-medium">{client.lastWorkout}</p>
                    <span className={`text-[10px] font-bold ${client.status === 'Completed' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {client.status === 'Completed' ? 'Séance validée' : 'En attente'}
                    </span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-600" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
