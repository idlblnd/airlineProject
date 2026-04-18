const API = "/api/v1/agent";

const ACTIONS = [
  { id: "queryFlight", icon: "🔍", label: "Query Flight" },
  { id: "bookFlight",  icon: "✈",  label: "Book Flight"  },
  { id: "checkIn",     icon: "✅", label: "Check In"     },
];

const AIRPORTS = ["IST", "ADB", "ESB", "SAW", "AYT", "BJV", "GZT", "TZX", "VAN", "ERZ"];

const today = () => new Date().toISOString().split("T")[0];
const nextDays = (n) => {
  const d = new Date(); d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
};

// form field definitions per action
const FORMS = {
  queryFlight: {
    title: "Search Flights",
    fields: [
      { id: "from",     label: "From",       type: "select",  options: AIRPORTS, placeholder: "IST" },
      { id: "to",       label: "To",         type: "select",  options: AIRPORTS, placeholder: "ADB" },
      { id: "date",     label: "Date",       type: "date",    default: nextDays(7) },
      { id: "n",        label: "Passengers", type: "number",  default: "1", min: 1, max: 9 },
    ],
    build: (v) => `Find flights from ${v.from} to ${v.to} on ${v.date} for ${v.n} passenger${v.n > 1 ? "s" : ""}`,
  },
  bookFlight: {
    title: "Book a Ticket",
    fields: [
      { id: "flightNumber", label: "Flight Number", type: "text", placeholder: "e.g. TK101" },
      { id: "date",         label: "Date",          type: "date", default: nextDays(7) },
      { id: "name",         label: "Passenger Name",type: "text", placeholder: "e.g. John Doe" },
    ],
    build: (v) => `Book flight ${v.flightNumber} on ${v.date} for ${v.name}`,
  },
  checkIn: {
    title: "Check In Passenger",
    fields: [
      { id: "name",         label: "Passenger Name", type: "text", placeholder: "e.g. John Doe" },
      { id: "flightNumber", label: "Flight Number",  type: "text", placeholder: "e.g. TK101" },
      { id: "date",         label: "Date",           type: "date", default: nextDays(7) },
    ],
    build: (v) => `Check in ${v.name} for ${v.flightNumber} on ${v.date}`,
  },
};

const state = {
  sessionId: "",
  messages: [],
  draft: "",
  isSending: false,
  error: "",
  activeAction: null,
  connected: false,
  eventSource: null,
  formValues: {},
};

