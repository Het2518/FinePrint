"use client";

import { useState, useRef, useEffect } from "react";
import { api } from "@/lib/api";
import { Send, Bot, User, Sparkles, ChevronDown, FileText, Loader2 } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  context?: string[];
  timestamp: Date;
}

const SUGGESTED_QUESTIONS = [
  "Which of our contracts have the highest risk this quarter?",
  "What's the total potential savings across all pending approvals?",
  "Are there any contracts auto-renewing in the next 60 days?",
  "Which vendor has the worst price escalation clause?",
  "What happened with our last renegotiation?",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "👋 Hi! I'm **FinePrint AI**, your procurement intelligence assistant.\n\nI can answer questions about your contracts, risks, savings opportunities, and past decisions. Ask me anything — like *'Which contracts are up for renewal?'* or *'What's our biggest risk right now?'*",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: msg,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await api.chat({ message: msg });
      const botMsg: Message = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: res.reply,
        context: res.context_used,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: `⚠️ Sorry, I encountered an error: ${e.message}. Please ensure the backend is running.`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-screen flex flex-col" style={{ background: "var(--bg-canvas)" }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-6 py-4 shrink-0"
        style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-surface)" }}
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: "var(--accent-muted)" }}
        >
          <Sparkles size={16} style={{ color: "var(--accent)" }} />
        </div>
        <div>
          <h1 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            FinePrint AI Chat
          </h1>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            Ask questions about your contracts, risks, and savings
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 animate-slide-up ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              {/* Avatar */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{
                  background: msg.role === "assistant" ? "var(--accent-muted)" : "var(--bg-surface-raised)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                {msg.role === "assistant" ? (
                  <Bot size={14} style={{ color: "var(--accent)" }} />
                ) : (
                  <User size={14} style={{ color: "var(--text-secondary)" }} />
                )}
              </div>

              {/* Bubble */}
              <div className={`flex flex-col gap-1 max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div
                  className="px-4 py-3 rounded-xl text-sm leading-relaxed"
                  style={{
                    background: msg.role === "user" ? "var(--accent)" : "var(--bg-surface)",
                    color: msg.role === "user" ? "var(--accent-text)" : "var(--text-primary)",
                    border: msg.role === "assistant" ? "1px solid var(--border-subtle)" : "none",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {msg.content}
                </div>

                {/* Context pills */}
                {msg.context && msg.context.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {msg.context.map((c) => (
                      <span
                        key={c}
                        className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{
                          background: "var(--bg-surface-raised)",
                          color: "var(--text-tertiary)",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        {c.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                )}

                <span className="text-[10px]" style={{ color: "var(--text-disabled)" }}>
                  {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className="flex gap-3 animate-slide-up">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "var(--accent-muted)", border: "1px solid var(--border-subtle)" }}
              >
                <Bot size={14} style={{ color: "var(--accent)" }} />
              </div>
              <div
                className="px-4 py-3 rounded-xl flex items-center gap-2"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
              >
                <Loader2 size={14} className="animate-spin-slow" style={{ color: "var(--accent)" }} />
                <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                  Thinking…
                </span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Suggested questions — show only at start */}
      {messages.length === 1 && (
        <div className="px-4 pb-3">
          <div className="max-w-3xl mx-auto">
            <p className="text-xs mb-2 font-medium" style={{ color: "var(--text-tertiary)" }}>
              Try asking:
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-secondary)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent)";
                    e.currentTarget.style.color = "var(--accent)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-subtle)";
                    e.currentTarget.style.color = "var(--text-secondary)";
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input area */}
      <div
        className="px-4 pb-4 pt-3 shrink-0"
        style={{ borderTop: "1px solid var(--border-subtle)", background: "var(--bg-surface)" }}
      >
        <div className="max-w-3xl mx-auto">
          <div
            className="flex items-end gap-3 rounded-xl px-4 py-3"
            style={{ background: "var(--bg-canvas)", border: "1px solid var(--border-default)" }}
          >
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your contracts, risks, or savings…"
              className="flex-1 resize-none bg-transparent text-sm outline-none"
              style={{
                color: "var(--text-primary)",
                minHeight: "24px",
                maxHeight: "120px",
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="p-2 rounded-lg transition-colors disabled:opacity-40"
              style={{
                background: input.trim() && !loading ? "var(--accent)" : "var(--bg-surface-raised)",
                color: input.trim() && !loading ? "var(--accent-text)" : "var(--text-disabled)",
              }}
            >
              <Send size={14} />
            </button>
          </div>
          <p className="text-[10px] text-center mt-2" style={{ color: "var(--text-disabled)" }}>
            Press Enter to send · Shift+Enter for new line · Powered by Groq + ChromaDB RAG
          </p>
        </div>
      </div>
    </div>
  );
}
