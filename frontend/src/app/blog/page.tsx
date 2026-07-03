import React from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CtaBanner from "@/components/layout/CtaBanner";
import { ArrowRight, BookOpen } from "lucide-react";

const MOCK_POSTS = [
  {
    id: "post-1",
    title: "How Local Restaurants Are Using WhatsApp to Bypass Delivery Apps",
    category: "Case Study",
    date: "June 12, 2026",
    excerpt: "Learn how a single pizzeria recovered 15% of their margin by shifting loyal customers to an AI-powered WhatsApp ordering system.",
  },
  {
    id: "post-2",
    title: "The Future of B2B Wholesale is Conversational",
    category: "Industry Insights",
    date: "June 5, 2026",
    excerpt: "Why the traditional PDF catalog is dying, and how distributors are using RAG agents to automate bulk pricing queries instantly.",
  },
  {
    id: "post-3",
    title: "Announcing AnytimeLLM Enterprise Routing",
    category: "Product Update",
    date: "May 28, 2026",
    excerpt: "Seamlessly route complex queries from the AI assistant directly to a human agent's WhatsApp or Zendesk inbox.",
  }
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 relative flex flex-col justify-between overflow-x-hidden selection:bg-violet-100 selection:text-violet-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 h-full w-full bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-50 pointer-events-none" />
      
      <Header />

      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-600/5 rounded-full blur-[120px] pointer-events-none z-0" />

      <main className="flex-1 relative z-10">
        <section className="pt-40 pb-20 px-6 md:px-12 w-full max-w-6xl mx-auto">
          
          <div className="text-center mb-16">
            <div className="mb-6 inline-flex items-center gap-1.5 border border-violet-200/50 bg-violet-50/50 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-sm mx-auto">
              <BookOpen className="w-3.5 h-3.5 text-violet-600 fill-violet-600/20" />
              <span className="text-[10px] tracking-[0.2em] text-violet-700 uppercase font-bold">
                RESOURCES & INSIGHTS
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1] mb-6">
              The AnytimeLLM Blog.
            </h1>
            <p className="text-base md:text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
              Stories, strategies, and updates on building autonomous customer service for your business.
            </p>
          </div>

          {/* Featured Post */}
          <div className="mb-12 rounded-[2.5rem] bg-white/60 backdrop-blur-xl border border-slate-200/60 p-8 md:p-12 hover:shadow-xl hover:shadow-violet-500/5 transition-all duration-300 cursor-pointer group">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1 space-y-6">
                <div className="inline-flex px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-xs font-bold tracking-wide uppercase">
                  Featured
                </div>
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 group-hover:text-violet-600 transition-colors">
                  Why 24/7 Responsiveness is the New Storefront
                </h2>
                <p className="text-slate-500 text-lg leading-relaxed">
                  In a world of instant gratification, the business that replies fastest wins. Discover the hidden cost of missed messages and how AI levels the playing field for local businesses.
                </p>
                <div className="flex items-center text-sm font-bold text-violet-600 gap-2">
                  Read Article <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
              <div className="w-full md:w-1/3 aspect-video md:aspect-square bg-slate-100 rounded-3xl border border-slate-200/50 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-violet-100 to-indigo-50 opacity-50" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 bg-white/50 backdrop-blur-md rounded-full shadow-sm border border-white/60 flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-violet-300" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Grid Posts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {MOCK_POSTS.map((post) => (
              <div
                key={post.id}
                className="group p-8 bg-white/60 backdrop-blur-xl border border-slate-200/60 rounded-[2rem] hover:shadow-xl hover:shadow-violet-500/5 hover:border-violet-200 transition-all duration-300 flex flex-col justify-between cursor-pointer"
              >
                <div>
                  <div className="mb-4 inline-flex px-2 py-1 bg-slate-100 rounded-md text-[10px] uppercase font-bold tracking-wider text-slate-500">
                    {post.category}
                  </div>
                  <h3 className="text-xl font-bold tracking-tight text-slate-900 mb-3 group-hover:text-violet-600 transition-colors line-clamp-2">{post.title}</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8 line-clamp-3">{post.excerpt}</p>
                </div>
                
                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-xs text-slate-400 font-medium">{post.date}</span>
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 group-hover:bg-violet-50 text-slate-400 group-hover:text-violet-600 transition-colors">
                    <ArrowRight className="w-4 h-4 -rotate-45 group-hover:rotate-0 transition-transform" />
                  </div>
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
