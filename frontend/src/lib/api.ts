export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export interface Business {
  id: string;
  name: string;
  api_settings: {
    system_prompt?: string;
    wa_verify_token?: string;
    [key: string]: any;
  };
  business_type?: string;
  onboarding_status: string;
  created_at: string;
}

export interface CatalogItem {
  id?: string;
  category?: string;
  name: string;
  description?: string;
  price?: number;
  attributes?: Record<string, any>;
  is_available?: boolean;
  created_at?: string;
}

export interface DocumentInfo {
  id: string;
  file_name: string;
  file_type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  summary?: string;
  created_at: string;
}

export interface ChatMessage {
  sender: 'customer' | 'agent';
  content: string;
  created_at: string;
}

export interface Order {
  id: string;
  business_id: string;
  customer_id: string;
  details: {
    items: {
      name: string;
      quantity: number;
      price?: number;
    }[];
  };
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
  customer_name?: string;
  customer_phone?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender: 'customer' | 'agent';
  content: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  business_id: string;
  customer_id: string;
  channel: string;
  status: string;
  created_at: string;
  customer_name?: string;
  customer_phone?: string;
  last_message_content?: string;
  messages: Message[];
  is_ai_paused: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

// Utility function to inject JWT Authorization header
function getHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { ...extraHeaders };
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("anytimellm-token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return headers;
}

export const api = {
  // Authentication methods
  async loginWithGoogle(credential: string, businessName?: string): Promise<{ is_registered: boolean, access_token?: string, business_id?: string }> {
    const res = await fetch(`${BACKEND_URL}/api/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential, business_name: businessName }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Google authentication failed.");
    }
    const data = await res.json();
    if (data.is_registered && data.access_token && data.business_id) {
      if (typeof window !== "undefined") {
        localStorage.setItem("anytimellm-token", data.access_token);
        localStorage.setItem("anytimellm-active-business-id", data.business_id);
      }
    }
    return data;
  },

  async login(email: string, password: string): Promise<{ access_token: string, business_id: string }> {
    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Invalid email or password.");
    }
    const data = await res.json();
    if (typeof window !== "undefined") {
      localStorage.setItem("anytimellm-token", data.access_token);
      localStorage.setItem("anytimellm-active-business-id", data.business_id);
    }
    return data;
  },

  async register(businessName: string, email: string, password: string): Promise<{ access_token: string, business_id: string }> {
    const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ business_name: businessName, email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Registration failed.");
    }
    const data = await res.json();
    if (typeof window !== "undefined") {
      localStorage.setItem("anytimellm-token", data.access_token);
      localStorage.setItem("anytimellm-active-business-id", data.business_id);
    }
    return data;
  },

  async getMe(): Promise<any> {
    const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Unauthorized");
    return res.json();
  },

  async getMyBusiness(): Promise<Business> {
    const res = await fetch(`${BACKEND_URL}/api/auth/business`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch business details.");
    return res.json();
  },

  // Legacy fallback method for initialization without token (registers empty business)
  async registerBusiness(name: string): Promise<Business> {
    const res = await fetch(`${BACKEND_URL}/api/businesses`, {
      method: "POST",
      headers: getHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error("Failed to register business tenant.");
    return res.json();
  },

  // Secured Operator API methods
  async getBusiness(id: string): Promise<Business> {
    const res = await fetch(`${BACKEND_URL}/api/businesses/${id}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch business details.");
    return res.json();
  },

  async uploadFile(businessId: string, file: File, businessName?: string, businessType?: string): Promise<DocumentInfo> {
    const formData = new FormData();
    formData.append("business_id", businessId);
    formData.append("file", file);
    if (businessName) formData.append("business_name", businessName);
    if (businessType) formData.append("business_type", businessType);

    const res = await fetch(`${BACKEND_URL}/api/ingest/file`, {
      method: "POST",
      body: formData,
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to upload and parse file.");
    }
    return res.json();
  },

  async crawlUrl(businessId: string, url: string): Promise<DocumentInfo> {
    const formData = new FormData();
    formData.append("business_id", businessId);
    formData.append("url", url);

    const res = await fetch(`${BACKEND_URL}/api/ingest/url`, {
      method: "POST",
      body: formData,
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed crawling URL.");
    }
    return res.json();
  },

  async getDocuments(businessId: string, page: number = 1, limit: number = 10): Promise<PaginatedResponse<DocumentInfo>> {
    const res = await fetch(`${BACKEND_URL}/api/ingest/${businessId}?page=${page}&limit=${limit}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to list business documents.");
    return res.json();
  },

  async deleteDocument(businessId: string, documentId: string): Promise<void> {
    const res = await fetch(`${BACKEND_URL}/api/ingest/${businessId}/documents/${documentId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to delete document.");
    }
  },

  async getSubscription(businessId: string): Promise<any> {
    const res = await fetch(`${BACKEND_URL}/api/billing/subscription/${businessId}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch subscription details.");
    return res.json();
  },

  async getDashboardStats(businessId: string): Promise<{
    unread_conversations: number;
    pending_orders: number;
    failed_responses: number;
    followups_due: number;
    revenue_today: number;
    orders_count: number;
    chats_count: number;
    ai_resolution_rate: number;
  }> {
    const res = await fetch(`${BACKEND_URL}/api/businesses/${businessId}/stats`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch dashboard stats.");
    return res.json();
  },

  async addCatalogItem(businessId: string, item: CatalogItem): Promise<CatalogItem> {
    const res = await fetch(`${BACKEND_URL}/api/businesses/${businessId}/catalog`, {
      method: "POST",
      headers: getHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(item),
    });
    if (!res.ok) throw new Error("Failed to register catalog item.");
    return res.json();
  },

  async getCatalog(businessId: string, page: number = 1, limit: number = 10): Promise<PaginatedResponse<CatalogItem>> {
    const res = await fetch(`${BACKEND_URL}/api/businesses/${businessId}/catalog?page=${page}&limit=${limit}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch catalog list.");
    return res.json();
  },

  // Public Agent endpoint (Anonymous Web widget) - doesn't need Bearer headers
  async chatWithAgent(businessId: string, content: string, customerPhone: string): Promise<ChatMessage> {
    const res = await fetch(`${BACKEND_URL}/api/chat/${businessId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, customer_phone: customerPhone }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed calling agent api.");
    }
    return res.json();
  },

  async getOrders(businessId: string, page: number = 1, limit: number = 10): Promise<PaginatedResponse<Order>> {
    const res = await fetch(`${BACKEND_URL}/api/businesses/${businessId}/orders?page=${page}&limit=${limit}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch orders list.");
    return res.json();
  },

  async updateOrderStatus(businessId: string, orderId: string, status: string): Promise<Order> {
    const res = await fetch(`${BACKEND_URL}/api/businesses/${businessId}/orders/${orderId}`, {
      method: "PATCH",
      headers: getHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error("Failed to update order status.");
    return res.json();
  },

  async getChats(businessId: string, page: number = 1, limit: number = 10): Promise<PaginatedResponse<Conversation>> {
    const res = await fetch(`${BACKEND_URL}/api/businesses/${businessId}/chats?page=${page}&limit=${limit}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch WhatsApp chats.");
    return res.json();
  },

  async sendChatMessage(businessId: string, conversationId: string, content: string): Promise<Message> {
    const res = await fetch(`${BACKEND_URL}/api/businesses/${businessId}/chats/${conversationId}/messages`, {
      method: "POST",
      headers: getHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ content }),
    });
    if (!res.ok) throw new Error("Failed to send chat reply message.");
    return res.json();
  },

  async initiateChat(businessId: string, phoneNumber: string, message: string, customerName?: string): Promise<Conversation> {
    const res = await fetch(`${BACKEND_URL}/api/businesses/${businessId}/chats/initiate`, {
      method: "POST",
      headers: getHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ phone_number: phoneNumber, message, customer_name: customerName }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to initiate chat.");
    }
    return res.json();
  },

  async updateChatSettings(businessId: string, conversationId: string, settings: { is_ai_paused?: boolean; status?: string; }): Promise<Conversation> {
    const res = await fetch(`${BACKEND_URL}/api/businesses/${businessId}/chats/${conversationId}`, {
      method: "PATCH",
      headers: getHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error("Failed to update conversation settings.");
    return res.json();
  },

  async startOnboarding(businessType: string): Promise<any> {
    const res = await fetch(`${BACKEND_URL}/api/onboarding/start`, {
      method: "POST",
      headers: getHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ business_type: businessType }),
    });
    if (!res.ok) throw new Error("Failed to start onboarding.");
    return res.json();
  },

  async sendOnboardingChatMessage(message: string): Promise<any> {
    const res = await fetch(`${BACKEND_URL}/api/onboarding/chat`, {
      method: "POST",
      headers: getHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ message }),
    });
    if (!res.ok) throw new Error("Failed to send onboarding chat message.");
    return res.json();
  },

  async updateBusinessSettings(businessId: string, settings: Record<string, any>): Promise<Business> {
    const res = await fetch(`${BACKEND_URL}/api/businesses/${businessId}/settings`, {
      method: "PATCH",
      headers: getHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error("Failed to update business settings.");
    return res.json();
  },

  async saveMetaAuthCode(code: string, redirectUri?: string): Promise<any> {
    const res = await fetch(`${BACKEND_URL}/api/integrations/whatsapp/meta/auth`, {
      method: "POST",
      headers: getHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ code, redirect_uri: redirectUri }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to exchange Meta auth code.");
    }
    return res.json();
  },

  async getMetaIntegrationStatus(): Promise<{ connected: boolean; provider?: string; phone_number_id?: string; display_name?: string; verify_token?: string }> {
    const res = await fetch(`${BACKEND_URL}/api/integrations/whatsapp/meta/status`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch integration status.");
    return res.json();
  },

  async getMetaConfig(): Promise<{ meta_app_id: string }> {
    const res = await fetch(`${BACKEND_URL}/api/integrations/whatsapp/meta/config`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch Meta configuration.");
    return res.json();
  },


  async getInstagramIntegrationStatus(): Promise<{ connected: boolean; provider?: string; page_id?: string; username?: string; verify_token?: string }> {
    const res = await fetch(`${BACKEND_URL}/api/integrations/instagram/status`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch Instagram status.");
    return res.json();
  },

  async saveInstagramAuthCode(code: string, username?: string, pageId?: string, accessToken?: string): Promise<any> {
    const res = await fetch(`${BACKEND_URL}/api/integrations/instagram/auth`, {
      method: "POST",
      headers: getHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ 
        code, 
        username, 
        page_id: pageId, 
        access_token: accessToken 
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to link Instagram account.");
    }
    return res.json();
  },

  async disconnectInstagram(): Promise<any> {
    const res = await fetch(`${BACKEND_URL}/api/integrations/instagram/disconnect`, {
      method: "POST",
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to disconnect Instagram.");
    }
    return res.json();
  },

  async upgradePlan(planType: string): Promise<any> {
    const res = await fetch(`${BACKEND_URL}/api/billing/upgrade`, {
      method: "POST",
      headers: getHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ plan_type: planType }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to upgrade subscription.");
    }
    return res.json();
  },
};
