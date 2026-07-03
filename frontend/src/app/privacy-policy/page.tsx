"use client";

import React from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Shield, Lock, Eye, Server } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 relative flex flex-col justify-between overflow-x-hidden selection:bg-violet-100 selection:text-violet-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 h-full w-full bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-50 pointer-events-none" />
      
      <Header />

      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-[800px] h-[400px] bg-violet-600/5 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Hero Header */}
      <section className="relative pt-40 pb-16 px-6 md:px-12 max-w-4xl mx-auto w-full text-center z-10">
        <div className="mb-6 inline-flex items-center gap-1.5 border border-violet-200/50 bg-violet-50/50 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-sm">
          <Shield className="w-3.5 h-3.5 text-violet-600 animate-pulse" />
          <span className="text-[10px] tracking-[0.2em] text-violet-700 uppercase font-bold">
            LEGAL COMPLIANCE
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl tracking-tight text-slate-900 mt-2 mb-6 leading-[1.1] font-extrabold">
          Privacy Policy
        </h1>
        <p className="text-base md:text-lg text-slate-500 max-w-xl mx-auto leading-relaxed font-medium">
          Last Updated: June 7, 2026. Learn how we safeguard your business catalogs and WhatsApp chats.
        </p>
      </section>

      {/* Content Section */}
      <section className="px-6 md:px-12 max-w-4xl mx-auto w-full z-10 mb-24 text-base text-slate-600 space-y-10 leading-relaxed">
        
        {/* Core Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-6 border border-slate-200/60 bg-white/50 backdrop-blur-xl hover:bg-white hover:shadow-md hover:border-violet-200 transition-all duration-300 rounded-3xl">
            <Lock className="w-5 h-5 text-violet-600 mb-4" />
            <h3 className="text-sm tracking-tight text-slate-900 font-bold mb-2">Tenant Isolation</h3>
            <p className="text-[13px] text-slate-500 font-medium leading-relaxed">
              Your uploaded catalogs, menus, and business databases are strictly partitioned using multi-tenant namespaces.
            </p>
          </div>
          <div className="p-6 border border-slate-200/60 bg-white/50 backdrop-blur-xl hover:bg-white hover:shadow-md hover:border-violet-200 transition-all duration-300 rounded-3xl">
            <Eye className="w-5 h-5 text-violet-600 mb-4" />
            <h3 className="text-sm tracking-tight text-slate-900 font-bold mb-2">Message Encryption</h3>
            <p className="text-[13px] text-slate-500 font-medium leading-relaxed">
              Customer messages forwarded via WhatsApp Cloud API are processed on-the-fly and never sold to third parties.
            </p>
          </div>
          <div className="p-6 border border-slate-200/60 bg-white/50 backdrop-blur-xl hover:bg-white hover:shadow-md hover:border-violet-200 transition-all duration-300 rounded-3xl">
            <Server className="w-5 h-5 text-violet-600 mb-4" />
            <h3 className="text-sm tracking-tight text-slate-900 font-bold mb-2">Secure Storage</h3>
            <p className="text-[13px] text-slate-500 font-medium leading-relaxed">
              Relational order details are stored in locally partitioned SQLite files, isolated per workspace environment.
            </p>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="border border-slate-200/60 bg-white/50 backdrop-blur-xl p-8 md:p-12 space-y-10 rounded-[2.5rem] shadow-xl shadow-slate-200/20">
          
          <div className="space-y-4">
            <h2 className="text-xl tracking-tight text-slate-900 font-bold border-b border-slate-200 pb-3">
              1. Information We Collect
            </h2>
            <p className="text-slate-600 font-medium">
              We collect information to initialize, operate, and maintain your AI assistant workspace:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-500 marker:text-violet-400">
              <li><strong className="text-slate-800 font-bold">Account Credentials:</strong> Admin email, business metadata, and hash passwords collected at registration.</li>
              <li><strong className="text-slate-800 font-bold">Catalog Content:</strong> Documents, PDF catalogs, URLs, and pricing grids uploaded to train your agent.</li>
              <li><strong className="text-slate-800 font-bold">Integration Keys:</strong> WhatsApp phone IDs and webhook verify tokens necessary to link Meta Cloud API.</li>
              <li><strong className="text-slate-800 font-bold">Customer Conversations:</strong> Text bubbles, timestamp sequences, and order records processed by the RAG reasoning loop.</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl tracking-tight text-slate-900 font-bold border-b border-slate-200 pb-3">
              2. How We Use Data
            </h2>
            <p className="text-slate-600 font-medium">
              The collected data is exclusively used to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-500 marker:text-violet-400">
              <li>Power the LangGraph cognitive loop to answer customer catalog questions.</li>
              <li>Parse uploaded documents, extract product metadata, and build search indexes.</li>
              <li>Process checkout commands and populate your relational order database.</li>
              <li>Send real-time updates and notification webhooks to Meta servers.</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl tracking-tight text-slate-900 font-bold border-b border-slate-200 pb-3">
              3. Data Boundaries & Security
            </h2>
            <p className="text-slate-600 font-medium">
              We enforce enterprise-grade security protocols:
            </p>
            <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200 text-slate-600 text-[15px] italic leading-relaxed">
              Multi-tenant separation prevents cross-workspace leaks. If you use a cloud index, your embeddings are isolated under dedicated namespaces. Local SQLite files are partitioned per user session. All authentication tokens are stored securely in localStorage and verified via HMAC signatures on the FastAPI backend.
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl tracking-tight text-slate-900 font-bold border-b border-slate-200 pb-3">
              4. Your Choices & Data Deletion
            </h2>
            <p className="text-slate-600 font-medium">
              As a workspace administrator, you have full control over your business intelligence:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-500 marker:text-violet-400">
              <li>You can delete uploaded documents or catalogs at any point from the admin console.</li>
              <li>You can request complete workspace termination, which wipes all user accounts, databases, and indexes.</li>
              <li>To initiate a request, please reach out to our privacy officer at <strong className="text-slate-800">privacy@anytimellm.com</strong>.</li>
            </ul>
          </div>

        </div>

      </section>

      <Footer />
    </div>
  );
}
