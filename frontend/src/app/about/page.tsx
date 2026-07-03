"use client";

import React from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CtaBanner from "@/components/layout/CtaBanner";
import { ArrowUpRight, Award, MessageSquare, Heart } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 relative flex flex-col justify-between overflow-x-hidden selection:bg-violet-100 selection:text-violet-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 h-full w-full bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-50 pointer-events-none" />
      
      <Header />

      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-600/5 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Hero Header */}
      <section className="relative pt-40 pb-16 px-6 md:px-12 max-w-4xl mx-auto w-full text-center z-10">
        <div className="mb-6 inline-flex items-center gap-1.5 border border-violet-200/50 bg-violet-50/50 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-sm">
          <Heart className="w-3.5 h-3.5 text-violet-600 animate-pulse fill-violet-600/20" />
          <span className="text-[10px] tracking-[0.2em] text-violet-700 uppercase font-bold">
            OUR MISSION
          </span>
        </div>
        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl tracking-tight text-slate-900 mt-2 mb-6 leading-[1.1] font-extrabold">
          Solving the 24/7 responsiveness problem for local businesses.
        </h1>
        <p className="font-body text-base md:text-xl text-slate-500 max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
          Small businesses lose customers every day simply because they can't reply to WhatsApps instantly. We are leveling the playing field.
        </p>
      </section>

      {/* Main Grid content */}
      <section className="px-6 md:px-12 max-w-5xl mx-auto w-full z-10 grid grid-cols-1 md:grid-cols-12 gap-16 items-start mb-32">
        
        {/* Founder Card Info (cols 1-5) */}
        <div className="md:col-span-5 flex flex-col gap-8 items-center w-full">
          {/* Card 1: Krish Thakur */}
          <div className="w-full border border-slate-200/60 bg-white/50 backdrop-blur-xl p-6 md:p-8 text-center hover:border-violet-200 hover:bg-white hover:shadow-xl hover:shadow-violet-100/50 transition-all duration-500 relative group rounded-3xl">
            
            {/* Founder Initial Bubble */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-extrabold shadow-lg shadow-violet-200 mb-6 mx-auto">
              KT
            </div>

            <span className="text-[10px] tracking-[0.2em] text-violet-600 uppercase block mb-2 font-bold">
              Founder & Engineering
            </span>
            <h3 className="font-display text-xl tracking-tight text-slate-900 font-bold mb-2">
              Krish Thakur
            </h3>
            <p className="font-body text-sm text-slate-500 mb-8 leading-relaxed">
              "Building conversational commerce for the millions of businesses that run entirely on chat."
            </p>

            {/* LinkedIn Redirect Link */}
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-11 border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-xs flex items-center justify-center gap-2 transition-all duration-300 font-body font-semibold rounded-xl shadow-sm"
            >
              Connect on LinkedIn
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Card 2: Gaurav Pawar */}
          <div className="w-full border border-slate-200/60 bg-white/50 backdrop-blur-xl p-6 md:p-8 text-center hover:border-fuchsia-200 hover:bg-white hover:shadow-xl hover:shadow-fuchsia-100/50 transition-all duration-500 relative group rounded-3xl">
            
            {/* Co-Founder Initial Bubble */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-fuchsia-600 to-pink-600 flex items-center justify-center text-white text-2xl font-extrabold shadow-lg shadow-fuchsia-200 mb-6 mx-auto">
              GP
            </div>

            <span className="text-[10px] tracking-[0.2em] text-fuchsia-600 uppercase block mb-2 font-bold">
              Co-Founder & Operations
            </span>
            <h3 className="font-display text-xl tracking-tight text-slate-900 font-bold mb-2">
              Gaurav Pawar
            </h3>
            <p className="font-body text-sm text-slate-500 mb-8 leading-relaxed">
              "Empowering local businesses with AI tools to handle customer demands 24/7 with zero hassle."
            </p>

            {/* LinkedIn Redirect Link */}
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-11 border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-xs flex items-center justify-center gap-2 transition-all duration-300 font-body font-semibold rounded-xl shadow-sm"
            >
              Connect on LinkedIn
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Brand Story and Context (cols 6-12) */}
        <div className="md:col-span-7 flex flex-col gap-6 text-base text-slate-600 leading-relaxed text-left md:pl-8">
          
          <div className="flex items-center gap-2 mb-2">
            <div className="h-[1px] w-8 bg-violet-600/30"></div>
            <span className="text-[10px] tracking-[0.2em] text-violet-600 uppercase font-bold">THE STORY</span>
          </div>

          <p className="font-body text-lg text-slate-800 font-medium leading-snug">
            In India, WhatsApp is not just a messaging app; it is the digital operating system for commerce.
          </p>

          <p className="font-body">
            From local kirana shops and boutique fashion brands to large distributors, millions of customer deals are initiated, negotiated, and settled via chat threads every single day. However, managing hundreds of manual messages, checking stock lists, and updating catalog coordinates takes hours of precious business time.
          </p>

          <p className="font-body">
            AnytimeLLM was built to bridge this gap. We wanted to create an intelligent assistant that learns your pricing grids instantly and responds to customers in Hindi, English, or Hinglish just like a human store manager would.
          </p>

          <p className="font-body">
            By combining easy catalog uploads, order tracking database logic, and simple WhatsApp webhook triggers, we allow business owners to sleep soundly knowing their customers are served 24/7 without delays or coding hassles.
          </p>

          {/* Quick Info Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
            <div className="flex gap-4 items-start p-5 bg-white border border-slate-200/60 rounded-2xl shadow-sm hover:border-violet-200 hover:shadow-md transition-all duration-300">
              <Award className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <span className="text-[13px] tracking-tight text-slate-900 font-bold mb-1">Local-First Solution</span>
                <span className="text-[11px] leading-tight text-slate-500 font-medium">Built specifically for Indian business workflows.</span>
              </div>
            </div>
            <div className="flex gap-4 items-start p-5 bg-white border border-slate-200/60 rounded-2xl shadow-sm hover:border-violet-200 hover:shadow-md transition-all duration-300">
              <MessageSquare className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <span className="text-[13px] tracking-tight text-slate-900 font-bold mb-1">Multilingual AI</span>
                <span className="text-[11px] leading-tight text-slate-500 font-medium">Answers fluently in Hindi, English & Hinglish.</span>
              </div>
            </div>
          </div>

        </div>

      </section>

      {/* Contact Section */}
      <section id="contact" className="relative py-20 px-6 md:px-12 max-w-5xl mx-auto w-full z-10 border-t border-slate-200/50">
        <div className="text-center mb-12">
          <span className="text-[10px] tracking-[0.2em] text-violet-600 uppercase font-bold block mb-2">
            GET IN TOUCH
          </span>
          <h2 className="font-display text-3xl md:text-4xl text-slate-900 font-extrabold tracking-tight">
            We'd love to hear from you
          </h2>
          <p className="font-body text-slate-500 max-w-md mx-auto mt-3 text-sm font-medium">
            Have questions about integrations, custom builds, or subscription tiers? Connect with us directly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Email Card */}
          <div className="bg-white border border-slate-200/60 p-6 rounded-2xl shadow-sm hover:border-violet-200 hover:shadow-md transition-all duration-300 flex items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600 shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h4 className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-0.5">Email Us</h4>
              <a href="mailto:anytimellm10@gmail.com" className="text-base font-semibold text-slate-800 hover:text-violet-600 transition-colors">
                anytimellm10@gmail.com
              </a>
            </div>
          </div>

          {/* Call Card */}
          <div className="bg-white border border-slate-200/60 p-6 rounded-2xl shadow-sm hover:border-fuchsia-200 hover:shadow-md transition-all duration-300 flex items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-fuchsia-50 flex items-center justify-center text-fuchsia-600 shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div>
              <h4 className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-0.5">Call Us</h4>
              <a href="tel:+919315549695" className="text-base font-semibold text-slate-800 hover:text-fuchsia-600 transition-colors">
                +91 9315549695
              </a>
            </div>
          </div>
        </div>
      </section>

      <CtaBanner />
      <Footer />
    </div>
  );
}
