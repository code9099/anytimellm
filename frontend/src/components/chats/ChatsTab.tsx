"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Loader2, 
  RefreshCw, 
  MessageSquare, 
  Send, 
  Search, 
  Phone,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  X
} from "lucide-react";
import { api } from "@/lib/api";
import type { Conversation } from "@/lib/api";

interface ChatsTabProps {
  businessId: string;
  chats: Conversation[];
  loading: boolean;
  onRefresh: () => void;
  onSendReply: (conversationId: string, content: string) => Promise<void>;
  onTogglePause: (conversationId: string, isPaused: boolean) => Promise<void>;
  onTabChange?: (tab: "overview" | "ingest" | "catalog" | "playground" | "integrations" | "orders" | "chats" | "analytics") => void;
  page: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export default function ChatsTab({
  businessId,
  chats,
  loading,
  onRefresh,
  onSendReply,
  onTogglePause,
  onTabChange,
  page,
  total,
  limit,
  onPageChange,
}: ChatsTabProps) {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  // States for initiating a new chat
  const [showInitiateModal, setShowInitiateModal] = useState(false);
  const [newChatPhone, setNewChatPhone] = useState("");
  const [newChatName, setNewChatName] = useState("");
  const [newChatMessage, setNewChatMessage] = useState("");
  const [initiatingChat, setInitiatingChat] = useState(false);
  const [initiateError, setInitiateError] = useState<string | null>(null);
  
  const threadEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (threadEndRef.current && threadEndRef.current.parentElement) {
      const container = threadEndRef.current.parentElement;
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [selectedChatId, chats]);

  const handleInitiateChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatPhone.trim() || !newChatMessage.trim()) return;

