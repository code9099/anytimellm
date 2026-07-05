"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { api, BACKEND_URL } from "@/lib/api";
import type { Business, CatalogItem, DocumentInfo, ChatMessage, Order, Conversation, Message } from "@/lib/api";
import { Loader2 } from "lucide-react";

// Modular UI Components
import DashboardShell from "@/components/layout/DashboardShell";
import TabTransition from "@/components/ui/TabTransition";
import OverviewTab from "@/components/overview/OverviewTab";
import IngestTab from "@/components/ingest/IngestTab";
import CatalogTab from "@/components/catalog/CatalogTab";
import PlaygroundTab from "@/components/playground/PlaygroundTab";
import IntegrationsTab from "@/components/integrations/IntegrationsTab";
import OrdersTab from "@/components/orders/OrdersTab";
import ChatsTab from "@/components/chats/ChatsTab";
import AnalyticsTab from "@/components/analytics/AnalyticsTab";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";

type Tab = "overview" | "ingest" | "catalog" | "playground" | "integrations" | "orders" | "chats" | "analytics";

export default function Dashboard() {
  const router = useRouter();
  const [activeBusiness, setActiveBusiness] = useState<Business | null>(null);
  const [loadingBusiness, setLoadingBusiness] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Theme Mode Settings
  const [theme, setTheme] = useState<"dark" | "light">("light");

  // Dashboard Stats & State
  const [tab, setTab] = useState<Tab>("overview");
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [documentsPage, setDocumentsPage] = useState(1);
  const [documentsTotal, setDocumentsTotal] = useState(0);

  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogTotal, setCatalogTotal] = useState(0);

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  
  const [chats, setChats] = useState<Conversation[]>([]);
  const [chatsPage, setChatsPage] = useState(1);
  const [chatsTotal, setChatsTotal] = useState(0);
  const [loadingChats, setLoadingChats] = useState(false);
  
  const [subscription, setSubscription] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  
  // Form States
  const [urlInput, setUrlInput] = useState("");
  const [ingestingUrl, setIngestingUrl] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  
  const [catalogName, setCatalogName] = useState("");
  const [catalogPrice, setCatalogPrice] = useState("");
  const [catalogCategory, setCatalogCategory] = useState("");
  const [catalogDesc, setCatalogDesc] = useState("");
  const [savingCatalog, setSavingCatalog] = useState(false);

  // Chat/Playground States
  const [chatPhone, setChatPhone] = useState("15550199");
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [sendingChat, setSendingChat] = useState(false);
  const [agentLogs, setAgentLogs] = useState<string[]>([]);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize client-side theme loading on mount and auto-load active business session
  useEffect(() => {
    localStorage.setItem("anytimellm-theme", "light");
    setTheme("light");
    document.documentElement.classList.remove("dark");

    const savedToken = localStorage.getItem("anytimellm-token");
    if (savedToken) {
      api.getMe()
        .then(user => {
          if (user.trial_expired) {
            alert("Your 15-day free trial has expired. Please select a plan to continue.");
            window.location.href = "/pricing";
            return;
          }
          return api.getMyBusiness();
        })
        .then(biz => {
          if (biz) {
            setActiveBusiness(biz);
          }
        })
        .catch(err => {
          console.error("Failed to load saved session:", err);
          localStorage.removeItem("anytimellm-active-business-id");
          localStorage.removeItem("anytimellm-token");
          window.location.href = "/login";
        })
        .finally(() => {
          setLoadingBusiness(false);
        });
    } else {
      window.location.href = "/login";
    }
  }, [router]);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("anytimellm-theme", nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  };

  useEffect(() => {
    if (activeBusiness) {
      fetchBusinessData();
      // Initialize playground greeting
      setChatMessages([
        {
          sender: "agent",
          content: `Hello! I am ${activeBusiness.name}'s virtual assistant. How can I help you check the catalog, make an order, or read our docs today?`,
          created_at: new Date().toISOString()
        }
      ]);
      setAgentLogs([
        "Chat Session Started"
      ]);
    }
  }, [activeBusiness]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Background polling for orders & Real-time Server-Sent Events (SSE) for chats
  useEffect(() => {
    if (!activeBusiness) return;
    
    let timer: any = null;
    let eventSource: EventSource | null = null;
    
    if (tab === "chats") {
      // Connect to Server-Sent Events for real-time reactive updates
      const token = localStorage.getItem("anytimellm-token") || "";
      const sseUrl = `${BACKEND_URL}/api/businesses/${activeBusiness.id}/chats/stream?token=${encodeURIComponent(token)}`;
      
      console.log("Establishing real-time SSE chat stream...");
      eventSource = new EventSource(sseUrl);
      
      eventSource.onmessage = (event) => {
        if (event.data === "refresh") {
          console.log("Real-time message received via SSE. Refreshing chats...");
          api.getChats(activeBusiness.id, chatsPage, 10)
            .then(data => {
              setChats(data.items);
              setChatsTotal(data.total);
            })
            .catch(err => console.error("Real-time chats update failed:", err));
        }
      };
      
      eventSource.onerror = (err) => {
        console.error("SSE connection error, falling back to 5s polling:", err);
        
        // Safely close using the event target/currentTarget to stop the browser's auto-retry loop
        const target = (err.currentTarget || err.target) as EventSource | null;
        if (target) {
          try {
            target.close();
          } catch (e) {}
        }
        if (eventSource) {
          try {
            eventSource.close();
          } catch (e) {}
          eventSource = null;
        }
        
        // Fallback polling in case of connection drop (only register once)
        if (!timer) {
          timer = setInterval(() => {
            api.getChats(activeBusiness.id, chatsPage, 10)
              .then(data => {
                setChats(data.items);
                setChatsTotal(data.total);
              })
              .catch(err => console.error("Fallback chats update failed:", err));
          }, 5000);
        }
      };
    } else if (tab === "orders") {
      timer = setInterval(() => {
        api.getOrders(activeBusiness.id, ordersPage, 10)
          .then(data => {
            setOrders(data.items);
            setOrdersTotal(data.total);
          })
          .catch(err => console.error("Silent background orders refresh failed:", err));
      }, 5000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
      if (eventSource) eventSource.close();
    };
  }, [tab, activeBusiness, chatsPage, ordersPage]);

  const fetchDocumentsPage = async (page: number) => {
    if (!activeBusiness) return;
    try {
      const data = await api.getDocuments(activeBusiness.id, page, 10);
      setDocuments(data.items);
      setDocumentsPage(data.page);
      setDocumentsTotal(data.total);
    } catch (err) {
      console.error("Failed to fetch documents page:", err);
    }
  };

  const fetchCatalogPage = async (page: number) => {
    if (!activeBusiness) return;
    try {
      const data = await api.getCatalog(activeBusiness.id, page, 10);
      setCatalog(data.items);
      setCatalogPage(data.page);
      setCatalogTotal(data.total);
    } catch (err) {
      console.error("Failed to fetch catalog page:", err);
    }
  };

  const fetchOrdersPage = async (page: number) => {
    if (!activeBusiness) return;
    try {
      const data = await api.getOrders(activeBusiness.id, page, 10);
      setOrders(data.items);
      setOrdersPage(data.page);
      setOrdersTotal(data.total);
    } catch (err) {
      console.error("Failed to fetch orders page:", err);
    }
  };

  const fetchChatsPage = async (page: number) => {
    if (!activeBusiness) return;
    try {
      const data = await api.getChats(activeBusiness.id, page, 10);
      setChats(data.items);
      setChatsPage(data.page);
      setChatsTotal(data.total);
    } catch (err) {
      console.error("Failed to fetch chats page:", err);
    }
  };

  const fetchBusinessData = async () => {
    if (!activeBusiness) return;
    try {
      const [docsData, catalogData, ordersData, chatsData, subData, statsData] = await Promise.all([
        api.getDocuments(activeBusiness.id, documentsPage, 10),
        api.getCatalog(activeBusiness.id, catalogPage, 10),
        api.getOrders(activeBusiness.id, ordersPage, 10),
        api.getChats(activeBusiness.id, chatsPage, 10),
        api.getSubscription(activeBusiness.id).catch(() => null),
        api.getDashboardStats(activeBusiness.id).catch(() => null)
      ]);
      setDocuments(docsData.items);
      setDocumentsPage(docsData.page);
      setDocumentsTotal(docsData.total);
      
      setCatalog(catalogData.items);
      setCatalogPage(catalogData.page);
      setCatalogTotal(catalogData.total);
      
      setOrders(ordersData.items);
      setOrdersPage(ordersData.page);
      setOrdersTotal(ordersData.total);
      
      setChats(chatsData.items);
      setChatsPage(chatsData.page);
      setChatsTotal(chatsData.total);
      
      setSubscription(subData);
      setStats(statsData);
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch business data. Check if backend server is running.");
    }
  };

  const handleRefreshOrders = async () => {
    if (!activeBusiness) return;
    setLoadingOrders(true);
    try {
      const ordersData = await api.getOrders(activeBusiness.id, ordersPage, 10);
      setOrders(ordersData.items);
      setOrdersTotal(ordersData.total);
    } catch (err) {
      setError("Failed to refresh orders.");
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: 'pending' | 'confirmed' | 'cancelled') => {
    if (!activeBusiness) return;
    setUpdatingOrderId(orderId);
    try {
      await api.updateOrderStatus(activeBusiness.id, orderId, status);
      const ordersData = await api.getOrders(activeBusiness.id, ordersPage, 10);
      setOrders(ordersData.items);
      setOrdersTotal(ordersData.total);
    } catch (err) {
      setError("Failed to update order status.");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleRefreshChats = async () => {
    if (!activeBusiness) return;
    setLoadingChats(true);
    try {
      const chatsData = await api.getChats(activeBusiness.id, chatsPage, 10);
      setChats(chatsData.items);
      setChatsTotal(chatsData.total);
    } catch (err) {
      setError("Failed to refresh chats.");
    } finally {
      setLoadingChats(false);
    }
  };

  const handleSendManualReply = async (conversationId: string, content: string) => {
    if (!activeBusiness) return;
    try {
      const newMsg = await api.sendChatMessage(activeBusiness.id, conversationId, content);
      setChats(prevChats => prevChats.map(c => {
        if (c.id === conversationId) {
          const exists = newMsg.id ? c.messages.some(m => m.id === newMsg.id) : false;
          return {
            ...c,
            last_message_content: content,
            messages: exists ? c.messages : [...c.messages, newMsg]
          };
        }
        return c;
      }));
    } catch (err) {
      setError("Failed to send manual reply.");
      throw err;
    }
  };

  const handleToggleChatPause = async (conversationId: string, isPaused: boolean) => {
    if (!activeBusiness) return;
    try {
      const updated = await api.updateChatSettings(activeBusiness.id, conversationId, { is_ai_paused: isPaused });
      setChats(prevChats => prevChats.map(c => {
        if (c.id === conversationId) {
          return {
            ...c,
            is_ai_paused: updated.is_ai_paused
          };
        }
        return c;
      }));
    } catch (err) {
      setError("Failed to toggle AI Agent pause state.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeBusiness) return;
    
    setUploadingFile(true);
    setError(null);
    
    // Add placeholder document to list immediately
    const tempDoc: DocumentInfo = {
      id: "temp-id",
      file_name: file.name,
      file_type: file.name.split(".").pop() || "txt",
      status: "processing",
      created_at: new Date().toISOString()
    };
    setDocuments(prev => [tempDoc, ...prev]);

    try {
      const doc = await api.uploadFile(activeBusiness.id, file);
      setDocuments(prev => prev.map(d => d.id === "temp-id" ? doc : d));
    } catch (err: any) {
      setError(err.message || "Failed to upload file.");
      setDocuments(prev => prev.map(d => d.id === "temp-id" ? { ...d, status: "failed" } : d));
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleCrawlUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim() || !activeBusiness) return;
    
    setIngestingUrl(true);
    setError(null);
    
    const tempDoc: DocumentInfo = {
      id: "temp-url-id",
      file_name: urlInput,
      file_type: "html",
      status: "processing",
      created_at: new Date().toISOString()
    };
    setDocuments(prev => [tempDoc, ...prev]);
    const targetUrl = urlInput;
    setUrlInput("");

    try {
      const doc = await api.crawlUrl(activeBusiness.id, targetUrl);
      setDocuments(prev => prev.map(d => d.id === "temp-url-id" ? doc : d));
    } catch (err: any) {
      setError(err.message || "Failed crawling URL.");
      setDocuments(prev => prev.map(d => d.id === "temp-url-id" ? { ...d, status: "failed" } : d));
    } finally {
      setIngestingUrl(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!activeBusiness) return;
    if (!confirm("Are you sure you want to delete this document from the AI memory? This cannot be undone.")) return;
    try {
      await api.deleteDocument(activeBusiness.id, documentId);
      await fetchDocumentsPage(documentsPage);
      const statsData = await api.getDashboardStats(activeBusiness.id).catch(() => null);
      if (statsData) setStats(statsData);
    } catch (err: any) {
      setError(err.message || "Failed to delete document.");
    }
  };

  const handleAddCatalogItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catalogName.trim() || !activeBusiness) return;
    
    setSavingCatalog(true);
    setError(null);
    try {
      await api.addCatalogItem(activeBusiness.id, {
        name: catalogName,
        price: catalogPrice ? parseFloat(catalogPrice) : 0,
        category: catalogCategory || "General",
        description: catalogDesc
      });
      await fetchCatalogPage(1);
      
      // Reset form
      setCatalogName("");
      setCatalogPrice("");
      setCatalogCategory("");
      setCatalogDesc("");
    } catch (err: any) {
      setError("Failed to add catalog item.");
    } finally {
      setSavingCatalog(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeBusiness || sendingChat) return;

    const userMessage: ChatMessage = {
      sender: "customer",
      content: chatInput,
      created_at: new Date().toISOString()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    const promptText = chatInput;
    setChatInput("");
    setSendingChat(true);

    // Update Logs
    setAgentLogs(prev => [
      ...prev,
      "Inbound customer query"
    ]);

    try {
      const reply = await api.chatWithAgent(activeBusiness.id, promptText, chatPhone);
      
      setAgentLogs(prev => [
        ...prev,
        "Response dispatched to client"
      ]);

      setChatMessages(prev => [...prev, reply]);
      fetchBusinessData();
    } catch (err: any) {
      setAgentLogs(prev => [...prev, `[ERROR] Execution failed: ${err.message}`]);
      setError("Failed to chat with AI agent.");
    } finally {
      setSendingChat(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // If loading business or not logged in, show the premium loading sequence
  if (loadingBusiness || !activeBusiness) {
    return (
      <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center text-foreground">
        <div className="flex flex-col items-center gap-4">
          <span className="font-display-lg text-lg tracking-[0.4em] font-medium uppercase animate-pulse">ANYTIMELLM</span>
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="font-mono text-[9px] tracking-[0.2em] text-muted uppercase">VERIFYING SECURE CONSOLE SESSION...</span>
        </div>
      </div>
    );
  }

  // If onboarding is incomplete, render the setup wizard
  if (activeBusiness && activeBusiness.onboarding_status !== "completed") {
    return (
      <OnboardingWizard
        activeBusiness={activeBusiness}
        onComplete={(updatedBiz) => {
          setActiveBusiness(updatedBiz);
          fetchBusinessData();
        }}
      />
    );
  }

  // Once tenant is active, render modular shell & feature tabs
  return (
    <DashboardShell
      activeBusiness={activeBusiness}
      tab={tab}
      onTabChange={setTab}
      onLogout={() => {
        setActiveBusiness(null);
        localStorage.removeItem("anytimellm-active-business-id");
        localStorage.removeItem("anytimellm-token");
        router.push("/");
      }}
      error={error}
      onDismissError={() => setError(null)}
      theme={theme}
      toggleTheme={toggleTheme}
    >
      <TabTransition tabKey={tab}>
        {tab === "overview" && (
          <OverviewTab
            activeBusiness={activeBusiness}
            documents={documents}
            catalog={catalog}
            orders={orders}
            copied={copied}
            copyToClipboard={copyToClipboard}
            onTabChange={setTab}
            onUpdateBusiness={setActiveBusiness}
            subscription={subscription}
            stats={stats}
          />
        )}
        {tab === "ingest" && (
          <IngestTab
            documents={documents}
            urlInput={urlInput}
            setUrlInput={setUrlInput}
            ingestingUrl={ingestingUrl}
            uploadingFile={uploadingFile}
            fileInputRef={fileInputRef}
            handleFileUpload={handleFileUpload}
            handleCrawlUrl={handleCrawlUrl}
            onDeleteDocument={handleDeleteDocument}
            onRefresh={fetchBusinessData}
            page={documentsPage}
            total={documentsTotal}
            limit={10}
            onPageChange={fetchDocumentsPage}
          />
        )}
        {tab === "catalog" && (
          <CatalogTab
            catalog={catalog}
            catalogName={catalogName}
            setCatalogName={setCatalogName}
            catalogPrice={catalogPrice}
            setCatalogPrice={setCatalogPrice}
            catalogCategory={catalogCategory}
            setCatalogCategory={setCatalogCategory}
            catalogDesc={catalogDesc}
            setCatalogDesc={setCatalogDesc}
            savingCatalog={savingCatalog}
            handleAddCatalogItem={handleAddCatalogItem}
            page={catalogPage}
            total={catalogTotal}
            limit={10}
            onPageChange={fetchCatalogPage}
          />
        )}
        {tab === "playground" && (
          <PlaygroundTab
            chatPhone={chatPhone}
            setChatPhone={setChatPhone}
            chatInput={chatInput}
            setChatInput={setChatInput}
            chatMessages={chatMessages}
            sendingChat={sendingChat}
            agentLogs={agentLogs}
            chatEndRef={chatEndRef}
            handleSendMessage={handleSendMessage}
          />
        )}
        {tab === "integrations" && (
          <IntegrationsTab
            activeBusiness={activeBusiness}
            copyToClipboard={copyToClipboard}
            onUpdateBusiness={(biz) => setActiveBusiness(biz)}
          />
        )}
        {tab === "orders" && (
          <OrdersTab
            orders={orders}
            loading={loadingOrders}
            onRefresh={handleRefreshOrders}
            onUpdateStatus={handleUpdateOrderStatus}
            updatingOrderId={updatingOrderId}
            page={ordersPage}
            total={ordersTotal}
            limit={10}
            onPageChange={fetchOrdersPage}
          />
        )}
        {tab === "chats" && activeBusiness && (
          <ChatsTab
            businessId={activeBusiness.id}
            chats={chats}
            loading={loadingChats}
            onRefresh={handleRefreshChats}
            onSendReply={handleSendManualReply}
            onTogglePause={handleToggleChatPause}
            onTabChange={setTab}
            page={chatsPage}
            total={chatsTotal}
            limit={10}
            onPageChange={fetchChatsPage}
          />
        )}
        {tab === "analytics" && (
          <AnalyticsTab
            orders={orders}
            chats={chats}
            catalog={catalog}
          />
        )}
      </TabTransition>
    </DashboardShell>
  );
}
