"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";
import gsap from "gsap";
import Link from "next/link";
import Script from "next/script";

export default function RegisterPage() {
  const router = useRouter();
  const formRef = useRef<HTMLDivElement>(null);
  const brandRef = useRef<HTMLDivElement>(null);

  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Google Sign-In registration states
  const [showBusinessPrompt, setShowBusinessPrompt] = useState(false);
  const [googleCredential, setGoogleCredential] = useState<string | null>(null);
  const [googleBusinessName, setGoogleBusinessName] = useState("");
  const [registeringGoogle, setRegisteringGoogle] = useState(false);

  // Validation checks
  const isLengthValid = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[@$!%*?&_#^()-+=]/.test(password);
  const isPasswordStrong = isLengthValid && hasUppercase && hasLowercase && hasNumber && hasSpecial;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  useEffect(() => {
    // If user is already logged in, redirect them immediately to dashboard
    const token = localStorage.getItem("anytimellm-token");
    if (token) {
      router.push("/dashboard");
      return;
    }

    // GSAP Reveal Animations
    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
    
    if (brandRef.current) {
      tl.fromTo(
        brandRef.current,
        { opacity: 0, y: -15 },
        { opacity: 1, y: 0, duration: 1.0, delay: 0.1 }
      );
    }

    if (formRef.current) {
      tl.fromTo(
        formRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1.0 },
        "-=0.6"
      );
    }
  }, [router]);

  const handleGoogleCallback = async (response: any) => {
    const credential = response.credential;
    if (!credential) return;

    setLoading(true);
    setError(null);

    try {
      const res = await api.loginWithGoogle(credential);
      if (res.is_registered) {
        router.push("/dashboard");
      } else {
        setGoogleCredential(credential);
        setShowBusinessPrompt(true);
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || "Google authentication failed.");
      setLoading(false);
    }
  };

  useEffect(() => {
    const initGoogle = () => {
      if (typeof window !== "undefined" && (window as any).google) {
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "mock-google-client-id.apps.googleusercontent.com";
        (window as any).google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCallback,
          use_fedcm_for_prompt: false,
        });
        
        const btnElem = document.getElementById("google-signin-btn");
        if (btnElem) {
          (window as any).google.accounts.id.renderButton(btnElem, {
            theme: "outline",
            size: "large",
            width: btnElem.clientWidth || 320,
            text: "continue_with",
            shape: "square"
          });
        }
      }
    };

    const timer = setInterval(() => {
      if ((window as any).google) {
        initGoogle();
        clearInterval(timer);
      }
    }, 200);

    return () => clearInterval(timer);
  }, []);

  const handleCompleteGoogleRegistration = async () => {
    if (!googleBusinessName.trim() || !googleCredential) return;
    
    setRegisteringGoogle(true);
    setError(null);
    try {
      await api.loginWithGoogle(googleCredential, googleBusinessName.trim());
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to finalize registration.");
      setRegisteringGoogle(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim() || !email.trim() || !password.trim()) return;

    if (!isEmailValid) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!isPasswordStrong) {
      setError("Please satisfy all password strength requirements.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.register(businessName.trim(), email.trim(), password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Registration failed. Email might already be taken.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-50 text-slate-900 relative overflow-x-hidden selection:bg-violet-100 selection:text-violet-900">
      {/* Script to load Google Identity Services */}
      <Script src="https://accounts.google.com/gsi/client" strategy="lazyOnload" />

      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 h-full w-full bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-50" />

      {/* Decorative Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-600/5 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Top Navigation Bar */}
      <header 
        ref={brandRef} 
        className="fixed top-0 w-full z-50 bg-white/50 backdrop-blur-md h-16 flex items-center justify-between px-8 border-b border-slate-200/60"
      >
        <Link 
          href="/" 
          className="font-mono text-[10px] tracking-[0.2em] text-slate-500 uppercase hover:text-slate-900 transition-colors duration-300"
        >
          ← HOME
        </Link>
        <div className="flex items-center gap-1">
          <span className="text-sm tracking-[0.4em] font-extrabold uppercase text-slate-900 cursor-pointer">ANYTIMELLM</span>
        </div>
        <span className="font-mono text-[10px] tracking-[0.2em] text-slate-500 uppercase">Dashboard</span>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-grow flex flex-col items-center justify-center pt-28 pb-16 px-6 max-w-[500px] mx-auto w-full">
        <div 
          ref={formRef} 
          className="w-full bg-white/60 backdrop-blur-xl border border-slate-200/60 p-8 md:p-10 rounded-[2rem] text-left flex flex-col justify-between shadow-xl shadow-violet-500/5 transition-all duration-300"
        >
          <div>
            <span className="text-[10px] tracking-[0.2em] text-violet-600 uppercase font-bold">PHASE 01</span>
            <h3 className="text-2xl tracking-tight text-slate-900 font-extrabold mt-1 mb-3">Create Workspace</h3>
            <p className="text-sm font-medium text-slate-500 mb-6 leading-relaxed">
              Set up your AI assistant and secure workspace for your brand. Type details to spin up metadata and vector namespace.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="w-full mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-600 text-xs text-left font-mono">
              <span className="shrink-0 mt-0.5 font-bold">⚠️</span>
              <span className="tracking-wider">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] tracking-[0.15em] text-slate-500 uppercase mb-1.5 font-bold">BUSINESS NAME</label>
              <input
                type="text"
                required
                placeholder="e.g. Acme Corp"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full bg-white/50 backdrop-blur-sm border border-slate-200 focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-all duration-300 font-medium"
              />
            </div>
            <div>
              <label className="block text-[10px] tracking-[0.15em] text-slate-500 uppercase mb-1.5 font-bold">ADMIN EMAIL</label>
              <input
                type="email"
                required
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/50 backdrop-blur-sm border border-slate-200 focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-all duration-300 font-medium"
              />
            </div>
            <div>
              <label className="block text-[10px] tracking-[0.15em] text-slate-500 uppercase mb-1.5 font-bold">PASSWORD</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/50 backdrop-blur-sm border border-slate-200 focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-all duration-300 font-medium"
              />
              {password && (
                <div className="mt-3 p-4 bg-white/50 backdrop-blur-sm border border-slate-200 text-xs space-y-1.5 transition-all duration-300 rounded-xl">
                  <span className="block text-slate-700 tracking-[0.1em] mb-1 font-bold text-[10px] uppercase">Password Requirements:</span>
                  <div className="flex items-center gap-2">
                    <span className={isLengthValid ? "text-emerald-600 font-bold" : "text-slate-400 font-medium"}>
                      {isLengthValid ? "✓" : "○"} At least 8 characters
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={hasUppercase ? "text-emerald-600 font-bold" : "text-slate-400 font-medium"}>
                      {hasUppercase ? "✓" : "○"} One uppercase letter (A-Z)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={hasLowercase ? "text-emerald-600 font-bold" : "text-slate-400 font-medium"}>
                      {hasLowercase ? "✓" : "○"} One lowercase letter (a-z)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={hasNumber ? "text-emerald-600 font-bold" : "text-slate-400 font-medium"}>
                      {hasNumber ? "✓" : "○"} One number (0-9)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={hasSpecial ? "text-emerald-600 font-bold" : "text-slate-400 font-medium"}>
                      {hasSpecial ? "✓" : "○"} One special character (@$!%*?&_#^()-+=)
                    </span>
                  </div>
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-slate-900 hover:bg-violet-600 text-white rounded-xl text-xs tracking-[0.1em] uppercase flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 cursor-pointer mt-6 shadow-lg shadow-slate-900/10 hover:shadow-violet-500/20 font-bold"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              ) : (
                "Create Workspace"
              )}
            </button>
          </form>

          {/* Google Sign-In Section */}
          <div className="w-full flex flex-col items-center gap-4 mt-6 border-t border-slate-100 pt-6">
            <span className="font-mono text-[9px] tracking-[0.2em] text-slate-400 uppercase font-bold">OR CONTINUE WITH</span>
            <div id="google-signin-btn" className="w-full flex justify-center min-h-[40px] z-10"></div>
          </div>

          <div className="mt-8 border-t border-slate-100 pt-6 text-center">
            <span className="text-sm font-medium text-slate-500">Already have a workspace? </span>
            <Link 
              href="/login" 
              className="text-sm text-violet-600 hover:text-violet-700 font-bold transition-colors duration-300"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Minimal Footer Info */}
        <footer className="mt-12 flex justify-center text-slate-400 text-[10px] font-mono tracking-widest uppercase border-t border-slate-100 pt-6 w-full text-center">
          <span>🔒 SECURE WORKSPACE INGESTION</span>
        </footer>
      </main>

      {/* Glassmorphic Prompt Modal for Workspace Name */}
      {showBusinessPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="w-full max-w-[420px] bg-white/80 backdrop-blur-xl border border-slate-200/60 p-8 text-left relative flex flex-col justify-between shadow-2xl rounded-3xl">
            <div>
              <span className="text-[10px] tracking-[0.2em] text-violet-600 uppercase block mb-1 font-bold">REGISTRATION</span>
              <h4 className="text-xl tracking-tight text-slate-900 font-extrabold mb-3">Name Your Workspace</h4>
              <p className="text-sm font-medium text-slate-500 leading-relaxed mb-6">
                Welcome! It looks like you're signing in with Google for the first time. Please specify a brand name.
              </p>
              
              <div>
                <label className="block text-[10px] tracking-[0.15em] text-slate-500 uppercase mb-1.5 font-bold">BUSINESS NAME</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Corp"
                  value={googleBusinessName}
                  onChange={(e) => setGoogleBusinessName(e.target.value)}
                  className="w-full bg-white/50 backdrop-blur-sm border border-slate-200 focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-all duration-300 font-medium"
                />
              </div>
            </div>
            
            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowBusinessPrompt(false);
                  setGoogleCredential(null);
                }}
                className="flex-1 h-11 border border-slate-200 hover:border-slate-300 hover:bg-white text-slate-500 hover:text-slate-700 rounded-xl bg-white/50 backdrop-blur-sm text-xs tracking-[0.1em] uppercase font-bold transition-all duration-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={registeringGoogle || !googleBusinessName.trim()}
                onClick={handleCompleteGoogleRegistration}
                className="flex-1 h-11 bg-slate-900 hover:bg-violet-600 text-white rounded-xl text-xs tracking-[0.1em] uppercase font-bold flex items-center justify-center gap-1 transition-all duration-300 disabled:opacity-40 cursor-pointer shadow-lg shadow-slate-900/10 hover:shadow-violet-500/20"
              >
                {registeringGoogle ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  "Create Workspace"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