    setInitiatingChat(true);
    setInitiateError(null);
    try {
      const newConv = await api.initiateChat(
        businessId,
        newChatPhone.trim(),
        newChatMessage.trim(),
        newChatName.trim() || undefined
      );
      
      // Reset inputs & close modal
      setNewChatPhone("");
      setNewChatName("");
      setNewChatMessage("");
      setShowInitiateModal(false);
      
      // Auto-select the newly created chat conversation & refresh parent feed list
      setSelectedChatId(newConv.id);
      onRefresh();
    } catch (err: any) {
      setInitiateError(err.message || "Failed to initiate new conversation.");
    } finally {
      setInitiatingChat(false);
    }
  };

  const renderInitiateModal = () => {
    if (!showInitiateModal) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 relative">
          <button
            type="button"
            onClick={() => setShowInitiateModal(false)}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <h3 className="font-display text-lg font-bold text-slate-900 mb-1">
            Start a New Conversation
          </h3>
          <p className="font-body text-xs text-slate-500 mb-6">
            Initiate contact with a customer using Meta Cloud API. If this is a new number, ensure you have whitelisted it or send an approved template.
          </p>

          <form onSubmit={handleInitiateChat} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1.5">
                Customer Phone Number
              </label>
              <input
                type="text"
                placeholder="e.g. 919315549695"
                value={newChatPhone}
                onChange={(e) => setNewChatPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 font-body text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/25 focus:border-purple-500 transition-all duration-300 font-semibold text-slate-800"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1.5">
                Customer Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. John Doe"
                value={newChatName}
                onChange={(e) => setNewChatName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 font-body text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/25 focus:border-purple-500 transition-all duration-300 font-semibold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1.5">
                Initial Message
              </label>
              <textarea
                placeholder="Type your first message here..."
                value={newChatMessage}
                onChange={(e) => setNewChatMessage(e.target.value)}
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 font-body text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/25 focus:border-purple-500 transition-all duration-300 font-semibold text-slate-800 resize-none"
                required
              />
            </div>

            {initiateError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-650 font-semibold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{initiateError}</span>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowInitiateModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors text-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={initiatingChat || !newChatPhone.trim() || !newChatMessage.trim()}
                className="px-5 py-2 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-40 text-sm flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                {initiatingChat ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Initiate Chat
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (!loading && chats.length === 0) {
    return (
      <>
        <div className="space-y-4 h-[calc(100vh-140px)] flex flex-col overflow-hidden text-left pb-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 shrink-0">
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
                Live Chats
              </h1>
              <p className="font-body text-sm text-slate-500 mt-1">
                Monitor and override the Business Brain.
              </p>
            </div>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 border border-slate-100">
              <MessageSquare className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="font-semibold text-slate-800 text-lg">No conversations resolved yet</h3>
            <p className="text-sm text-slate-500 mt-2 max-w-md leading-relaxed">
              Link Meta channels in settings to receive customer inquiries. Once connected, customer conversations will populate here.
            </p>
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => onTabChange?.("integrations")}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Connect Channels
              </button>
              <button
                onClick={() => setShowInitiateModal(true)}
                className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Start New Chat
              </button>
            </div>
          </div>
        </div>
        {renderInitiateModal()}
      </>
    );
  }

  const activeChat = chats.find(c => c.id === selectedChatId);
  const isActiveInstagram = activeChat?.channel === "instagram";

  const filteredChats = chats.filter(c => {
    const name = (c.customer_name || "").toLowerCase();
    const phone = (c.customer_phone || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || phone.includes(query);
  });

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedChatId) return;

    setSendingReply(true);
    try {
      await onSendReply(selectedChatId, replyText);
      setReplyText("");
    } catch (err) {
      console.error(err);
    } finally {
      setSendingReply(false);
    }
  };




  const getRelativeTime = (timeStr: string) => {
    try {
      const date = new Date(timeStr);
      const delta = Math.round((Date.now() - date.getTime()) / 1000);
      if (delta < 60) return "now";
      const minutes = Math.round(delta / 60);
      if (minutes < 60) return `${minutes}m`;
      const hours = Math.round(minutes / 60);
      if (hours < 24) return `${hours}h`;
      return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch (e) {
      return "";
    }
  };

  const getFormatTimeOnly = (timeStr: string) => {
    try {
      const date = new Date(timeStr);
      return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return "";
    }
  };

  const getMessageStyle = (m: any) => {
    const isAgent = m.sender === "agent";
    const text = m.content.toLowerCase();
    
    if (!isAgent) {
      return {
        bg: "bg-slate-100",
        text: "text-slate-900",
        border: "border-slate-200"
      };
    }
    if (text.includes("order") || text.includes("₹")) {
      return {
        bg: "bg-emerald-50",
        text: "text-emerald-900",
        border: "border-emerald-200"
      };
    }
    if (text.includes("system") || text.includes("error")) {
      return {
        bg: "bg-blue-50",
        text: "text-blue-900",
        border: "border-blue-200"
      };
    }
    return {
      bg: "bg-purple-50",
      text: "text-purple-900",
      border: "border-purple-200"
    };
  };

  return (
    <div className="space-y-4 h-[calc(100vh-140px)] flex flex-col overflow-hidden text-left pb-4">
      {/* Tab Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 shrink-0">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Live Chats
          </h1>
          <p className="font-body text-sm text-slate-500 mt-1">
            Monitor and override the Business Brain.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowInitiateModal(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 text-sm font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-all duration-200 shadow-sm cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            Start New Chat
          </button>

          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all duration-200 shadow-sm"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Refresh
          </button>
        </div>
      </div>

      {/* Main split-pane content */}
      <div className="flex-1 flex gap-0 items-stretch overflow-hidden min-h-0 bg-white border border-slate-200 rounded-xl shadow-sm">
        {/* Left Column: Chat Conversation Threads list */}
        <div className={`w-full md:w-80 flex flex-col border-r border-slate-200 shrink-0 bg-[#F8FAFC] ${selectedChatId ? "hidden md:flex" : "flex"}`}>
          {/* Search bar */}
          <div className="p-3 border-b border-slate-200 bg-white shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 border-none rounded-lg pl-9 pr-4 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
          </div>

          {/* List feed */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loading && chats.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                {searchQuery ? "No matching chats found" : "No active chats"}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredChats.map((c) => {
                  const isSelected = selectedChatId === c.id;
                  const isInstagram = c.channel === "instagram";
                  const initials = (c.customer_name || (isInstagram ? "IG" : "WA"))
                    .split(" ")
                    .map(n => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();
                    
                  const selectionClass = isSelected
                    ? "bg-white border-l-2 border-l-purple-500 shadow-sm"
                    : "hover:bg-slate-50 border-l-2 border-l-transparent";

                  // Semantic Status Dots (Mocked based on is_ai_paused for now)
                  const StatusIcon = c.is_ai_paused ? AlertCircle : CheckCircle2;
                  const statusColor = c.is_ai_paused ? "text-amber-500" : "text-emerald-500";

                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedChatId(c.id)}
                      className={`p-4 flex gap-3 cursor-pointer transition-all duration-200 select-none ${selectionClass}`}
                    >
                      {/* Customer avatar */}
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm shrink-0 border border-slate-100">
                          {initials}
                        </div>
                        <StatusIcon className={`w-3.5 h-3.5 absolute -bottom-0.5 -right-0.5 bg-white rounded-full ${statusColor}`} />
                      </div>

                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <span className="font-semibold text-slate-900 text-sm truncate">
                            {c.customer_name || (isInstagram ? "Instagram User" : "WhatsApp User")}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium shrink-0 ml-1">
                            {c.messages.length > 0
                              ? getRelativeTime(c.messages[c.messages.length - 1].created_at)
                              : getRelativeTime(c.created_at)}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 truncate leading-snug">
                          {c.last_message_content || "No messages sent yet"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {/* Pagination Controls */}
          {total > limit && (
            <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-2 shrink-0">
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page === 1}
                className="relative inline-flex items-center rounded-md border border-slate-250 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-650 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Prev
              </button>
              <span className="text-[10px] font-bold text-slate-500 font-mono">
                Page {page}/{Math.ceil(total / limit)}
              </span>
              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page * limit >= total}
                className="relative inline-flex items-center rounded-md border border-slate-250 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-650 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Chat thread detail */}
        <div className={`flex-1 flex flex-col relative bg-white ${selectedChatId ? "flex" : "hidden md:flex"}`}>
          {activeChat ? (
            <>
              {/* Header profile info */}
              <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0 bg-white">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedChatId(null)}
                    className="md:hidden flex items-center justify-center p-1.5 text-slate-500 hover:text-slate-800 transition-colors border border-slate-200 rounded-lg hover:bg-slate-50 bg-white mr-1"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="text-left">
                    <h3 className="font-bold text-base text-slate-900">
                      {activeChat.customer_name || (isActiveInstagram ? "Instagram User" : "WhatsApp User")}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {activeChat.customer_phone?.replace("instagram:", "")}
                      </span>
                      {isActiveInstagram ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-pink-50 text-pink-600 px-1.5 py-0.5 rounded">
                          Instagram
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded">
                          WhatsApp
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 px-2 py-1 rounded-md ${activeChat.is_ai_paused ? 'bg-amber-50 text-amber-700' : 'bg-purple-50 text-purple-700'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${activeChat.is_ai_paused ? 'bg-amber-500' : 'bg-purple-500'}`} />
                    {activeChat.is_ai_paused ? "Needs Attention" : "AI Resolving"}
                  </span>
                  {/* AI Agent Pause Toggle Button */}
                  <button
                    onClick={() => onTogglePause(activeChat.id, !activeChat.is_ai_paused)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors ${
                      activeChat.is_ai_paused
                        ? "border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm"
                        : "border-red-200 bg-red-50 hover:bg-red-100 text-red-700 shadow-sm"
                    }`}
                  >
                    {activeChat.is_ai_paused ? "Resume AI Bot" : "Stop AI Bot"}
                  </button>
                </div>
              </div>

              {/* Chat messages feed */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/30">
                {activeChat.messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-8">
                    <MessageSquare className="w-12 h-12 text-slate-200 mb-2" />
                    <span className="text-sm font-medium">No messages yet.</span>
                  </div>
                ) : (
                  activeChat.messages.map((m, idx) => {
                    const isAgent = m.sender === "agent";
                    const alignClass = isAgent ? "justify-end" : "justify-start";
                    const borderRadius = isAgent ? "rounded-2xl rounded-br-sm" : "rounded-2xl rounded-bl-sm";
                    const styles = getMessageStyle(m);

                    return (
                      <div
                        key={m.id || idx}
                        className={`flex ${alignClass}`}
                      >
                        <div className={`flex flex-col max-w-[75%] ${isAgent ? 'items-end' : 'items-start'}`}>
                          {isAgent && (
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 mr-1">
                              Business Brain
                            </span>
                          )}
                          <div className={`px-4 py-2.5 text-[14px] leading-relaxed shadow-sm border ${styles.bg} ${styles.text} ${styles.border} ${borderRadius}`}>
                            {m.content}
                          </div>
                          <span className={`text-[10px] mt-1 font-medium text-slate-400 ${isAgent ? 'mr-1' : 'ml-1'}`}>
                            {getFormatTimeOnly(m.created_at)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={threadEndRef} />
              </div>

              {/* Chat outbox reply form */}
              <form 
                onSubmit={handleSend}
                className="p-4 border-t border-slate-200 bg-[#F8FAFC] shrink-0 flex gap-3 items-end"
              >
                <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-[#2563EB]/20 focus-within:border-[#2563EB] transition-all shadow-sm">
                  <textarea
                    placeholder="Type your manual reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    disabled={sendingReply}
                    className="w-full max-h-32 bg-transparent border-none px-4 py-3 text-[14px] focus:outline-none text-slate-900 placeholder:text-slate-400 resize-none overflow-y-auto"
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend(e);
                      }
                    }}
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={sendingReply || !replyText.trim()}
                  className="w-11 h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center shrink-0 transition-all disabled:opacity-50 disabled:hover:bg-slate-900 mb-0 shadow-sm"
                >
                  {sendingReply ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 ml-0.5" />
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50/50">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4 border border-slate-200">
                <MessageSquare className="w-6 h-6 text-slate-300" />
              </div>
              <h3 className="font-semibold text-slate-700">No conversation selected</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-xs">
                Select a chat from the sidebar to view messages, order history, and reply manually.
              </p>
            </div>
          )}
        </div>
      </div>
      {renderInitiateModal()}
    </div>
  );
}
