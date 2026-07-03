"use client";

import React from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CtaBanner from "@/components/layout/CtaBanner";
import { Shield, Lock, Server, Key, CheckCircle2 } from "lucide-react";

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 relative flex flex-col justify-between overflow-x-hidden selection:bg-emerald-100 selection:text-emerald-900 font-body">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 h-full w-full bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-50 pointer-events-none" />
      
      <Header />

      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-600/5 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Hero Header */}
      <section className="relative pt-40 pb-16 px-6 md:px-12 max-w-4xl mx-auto w-full text-center z-10">
        <div className="mb-6 inline-flex items-center gap-1.5 border border-emerald-200/50 bg-emerald-50/50 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-sm">
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-[10px] tracking-[0.2em] text-emerald-700 uppercase font-bold">
            ENTERPRISE GRADE SECURITY
          </span>
        </div>
        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl tracking-tight text-slate-900 mt-2 mb-6 leading-[1.1] font-extrabold">
          Your business data is safe with us.
        </h1>
        <p className="text-base md:text-xl text-slate-500 max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
          We treat your catalog, customer chats, and business knowledge with the highest level of security. We never train public AI models on your private data.
        </p>
      </section>

      {/* Core Principles Grid */}
      <section className="px-6 md:px-12 max-w-5xl mx-auto w-full z-10 grid grid-cols-1 md:grid-cols-2 gap-6 mb-24">
        
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-6">
            <Lock className="w-6 h-6 text-emerald-600" />
          </div>
          <h3 className="font-display text-xl font-bold text-slate-900 mb-3">Data Isolation & Encryption</h3>
          <p className="text-slate-600 leading-relaxed text-sm">
            All data is encrypted in transit using TLS 1.3 and at rest using AES-256. Your business knowledge base is strictly isolated using vector partitioning—no other customer can ever access your data.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm hover:shadow-md hover:emerald-200 transition-all">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-6">
            <Key className="w-6 h-6 text-emerald-600" />
          </div>
          <h3 className="font-display text-xl font-bold text-slate-900 mb-3">Zero Public Model Training</h3>
          <p className="text-slate-600 leading-relaxed text-sm">
            We partner with foundational model providers (like OpenAI) under strict enterprise agreements. Your prompts, catalogs, and customer conversations are explicitly opted out of model training.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-6">
            <Server className="w-6 h-6 text-emerald-600" />
          </div>
          <h3 className="font-display text-xl font-bold text-slate-900 mb-3">Reliable Infrastructure</h3>
          <p className="text-slate-600 leading-relaxed text-sm">
            Hosted on secure cloud infrastructure with 99.9% uptime SLA. We maintain automated daily backups of all catalogs and configurations to ensure you never lose your setup.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-6">
            <Shield className="w-6 h-6 text-emerald-600" />
          </div>
          <h3 className="font-display text-xl font-bold text-slate-900 mb-3">WhatsApp Meta API Compliance</h3>
          <p className="text-slate-600 leading-relaxed text-sm">
            We integrate directly with the official Meta Cloud API. We enforce strict webhook signature validation to ensure all incoming messages are legitimately from Meta and not malicious actors.
          </p>
        </div>

      </section>

      {/* Compliance Checklist */}
      <section className="px-6 md:px-12 max-w-3xl mx-auto w-full z-10 mb-32">
        <div className="bg-slate-900 rounded-3xl p-8 md:p-12 text-white">
          <h3 className="font-display text-2xl font-bold mb-8">Security Checklist</h3>
          <div className="space-y-4">
            {[
              "Enterprise-grade AES-256 Encryption at rest",
              "TLS 1.3 Encryption in transit",
              "Strict Vector Database Partitioning per customer",
              "Meta Webhook Signature Validation",
              "SSRF Protection for URL Ingestion",
              "Zero Public Model Training Policy",
              "Automated Daily Backups"
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-4 border-b border-slate-800 pb-4 last:border-0 last:pb-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-slate-300 font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CtaBanner />
      <Footer />
    </div>
  );
}
