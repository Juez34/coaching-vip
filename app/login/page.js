"use client";
import React, { useState } from "react";
import { supabase } from "../../lib/supabase";
import { Dumbbell, ArrowRight, Lock, Mail, Phone, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  
  // Remplacement de l'âge par la date de naissance
  const [birthDate, setBirthDate] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");

  const [specialties, setSpecialties] = useState("");
  const [certifications, setCertifications] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [bio, setBio] = useState("");

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState("client");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleAuth = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setErrorMessage("Saisis une adresse e-mail valide.");
      return;
    }
    if (isSignUp) {
      if (password.length < 8) {
        setErrorMessage("Le mot de passe doit contenir au moins 8 caractères.");
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage("Les deux mots de passe ne correspondent pas.");
        return;
      }
      if (!agreeTerms) {
        setErrorMessage("Veuillez accepter les conditions d'utilisation.");
        return;
      }
      if (role === "client" && height && (!Number.isFinite(Number(height)) || Number(height) < 50 || Number(height) > 260)) {
        setErrorMessage("Vérifie la taille indiquée (entre 50 et 260 cm).");
        return;
      }
      if (role === "client" && weight && (!Number.isFinite(Number(weight)) || Number(weight) < 20 || Number(weight) > 350)) {
        setErrorMessage("Vérifie le poids indiqué (entre 20 et 350 kg).");
        return;
      }
      if (role === "coach" && yearsExperience && (!Number.isInteger(Number(yearsExperience)) || Number(yearsExperience) < 0 || Number(yearsExperience) > 80)) {
        setErrorMessage("Les années d'expérience doivent être un nombre entier entre 0 et 80.");
        return;
      }
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const cleanFirstName = firstName.trim();
        const cleanLastName = lastName.trim();
        const fullName = `${cleanFirstName} ${cleanLastName}`.trim();

        // Le rôle effectif reste toujours "client" à l'inscription publique.
        // Le rôle coach demandé n'accorde aucun droit tant qu'un administrateur ne l'a pas validé.
        const profileData = {
          role: "client",
          requested_role: role,
          first_name: cleanFirstName,
          last_name: cleanLastName,
          full_name: fullName,
          phone: phone.trim() || null,
        };

        if (role === "client") {
          profileData.birth_date = birthDate || null;
          profileData.height = height ? Number(height) : null;
          profileData.weight = weight ? Number(weight) : null;
        } else if (role === "coach") {
          profileData.specialties = specialties.trim() || null;
          profileData.certifications = certifications.trim() || null;
          profileData.years_experience = yearsExperience ? Number(yearsExperience) : null;
          profileData.bio = bio.trim() || null;
        }

        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: { data: profileData }
        });
        if (error) throw error;
        if (!data.user) {
          throw new Error("Le compte n'a pas pu être créé. Réessaie dans quelques instants.");
        }

        // Le profil est créé par un trigger SQL sur auth.users. Cela fonctionne même
        // lorsque Supabase exige une confirmation d'e-mail et ne crée pas de session.
        if (role === "coach") {
          const { error: notificationError } = await supabase.functions.invoke("coach-email-notifications", {
            body: { action: "coach-requested", user_id: data.user.id },
          });
          if (notificationError) {
            console.error("Demande coach enregistrée, mais notification e-mail non envoyée :", notificationError);
          }
        }

        setSuccessMessage(
          role === "coach"
            ? "Compte créé. Ta demande pour devenir coach est en attente de validation. Vérifie tes e-mails si une confirmation est demandée, puis connecte-toi."
            : "Compte créé. Vérifie tes e-mails si une confirmation est demandée, puis connecte-toi."
        );
        setIsSignUp(false);
        setPassword("");
        setConfirmPassword("");
        setAgreeTerms(false);
      } else {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        if (authError) throw authError;
        if (!authData?.user) {
          throw new Error("Connexion impossible. Réessaie.");
        }

        const { data: profile, error: profileReadError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", authData.user.id)
          .maybeSingle();

        if (profileReadError) {
          await supabase.auth.signOut();
          console.error("Impossible de lire le rôle du profil :", profileReadError);
          throw new Error("Ton compte est reconnu, mais ton profil n'a pas pu être chargé. Réessaie ; si le problème persiste, contacte l'administrateur.");
        }

        let resolvedProfile = profile;
        if (!resolvedProfile) {
          // Répare un ancien compte sans profil, sans accorder de droits privilégiés.
          const { error: repairError } = await supabase.from("profiles").insert({
            id: authData.user.id,
            email: normalizedEmail,
            role: "client",
            requested_role: "client",
            full_name: authData.user.user_metadata?.full_name || null,
          });
          if (repairError) {
            await supabase.auth.signOut();
            console.error("Impossible de réparer le profil manquant :", repairError);
            throw new Error("Ton compte existe, mais son profil est incomplet. Contacte l'administrateur pour le rétablir.");
          }
          resolvedProfile = { role: "client" };
        }

        const userRole = resolvedProfile.role || "client";
        if (userRole === "admin") router.replace("/admin");
        else if (userRole === "coach") router.replace("/coach");
        else router.replace("/client");
      }
    } catch (err) {
      const rawMessage = String(err?.message || "").toLowerCase();
      let friendlyMessage = "Une erreur est survenue. Vérifie ta connexion internet et réessaie.";
      if (rawMessage.includes("invalid login credentials") || rawMessage.includes("invalid_credentials")) {
        friendlyMessage = "Adresse e-mail ou mot de passe incorrect.";
      } else if (rawMessage.includes("email not confirmed")) {
        friendlyMessage = "Ton adresse e-mail n'est pas encore confirmée. Vérifie ta boîte de réception et tes courriers indésirables.";
      } else if (rawMessage.includes("user already registered") || rawMessage.includes("already been registered")) {
        friendlyMessage = "Un compte existe déjà avec cette adresse. Essaie de te connecter ou utilise « Mot de passe oublié ».";
      } else if (rawMessage.includes("password should be at least") || (rawMessage.includes("password") && rawMessage.includes("characters"))) {
        friendlyMessage = "Le mot de passe doit respecter les exigences de sécurité (au moins 8 caractères).";
      } else if (rawMessage.includes("rate limit") || rawMessage.includes("too many requests")) {
        friendlyMessage = "Trop de tentatives en peu de temps. Patiente quelques minutes avant de réessayer.";
      } else if (err?.message && !/supabase|postgres|jwt|rls|row-level|fetch failed/i.test(err.message)) {
        friendlyMessage = err.message;
      }
      setErrorMessage(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl my-8">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-amber-400/10 border border-amber-400/20 rounded-2xl flex items-center justify-center mb-3">
            <Dumbbell className="w-6 h-6 text-amber-400" />
          </div>
          <h1 className="text-xl font-black text-white">COACHING VIP</h1>
          <p className="text-xs text-slate-400 mt-1">
            {isSignUp ? `Création de compte (${role === 'coach' ? 'Coach' : 'Élève'})` : "Accède à ton espace personnel"}
          </p>
        </div>

        {errorMessage && <p role="alert" className="mb-4 rounded-xl border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">{errorMessage}</p>}
        {successMessage && <p role="status" className="mb-4 rounded-xl border border-emerald-900 bg-emerald-950/40 p-3 text-sm text-emerald-200">{successMessage}</p>}

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Je m'inscris en tant que :</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole("client")}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      role === "client" ? "bg-amber-400 text-slate-950 border-amber-400" : "bg-slate-950 text-slate-400 border-slate-800"
                    }`}
                  >
                    Élève
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("coach")}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      role === "coach" ? "bg-amber-400 text-slate-950 border-amber-400" : "bg-slate-950 text-slate-400 border-slate-800"
                    }`}
                  >
                    Coach
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Prénom *</label>
                  <input
                    type="text"
                    placeholder="Jean"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Nom *</label>
                  <input
                    type="text"
                    placeholder="Dupont"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Téléphone *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="tel"
                    placeholder="06 12 34 56 78"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>
              </div>

              {/* CHAMPS SPÉCIFIQUES ÉLÈVE AVEC DATE DE NAISSANCE */}
              {role === "client" && (
                <div className="pt-2 border-t border-slate-800/60">
                  <p className="text-[11px] font-bold uppercase text-amber-400/80 mb-2">Informations physiques (facultatif)</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Né(e) le</label>
                      <input
                        type="date"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-2 text-[11px] text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Taille (cm)</label>
                      <input
                        type="number"
                        min="50"
                        max="260"
                        step="1"
                        placeholder="175"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Poids (kg)</label>
                      <input
                        type="number"
                        min="20"
                        max="350"
                        step="0.1"
                        placeholder="70"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* CHAMPS SPÉCIFIQUES COACH */}
              {role === "coach" && (
                <div className="pt-2 border-t border-slate-800/60 space-y-3">
                  <p className="text-[11px] font-bold uppercase text-amber-400/80">Profil Professionnel Coach</p>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Domaines de compétence / Spécialités *</label>
                    <input
                      type="text"
                      placeholder="Prise de masse, Perte de gras..."
                      value={specialties}
                      onChange={(e) => setSpecialties(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Diplômes / Certifications</label>
                      <input
                        type="text"
                        placeholder="BPJEPS, STAPS..."
                        value={certifications}
                        onChange={(e) => setCertifications(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Années d'expérience</label>
                      <input
                        type="number"
                        min="0"
                        max="80"
                        step="1"
                        placeholder="5"
                        value={yearsExperience}
                        onChange={(e) => setYearsExperience(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Présentation / Bio (facultatif)</label>
                    <textarea
                      placeholder="Présente ta philosophie de coaching..."
                      rows={2}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400 resize-none"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Email *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              <input
                type="email"
                placeholder="exemple@email.com"
                value={email}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-amber-400"
                required
              />
            </div>
          </div>

          {!isSignUp && (
            <div className="text-right -mt-2">
              <a href="/forgot-password" className="text-xs text-amber-400 hover:text-amber-300 font-medium">
                Mot de passe oublié ?
              </a>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Mot de passe *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-9 pr-11 text-sm text-white focus:outline-none focus:border-amber-400"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                minLength={isSignUp ? 8 : undefined}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded"
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {isSignUp && (
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Confirmer le mot de passe *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-9 pr-11 text-sm text-white focus:outline-none focus:border-amber-400"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((visible) => !visible)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded"
                  aria-label={showConfirmPassword ? "Masquer la confirmation du mot de passe" : "Afficher la confirmation du mot de passe"}
                  aria-pressed={showConfirmPassword}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && <p className={password === confirmPassword ? "mt-1 text-xs text-emerald-300" : "mt-1 text-xs text-red-300"}>{password === confirmPassword ? "Les mots de passe correspondent." : "Les mots de passe ne correspondent pas."}</p>}
            </div>
          )}

          {isSignUp && (
            <div className="flex items-start gap-2 pt-2">
              <input
                type="checkbox"
                id="terms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-1 rounded bg-slate-950 border-slate-800 text-amber-400 focus:ring-amber-400"
                required
              />
              <label htmlFor="terms" className="text-xs text-slate-400 leading-tight">
                J'accepte les conditions d'utilisation et la politique de confidentialité.
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-black text-sm rounded-xl flex items-center justify-center gap-2 transition-all mt-6"
          >
            <span>{loading ? "CHARGEMENT..." : isSignUp ? "S'INSCRIRE" : "SE CONNECTER"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            disabled={loading}
            onClick={() => { setIsSignUp(!isSignUp); setErrorMessage(""); setSuccessMessage(""); }}
            className="text-xs text-slate-400 hover:text-amber-400 font-medium transition-colors"
          >
            {isSignUp ? "Déjà un compte ? Se connecter" : "Pas encore de compte ? S'inscrire"}
          </button>
        </div>
      </div>
    </div>
  );
}
