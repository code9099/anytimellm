import React from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CtaBanner from "@/components/layout/CtaBanner";
import { LayoutTemplate, ArrowRight, Copy, Terminal } from "lucide-react";

const MOCK_TEMPLATES = [
  {
    id: "boutique",
    name: "The Boutique Retailer",
    description: "Connects your Shopify inventory with WhatsApp for instant fashion retail support.",
    tag: "Retail",
  },
  {
    id: "restaurant",
    name: "The Local Restaurant",
    description: "PDF Menu parsing, take-out order routing, and reservation handling.",
    tag: "Food & Bev",
  },
  {
    id: "real-estate",
    name: "The Real Estate Agent",
    description: "CRM lead capture, property FAQs, and automated showing schedules.",
    tag: "Real Estate",
  },
  {
    id: "b2b-distributor",
    name: "The B2B Distributor",
    description: "Bulk pricing lookups, re-order history, and invoice generation.",
    tag: "Wholesale",
  },
  {
    id: "gym",
    name: "The Fitness Studio",
    description: "Class schedules, membership inquiries, and trainer booking.",
    tag: "Services",
  },
  {
    id: "salon",
    name: "The Beauty Salon",
    description: "Appointment booking, service pricing, and cancellation policies.",
    tag: "Services",
  }
];

export default function TemplatesPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 relative flex flex-col justify-between overflow-x-hidden selection:bg-violet-100 selection:text-violet-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 h-full w-full bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-50 pointer-events-none" />
      
      <Header />

      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-600/5 rounded-full blur-[120px] pointer-events-none z-0" />

      <main className="flex-1 relative z-10">
        <section className="pt-40 pb-20 px-6 md:px-12 w-full text-center max-w-6xl mx-auto">
          
          <div className="mb-6 inline-flex items-center gap-1.5 border border-violet-200/50 bg-violet-50/50 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-sm">
            <LayoutTemplate className="w-3.5 h-3.5 text-violet-600 fill-violet-600/20" />
            <span className="text-[10px] tracking-[0.2em] text-violet-700 uppercase font-bold">
              AGENT TEMPLATES
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1] mb-6">
            Start faster with <br className="hidden md:block"/> Pre-built Brains.
          </h1>
          <p className="text-base md:text-xl text-slate-500 font-medium mb-16 max-w-2xl mx-auto leading-relaxed">
            Copy-paste system instructions and prompts designed specifically for your industry's workflow.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            {MOCK_TEMPLATES.map((template) => (
              <div
                key={template.id}
                className="group p-8 bg-white/60 backdrop-blur-xl border border-slate-200/60 rounded-[2rem] hover:shadow-xl hover:shadow-violet-500/5 hover:border-violet-200 transition-all duration-300 flex flex-col justify-between cursor-pointer"
              >
                <div>
                  <div className="mb-4 inline-flex px-2 py-1 bg-slate-100 rounded-md text-[10px] uppercase font-bold tracking-wider text-slate-500">
                    {template.tag}
                  </div>
                  <h3 className="text-xl font-bold tracking-tight text-slate-900 mb-3">{template.name}</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8">{template.description}</p>
                </div>
                
                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                  <div className="flex items-center text-[11px] uppercase tracking-[0.1em] text-violet-600 font-bold gap-1.5 group-hover:text-violet-700 transition-colors">
                    <Terminal className="w-3 h-3" /> View Prompt
                  </div>
                  <button className="p-2 bg-slate-50 hover:bg-violet-50 rounded-full text-slate-400 hover:text-violet-600 transition-colors">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <CtaBanner />
      <Footer />
    </div>
  );
}
