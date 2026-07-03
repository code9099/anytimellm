"use client";

import React, { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CtaBanner from "@/components/layout/CtaBanner";
import { Play, Calendar, CheckCircle2, ChevronRight, User, Building, Phone, Send } from "lucide-react";

export default function DemoPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    businessType: "",
    whatsappNumber: ""
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.businessType || !formData.whatsappNumber) return;
    
    setSubmitting(true);
    // Simulate booking submission
    setTimeout(() => {
      setSubmitting(false);
      setFormSubmitted(true);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 relative flex flex-col justify-between overflow-x-hidden selection:bg-violet-100 selection:text-violet-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 h-full w-full bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-50 pointer-events-none" />
      
      <Header />

      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-600/5 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Hero Content */}
      <section className="relative pt-40 pb-8 px-6 md:px-12 max-w-5xl mx-auto w-full text-center z-10">
        <div className="mb-6 inline-flex items-center gap-1.5 border border-violet-200/50 bg-violet-50/50 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-sm">
          <Calendar className="w-3.5 h-3.5 text-violet-600 animate-pulse fill-violet-600/20" />
          <span className="text-[10px] tracking-[0.2em] text-violet-700 uppercase font-bold">
            LIVE WALKTHROUGH
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl tracking-tight text-slate-900 mt-2 mb-6 leading-[1.1] font-extrabold">
          See it work in 2 minutes.
        </h1>
        <p className="text-base md:text-xl text-slate-500 max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
          Watch how an AnytimeLLM AI agent automatically reads a catalog and answers complex order requests on WhatsApp.
        </p>
      </section>

      {/* Video / Chat Mockup Container */}
      <section className="px-6 md:px-12 max-w-4xl mx-auto w-full z-10 mb-20">
        <div className="border border-slate-200/60 bg-white/50 backdrop-blur-xl p-4 md:p-8 rounded-3xl relative overflow-hidden shadow-xl flex items-center justify-center">
          
          <div className="w-full max-w-md aspect-[9/16] md:aspect-video border border-slate-800 bg-black relative flex flex-col justify-between overflow-hidden shadow-2xl rounded-2xl">
            
            {isPlaying ? (
              // Live Interactive Mockup
              <div className="w-full h-full relative bg-[#0b141a] flex flex-col text-left text-xs select-none animate-in fade-in duration-500">
                
                {/* Custom Mobile Header */}
                <div className="bg-[#202c33] p-3 border-b border-white/5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-violet-950/45 border border-violet-500/20 flex items-center justify-center font-bold text-white text-[10px]">
                    AL
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-[11px] text-white/95 leading-tight">AnytimeLLM Assistant</span>
                    <span className="text-[9px] text-[#00a884] font-medium mt-0.5 leading-none">Online</span>
                  </div>
                  <span className="font-mono text-[9px] text-white/30 ml-auto">9:41 AM</span>
                </div>

                {/* Chat Log Window */}
                <div className="space-y-4 overflow-y-auto flex-1 p-4 font-body text-xs leading-normal">
                  
                  {/* Customer Msg 1 */}
                  <div className="p-3 bg-[#202c33] text-white/90 max-w-[85%] border border-white/5 shadow-sm animate-in fade-in duration-500 delay-300" style={{ borderRadius: '0 10px 10px 10px' }}>
                    <p className="font-mono text-[8px] text-white/40 uppercase tracking-wider mb-1">Customer</p>
                    Do you have a deep cleaning service available for tomorrow? And what is the price?
                  </div>
                  
                  {/* Agent Msg 1 */}
                  <div className="p-3 bg-[#005c4b] text-white max-w-[85%] ml-auto border border-white/5 shadow-sm animate-in fade-in duration-500 delay-[1200ms]" style={{ borderRadius: '10px 0 10px 10px' }}>
                    <p className="font-mono text-[8px] text-white/60 uppercase tracking-wider mb-1">AI Assistant</p>
                    Yes! We have our **Deep Cleaning Package** available. The price is ₹2,499. Would you like me to book this for tomorrow?
                  </div>

                  {/* Customer Msg 2 */}
                  <div className="p-3 bg-[#202c33] text-white/90 max-w-[85%] border border-white/5 shadow-sm animate-in fade-in duration-500 delay-[2400ms]" style={{ borderRadius: '0 10px 10px 10px' }}>
                    <p className="font-mono text-[8px] text-white/40 uppercase tracking-wider mb-1">Customer</p>
                    Yes please, book it. Email is gaurav@example.com
                  </div>

                  {/* Agent Msg 2 */}
                  <div className="p-3 bg-[#005c4b] text-white max-w-[85%] ml-auto border border-white/5 shadow-sm animate-in fade-in duration-500 delay-[3600ms]" style={{ borderRadius: '10px 0 10px 10px' }}>
                    <p className="font-mono text-[8px] text-white/60 uppercase tracking-wider mb-1">AI Assistant</p>
                    Perfect! Order created for **Deep Cleaning** for tomorrow. Order ID: **#ORD-7392**. We sent details to gaurav@example.com.
                  </div>

                </div>

                {/* Mock Input Bar */}
                <div className="bg-[#202c33] p-3 flex items-center gap-2 border-t border-white/5">
                  <div className="flex-1 bg-[#2a3942] rounded-full py-2 px-4 text-white/30 text-[10px]">
                    Type a message...
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#00a884] flex items-center justify-center text-white">
                    <Send className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Close Button overlay */}
                <button 
                  onClick={() => setIsPlaying(false)} 
                  className="absolute bottom-16 right-4 bg-black/80 hover:bg-black border border-slate-700 hover:border-white px-3 py-1.5 font-mono text-[8px] tracking-widest uppercase text-white shadow-lg transition-all rounded-md"
                >
                  Reset Demo
                </button>

              </div>
            ) : (
              // Cover Layout
              <>
                <div className="absolute inset-0 bg-slate-900/10 flex items-center justify-center" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                
                {/* Play Trigger */}
                <button
                  onClick={() => setIsPlaying(true)}
                  className="relative z-10 w-20 h-20 rounded-full border border-slate-700 bg-slate-900 text-white hover:bg-violet-600 hover:border-violet-600 flex items-center justify-center transition-all duration-500 transform active:scale-95 shadow-xl cursor-pointer"
                  aria-label="Play video demo"
                >
                  <Play className="w-8 h-8 fill-current ml-1" />
                </button>

                <div className="absolute bottom-6 left-6 z-10 text-left">
                  <span className="text-[10px] tracking-[0.2em] text-violet-400 uppercase block mb-1 font-bold">
                    INTERACTIVE PREVIEW
                  </span>
                  <span className="text-lg tracking-tight text-white font-bold block">
                    Click to launch WhatsApp simulator
                  </span>
                </div>
              </>
            )}

          </div>
        </div>
      </section>

      {/* Booking Form Section */}
      <section className="py-12 px-6 md:px-12 max-w-xl mx-auto w-full z-10 mb-20">
        <div className="border border-slate-200/60 bg-white/50 backdrop-blur-xl p-8 md:p-10 shadow-xl shadow-slate-200/40 relative rounded-3xl">
          
          {formSubmitted ? (
            // Success State
            <div className="text-center py-6 animate-in zoom-in-95 duration-350">
              <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-xl tracking-tight text-slate-900 mb-2 font-bold">
                Demo Booking Received!
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">
                Thanks, {formData.name}. Our WhatsApp solutions expert will contact you at <strong>{formData.whatsappNumber}</strong> to show a live catalog sync demo customized for your business.
              </p>
              <button
                onClick={() => {
                  setFormSubmitted(false);
                  setFormData({ name: "", businessType: "", whatsappNumber: "" });
                }}
                className="text-[11px] tracking-[0.1em] uppercase border border-slate-200 px-6 py-2.5 hover:border-slate-400 text-slate-700 transition-colors rounded-xl font-bold bg-white"
              >
                Book another demo
              </button>
            </div>
          ) : (
            // Booking Form
            <>
              <div className="mb-8 text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.2em] text-violet-600 uppercase mb-2 font-bold">
                  <Calendar className="w-3.5 h-3.5" />
                  Live Meeting
                </div>
                <h3 className="text-3xl tracking-tight text-slate-900 mb-3 font-extrabold">
                  Book a live demo
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  Fill in your details below and a solutions expert will reach out over WhatsApp to run a live catalog sync tailored to your products.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-[10px] tracking-[0.15em] text-slate-500 uppercase mb-1.5 flex items-center gap-1.5 font-bold">
                    <User className="w-3.5 h-3.5 text-violet-600" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white border border-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all duration-300"
                  />
                </div>

                <div>
                  <label className="block text-[10px] tracking-[0.15em] text-slate-500 uppercase mb-1.5 flex items-center gap-1.5 font-bold">
                    <Building className="w-3.5 h-3.5 text-violet-600" />
                    Business Type
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Retail, Food, Distributor"
                    value={formData.businessType}
                    onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                    className="w-full bg-white border border-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all duration-300"
                  />
                </div>

                <div>
                  <label className="block text-[10px] tracking-[0.15em] text-slate-500 uppercase mb-1.5 flex items-center gap-1.5 font-bold">
                    <Phone className="w-3.5 h-3.5 text-violet-600" />
                    WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +91 98765 43210"
                    value={formData.whatsappNumber}
                    onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                    className="w-full bg-white border border-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all duration-300"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white text-[11px] tracking-[0.2em] uppercase flex items-center justify-center gap-1.5 transition-all duration-300 cursor-pointer disabled:opacity-50 font-bold rounded-xl shadow-lg shadow-slate-900/10"
                >
                  {submitting ? "Booking..." : "Submit request"}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </form>
            </>
          )}

        </div>
      </section>

      <CtaBanner />
      <Footer />
    </div>
  );
}
