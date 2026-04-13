const state = {
  sessionId: "",
  messages: [],
  draft: "",
  isSending: false,
  error: "",
  eventSource: null
};

const root = document.getElementById("root");

const getMessageLabel = (message) => {
  if (message.role === "tool") {
    return message.metadata?.toolName || "Tool";
  }

  if (message.role === "assistant") {
    return "Agent";
  }

  return "You";
};

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const renderMessages = () =>
  state.messages
    .map((message) => {
      const content =
        message.role === "tool"
          ? `<pre>${escapeHtml(message.content)}</pre>`
          : `<div>${escapeHtml(message.content)}</div>`;

      return `
        <article class="message ${escapeHtml(message.role)}">
          <div class="message-label">${escapeHtml(getMessageLabel(message))}</div>
          ${content}
        </article>
      `;
    })
    .join("");

const render = () => {
  root.innerHTML = `
    <div class="shell">
      <aside class="sidebar">
        <p class="brand-kicker">SE4458 AI Agent</p>
        <h1>Airline Copilot</h1>
        <p>
          This chat UI talks to an agent backend, which lets the LLM choose MCP
          tools that reach your flight APIs through the gateway.
        </p>
        <ul class="capability-list">
          <li>Query available flights</li>
          <li>Book tickets through authenticated gateway calls</li>
          <li>Check in passengers</li>
          <li>Stream chat updates in real time</li>
        </ul>
      </aside>
      <main class="main">
        <section class="hero">
          <div class="hero-card">
            <h2>Flight operations through an AI agent</h2>
            <p>
              Try messages like "Find 2 seats from IST to ADB on 2026-04-20" or
              "Check in Ayse Yilmaz for TK101 on 2026-04-20."
            </p>
          </div>
        </section>
        <section class="chat-panel">
          <div class="status-bar">
            <div class="status-pill">
              <span class="dot"></span>
              ${state.sessionId ? "Connected" : "Starting session"}
            </div>
            <div>${state.sessionId ? `Session ${escapeHtml(state.sessionId.slice(0, 8))}` : "Preparing"}</div>
          </div>
          <div class="messages" id="messages">${renderMessages()}</div>
          <div class="composer">
            <form id="composer-form">
              <textarea
                id="composer-input"
                placeholder="Ask to query flights, buy a ticket, check in, or see passengers..."
                ${state.isSending || !state.sessionId ? "disabled" : ""}
              >${escapeHtml(state.draft)}</textarea>
              <button type="submit" ${state.isSending || !state.sessionId ? "disabled" : ""}>
                ${state.isSending ? "Working..." : "Send"}
              </button>
            </form>
            <div class="helper-row">
              <div>Gateway-only calls, MCP tool mapping, and SSE chat refresh are active.</div>
              <div class="error">${escapeHtml(state.error)}</div>
            </div>
          </div>
        </section>
      </main>
    </div>
  `;

  const form = document.getElementById("composer-form");
  const input = document.getElementById("composer-input");
  const messages = document.getElementById("messages");

  if (form) {
    form.addEventListener("submit", sendMessage);
  }

  if (input) {
    input.addEventListener("input", (event) => {
      state.draft = event.target.value;
    });
  }

  if (messages) {
    messages.scrollTop = messages.scrollHeight;
  }
};

const connectStream = () => {
  if (!state.sessionId) {
    return;
  }

  if (state.eventSource) {
    state.eventSource.close();
  }

  const eventSource = new EventSource(`/api/v1/agent/sessions/${state.sessionId}/stream`);
  state.eventSource = eventSource;

  eventSource.onmessage = (event) => {
    const payload = JSON.parse(event.data);

    if (payload.type === "snapshot") {
      state.messages = payload.session.messages || [];
      render();
      return;
    }

    if (payload.type === "message") {
      const exists = state.messages.some((message) => message.id === payload.message.id);
      if (!exists) {
        state.messages = [...state.messages, payload.message];
        render();
      }
    }
  };

  eventSource.onerror = () => {
    state.error = "Realtime connection dropped. Refresh the page to reconnect.";
    eventSource.close();
    render();
  };
};

const bootstrap = async () => {
  try {
    const response = await fetch("/api/v1/agent/sessions", {
      method: "POST"
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.message || "Unable to create chat session");
    }

    state.sessionId = payload.id;
    state.messages = payload.messages || [];
    state.error = "";
    render();
    connectStream();
  } catch (error) {
    state.error = error.message;
    render();
  }
};

async function sendMessage(event) {
  event.preventDefault();

  if (!state.sessionId || !state.draft.trim() || state.isSending) {
    return;
  }

  state.isSending = true;
  state.error = "";
  render();

  try {
    const response = await fetch(`/api/v1/agent/sessions/${state.sessionId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: state.draft.trim()
      })
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.message || "Unable to send message");
    }

    state.draft = "";
  } catch (error) {
    state.error = error.message;
  } finally {
    state.isSending = false;
    render();
  }
}

window.addEventListener("beforeunload", () => {
  state.eventSource?.close();
});

render();
bootstrap();
