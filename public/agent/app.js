import React, { useEffect, useMemo, useRef, useState } from "https://esm.sh/react@18";
import { createRoot } from "https://esm.sh/react-dom@18/client";

const h = React.createElement;

function MessageCard({ message }) {
  const label = useMemo(() => {
    if (message.role === "tool") {
      return message.metadata?.toolName || "Tool";
    }

    if (message.role === "assistant") {
      return "Agent";
    }

    return "You";
  }, [message]);

  return h(
    "article",
    { className: `message ${message.role}` },
    h("div", { className: "message-label" }, label),
    message.role === "tool"
      ? h("pre", null, message.content)
      : h("div", null, message.content)
  );
}

function App() {
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const messagesRef = useRef(null);
  const eventSourceRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      const response = await fetch("/api/v1/agent/sessions", {
        method: "POST"
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || "Unable to create chat session");
      }

      if (!isMounted) {
        return;
      }

      setSessionId(payload.id);
      setMessages(payload.messages || []);
    };

    bootstrap().catch((err) => {
      setError(err.message);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!sessionId) {
      return undefined;
    }

    const eventSource = new EventSource(`/api/v1/agent/sessions/${sessionId}/stream`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      const payload = JSON.parse(event.data);

      if (payload.type === "snapshot") {
        setMessages(payload.session.messages || []);
        return;
      }

      if (payload.type === "message") {
        setMessages((current) => {
          const exists = current.some((message) => message.id === payload.message.id);
          return exists ? current : [...current, payload.message];
        });
      }
    };

    eventSource.onerror = () => {
      setError("Realtime connection dropped. Refresh the page to reconnect.");
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [sessionId]);

  useEffect(() => {
    if (!messagesRef.current) {
      return;
    }

    messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = async (event) => {
    event.preventDefault();

    if (!draft.trim() || !sessionId) {
      return;
    }

    setIsSending(true);
    setError("");

    try {
      const response = await fetch(`/api/v1/agent/sessions/${sessionId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: draft.trim()
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || "Unable to send message");
      }

      setDraft("");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSending(false);
    }
  };

  return h(
    "div",
    { className: "shell" },
    h(
      "aside",
      { className: "sidebar" },
      h("p", { className: "brand-kicker" }, "SE4458 AI Agent"),
      h("h1", null, "Airline Copilot"),
      h(
        "p",
        null,
        "This React chat UI talks to an agent backend, which lets the LLM choose MCP tools that reach your flight APIs through the gateway."
      ),
      h(
        "ul",
        { className: "capability-list" },
        h("li", null, "Query available flights"),
        h("li", null, "Book tickets through authenticated gateway calls"),
        h("li", null, "Check in passengers"),
        h("li", null, "Stream chat updates in real time")
      )
    ),
    h(
      "main",
      { className: "main" },
      h(
        "section",
        { className: "hero" },
        h(
          "div",
          { className: "hero-card" },
          h("h2", null, "Flight operations through an AI agent"),
          h(
            "p",
            null,
            "Try messages like “Find 2 seats from IST to ADB on 2026-04-20” or “Check in Ayse Yilmaz for TK101 on 2026-04-20.”"
          )
        )
      ),
      h(
        "section",
        { className: "chat-panel" },
        h(
          "div",
          { className: "status-bar" },
          h(
            "div",
            { className: "status-pill" },
            h("span", { className: "dot" }),
            sessionId ? "Connected" : "Starting session"
          ),
          h("div", null, sessionId ? `Session ${sessionId.slice(0, 8)}` : "Preparing")
        ),
        h(
          "div",
          { className: "messages", ref: messagesRef },
          ...messages.map((message) =>
            h(MessageCard, {
              key: message.id,
              message
            })
          )
        ),
        h(
          "div",
          { className: "composer" },
          h(
            "form",
            { onSubmit: sendMessage },
            h("textarea", {
              value: draft,
              onChange: (event) => setDraft(event.target.value),
              placeholder:
                "Ask to query flights, buy a ticket, check in, or see passengers...",
              disabled: isSending || !sessionId
            }),
            h(
              "button",
              {
                type: "submit",
                disabled: isSending || !sessionId
              },
              isSending ? "Working..." : "Send"
            )
          ),
          h(
            "div",
            { className: "helper-row" },
            h(
              "div",
              null,
              "Gateway-only calls, MCP tool mapping, and SSE chat refresh are active."
            ),
            h("div", { className: "error" }, error)
          )
        )
      )
    )
  );
}

createRoot(document.getElementById("root")).render(h(App));
