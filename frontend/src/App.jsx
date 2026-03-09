import { useState, useEffect, useRef } from "react";

// ─── API ──────────────────────────────────────────────────────────────────────
const API = "/events";
const api = {
  getEvents: () => fetch(API).then((r) => r.json()),
  addEvent: (event) => fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(event) }).then((r) => r.json()),
  deleteEvent: (id) => fetch(`${API}/${id}`, { method: "DELETE" }).then((r) => r.json()),
  toggleNotify: (id) => fetch(`${API}/${id}/notify`, { method: "PATCH" }).then((r) => r.json()),
};
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORIES = {
  work:    { label: "Work",    color: "#3B82F6" },
  health:  { label: "Health",  color: "#10B981" },
  social:  { label: "Social",  color: "#F59E0B" },
  finance: { label: "Finance", color: "#8B5CF6" },
  study:   { label: "Study",   color: "#EC4899" },
  travel:  { label: "Travel",  color: "#F97316" },
  personal:{ label: "Personal",color: "#14B8A6" },
  other:   { label: "Other",   color: "#6B7280" },
};

const BLANK_FORM = { title: "", date: "", time: "", category: "work", notify: true, note: "" };

const fmt = (date, time) => {
  const d = new Date(`${date}T${time}`);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) + " · " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
};

const isUpcoming = (date, time) => new Date(`${date}T${time}`) >= new Date();
const getCountdown = (date, time) => {
  const diff = new Date(`${date}T${time}`) - new Date();

  if (diff <= 0) return "Started";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);

  return `${days}d ${hours}h ${minutes}m`;
};
const ONGOING_WINDOW_MS = 60 * 60 * 1000;

