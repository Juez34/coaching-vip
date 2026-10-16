"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import { Menu, X, LayoutDashboard, UserRound, Users, Dumbbell, LogOut, ChevronDown, Search, Inbox, UserPlus } from "lucide-react";

const ROLE_ITEMS = {
  admin: [
    { label: "Mon tableau de bord", href: "/admin", icon: LayoutDashboard },
    { label: "Mon profil", href: "/admin/profile", icon: UserRound },
  ],
  coach: [
    { label: "Mon tableau de bord", href: "/coach", icon: LayoutDashboard },
    { label: "Mes élèves", href: "/coach", icon: Users },
    { label: "Trouver un élève", href: "/coach/students/search", icon: UserPlus },
    { label: "Demandes reçues", href: "/coach/requests", icon: Inbox },
    { label: "Mon profil", href: "/coach/profile", icon: UserRound },
  ],
  student: [
    { label: "Mon tableau de bord", href: "/client", icon: LayoutDashboard },
    { label: "Mes séances", href: "/client", icon: Dumbbell },
    { label: "Trouver un coach", href: "/client/coaches", icon: Search },
    { label: "Mes demandes", href: "/client/requests", icon: Inbox },
    { label: "Mon profil", href: "/client/profile", icon: UserRound },
  ],
};

export default function RoleNavigation({ role = "student" }) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const menuRef = useRef(null);
  const router = useRouter();
  const items = ROLE_ITEMS[role] || ROLE_ITEMS.student;

  useEffect(() => {
    let active = true;
    const loadPendingCount = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) return;
      const { data } = await supabase.rpc("list_coaching_requests");
      if (!active || !data) return;
      setPendingCount(data.filter((item) => item.receiver_id === authData.user.id && item.status === "pending").length);
    };
    loadPendingCount();
    const onFocus = () => loadPendingCount();
    window.addEventListener("focus", onFocus);
    return () => {
      active = false;
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Erreur lors de la déconnexion :", error);
      setSigningOut(false);
      return;
    }
    setOpen(false);
    router.replace("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href={role === "admin" ? "/admin" : role === "coach" ? "/coach" : "/client"} className="min-w-0">
          <span className="block truncate text-sm font-black tracking-wide text-white">COACHING <span className="text-amber-400">VIP</span></span>
          <span className="block text-[10px] uppercase tracking-wider text-slate-500">{role === "admin" ? "Espace administrateur" : role === "coach" ? "Espace coach" : "Espace élève"}</span>
        </Link>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-haspopup="menu"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-semibold text-slate-100 transition hover:border-amber-400/60 hover:text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            <span>Menu</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>

          {open && (
            <nav role="menu" aria-label="Navigation principale" className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-2 shadow-2xl shadow-black/40">
              {items.map(({ label, href, icon: Icon }, index) => (
                <Link
                  key={label}
                  href={href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-200 transition hover:bg-slate-800 hover:text-amber-300 ${index ? "mt-1" : ""}`}
                >
                  <Icon className="h-4 w-4 shrink-0 text-amber-400" />
                  <span className="flex-1">{label}</span>\n                  {pendingCount > 0 && (href === "/coach/requests" || href === "/client/requests") && <span className="min-w-5 rounded-full bg-amber-400 px-1.5 py-0.5 text-center text-[10px] font-black text-slate-950">{pendingCount > 99 ? "99+" : pendingCount}</span>}
                </Link>
              ))}
              <div className="my-2 border-t border-slate-800" />
              <button
                type="button"
                role="menuitem"
                onClick={handleSignOut}
                disabled={signingOut}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-rose-300 transition hover:bg-rose-500/10 disabled:opacity-60"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                <span>{signingOut ? "Déconnexion…" : "Déconnexion"}</span>
              </button>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}
