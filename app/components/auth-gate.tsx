"use client";
import { useEffect, useState, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { AppShell } from "./app-shell";
import { AccountSettings } from "./account-settings";

export function AuthGate() {
  const [user, setUser] = useState<User | null>(null),
    [checking, setChecking] = useState(true),
    [signup, setSignup] = useState(false),
    [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""), [accountOpen,setAccountOpen]=useState(false), [recovering,setRecovering]=useState(false);
  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setChecking(false);
    });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if(event==="PASSWORD_RECOVERY") setRecovering(true);
      setUser(session?.user ?? null);
      setChecking(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const result = signup
      ? await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name.trim() },
            emailRedirectTo: window.location.origin,
          },
        })
      : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (result.error) setMessage(result.error.message);
    else if (signup && !result.data.session)
      setMessage(
        "Check your email to confirm your PostCare account, then return here to sign in.",
      );
  };
  const google = async () => {
    setBusy(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      setMessage(error.message);
      setBusy(false);
    }
  };
  const forgot=async()=>{if(!email){setMessage("Enter your email address first.");return;}setBusy(true);const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin});setBusy(false);setMessage(error?error.message:"Check your email for a secure password-reset link.");};
  if(recovering&&user)return <main className="auth-page"><section className="auth-card recovery-card"><p className="kicker">SECURE RECOVERY</p><h2>Choose a new password</h2><form onSubmit={async e=>{e.preventDefault();setBusy(true);const {error}=await supabase.auth.updateUser({password});setBusy(false);setMessage(error?error.message:"Password updated.");if(!error)setRecovering(false);}}><label>New password<input required minLength={8} type="password" value={password} onChange={e=>setPassword(e.target.value)}/></label>{message&&<p className="auth-success">{message}</p>}<button className="primary auth-submit" disabled={busy}>Update password</button></form></section></main>;
  if (checking)
    return (
      <main className="auth-loading">
        <span>+</span>
        <p>Opening your private PostCare account…</p>
      </main>
    );
  if (user?.email) {
    const displayName = String(
      user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email.split("@")[0],
    );
    return <>
      <AppShell
        displayName={displayName}
        email={user.email}
        onSignOut={() => supabase.auth.signOut()}
        onManageAccount={()=>setAccountOpen(true)}
      />
      {accountOpen&&<AccountSettings user={user} onClose={()=>setAccountOpen(false)}/>}</>;
  }
  return (
    <main className="auth-page">
      <section className="auth-intro">
        <div className="auth-brand">
          <span>+</span>
          <strong>PostCare</strong>
        </div>
        <p className="kicker">YOUR COMPLETE HEALTH STORY</p>
        <h1>One private place for every part of your care.</h1>
        <p>
          Keep medical, dental, vision, specialist, medication, and document
          history organized across your lifetime.
        </p>
        <div className="auth-trust">
          <span>✓</span>
          <div>
            <strong>Patient-controlled by design</strong>
            <small>
              Your information is connected to a permanent PostCare account—not
              a login provider.
            </small>
          </div>
        </div>
      </section>
      <section className="auth-card">
        <p className="kicker">PRIVATE PATIENT ACCESS</p>
        <h2>{signup ? "Create your account" : "Welcome back"}</h2>
        <p>
          {signup
            ? "Start building a portable record you control."
            : "Sign in to open your private health dashboard."}
        </p>
        <button className="google-auth" onClick={google} disabled={busy}>
          <b>G</b> Continue with Google
        </button>
        <div className="auth-divider">
          <span>or continue with email</span>
        </div>
        <form onSubmit={submit}>
          {signup && (
            <label>
              Full name
              <input
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
          )}
          <label>
            Email address
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Password
            <input
              required
              minLength={8}
              type="password"
              autoComplete={signup ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {message && (
            <p
              className={
                message.startsWith("Check") ? "auth-success" : "form-error"
              }
              role="status"
            >
              {message}
            </p>
          )}
          <button className="primary auth-submit" disabled={busy}>
            {busy
              ? "Please wait…"
              : signup
                ? "Create account"
                : "Sign in securely"}
          </button>
        </form>
        {!signup&&<button className="auth-switch" onClick={()=>{void forgot();}}>Forgot your password?</button>}
        <button
          className="auth-switch"
          onClick={() => {
            setSignup(!signup);
            setMessage("");
          }}
        >
          {signup
            ? "Already have an account? Sign in"
            : "New to PostCare? Create an account"}
        </button>
        <small className="auth-disclaimer">
          PostCare is a patient-maintained record and does not replace
          professional medical advice or official provider records.
        </small>
      </section>
    </main>
  );
}
