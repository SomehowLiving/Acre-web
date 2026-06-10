import { useState, useRef, useEffect, useCallback } from "react";
import { fetchAcreChat, type ChatMessage } from "@/lib/api";

const WELCOME: ChatMessage = {
  role: "assistant",
  content:
    "Hi! I'm your ACRE Advisor. Ask me how to improve your Blue Score, understand your credit tier, qualify for better loan rates, or anything about how ACRE works.",
};

const SUGGESTIONS = [
  "How do I reach Blue Prime tier?",
  "Why is my score lower than expected?",
  "Is my Aadhaar data stored anywhere?",
  "How do lenders use my score?",
];

export default function AcreAdvisor() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
    }
  }, [open, messages]);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setError(null);
    const userMsg: ChatMessage = { role: "user", content: trimmed };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      // Pass only role/content pairs to backend, skip the welcome placeholder
      const history = next.slice(1); // drop the static welcome
      const reply = await fetchAcreChat(history);
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [messages, loading]);

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close ACRE Advisor" : "Open ACRE Advisor"}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-secondary text-background flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity"
        style={{ borderRadius: 0 }}
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 2L16 16M16 2L2 16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="square"/>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M2 3h16v11H2V3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="miter"/>
            <path d="M6 17l4-3h6V3" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="miter"/>
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-22 right-6 z-50 flex flex-col bg-card border border-border shadow-2xl"
          style={{ width: 360, height: 520, borderRadius: 0, bottom: "5rem" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
            <div>
              <p className="font-heading text-sm tracking-wide">ACRE ADVISOR</p>
              <p className="text-xs text-secondary mt-0.5">AI-powered · score &amp; compliance help</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-secondary inline-block" />
              <span className="text-xs text-muted-foreground">online</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 text-sm">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[84%] px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-secondary/20 border border-secondary/30 text-foreground"
                      : "bg-muted border border-border text-foreground"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted border border-border px-3 py-2 text-xs text-muted-foreground flex items-center gap-1.5">
                  <span className="animate-pulse">●</span>
                  <span className="animate-pulse" style={{ animationDelay: "0.2s" }}>●</span>
                  <span className="animate-pulse" style={{ animationDelay: "0.4s" }}>●</span>
                </div>
              </div>
            )}

            {error && (
              <div className="text-xs text-primary border border-primary/30 bg-primary/10 px-3 py-2">
                {error}
              </div>
            )}

            {/* Quick suggestions (show only at start) */}
            {messages.length === 1 && !loading && (
              <div className="pt-1 space-y-1.5">
                <p className="text-xs text-muted-foreground">Quick questions:</p>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="block w-full text-left text-xs px-3 py-2 border border-secondary/30 text-secondary hover:bg-secondary/10 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="shrink-0 border-t border-border p-3 flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about your score, compliance, loans…"
              className="flex-1 bg-background border border-border px-3 py-2 text-sm outline-none focus:border-secondary/60 placeholder:text-muted-foreground"
              disabled={loading}
            />
            <button
              onClick={() => send(input)}
              disabled={loading || !input.trim()}
              className="bg-secondary text-background px-3 py-2 text-xs font-heading disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              SEND
            </button>
          </div>
        </div>
      )}
    </>
  );
}
