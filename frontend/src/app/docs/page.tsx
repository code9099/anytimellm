"use client";

import React, { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { BookOpen, Key, Phone, Database, Terminal, ArrowRight } from "lucide-react";

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("getting-started");

  const sections = [
    {
      id: "getting-started",
      title: "Getting Started",
      icon: <BookOpen className="w-4 h-4" />,
      content: (
        <div className="space-y-6">
          <h2 className="font-display text-3xl font-bold text-slate-900 tracking-tight">Getting Started</h2>
          <p className="font-body text-base text-slate-600 leading-relaxed font-medium">
            AnytimeLLM connects directly to your WhatsApp Business number to answer customer questions, verify product availability, and take orders automatically.
          </p>
          <p className="font-body text-base text-slate-600 leading-relaxed font-medium">
            To set up your workspace, you need to configure your catalog and connect your phone number. You can be fully operational in less than three minutes.
          </p>
          
          <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-3">
            <h4 className="font-display text-sm font-bold text-slate-800 tracking-tight">Core requirements before starting:</h4>
            <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600 font-medium leading-relaxed">
              <li>A Meta Developer Account (free to create).</li>
              <li>A phone number that can receive SMS verification codes (cannot have an active WhatsApp app installed).</li>
              <li>Your inventory list or menu in CSV, PDF, or text format.</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "connecting-whatsapp",
      title: "Connecting WhatsApp",
      icon: <Phone className="w-4 h-4" />,
      content: (
        <div className="space-y-6">
          <h2 className="font-display text-3xl font-bold text-slate-900 tracking-tight">Connecting WhatsApp</h2>
          <p className="font-body text-base text-slate-600 leading-relaxed font-medium">
            We link to WhatsApp using the official Meta Cloud API. This ensures fast message delivery and absolute compliance with Meta's terms of service.
          </p>
          
          <h3 className="font-display text-xl font-bold text-slate-800 mt-6 tracking-tight">Step-by-step setup:</h3>
          <ol className="list-decimal pl-5 space-y-4 text-sm text-slate-600 font-medium leading-relaxed">
            <li>
              <strong>Configure WhatsApp Developer Credentials:</strong> Go to the Integrations tab in your AnytimeLLM Dashboard, and locate your unique Webhook Verification Token.
            </li>
            <li>
              <strong>Register webhook on Meta Portal:</strong> Add your Webhook URL and Verification Token in your Meta Developer App settings under the WhatsApp product configuration.
            </li>
            <li>
              <strong>Subscribe to messages:</strong> Check the box for <code>messages</code> in the webhook subscription field. This triggers AnytimeLLM to process every incoming conversation immediately.
            </li>
          </ol>

          <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl text-amber-900 text-sm font-medium leading-relaxed">
            <strong>Note:</strong> Make sure your WhatsApp Business Account has a valid payment method configured in the Meta Business Suite to avoid conversation delivery limits.
          </div>
        </div>
      ),
    },
    {
      id: "knowledge-base",
      title: "Knowledge & Catalog Sync",
      icon: <Database className="w-4 h-4" />,
      content: (
        <div className="space-y-6">
          <h2 className="font-display text-3xl font-bold text-slate-900 tracking-tight">Knowledge & Catalog Sync</h2>
          <p className="font-body text-base text-slate-600 leading-relaxed font-medium">
            Your assistant reads and answers based on your catalog and knowledge base. This ensures it never makes up prices or policies.
          </p>

          <h3 className="font-display text-xl font-bold text-slate-800 mt-6 tracking-tight">Uploading catalogs:</h3>
          <p className="font-body text-sm text-slate-600 leading-relaxed font-medium">
            Format your products using CSV format with headers for <code>name</code>, <code>price</code>, <code>category</code>, and <code>description</code>. Upload the file in the Catalog tab to update your assistant instantly.
          </p>

          <h3 className="font-display text-xl font-bold text-slate-800 mt-6 tracking-tight">Business rules ingestion:</h3>
          <p className="font-body text-sm text-slate-600 leading-relaxed font-medium">
            For returns, delivery timings, and general questions, paste your text guidelines directly into the Knowledge Ingestion portal. AnytimeLLM formats this into vector namespaces to reference during customer chats.
          </p>
        </div>
      ),
    },
    {
      id: "api-integration",
      title: "API Reference",
      icon: <Terminal className="w-4 h-4" />,
      content: (
        <div className="space-y-6">
          <h2 className="font-display text-3xl font-bold text-slate-900 tracking-tight">API Reference</h2>
          <p className="font-body text-base text-slate-600 leading-relaxed font-medium">
            Query catalogs, ingest documents, and trigger message flows programmatically.
          </p>

          <div className="space-y-4">
            <h4 className="font-mono text-xs font-bold text-slate-700 uppercase tracking-widest">1. Create a workspace item</h4>
            <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-xs overflow-x-auto shadow-sm">
              <pre>{`POST /api/business/catalog
Headers:
  Authorization: Bearer <your-api-token>
  Content-Type: application/json

Body:
{
  "name": "Linen Shirt",
  "price": 1499.0,
  "category": "Apparel",
  "description": "Premium large blue linen shirt"
}`}</pre>
            </div>
          </div>

          <div className="space-y-4 mt-8">
            <h4 className="font-mono text-xs font-bold text-slate-700 uppercase tracking-widest">2. Ingest document via url</h4>
            <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-xs overflow-x-auto shadow-sm">
              <pre>{`POST /api/business/ingest/url
Headers:
  Authorization: Bearer <your-api-token>
  Content-Type: application/json

Body:
{
  "url": "https://yoursite.com/shipping-policy"
}`}</pre>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 relative flex flex-col justify-between overflow-x-hidden selection:bg-emerald-500/20 font-body">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 h-full w-full bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

      <Header />

      <div className="max-w-7xl mx-auto w-full px-6 md:px-12 py-24 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 flex-1">
        {/* Sidebar navigation */}
        <aside className="lg:col-span-3">
          <div className="sticky top-24 space-y-1">
            <div className="px-4 py-3 mb-4">
              <span className="font-display text-xs font-bold text-slate-400 uppercase tracking-widest">Documentation</span>
            </div>
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-semibold transition-all rounded-xl cursor-pointer ${
                  activeSection === section.id
                    ? "bg-white border border-slate-200 text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <span className={activeSection === section.id ? "text-violet-600" : "text-slate-400"}>
                  {section.icon}
                </span>
                {section.title}
              </button>
            ))}
          </div>
        </aside>

        {/* Content Panel */}
        <main className="lg:col-span-9 bg-white border border-slate-200 shadow-xl shadow-slate-100/50 p-8 md:p-14 rounded-3xl min-h-[500px]">
          {sections.find((s) => s.id === activeSection)?.content}
        </main>
      </div>

      <Footer />
    </div>
  );
}
