import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail = Deno.env.get("RESEND_FROM_EMAIL");
  const adminEmail = Deno.env.get("ADMIN_NOTIFICATION_EMAIL") || "coaching-vip@outlook.fr";

  if (!supabaseUrl || !serviceRoleKey || !resendApiKey || !fromEmail) {
    return json({ error: "Email service is not fully configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL." }, 500);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let body: { action?: string; user_id?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const action = body.action;
  const userId = body.user_id;
  if (!userId || typeof userId !== "string") return json({ error: "Missing user_id" }, 400);

  if (action === "coach-approved") {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token || token === authHeader) return json({ error: "Authentication required" }, 401);

    const { data: authData, error: authError } = await admin.auth.getUser(token);
    if (authError || !authData.user) return json({ error: "Invalid session" }, 401);

    const { data: callerProfile, error: callerError } = await admin
      .from("profiles").select("role").eq("id", authData.user.id).maybeSingle();
    if (callerError || callerProfile?.role !== "admin") return json({ error: "Admin access required" }, 403);
  } else if (action !== "coach-requested") {
    return json({ error: "Unsupported action" }, 400);
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, email, full_name, first_name, last_name, role, requested_role, coach_request_notified_at, coach_approval_notified_at")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) return json({ error: "Could not load profile" }, 500);
  if (!profile?.email) return json({ error: "Profile or email not found" }, 404);

  const isRequest = action === "coach-requested";
  if (isRequest && !(profile.requested_role === "coach" && profile.role !== "coach")) {
    return json({ error: "No pending coach request for this profile" }, 409);
  }
  if (!isRequest && profile.role !== "coach") {
    return json({ error: "Coach role is not approved" }, 409);
  }

  const stampColumn = isRequest ? "coach_request_notified_at" : "coach_approval_notified_at";
  if (profile[stampColumn]) return json({ ok: true, alreadySent: true });

  const claimedAt = new Date().toISOString();
  const { data: claimed, error: claimError } = await admin
    .from("profiles")
    .update({ [stampColumn]: claimedAt })
    .eq("id", userId)
    .is(stampColumn, null)
    .select("id")
    .maybeSingle();

  if (claimError) return json({ error: "Could not reserve notification" }, 500);
  if (!claimed) return json({ ok: true, alreadySent: true });

  const displayName = profile.full_name || [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.email;
  const subject = isRequest
    ? "Nouvelle demande d'accès coach — Coaching VIP"
    : "Ton accès coach Coaching VIP est validé";
  const html = isRequest
    ? `<div style="font-family:Arial,sans-serif;line-height:1.6"><h2>Nouvelle demande coach</h2><p><strong>${escapeHtml(displayName)}</strong> souhaite devenir coach sur Coaching VIP.</p><p>Email : ${escapeHtml(profile.email)}</p><p>Connecte-toi à l'administration pour examiner la demande et valider l'accès.</p></div>`
    : `<div style="font-family:Arial,sans-serif;line-height:1.6"><h2>Accès coach validé</h2><p>Bonjour ${escapeHtml(displayName)},</p><p>Ton accès coach sur Coaching VIP vient d'être validé par l'administrateur. Tu peux maintenant te connecter à ton compte.</p></div>`;

  const payload = {
    from: fromEmail,
    to: [isRequest ? adminEmail : profile.email],
    subject,
    html,
  };

  let resendResponse: Response;
  try {
    resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    await admin.from("profiles").update({ [stampColumn]: null }).eq("id", userId).eq(stampColumn, claimedAt);
    return json({ error: "Could not contact email provider" }, 502);
  }

  if (!resendResponse.ok) {
    await admin.from("profiles").update({ [stampColumn]: null }).eq("id", userId).eq(stampColumn, claimedAt);
    const details = await resendResponse.text();
    console.error("Resend rejected email:", details);
    return json({ error: "Email provider rejected the message" }, 502);
  }

  return json({ ok: true });
});

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character] || character);
}
