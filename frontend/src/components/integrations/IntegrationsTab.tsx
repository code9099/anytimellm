"use client";

import React, { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import type { Business } from "@/lib/api";
import { api } from "@/lib/api";
import { Loader2, MessageSquare, Shield, Zap, Link, Trash2, CheckCircle2 } from "lucide-react";

const Instagram = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

interface IntegrationsTabProps {
  activeBusiness: Business;
  copyToClipboard: (text: string) => void;
  onUpdateBusiness?: (biz: Business) => void;
}

interface ChannelStatus {
  connected: boolean;
  provider?: string;
  phone_number_id?: string;
  display_name?: string;
  verify_token?: string;
  page_id?: string;
  username?: string;
}

export default function IntegrationsTab({ activeBusiness, copyToClipboard, onUpdateBusiness }: IntegrationsTabProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // States for Business Profile update
  const [businessName, setBusinessName] = useState(activeBusiness.name);
  const [updatingName, setUpdatingName] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Sync prop changes
  useEffect(() => {
    setBusinessName(activeBusiness.name);
  }, [activeBusiness]);

  const [loadingWA, setLoadingWA] = useState(true);
  const [waStatus, setWaStatus] = useState<ChannelStatus | null>(null);
  const [waError, setWaError] = useState<string | null>(null);
  const [connectingWA, setConnectingWA] = useState(false);
  const [waDevMode, setWaDevMode] = useState(true);

  const [loadingInsta, setLoadingInsta] = useState(true);
  const [instaStatus, setInstaStatus] = useState<ChannelStatus | null>(null);
  const [instaError, setInstaError] = useState<string | null>(null);
  const [connectingInsta, setConnectingInsta] = useState(false);
  const [instaDevMode, setInstaDevMode] = useState(true);
  const [instaUsernameInput, setInstaUsernameInput] = useState("");
  const [instaPageIdInput, setInstaPageIdInput] = useState("");
  const [instaAccessTokenInput, setInstaAccessTokenInput] = useState("");

  const [copiedVerify, setCopiedVerify] = useState<{ [key: string]: boolean }>({});
  const [copiedWebhook, setCopiedWebhook] = useState<{ [key: string]: boolean }>({});

  // Fetch all channels status on mount
  useEffect(() => {
    fetchWAStatus();
    fetchInstaStatus();

    // Animate container elements
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current.children,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: "power2.out" }
      );
    }
  }, []);

  const fetchWAStatus = async () => {
    try {
      setLoadingWA(true);
      const res = await api.getMetaIntegrationStatus();
      setWaStatus(res);
    } catch (err) {
      console.error("Failed to load WhatsApp status:", err);
    } finally {
      setLoadingWA(false);
    }
  };

  const fetchInstaStatus = async () => {
    try {
      setLoadingInsta(true);
      const res = await api.getInstagramIntegrationStatus();
      setInstaStatus(res);
      if (res.username) {
        setInstaUsernameInput(res.username);
      }
    } catch (err) {
      console.error("Failed to load Instagram status:", err);
    } finally {
      setLoadingInsta(false);
    }
  };

  const loadAndInitFBSDK = async (): Promise<any> => {
    if ((window as any).FB) {
      return (window as any).FB;
    }

    // Fetch Meta App ID from the backend config endpoint
    const config = await api.getMetaConfig();
    if (!config.meta_app_id) {
      throw new Error("Meta App ID is not configured on the backend. Please set META_APP_ID in your backend settings.");
    }

    return new Promise((resolve, reject) => {
      // Setup async initialization callback
      (window as any).fbAsyncInit = function() {
        (window as any).FB.init({
          appId            : config.meta_app_id,
          autoLogAppEvents : true,
          xfbml            : true,
          version          : 'v25.0',
          cookie           : true
        });
        resolve((window as any).FB);
      };

      // Load SDK Script Tag
      const id = "facebook-jssdk";
      if (document.getElementById(id)) {
        const checkFB = setInterval(() => {
          if ((window as any).FB) {
            clearInterval(checkFB);
            (window as any).fbAsyncInit();
          }
        }, 100);
        return;
      }

      const fjs = document.getElementsByTagName("script")[0];
      const js = document.createElement("script") as HTMLScriptElement;
      js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      js.async = true;
      js.defer = true;
      js.crossOrigin = "anonymous";
      js.onerror = () => {
        reject(new Error("Failed to load Facebook SDK. Check if an adblocker is blocking connect.facebook.net."));
      };

      if (fjs && fjs.parentNode) {
        fjs.parentNode.insertBefore(js, fjs);
      } else {
        document.head.appendChild(js);
      }
    });
  };

  const handleWAConnect = async () => {
    setConnectingWA(true);
    setWaError(null);
    try {
      if (waDevMode) {
        await api.saveMetaAuthCode("mock_wa_code_" + Math.random().toString(36).substring(7));
        await fetchWAStatus();
        setConnectingWA(false);
      } else {
        const FBInstance = await loadAndInitFBSDK();
        if (!FBInstance) {
          throw new Error("Could not load or initialize Facebook SDK.");
        }

        FBInstance.login(
          (response: any) => {
            (async () => {
              if (response.authResponse && response.authResponse.code) {
                try {
                  // Determine the correct redirect URI for the exchange (where the popup was initialized)
                  const redirectUri = window.location.origin;
                  await api.saveMetaAuthCode(response.authResponse.code, redirectUri);
                  await fetchWAStatus();
                } catch (ex: any) {
                  setWaError(ex.message || "Failed to exchange auth credentials with the server.");
                }
              } else {
                setWaError("Meta registration login was cancelled or failed to verify.");
              }
              setConnectingWA(false);
            })();
          },
          {
            scope: "whatsapp_business_management,whatsapp_business_messaging",
            response_type: "code",
            override_default_response_type: true,
            extras: {
              feature: "whatsapp_embedded_signup"
            }
          }
        );
      }
    } catch (err: any) {
      setWaError(err.message || "WhatsApp connection failed.");
      setConnectingWA(false);
    }
  };


  const handleWADisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect WhatsApp? Your chatbot will stop responding to WhatsApp customers.")) return;
    setLoadingWA(true);
    try {
      await api.updateBusinessSettings(activeBusiness.id, {
        whatsapp_provider: "mock"
      });
      await fetchWAStatus();
    } catch (err) {
      setWaError("Failed to disconnect WhatsApp integration.");
    } finally {
      setLoadingWA(false);
    }
  };

  const handleInstaConnect = async () => {
    setConnectingInsta(true);
    setInstaError(null);
    try {
      const handle = instaUsernameInput.trim() || "@" + activeBusiness.name.toLowerCase().replace(/\s+/g, "_");
      
      const pageId = instaDevMode ? undefined : instaPageIdInput.trim();
      const accessToken = instaDevMode ? undefined : instaAccessTokenInput.trim();
      
      if (!instaDevMode && (!pageId || !accessToken)) {
        throw new Error("Please enter both Page ID and Access Token for real connection.");
      }

      await api.saveInstagramAuthCode(
        "mock_insta_code_" + Math.random().toString(36).substring(7),
        handle,
        pageId,
        accessToken
      );
      await fetchInstaStatus();
    } catch (err: any) {
      setInstaError(err.message || "Instagram connection failed.");
    } finally {
      setConnectingInsta(false);
    }
  };

  const handleInstaDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect Instagram? Your chatbot will stop responding to Instagram DMs.")) return;
    setLoadingInsta(true);
    try {
      await api.disconnectInstagram();
      await fetchInstaStatus();
    } catch (err) {
      setInstaError("Failed to disconnect Instagram integration.");
    } finally {
      setLoadingInsta(false);
    }
  };
  const handleUpdateBusinessName = async () => {
    setUpdatingName(true);
    setUpdateError(null);
    setUpdateSuccess(false);
    try {
      const updatedBiz = await api.updateBusinessSettings(activeBusiness.id, {
        name: businessName.trim()
      });
      setUpdateSuccess(true);
      if (onUpdateBusiness) {
        onUpdateBusiness(updatedBiz);
      }
    } catch (err: any) {
      setUpdateError(err.message || "Failed to update business name.");
    } finally {
      setUpdatingName(false);
    }
  };


  const copyUrl = (channel: string, path: string) => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:8000";
    copyToClipboard(`${baseUrl}${path}`);
    setCopiedWebhook(prev => ({ ...prev, [channel]: true }));
    setTimeout(() => setCopiedWebhook(prev => ({ ...prev, [channel]: false })), 2000);
  };

  const copyToken = (channel: string, token: string) => {
    copyToClipboard(token);
    setCopiedVerify(prev => ({ ...prev, [channel]: true }));
    setTimeout(() => setCopiedVerify(prev => ({ ...prev, [channel]: false })), 2000);
  };

  return (
    <div className="space-y-8 text-left">
      {/* Page Header */}
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-900 uppercase">
          Integrations & Channels
        </h1>
        <p className="font-body text-sm text-slate-500 mt-1">
          Link your automated AI assistant directly to messaging channels and take over conversations seamlessly.
        </p>
      </div>

      <div ref={containerRef} className="space-y-8">
        
        {/* ==================== WORKSPACE PROFILE SETTINGS ==================== */}
        <div className="space-y-4 bg-white border border-slate-200/60 p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-600 font-bold">domain</span>
            <h2 className="font-display text-lg font-bold text-slate-700 uppercase tracking-wide">Workspace Profile</h2>
          </div>
          
          <div className="max-w-md space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Business / Organization Name
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Enter business name"
                  className="w-full bg-slate-50 border border-slate-200 font-body text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-500 transition-all duration-300 font-semibold text-slate-800"
                />
                <button
                  onClick={handleUpdateBusinessName}
                  disabled={updatingName || !businessName.trim() || businessName.trim() === activeBusiness.name}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-body text-xs tracking-wider uppercase flex items-center justify-center gap-1.5 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-bold rounded-xl shadow-sm shrink-0"
                >
                  {updatingName ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving
                    </>
                  ) : (
                    "Save"
                  )}
                </button>
              </div>
            </div>

            {updateSuccess && (
              <div className="text-emerald-600 text-xs font-semibold flex items-center gap-1.5 animate-fade-in">
                <CheckCircle2 className="w-4 h-4" />
                Business name updated successfully!
              </div>
            )}
            {updateError && (
              <div className="text-red-600 text-xs font-semibold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">error</span>
                {updateError}
              </div>
            )}
          </div>
        </div>

        {/* ==================== CHANNEL 1: WHATSAPP ==================== */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600 font-bold">chat</span>
            <h2 className="font-display text-lg font-bold text-slate-700 uppercase tracking-wide">WhatsApp Channel</h2>
          </div>
          
          {waError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-750 text-sm font-mono">
              <span className="material-symbols-outlined text-[16px] text-red-600 shrink-0 mt-0.5">error</span>
              <span>{waError}</span>
            </div>
          )}

          {loadingWA ? (
            <div className="bg-white border border-slate-200 p-8 flex flex-col items-center justify-center space-y-3 shadow-xs rounded-2xl">
              <Loader2 className="w-6 h-6 animate-spin text-[#128C7E]" />
              <span className="font-mono text-[9px] tracking-widest text-slate-400 uppercase font-bold">Querying WhatsApp Status...</span>
            </div>
          ) : waStatus?.connected ? (
            <div className="bg-white border border-slate-200 p-6 space-y-6 shadow-xs rounded-2xl">
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                  <span className="font-mono text-[9px] text-emerald-700 tracking-widest font-bold uppercase bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                    ACTIVE (AI TAKEOVER ENABLED)
                  </span>
                  <h3 className="font-display text-xl font-extrabold text-slate-800 uppercase mt-4">
                    {waStatus.display_name || "WhatsApp Business Account"}
                  </h3>
                  <p className="font-body text-sm text-slate-500 mt-1 leading-relaxed">
                    Incoming messages to your business number are processed by your AI agent, while you retain manual chat controls on your WhatsApp Business app.
                  </p>
                </div>
                <button
                  onClick={handleWADisconnect}
                  className="border border-red-200 hover:border-red-500 hover:bg-red-50/50 text-red-650 rounded-xl py-1.5 px-4 font-mono text-[9px] tracking-wider uppercase transition-all duration-200 cursor-pointer font-bold shrink-0"
                >
                  Disconnect WhatsApp
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-6">
                <div className="p-4 bg-slate-50 border border-slate-200 font-mono text-sm text-left rounded-xl">
                  <span className="block text-slate-450 text-[9px] uppercase tracking-wider font-bold mb-1">WhatsApp Phone ID</span>
                  <span className="text-slate-800 font-bold select-all">{waStatus.phone_number_id || "N/A"}</span>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 font-mono text-sm text-left rounded-xl">
                  <span className="block text-slate-450 text-[9px] uppercase tracking-wider font-bold mb-1">API Provider</span>
                  <span className="text-slate-800 font-bold uppercase tracking-wider">{waStatus.provider || "N/A"}</span>
                </div>
              </div>

              {waStatus.verify_token && (
                <div className="space-y-4 border-t border-slate-100 pt-6 font-mono text-sm text-left">
                  <h4 className="font-bold text-slate-700 uppercase tracking-wider text-xs">System Webhook Details:</h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 items-center">
                      <div className="col-span-1 text-slate-450 font-bold uppercase tracking-wider text-[9px]">Webhook URL:</div>
                      <div className="col-span-2 text-slate-850 truncate font-bold select-all pl-2 text-xs">
                        {typeof window !== "undefined" ? window.location.origin : "http://localhost:8000"}/api/webhooks/whatsapp/incoming
                      </div>
                      <div className="col-span-1 text-right">
                        <button
                          onClick={() => copyUrl("whatsapp", "/api/webhooks/whatsapp/incoming")}
                          className="inline-flex items-center gap-1.5 text-[9px] uppercase tracking-[0.15em] px-3.5 py-1.5 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 transition duration-200 cursor-pointer font-bold text-slate-700"
                        >
                          {copiedWebhook["whatsapp"] ? "Copied" : "Copy URL"}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 items-center">
                      <div className="col-span-1 text-slate-450 font-bold uppercase tracking-wider text-[9px]">Verify Token:</div>
                      <div className="col-span-2 text-slate-850 font-bold select-all pl-2 text-xs">
                        {waStatus.verify_token}
                      </div>
                      <div className="col-span-1 text-right">
                        <button
                          onClick={() => copyToken("whatsapp", waStatus.verify_token || "")}
                          className="inline-flex items-center gap-1.5 text-[9px] uppercase tracking-[0.15em] px-3.5 py-1.5 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 transition duration-200 cursor-pointer font-bold text-slate-700"
                        >
                          {copiedVerify["whatsapp"] ? "Copied" : "Copy Token"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 p-8 space-y-6 shadow-xs rounded-2xl">
              <div>
                <span className="font-mono text-[9px] text-[#128C7E] tracking-widest uppercase font-bold bg-[#128C7E]/5 px-2 py-0.5 rounded border border-[#128C7E]/20">Meta Cloud Channel</span>
                <h3 className="font-display text-xl font-extrabold text-slate-800 uppercase mt-2 mb-2">
                  Link WhatsApp Business API
                </h3>
                <p className="font-body text-sm text-slate-500 leading-relaxed max-w-2xl">
                  Connect your business phone number to respond to orders, query catalogs, and answers FAQ autonomously.
                </p>
              </div>

              {/* Onboarding Trigger Controls */}
              <div className="p-6 bg-slate-50 border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6 rounded-2xl">
                <div className="text-left">
                  <h4 className="font-display text-sm text-slate-800 uppercase font-bold tracking-wider">Start Verification Flow</h4>
                  <p className="font-body text-xs text-slate-500 mt-1">
                    Initiate setup in Meta Developer Dashboard.
                  </p>
                  
                  {/* Developer Mock Toggle */}
                  <div className="flex items-center gap-2 mt-4 font-mono text-[9px]">
                    <input
                      type="checkbox"
                      id="wa-dev-mode-checkbox"
                      checked={waDevMode}
                      onChange={(e) => setWaDevMode(e.target.checked)}
                      className="rounded-md border border-slate-250 bg-transparent text-slate-800 focus:ring-0 cursor-pointer"
                    />
                    <label htmlFor="wa-dev-mode-checkbox" className="text-slate-550 uppercase tracking-wider cursor-pointer font-bold">
                      Developer Mock Connection (Verify immediately)
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleWAConnect}
                  disabled={connectingWA}
                  className="w-full md:w-auto h-12 px-8 bg-gradient-to-r from-[#128C7E] to-[#25D366] hover:opacity-95 text-white font-mono text-sm tracking-[0.2em] uppercase flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 cursor-pointer shadow-sm font-bold rounded-xl"
                >
                  {connectingWA ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      CONNECTING...
                    </>
                  ) : (
                    "Connect WhatsApp"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ==================== CHANNEL 2: INSTAGRAM ==================== */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Instagram className="text-fuchsia-600 w-5 h-5 shrink-0" />
            <h2 className="font-display text-lg font-bold text-slate-700 uppercase tracking-wide">Instagram Channel</h2>
          </div>
          
          {instaError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-750 text-sm font-mono">
              <span className="material-symbols-outlined text-[16px] text-red-600 shrink-0 mt-0.5">error</span>
              <span>{instaError}</span>
            </div>
          )}

          {loadingInsta ? (
            <div className="bg-white border border-slate-200 p-8 flex flex-col items-center justify-center space-y-3 shadow-xs rounded-2xl">
              <Loader2 className="w-6 h-6 animate-spin text-fuchsia-600" />
              <span className="font-mono text-[9px] tracking-widest text-slate-400 uppercase font-bold">Querying Instagram Status...</span>
            </div>
          ) : instaStatus?.connected ? (
            <div className="bg-white border border-slate-200 p-6 space-y-6 shadow-xs rounded-2xl">
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                  <span className="font-mono text-[9px] text-fuchsia-700 bg-fuchsia-50 border border-fuchsia-200 tracking-widest font-bold uppercase px-2.5 py-1 rounded-md">
                    ACTIVE (AI TAKEOVER ACTIVE)
                  </span>
                  <h3 className="font-display text-xl font-extrabold text-slate-800 uppercase mt-4">
                    Instagram Handle: {instaStatus.username || "@mybusiness"}
                  </h3>
                  <p className="font-body text-sm text-slate-500 mt-1 leading-relaxed">
                    Incoming Instagram Direct Messages (DMs) are routed to your AnytimeLLM agent. When operators manual reply in the Inbox, the agent pauses automatically.
                  </p>
                </div>
                <button
                  onClick={handleInstaDisconnect}
                  className="border border-red-200 hover:border-red-500 hover:bg-red-50/50 text-red-650 rounded-xl py-1.5 px-4 font-mono text-[9px] tracking-wider uppercase transition-all duration-200 cursor-pointer font-bold shrink-0"
                >
                  Disconnect Instagram
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-6">
                <div className="p-4 bg-slate-50 border border-slate-200 font-mono text-sm text-left rounded-xl">
                  <span className="block text-slate-450 text-[9px] uppercase tracking-wider font-bold mb-1">Instagram Account ID</span>
                  <span className="text-slate-800 font-bold select-all">{instaStatus.page_id || "N/A"}</span>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 font-mono text-sm text-left rounded-xl">
                  <span className="block text-slate-450 text-[9px] uppercase tracking-wider font-bold mb-1">Active Handle</span>
                  <span className="text-slate-800 font-bold select-all">{instaStatus.username || "N/A"}</span>
                </div>
              </div>

              {instaStatus.verify_token && (
                <div className="space-y-4 border-t border-slate-100 pt-6 font-mono text-sm text-left">
                  <h4 className="font-bold text-slate-700 uppercase tracking-wider text-xs">System Webhook Details:</h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 items-center">
                      <div className="col-span-1 text-slate-450 font-bold uppercase tracking-wider text-[9px]">Webhook URL:</div>
                      <div className="col-span-2 text-slate-850 truncate font-bold select-all pl-2 text-xs">
                        {typeof window !== "undefined" ? window.location.origin : "http://localhost:8000"}/api/webhooks/instagram/incoming
                      </div>
                      <div className="col-span-1 text-right">
                        <button
                          onClick={() => copyUrl("instagram", "/api/webhooks/instagram/incoming")}
                          className="inline-flex items-center gap-1.5 text-[9px] uppercase tracking-[0.15em] px-3.5 py-1.5 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 transition duration-200 cursor-pointer font-bold text-slate-700"
                        >
                          {copiedWebhook["instagram"] ? "Copied" : "Copy URL"}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 items-center">
                      <div className="col-span-1 text-slate-450 font-bold uppercase tracking-wider text-[9px]">Verify Token:</div>
                      <div className="col-span-2 text-slate-850 font-bold select-all pl-2 text-xs">
                        {instaStatus.verify_token}
                      </div>
                      <div className="col-span-1 text-right">
                        <button
                          onClick={() => copyToken("instagram", instaStatus.verify_token || "")}
                          className="inline-flex items-center gap-1.5 text-[9px] uppercase tracking-[0.15em] px-3.5 py-1.5 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 transition duration-200 cursor-pointer font-bold text-slate-700"
                        >
                          {copiedVerify["instagram"] ? "Copied" : "Copy Token"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 p-8 space-y-6 shadow-xs rounded-2xl">
              <div>
                <span className="font-mono text-[9px] text-fuchsia-600 tracking-widest uppercase font-bold bg-fuchsia-50 border border-fuchsia-200 px-2 py-0.5 rounded">Instagram Messenger Channel</span>
                <h3 className="font-display text-xl font-extrabold text-slate-800 uppercase mt-2 mb-2">
                  Takeover Instagram Direct Messages
                </h3>
                <p className="font-body text-sm text-slate-500 leading-relaxed max-w-2xl">
                  Deploy your autonomous AI sales agent on Instagram. The agent handles inbound inquiries, catalog checks, and reservation prompts immediately.
                </p>
              </div>

              {/* Onboarding Trigger Controls */}
              <div className="p-6 bg-slate-50 border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6 rounded-2xl">
                <div className="text-left flex-1 space-y-4">
                  <div>
                    <h4 className="font-display text-sm text-slate-800 uppercase font-bold tracking-wider">Instagram Page Identity</h4>
                    <p className="font-body text-xs text-slate-500 mt-1">
                      Specify the Instagram handle to deploy the AI chatbot takeover.
                    </p>
                  </div>
                  
                  <div className="max-w-md flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1">
                    <span className="font-mono text-slate-400 font-bold text-sm">@</span>
                    <input
                      type="text"
                      placeholder="instagram_handle"
                      value={instaUsernameInput.replace("@", "")}
                      onChange={(e) => setInstaUsernameInput(e.target.value)}
                      className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-sm font-mono text-slate-800 placeholder:text-slate-350"
                    />
                  </div>

                  {/* Developer Mock Toggle */}
                  <div className="flex items-center gap-2 mt-4 font-mono text-[9px]">
                    <input
                      type="checkbox"
                      id="insta-dev-mode-checkbox"
                      checked={instaDevMode}
                      onChange={(e) => setInstaDevMode(e.target.checked)}
                      className="rounded-md border border-slate-250 bg-transparent text-slate-800 focus:ring-0 cursor-pointer"
                    />
                    <label htmlFor="insta-dev-mode-checkbox" className="text-slate-550 uppercase tracking-wider cursor-pointer font-bold">
                      Developer Mock Mode (Link handle instantly)
                    </label>
                  </div>

                  {/* Real Credentials Inputs when not in Dev Mock Mode */}
                  {!instaDevMode && (
                    <div className="space-y-4 mt-4 max-w-md text-left">
                      <div>
                        <label className="block font-mono text-[9px] tracking-wider text-slate-400 uppercase font-bold mb-1">
                          Meta Instagram Page ID
                        </label>
                        <input
                          type="text"
                          placeholder="Enter your real Page ID"
                          value={instaPageIdInput}
                          onChange={(e) => setInstaPageIdInput(e.target.value)}
                          className="w-full bg-white border border-slate-250 font-mono text-xs p-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-fuchsia-600 focus:border-fuchsia-600"
                        />
                      </div>
                      <div>
                        <label className="block font-mono text-[9px] tracking-wider text-slate-400 uppercase font-bold mb-1">
                          Meta Page Access Token
                        </label>
                        <input
                          type="text"
                          placeholder="Enter your real Page Access Token"
                          value={instaAccessTokenInput}
                          onChange={(e) => setInstaAccessTokenInput(e.target.value)}
                          className="w-full bg-white border border-slate-250 font-mono text-xs p-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-fuchsia-600 focus:border-fuchsia-600"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleInstaConnect}
                  disabled={connectingInsta}
                  className="w-full md:w-auto h-12 px-8 bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-500 hover:opacity-95 text-white font-mono text-sm tracking-[0.2em] uppercase flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 cursor-pointer shadow-sm font-bold rounded-xl shrink-0"
                >
                  {connectingInsta ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      CONNECTING...
                    </>
                  ) : (
                    "Connect Instagram"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
