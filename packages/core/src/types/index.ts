export interface TenantInfo {
  id: string;
  name: string;
  roomNo: string;
  phone: string;
  leaseStart: Date;
  leaseEnd: Date;
  monthlyRent: number;
  billStatus: string;
  overdueDays: number;
  totalDue: number;
  activated: boolean;
}

export interface WorkOrderItem {
  id: string;
  orderNo: string;
  tenantName: string;
  roomNo: string;
  phone: string;
  category: string;
  description: string;
  aiSummary: string;
  status: string;
  assignee: string | null;
  createdAt: Date;
  completedAt: Date | null;
}

export interface FaqResult {
  question: string;
  answer: string;
  similarity: number;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  time: string;
}

export interface ActionMark {
  type: "CREATE_ORDER" | "HANDOFF" | "VERIFY_REQUIRED" | "NIGHT_URGENT";
  params: Record<string, string>;
}