const esc = (v) =>
  String(v ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// deterministic departure time from flight number
const flightTime = (fn) => {
  let h = 0;
  for (let i = 0; i < fn.length; i++) h = (h * 31 + fn.charCodeAt(i)) & 0xffff;
  const hour = 6 + (h % 15);
  const min  = (h >> 4) % 4 * 15;
  return `${String(hour).padStart(2,"0")}:${String(min).padStart(2,"0")}`;
};

const addMinutes = (time, mins) => {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + mins;
  return `${String(Math.floor(total/60)%24).padStart(2,"0")}:${String(total%60).padStart(2,"0")}`;
};

const renderFlightCards = (flights) => {
  if (!flights.length) return `<div class="no-results">No flights found for this route and date.</div>`;
  return flights.map(f => {
    const dep = flightTime(f.flightNumber);
    const arr = addMinutes(dep, f.duration || 60);
    return `
    <div class="flight-card">
      <div class="fc-left">
        <span class="fc-fn">${esc(f.flightNumber)}</span>
        <span class="fc-route-inline">
          <span class="fc-iata">${esc(f.airportFrom)}</span>
          <span class="fc-times">${dep} → ${arr}</span>
          <span class="fc-iata">${esc(f.airportTo)}</span>
        </span>
        <span class="fc-dur">⏱ ${f.duration} min</span>
      </div>
      <span class="fc-cap">${f.capacity} seats</span>
    </div>`;
  }).join("");
};

const renderToolBubble = (msg) => {
  const name = msg.metadata?.toolName || "tool";
  let data = {};
  try { data = JSON.parse(msg.content); } catch {}

  if (name === "queryFlight") {
    const flights = data.flights || [];
    return `<div class="msg-row tool-row">
      <div class="tool-result-card">
        <div class="trc-header">🔍 Available Flights</div>
        <div class="flights-grid">${renderFlightCards(flights)}</div>
      </div>
    </div>`;
  }

  if (name === "bookFlight") {
    const ok = data.status === "SUCCESS";
    const inner = data.data || {};
    const args = msg.metadata?.args || {};
    return `<div class="msg-row tool-row">
      <div class="tool-result-card ${ok ? "trc-ok" : "trc-err"}">
        <div class="trc-header">${ok ? "✅ Ticket Booked" : "❌ Booking Failed"}</div>
        ${ok ? `<div class="trc-row"><span>Ticket No</span><strong>${esc(inner.ticketNumber || "")}</strong></div>
        <div class="trc-row"><span>Flight</span><strong>${esc(args.flightNumber || "")}</strong></div>
        <div class="trc-row"><span>Date</span><strong>${esc(args.date || "")}</strong></div>
        <div class="trc-row"><span>Passenger</span><strong>${esc(args.fullName || "")}</strong></div>` :
        `<div class="trc-row err-msg">${esc(data.message || "Booking failed")}</div>`}
      </div>
    </div>`;
  }

  if (name === "checkIn") {
    const ok = data.status === "SUCCESS";
    const inner = data.data || {};
    const args = msg.metadata?.args || {};
    return `<div class="msg-row tool-row">
      <div class="tool-result-card ${ok ? "trc-ok" : "trc-err"}">
        <div class="trc-header">${ok ? "✅ Check-In Complete" : "❌ Check-In Failed"}</div>
        ${ok ? `<div class="trc-row"><span>Passenger</span><strong>${esc(args.fullName || "")}</strong></div>
        <div class="trc-row"><span>Flight</span><strong>${esc(args.flightNumber || "")}</strong></div>
        <div class="trc-row"><span>Seat</span><strong class="seat-num">${esc(inner.seatNumber || "")}</strong></div>` :
        `<div class="trc-row err-msg">${esc(data.message || "Check-in failed")}</div>`}
      </div>
    </div>`;
  }

  return ""; // hide unknown tool results
};

const renderMessages = () => {
  if (!state.messages.length) {
    return `<div class="empty-state">
      <div class="empty-icon">✈</div>
      <div>Select an action from the sidebar or type a message to get started.</div>
    </div>`;
  }
  return state.messages.map((msg) => {
    if (msg.role === "tool") return renderToolBubble(msg);
    const isUser = msg.role === "user";
    return `<div class="msg-row ${isUser ? "user" : "agent"}">
      <div class="msg-avatar ${isUser ? "user-av" : ""}">${isUser ? "You" : "✈"}</div>
      <div class="bubble ${isUser ? "user" : "agent"}">${esc(msg.content)}</div>
    </div>`;
  }).join("") + (state.isSending ? `
    <div class="msg-row agent">
      <div class="msg-avatar">✈</div>
      <div class="bubble agent"><div class="typing-dots"><span></span><span></span><span></span></div></div>
    </div>` : "");
};

const renderActionForm = () => {
  if (!state.activeAction) return "";
  const form = FORMS[state.activeAction];
  if (!form) return "";

  const fields = form.fields.map((f) => {
    const val = esc(state.formValues[f.id] ?? f.default ?? "");
    if (f.type === "select") {
      const opts = f.options.map((o) =>
        `<option value="${o}" ${state.formValues[f.id] === o ? "selected" : ""}>${o}</option>`
      ).join("");
      return `<div class="form-field">
        <label class="form-label">${f.label}</label>
        <select class="form-input" data-field="${f.id}">
          <option value="">— select —</option>
          ${opts}
        </select>
      </div>`;
    }
    if (f.type === "number") {
      return `<div class="form-field">
        <label class="form-label">${f.label}</label>
        <input class="form-input" type="number" data-field="${f.id}" value="${val}" min="${f.min||1}" max="${f.max||9}" />
      </div>`;
    }
    if (f.type === "date") {
      return `<div class="form-field">
        <label class="form-label">${f.label}</label>
        <input class="form-input" type="date" data-field="${f.id}" value="${val||form.fields.find(x=>x.id===f.id)?.default||""}" />
      </div>`;
    }
    return `<div class="form-field">
      <label class="form-label">${f.label}</label>
      <input class="form-input" type="text" data-field="${f.id}" value="${val}" placeholder="${esc(f.placeholder||"")}" />
    </div>`;
  }).join("");

  return `<div class="action-form" id="action-form">
    <div class="form-title">${ACTIONS.find(a=>a.id===state.activeAction)?.icon} ${form.title}</div>
    <div class="form-grid">${fields}</div>
    <button class="form-send-btn" id="form-send-btn">Send →</button>
  </div>`;
};

const render = () => {
  const act = ACTIONS.find((a) => a.id === state.activeAction);
  document.getElementById("root").innerHTML = `
    <div class="shell">
      <aside class="sidebar">
        <div class="sidebar-logo">
          <div class="logo-icon">✈</div>
          <div>
            <div class="logo-text">AI Agent</div>
            <div class="logo-sub">Flight Actions</div>
          </div>
        </div>

        <div class="sidebar-greeting">
          <div class="s-avatar">🤖</div>
          <div class="greeting-text">Hello! How can I assist you today?</div>
        </div>

        <div class="sidebar-label">Actions</div>
        ${ACTIONS.map((a) => `
          <button class="action-btn${state.activeAction === a.id ? " active" : ""}" data-action="${a.id}">
            <span class="btn-icon">${a.icon}</span>${a.label}
          </button>`).join("")}

        <div class="sidebar-spacer"></div>
        <div class="conn-status">
          <div class="conn-dot${state.connected ? " on" : ""}"></div>
          ${state.connected ? "Connected" : "Connecting…"}
        </div>
      </aside>

      <main class="main">
        <div class="chat-header">
          <div class="chat-header-title">${act ? act.icon + " " + act.label : "✈ Flight Assistant"}</div>
          <div class="chat-header-sub">${act ? "Fill in the form below or type freely" : "Select an action or type a message"}</div>
        </div>

        <div class="messages" id="messages">${renderMessages()}</div>

        ${renderActionForm()}

        <div class="composer-wrap">
          ${state.error ? `<div class="err-bar">${esc(state.error)}</div>` : ""}
          <div class="composer">
            <textarea id="draft" rows="1"
              placeholder="${act ? "Or type freely…" : "Ask me anything about flights…"}"
              ${state.isSending || !state.sessionId ? "disabled" : ""}
            >${esc(state.draft)}</textarea>
            <button class="send-btn" id="send-btn"
              ${state.isSending || !state.sessionId || !state.draft.trim() ? "disabled" : ""}>↑</button>
          </div>
          <div class="composer-hint">Gateway → MCP → Groq LLaMA 3.3</div>
        </div>
      </main>
    </div>`;

  // scroll
  const msgs = document.getElementById("messages");
  if (msgs) msgs.scrollTop = msgs.scrollHeight;

  // textarea
  const ta = document.getElementById("draft");
  if (ta) {
    ta.addEventListener("input", (e) => {
      state.draft = e.target.value;
      e.target.style.height = "auto";
      e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
      document.getElementById("send-btn").disabled =
        !state.draft.trim() || state.isSending || !state.sessionId;
    });
    ta.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendText(); }
    });
  }

  // action buttons
  document.querySelectorAll(".action-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.action;
      state.activeAction = id === state.activeAction ? null : id;
      if (state.activeAction) {
        // seed date defaults
        const form = FORMS[state.activeAction];
        form?.fields.forEach((f) => {
          if (f.default && !state.formValues[f.id]) {
            state.formValues[f.id] = f.default;
          }
        });
      }
      render();
    });
  });

  // form field listeners
  document.querySelectorAll(".form-input").forEach((input) => {
    input.addEventListener("change", (e) => {
      state.formValues[e.target.dataset.field] = e.target.value;
    });
    input.addEventListener("input", (e) => {
      state.formValues[e.target.dataset.field] = e.target.value;
    });
  });

  // form send
  document.getElementById("form-send-btn")?.addEventListener("click", sendFromForm);

  // free send
  document.getElementById("send-btn")?.addEventListener("click", sendText);
};

