import React from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CtaBanner from "@/components/layout/CtaBanner";
import { ArrowRight, Compass, PlayCircle, Book } from "lucide-react";

const MOCK_GUIDES = [
  {
    id: "guide-1",
    title: "Connecting the WhatsApp Cloud API",
    category: "Integration",
    time: "10 min read",
    excerpt: "Step-by-step instructions on securing your Meta Developer token and configuring webhooks.",
    icon: PlayCircle,
  },
  {
    id: "guide-2",
    title: "Uploading and Formatting Your Catalog",
    category: "Knowledge Base",
    time: "5 min read",
    excerpt: "Best practices for formatting PDFs and spreadsheets so the AI extracts pricing and details accurately.",
    icon: Book,
  },
  {
    id: "guide-3",
    title: "Prompt Engineering for Store Managers",
    category: "AI Training",
    time: "15 min read",
    excerpt: "How to use System Prompts to control the personality, tone, and upsell behavior of your AI assistant.",
    icon: Book,
  }
];

export default function GuidesPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 relative flex flex-col justify-between overflow-x-hidden selection:bg-violet-100 selection:text-violet-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 h-full w-full bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-50 pointer-events-none" />
      
      <Header />

      {/* Background Glows */}
      <div className="absolute top-0 right-1/4 w-[800px] h-[400px] bg-violet-600/5 rounded-full blur-[120px] pointer-events-none z-0" />

      <main className="flex-1 relative z-10">
        <section className="pt-40 pb-20 px-6 md:px-12 w-full max-w-6xl mx-auto">
          
          <div className="text-center mb-16">
            <div className="mb-6 inline-flex items-center gap-1.5 border border-violet-200/50 bg-violet-50/50 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-sm mx-auto">
              <Compass className="w-3.5 h-3.5 text-violet-600 fill-violet-600/20" />
              <span className="text-[10px] tracking-[0.2em] text-violet-700 uppercase font-bold">
                DOCUMENTATION & TUTORIALS
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1] mb-6">
              AnytimeLLM Guides.
            </h1>
            <p className="text-base md:text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
              Step-by-step tutorials to help you deploy your AI agent and automate your operations.
            </p>
          </div>

          {/* Featured Guide */}
          <div className="mb-12 rounded-[2.5rem] bg-slate-900 text-white p-8 md:p-12 shadow-2xl relative overflow-hidden group cursor-pointer">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-600/30 via-slate-900 to-slate-900 opacity-60" />
            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1 space-y-6">
                <div className="inline-flex px-3 py-1 bg-violet-500/20 text-violet-300 rounded-full text-xs font-bold tracking-wide uppercase border border-violet-500/30">
                  Quick Start
                </div>
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white group-hover:text-violet-300 transition-colors">
                  The Zero-to-One Deployment Guide
                </h2>
                <p className="text-slate-400 text-lg leading-relaxed">
                  From creating your account to receiving your first automated order on WhatsApp. Follow this comprehensive 20-minute masterclass.
                </p>
                <div className="flex items-center text-sm font-bold text-violet-400 gap-2">
                  Start Guide <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
              <div className="w-full md:w-1/3 aspect-video bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden relative flex items-center justify-center group-hover:border-violet-500/50 transition-colors">
                <PlayCircle className="w-16 h-16 text-slate-600 group-hover:text-violet-500 transition-colors" />
              </div>
            </div>
          </div>

          {/* Grid Posts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {MOCK_GUIDES.map((guide) => {
              const Icon = guide.icon;
              return (
                <div
                  key={guide.id}
                  className="group p-8 bg-white/60 backdrop-blur-xl border border-slate-200/60 rounded-[2rem] hover:shadow-xl hover:shadow-violet-500/5 hover:border-violet-200 transition-all duration-300 flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    <div className="mb-4 inline-flex items-center gap-2 px-2 py-1 bg-slate-100 rounded-md text-[10px] uppercase font-bold tracking-wider text-slate-500">
                      <Icon className="w-3 h-3" /> {guide.category}
                    </div>
                    <h3 className="text-xl font-bold tracking-tight text-slate-900 mb-3 group-hover:text-violet-600 transition-colors line-clamp-2">{guide.title}</h3>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8 line-clamp-3">{guide.excerpt}</p>
                  </div>
                  
                  <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="text-xs text-slate-400 font-medium">{guide.time}</span>
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 group-hover:bg-violet-50 text-slate-400 group-hover:text-violet-600 transition-colors">
                      <ArrowRight className="w-4 h-4 -rotate-45 group-hover:rotate-0 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </section>
      </main>

      <CtaBanner />
      <Footer />
    </div>
  );
}
