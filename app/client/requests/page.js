"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import CoachingRequests from "../../../components/CoachingRequests";
import { supabase } from "../../../lib/supabase";

export default function ClientRequestsPage() {
  const router = useRouter();
  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data, error }) => {
      if (active && (error || !data?.user)) router.replace("/login");
    });
    return () => { active = false; };
  }, [router]);

  return <main className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 max-w-4xl mx-auto pb-24"><CoachingRequests role="client" /></main>;
}
