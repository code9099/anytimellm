"use client";

import React from "react";
import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    {
      title: "Product",
      links: [
        { name: "Features", href: "/#features" },
        { name: "Pricing", href: "/pricing" },
        { name: "Demo", href: "/demo" },
        { name: "Use Cases", href: "/use-cases" },
      ],
    },
    {
      title: "Company",
      links: [
        { name: "About", href: "/about" },
        { name: "Security", href: "/security" },
        { name: "Contact", href: "/about#contact" },
        { name: "Privacy Policy", href: "/privacy-policy" },
        { name: "Terms of Service", href: "/terms-of-service" },
      ],
    },
    {
      title: "Resources",
      links: [
        { name: "Documentation", href: "/docs" },
        { name: "WhatsApp Setup", href: "/demo" },
        { name: "API Reference", href: "/docs" },
      ],
    },
  ];

  return (
    <footer className="bg-transparent border-t border-slate-200/50 mt-12">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="block mb-3">
              <span className="font-display text-[15px] font-extrabold tracking-[0.12em] text-slate-900">
                ANYTIMELLM
              </span>
            </Link>
            <div className="font-body text-[13px] text-slate-500 leading-relaxed max-w-xs font-medium space-y-1">
              <div>Email: <a href="mailto:anytimellm10@gmail.com" className="hover:text-slate-900 font-semibold transition-colors">anytimellm10@gmail.com</a></div>
              <div>Phone: <a href="tel:+919315549695" className="hover:text-slate-900 font-semibold transition-colors">+91 93155 49695</a></div>
              <div className="pt-0.5 text-xs text-slate-400 leading-snug">Address: D-11/322, Sector-7, Rohini, Delhi - 110085</div>
            </div>
            <div className="flex items-center gap-1.5 mt-4">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-body text-[10px] font-bold text-emerald-600 tracking-wider uppercase">
                ALL SYSTEMS OPERATIONAL
              </span>
            </div>
          </div>

          {/* Link Columns */}
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h4 className="font-display text-[11px] font-bold text-slate-800 tracking-[0.15em] uppercase mb-4">
                {section.title}
              </h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-slate-500 hover:text-slate-900 transition-colors duration-300"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-[12px] text-slate-400">
            © {currentYear} AnytimeLLM. All rights reserved.
          </span>
          <div className="flex items-center gap-6">
            <Link href="/privacy-policy" className="text-[12px] text-slate-400 hover:text-slate-600 transition-colors">
              Privacy
            </Link>
            <Link href="/terms-of-service" className="text-[12px] text-slate-400 hover:text-slate-600 transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