function CategoryLegend({ categories }) {
  return (
    <div style={styles.legendBar}>
      {Object.entries(categories).map(([key, cat]) => (
        <div key={key} style={styles.legendItem}>
          <span style={{ ...styles.legendSwatch, background: cat.color }} />
          <span style={styles.legendLabel}>{cat.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(BLANK_FORM);
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState("all");
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");
  const [darkMode, setDarkMode] = useState(true);
  const [viewMode, setViewMode] = useState("list");
  const [, forceUpdate] = useState(0);

  const titleRef = useRef();

  useEffect(() => { api.getEvents().then(setEvents); }, []);
  useEffect(() => { if (adding) titleRef.current?.focus(); }, [adding]);
  useEffect(() => {
  const timer = setInterval(() => {
    forceUpdate((n) => n + 1);
  }, 60000); // refresh every minute
  return () => clearInterval(timer);
}, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const handleAdd = async () => {
    if (!form.title.trim() || !form.date || !form.time) return showToast("Fill in title, date & time", "error");
    await api.addEvent(form);
    setEvents(await api.getEvents());
    setForm(BLANK_FORM);
    setAdding(false);
    showToast(`"${form.title}" added`);
  };

  const handleDelete = async (id, title) => {
    await api.deleteEvent(id);
    setEvents(events.filter((e) => e.id !== id));
    showToast(`"${title}" removed`, "info");
  };

  const handleToggle = async (id) => {
  const toggleImportant = (id) => {
  setEvents(events.map(e =>
    e.id === id ? { ...e, important: !e.important } : e
  ));
};

const toggleInterested = (id) => {
  setEvents(events.map(e =>
    e.id === id ? { ...e, interested: !e.interested } : e
  ));
};
    await api.toggleNotify(id);
    setEvents(events.map((e) => (e.id === id ? { ...e, notify: !e.notify } : e)));
  };

  const handleExport = () => {
    const json = JSON.stringify(events, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "events.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleClearAll = async () => {
    if (events.length === 0) return;
    const confirmed = window.confirm("Delete all events? This cannot be undone.");
    if (!confirmed) return;
    await Promise.all(events.map((event) => api.deleteEvent(event.id)));
    setEvents([]);
    showToast("All events cleared", "info");
  };

  const handleCopy = async (event) => {
    const cat = CATEGORIES[event.category] || CATEGORIES.other;
    const details = [
      `Title: ${event.title}`,
      `Category: ${cat.label}`,
      `Date: ${event.date}`,
      `Time: ${event.time}`,
      `Note: ${event.note || "-"}`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(details);
      showToast("Event copied", "info");
    } catch {
      alert("Event copied");
    }
  };

  const visible = events.filter((e) => filter === "all" || e.category === filter);
  const upcomingCount = events.filter((e) => isUpcoming(e.date, e.time)).length;
  const upcomingEvents = events
  .filter((e) => isUpcoming(e.date, e.time))
  .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`))
  .slice(0, 3);
  const now = Date.now();
  const ongoingCount = events.filter((e) => {
    const eventTime = new Date(`${e.date}T${e.time}`).getTime();
    return eventTime <= now && now - eventTime < ONGOING_WINDOW_MS;
  }).length;
  const completedCount = events.filter((e) => {
    const eventTime = new Date(`${e.date}T${e.time}`).getTime();
    return now - eventTime >= ONGOING_WINDOW_MS;
  }).length;
  const analytics = [
    { label: "total", value: events.length },
    { label: "upcoming", value: upcomingCount },
    { label: "ongoing", value: ongoingCount },
    { label: "completed", value: completedCount },
  ];

  return (
    <div style={{
  ...styles.root,
  background: darkMode ? "#0e0e0e" : "#f5f5f5",
  color: darkMode ? "#e8e8e8" : "#111"
}}>
      <div style={styles.grain} />
      <header style={styles.header}>
      <input
  style={{margin:"0 2rem 1rem", padding:"6px", borderRadius:"6px"}}
  placeholder="search events..."
  value={search}
  onChange={(e)=>setSearch(e.target.value)}
/>
  <div>
    <div style={styles.logo}>notifi</div>
          <div style={styles.eventCountBadge}>{events.length} total event{events.length !== 1 ? "s" : ""}</div>
    <div style={styles.subhead}>{upcomingCount} upcoming event{upcomingCount !== 1 ? "s" : ""}</div>
  </div>
        <div style={styles.headerActions}>
          <button style={styles.exportBtn} onClick={handleExport}>export events</button>
          <button style={styles.clearBtn} onClick={handleClearAll} disabled={events.length === 0}>clear all</button>
  
  <div style={{display:"flex", gap:"0.6rem"}}>
    <button style={styles.themeBtn} onClick={() => setDarkMode(!darkMode)}>
      {darkMode ? "☀️ light" : "🌙 dark"}
    </button>

    <button style={styles.addBtn} onClick={() => setAdding(true)}>
      + add event
    </button>
        </div>
  </div>
</header>

      <div style={styles.analyticsBar}>
        {analytics.map((stat) => (
          <div key={stat.label} style={styles.analyticsItem}>
            <span style={styles.analyticsValue}>{stat.value}</span>
            <span style={styles.analyticsLabel}>{stat.label}</span>
          </div>
        ))}
      </div>
      <div style={styles.filterBar}>
        <div style={styles.viewToggle}>
  <button
    style={{ ...styles.viewBtn, ...(viewMode === "list" ? styles.viewActive : {}) }}
    onClick={() => setViewMode("list")}
  >
    📄 list
  </button>

  <button
    style={{ ...styles.viewBtn, ...(viewMode === "grid" ? styles.viewActive : {}) }}
    onClick={() => setViewMode("grid")}
  >
    🔲 grid
  </button>
</div>
        {["all", ...Object.keys(CATEGORIES)].map((cat) => (
          <button key={cat} style={{ ...styles.filterChip, ...(filter === cat ? styles.filterActive : {}) }} onClick={() => setFilter(cat)}>
            {cat === "all" ? "all" : CATEGORIES[cat].label.toLowerCase()}
          </button>
        ))}
      </div>

      <CategoryLegend categories={CATEGORIES} />

      <main style={styles.main}>
        {visible.length === 0 && (
          <div style={styles.emptyCard}>
            <div style={styles.emptyTitle}>No events yet</div>
            <div style={styles.emptyText}>Try starting with one of these ideas.</div>
            <div style={styles.suggestRow}>
              {["Meeting", "Study session", "Workout"].map((idea) => (
                <button
                  key={idea}
                  style={styles.suggestChip}
                  onClick={() => {
                    setForm({ ...BLANK_FORM, title: idea });
                    setAdding(true);
                  }}
                >
                  {idea}
                </button>
              ))}
            </div>
          </div>
        )}
        {visible.map((e) => {
          const cat = CATEGORIES[e.category] || CATEGORIES.other;
          const past = !isUpcoming(e.date, e.time);
          return (
            <div key={e.id} style={{ ...styles.card, opacity: past ? 0.5 : 1 }}>
              <div style={{ ...styles.cardAccent, background: cat.color }} />
              <div style={styles.cardBody}>
                <div style={styles.cardTop}>
                  <span style={styles.cardTitle}>{e.title}</span>
                  <div style={styles.cardActions}>
                    <button title="Toggle notification" style={{ ...styles.iconBtn, color: e.notify ? cat.color : "#555" }} onClick={() => handleToggle(e.id)}>
                      {e.notify ? "🔔" : "🔕"}
                    </button>
                    <button title="Copy event details" style={{ ...styles.iconBtn, color: "#8a8a8a" }} onClick={() => handleCopy(e)}>
                      📋
                    </button>
                    <button title="Delete event" style={{ ...styles.iconBtn, color: "#777" }} onClick={() => handleDelete(e.id, e.title)}>×</button>
                  </div>
                </div>
                <div style={styles.cardMeta}>
                  <span style={{ ...styles.badge, background: cat.color + "22", color: cat.color }}>{cat.label}</span>
                  <span style={styles.cardDate}>{fmt(e.date, e.time)}</span>
                  <span style={{fontSize:"0.7rem", color:"#888"}}>
  {getStatus(e.date, e.time)}
</span>
                </div>
                {e.note && <div style={styles.cardNote}>{e.note}</div>}
              </div>
            </div>
          );
        })}
      </main>

      {adding && (
        <div style={styles.overlay} onClick={(ev) => ev.target === ev.currentTarget && setAdding(false)}>
          <div style={styles.modal}>
            <div style={styles.modalTitle}>new event</div>
            <label style={styles.label}>title</label>
            <input ref={titleRef} style={styles.input} placeholder="What's happening?" value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
            <div style={styles.row}>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>date</label>
                <input style={styles.input} type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>time</label>
                <input style={styles.input} type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
              </div>
            </div>
            <label style={styles.label}>category</label>
            <div style={styles.catGrid}>
              {Object.entries(CATEGORIES).map(([key, val]) => (
                <button key={key} style={{ ...styles.catChip, borderColor: form.category === key ? val.color : "transparent", color: form.category === key ? val.color : "#aaa" }}
                  onClick={() => setForm({ ...form, category: key })}>{val.label}</button>
              ))}
            </div>
            <label style={styles.label}>note <span style={{ color: "#555" }}>(optional)</span></label>
            <input style={styles.input} placeholder="Any extra details..." value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            <label style={styles.toggleRow}>
              <input type="checkbox" checked={form.notify} onChange={(e) => setForm({ ...form, notify: e.target.checked })} />
              <span>notify me</span>
            </label>
            <div style={styles.modalActions}>
              <button style={styles.cancelBtn} onClick={() => { setAdding(false); setForm(BLANK_FORM); }}>cancel</button>
              <button style={styles.iconBtn} onClick={() => toggleImportant(e.id)}>⭐</button>
<button style={styles.iconBtn} onClick={() => toggleInterested(e.id)}>❤️</button>
              <button style={styles.saveBtn} onClick={handleAdd}>save event</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ ...styles.toast, background: toast.type === "error" ? "#7f1d1d" : toast.type === "info" ? "#1e3a5f" : "#14532d" }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

const styles = {
  viewToggle: {
  display: "flex",
  justifyContent: "center",
  gap: "0.5rem",
  marginBottom: "1rem"
},

viewBtn: {
  background: "#1a1a1a",
  border: "1px solid #333",
  color: "#aaa",
  borderRadius: "6px",
  padding: "0.3rem 0.8rem",
  fontSize: "0.75rem",
  cursor: "pointer"
},

viewActive: {
  background: "#fff",
  color: "#000"
},
  themeBtn: {
  background: "#1f1f1f",
  color: "#ddd",
  border: "1px solid #333",
  borderRadius: "6px",
  padding: "0.4rem 0.8rem",
  fontSize: "0.75rem",
  cursor: "pointer"
},
  upcomingSection: {
  background: "#141414",
  border: "1px solid #1f1f1f",
  borderRadius: "12px",
  padding: "1rem",
  marginBottom: "1rem",
},

upcomingTitle: {
  fontSize: "0.8rem",
  color: "#9ca3af",
  marginBottom: "0.6rem",
  letterSpacing: "0.05em",
},

upcomingItem: {
  display: "flex",
  justifyContent: "space-between",
  fontSize: "0.8rem",
  padding: "0.3rem 0",
},
  root: { minHeight: "100vh", background: "#0e0e0e", color: "#e8e8e8", fontFamily: "'DM Mono', 'Courier New', monospace", position: "relative", overflow: "hidden" },
  grain: { position: "fixed", inset: 0, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")", pointerEvents: "none", zIndex: 0 },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "2rem 2rem 1rem", position: "relative", zIndex: 1 },
  logo: { fontSize: "1.8rem", fontWeight: "700", letterSpacing: "-0.05em", color: "#fff" },
  eventCountBadge: { display: "inline-flex", marginTop: "0.35rem", padding: "0.18rem 0.5rem", borderRadius: "999px", border: "1px solid #2a2a2a", background: "#141414", color: "#8c8c8c", fontSize: "0.68rem", letterSpacing: "0.04em" },
  subhead: { fontSize: "0.75rem", color: "#555", marginTop: "0.15rem", letterSpacing: "0.05em" },
  headerActions: { display: "flex", gap: "0.5rem", alignItems: "center" },
  exportBtn: { background: "transparent", color: "#b7b7b7", border: "1px solid #2a2a2a", borderRadius: "6px", padding: "0.5rem 0.85rem", fontSize: "0.74rem", fontFamily: "inherit", fontWeight: "600", cursor: "pointer", textTransform: "lowercase" },
  clearBtn: { background: "transparent", color: "#b78181", border: "1px solid #3a2525", borderRadius: "6px", padding: "0.5rem 0.75rem", fontSize: "0.74rem", fontFamily: "inherit", fontWeight: "600", cursor: "pointer", textTransform: "lowercase" },
  addBtn: { background: "#fff", color: "#0e0e0e", border: "none", borderRadius: "6px", padding: "0.5rem 1.1rem", fontSize: "0.8rem", fontFamily: "inherit", fontWeight: "600", cursor: "pointer" },
  analyticsBar: { display: "flex", gap: "0.5rem", padding: "0 2rem 1.25rem", position: "relative", zIndex: 1, overflowX: "auto" },
  analyticsItem: { flex: "1 1 0", minWidth: "115px", background: "#141414", border: "1px solid #222", borderRadius: "8px", padding: "0.55rem 0.7rem", display: "flex", alignItems: "baseline", justifyContent: "space-between" },
  analyticsValue: { fontSize: "1rem", fontWeight: "700", color: "#f0f0f0" },
  analyticsLabel: { fontSize: "0.68rem", color: "#666", letterSpacing: "0.08em", textTransform: "uppercase" },
  filterBar: { display: "flex", gap: "0.5rem", padding: "0 2rem 1.25rem", flexWrap: "wrap", position: "relative", zIndex: 1 },
  legendBar: { display: "flex", gap: "0.75rem", padding: "0 2rem 1rem", flexWrap: "wrap", position: "relative", zIndex: 1 },
  legendItem: { display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.25rem 0.45rem", border: "1px solid #232323", borderRadius: "6px", background: "#121212" },
  legendSwatch: { width: "8px", height: "8px", borderRadius: "999px", display: "inline-block" },
  legendLabel: { fontSize: "0.68rem", color: "#9a9a9a", letterSpacing: "0.04em", textTransform: "uppercase" },
  filterChip: { background: "transparent", border: "1px solid #2a2a2a", color: "#555", borderRadius: "100px", padding: "0.3rem 0.85rem", fontSize: "0.72rem", fontFamily: "inherit", cursor: "pointer", transition: "all 0.15s" },
  filterActive: { background: "#1a1a1a", border: "1px solid #444", color: "#e8e8e8" },
  main: { padding: "0 2rem 4rem", display: "flex", flexDirection: "column", gap: "0.6rem", position: "relative", zIndex: 1, maxWidth: "700px", margin: "0 auto" },
  emptyCard: { background: "#141414", border: "1px solid #222", borderRadius: "10px", padding: "1.1rem", textAlign: "center", marginTop: "1rem" },
  emptyTitle: { color: "#f0f0f0", fontSize: "0.92rem", fontWeight: "600" },
  emptyText: { color: "#666", fontSize: "0.78rem", marginTop: "0.3rem" },
  suggestRow: { display: "flex", justifyContent: "center", gap: "0.45rem", marginTop: "0.85rem", flexWrap: "wrap" },
  suggestChip: { background: "#0f0f0f", color: "#b0b0b0", border: "1px solid #2a2a2a", borderRadius: "999px", padding: "0.3rem 0.7rem", fontSize: "0.72rem", fontFamily: "inherit", cursor: "pointer" },
  card: { display: "flex", background: "#141414", border: "1px solid #1f1f1f", borderRadius: "10px", overflow: "hidden" },
  cardAccent: { width: "3px", flexShrink: 0 },
  cardBody: { padding: "0.85rem 1rem", flex: 1, minWidth: 0 },
  cardTop: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" },
  cardTitle: { fontSize: "0.95rem", fontWeight: "600", color: "#f0f0f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  cardActions: { display: "flex", gap: "0.1rem", flexShrink: 0 },
  iconBtn: { background: "none", border: "none", cursor: "pointer", fontSize: "1rem", padding: "0.1rem 0.3rem", fontFamily: "inherit", lineHeight: 1 },
  cardMeta: { display: "flex", gap: "0.6rem", alignItems: "center", marginTop: "0.35rem", flexWrap: "wrap" },
  badge: { fontSize: "0.65rem", borderRadius: "4px", padding: "0.15rem 0.45rem", fontWeight: "600", letterSpacing: "0.05em", textTransform: "uppercase" },
  cardDate: { fontSize: "0.72rem", color: "#555" },
  cardNote: { fontSize: "0.75rem", color: "#555", marginTop: "0.35rem", fontStyle: "italic" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1rem" },
  modal: { background: "#141414", border: "1px solid #272727", borderRadius: "14px", padding: "1.75rem", width: "100%", maxWidth: "420px", display: "flex", flexDirection: "column", gap: "0.75rem" },
  modalTitle: { fontSize: "1.1rem", fontWeight: "700", color: "#fff", marginBottom: "0.25rem" },
  label: { fontSize: "0.68rem", color: "#555", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: "-0.25rem" },
  input: { width: "100%", background: "#0e0e0e", border: "1px solid #2a2a2a", borderRadius: "7px", padding: "0.6rem 0.8rem", color: "#e8e8e8", fontSize: "0.85rem", fontFamily: "inherit", outline: "none", boxSizing: "border-box" },
  row: { display: "flex", gap: "0.75rem" },
  catGrid: { display: "flex", flexWrap: "wrap", gap: "0.4rem" },
  catChip: { background: "#0e0e0e", border: "1px solid", borderRadius: "6px", padding: "0.3rem 0.75rem", fontSize: "0.75rem", fontFamily: "inherit", cursor: "pointer", transition: "all 0.15s" },
  toggleRow: { display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.8rem", color: "#aaa", cursor: "pointer" },
  modalActions: { display: "flex", gap: "0.6rem", marginTop: "0.5rem" },
  cancelBtn: { flex: 1, background: "transparent", border: "1px solid #2a2a2a", color: "#777", borderRadius: "7px", padding: "0.65rem", fontSize: "0.8rem", fontFamily: "inherit", cursor: "pointer" },
  saveBtn: { flex: 2, background: "#fff", color: "#0e0e0e", border: "none", borderRadius: "7px", padding: "0.65rem", fontSize: "0.8rem", fontFamily: "inherit", fontWeight: "700", cursor: "pointer" },
  toast: { position: "fixed", bottom: "1.5rem", left: "50%", transform: "translateX(-50%)", borderRadius: "8px", padding: "0.65rem 1.25rem", fontSize: "0.8rem", color: "#fff", zIndex: 200, border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" },
};