const connectStream = () => {
  if (!state.sessionId) return;
  state.eventSource?.close();
  const es = new EventSource(`${API}/sessions/${state.sessionId}/stream`);
  state.eventSource = es;
  es.onopen = () => { state.connected = true; render(); };
  es.onmessage = (e) => {
    const p = JSON.parse(e.data);
    if (p.type === "snapshot") { state.messages = p.session.messages || []; render(); }
    else if (p.type === "message") {
      if (!state.messages.some((m) => m.id === p.message.id)) {
        state.messages = [...state.messages, p.message];
        render();
      }
    }
  };
  es.onerror = () => {
    state.connected = false;
    state.error = "Connection lost. Refresh to reconnect.";
    es.close(); render();
  };
};

const bootstrap = async () => {
  render();
  try {
    const res  = await fetch(`${API}/sessions`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    state.sessionId = data.id;
    state.messages  = data.messages || [];
    state.connected = true;
    render();
    connectStream();
  } catch (err) {
    state.error = err.message; render();
  }
};

async function sendMessage(text) {
  if (!text || !state.sessionId || state.isSending) return;
  state.draft = "";
  state.isSending = true;
  state.error = "";
  state.messages = [...state.messages, { id: `tmp-${Date.now()}`, role: "user", content: text }];
  render();
  try {
    const res  = await fetch(`${API}/sessions/${state.sessionId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    state.messages = data.session?.messages || state.messages;
  } catch (err) {
    state.error = err.message;
    state.messages = state.messages.filter((m) => !String(m.id).startsWith("tmp-"));
  } finally {
    state.isSending = false; render();
  }
}

function sendText() {
  sendMessage(state.draft.trim());
}

function sendFromForm() {
  const form = FORMS[state.activeAction];
  if (!form) return;

  // read current field values from DOM
  document.querySelectorAll(".form-input").forEach((el) => {
    state.formValues[el.dataset.field] = el.value;
  });

  // validate all fields filled
  const missing = form.fields.find((f) => !state.formValues[f.id]?.trim());
  if (missing) {
    state.error = `Please fill in: ${missing.label}`;
    render(); return;
  }

  const text = form.build(state.formValues);
  sendMessage(text);
}

window.addEventListener("beforeunload", () => state.eventSource?.close());
bootstrap();
