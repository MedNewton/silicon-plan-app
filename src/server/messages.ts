// src/server/messages.ts
import { getSupabaseClient } from "@/lib/supabaseServer";
import type {
  MessageThread,
  Message,
  Consultant,
} from "@/types/workspaces";

// ── Thread with preview info ──

export type ThreadWithPreview = MessageThread & {
  consultant_name: string;
  preview: string;
};

export async function listUserThreads(userId: string): Promise<ThreadWithPreview[]> {
  const client = getSupabaseClient();

  const { data: threadsData, error } = await client
    .from("message_threads")
    .select("*")
    .eq("user_id", userId)
    .order("last_message_at", { ascending: false });

  if (error) throw new Error(`Failed to load threads: ${error.message}`);

  const threads = (threadsData ?? []) as MessageThread[];
  if (threads.length === 0) return [];

  // Load consultant names
  const consultantIds = [...new Set(threads.map((t) => t.consultant_id))];
  const { data: consultantsData } = await client
    .from("consultants")
    .select("*")
    .in("id", consultantIds);

  const consultantMap = new Map<string, Consultant>();
  for (const c of ((consultantsData ?? []) as Consultant[])) {
    consultantMap.set(c.id, c);
  }

  // Load latest message per thread for preview
  const threadIds = threads.map((t) => t.id);
  const { data: messagesData } = await client
    .from("messages")
    .select("*")
    .in("thread_id", threadIds)
    .order("created_at", { ascending: false });

  const latestMessageMap = new Map<string, Message>();
  for (const m of ((messagesData ?? []) as Message[])) {
    if (!latestMessageMap.has(m.thread_id)) {
      latestMessageMap.set(m.thread_id, m);
    }
  }

  return threads.map((t) => {
    const consultant = consultantMap.get(t.consultant_id);
    const latestMsg = latestMessageMap.get(t.id);
    return {
      ...t,
      consultant_name: consultant?.name ?? "Unknown",
      preview: latestMsg?.text.slice(0, 40) ?? "",
    };
  });
}

// ── Messages for a thread ──

export type MessageWithSender = Message & {
  sender_name: string;
  is_own: boolean;
};

export async function listThreadMessages(
  threadId: string,
  userId: string,
): Promise<{ messages: MessageWithSender[]; consultantId: string; consultantName: string }> {
  const client = getSupabaseClient();

  // Verify the thread belongs to this user
  const { data: threadData, error: threadErr } = await client
    .from("message_threads")
    .select("*")
    .eq("id", threadId)
    .eq("user_id", userId)
    .single();

  if (threadErr || !threadData) throw new Error("Thread not found");
  const thread = threadData as MessageThread;

  // Load consultant
  const { data: consultantData } = await client
    .from("consultants")
    .select("*")
    .eq("id", thread.consultant_id)
    .single();
  const consultant = consultantData as Consultant | null;

  // Load messages
  const { data: messagesData, error: msgErr } = await client
    .from("messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (msgErr) throw new Error(`Failed to load messages: ${msgErr.message}`);

  const messages = (messagesData ?? []) as Message[];

  return {
    messages: messages.map((m) => ({
      ...m,
      sender_name: m.sender_user_id === userId
        ? "You"
        : consultant?.name ?? "Consultant",
      is_own: m.sender_user_id === userId,
    })),
    consultantId: thread.consultant_id,
    consultantName: consultant?.name ?? "Unknown",
  };
}

// ── Send message ──

export async function sendMessage(
  threadId: string,
  userId: string,
  text: string,
): Promise<Message> {
  const client = getSupabaseClient();

  // Verify thread belongs to user
  const { data: threadData, error: threadErr } = await client
    .from("message_threads")
    .select("*")
    .eq("id", threadId)
    .eq("user_id", userId)
    .single();

  if (threadErr || !threadData) throw new Error("Thread not found");

  // Insert message
  const { data: msgData, error: msgErr } = await client
    .from("messages")
    .insert({
      thread_id: threadId,
      sender_user_id: userId,
      text,
    })
    .select("*")
    .single();

  if (msgErr || !msgData) throw new Error(`Failed to send message: ${msgErr?.message}`);

  // Update thread last_message_at
  await client
    .from("message_threads")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", threadId);

  return msgData as Message;
}
