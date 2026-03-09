import { useEffect, useMemo, useRef, useState } from "react";

const API = "/events";
const api = {
  getEvents: () => fetch(API).then((r) => r.json()),
  addEvent: (event) =>
    fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    }).then((r) => r.json()),
  deleteEvent: (id) => fetch(`${API}/${id}`, { method: "DELETE" }).then((r) => r.json()),
  toggleNotify: (id) => fetch(`${API}/${id}/notify`, { method: "PATCH" }).then((r) => r.json()),
};

const CATEGORIES = {
  work: { label: "Work", color: "#60A5FA" },
  health: { label: "Health", color: "#34D399" },
  social: { label: "Social", color: "#FBBF24" },
  finance: { label: "Finance", color: "#A78BFA" },
  study: { label: "Study", color: "#F472B6" },
  travel: { label: "Travel", color: "#FB923C" },
  personal: { label: "Personal", color: "#2DD4BF" },
  other: { label: "Other", color: "#9CA3AF" },
};

const BLANK_FORM = { title: "", date: "", time: "", category: "work", notify: true, note: "" };

const DARK_THEME = {
  bg: "#080b12",
  text: "#e6edf8",
  muted: "#95a3ba",
  border: "rgba(255,255,255,0.16)",
  panel: "rgba(16,22,34,0.62)",
  panelStrong: "rgba(16,22,34,0.82)",
  input: "rgba(12,18,30,0.78)",
  primary: "#e6edf8",
  primaryText: "#111827",
  shadow: "0 18px 50px rgba(0,0,0,0.35)",
  glassBorder: "rgba(255,255,255,0.24)",
};

const LIGHT_THEME = {
  bg: "#eef2ff",
  text: "#182036",
  muted: "#4e5d78",
  border: "rgba(24,32,54,0.18)",
  panel: "rgba(255,255,255,0.7)",
  panelStrong: "rgba(255,255,255,0.82)",
  input: "rgba(255,255,255,0.95)",
  primary: "#182036",
  primaryText: "#f8fafc",
  shadow: "0 18px 40px rgba(61,76,114,0.16)",
  glassBorder: "rgba(255,255,255,0.75)",
};

const PASSWORD_RULES = [
  { id: "len", label: "8+ chars", test: (p) => p.length >= 8 },
  { id: "upper", label: "Uppercase", test: (p) => /[A-Z]/.test(p) },
  { id: "lower", label: "Lowercase", test: (p) => /[a-z]/.test(p) },
  { id: "num", label: "Number", test: (p) => /\d/.test(p) },
  { id: "special", label: "Special char", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

const fmt = (date, time) => {
  const d = new Date(`${date}T${time}`);
  return (
    d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) +
    " · " +
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
  );
};

const getStatus = (date, time) => {
  const now = new Date();
  const eventTime = new Date(`${date}T${time}`);
  const diff = eventTime - now;

  if (diff > 3600000) return "Upcoming";
  if (diff > -3600000) return "Ongoing";
  return "Completed";
};

const getCountdown = (date, time) => {
  const now = Date.now();
  const eventTime = new Date(`${date}T${time}`).getTime();
  const diff = eventTime - now;
  const abs = Math.abs(diff);

  const days = Math.floor(abs / 86400000);
  const hours = Math.floor((abs / 3600000) % 24);
  const minutes = Math.floor((abs / 60000) % 60);

  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);

  if (abs < 60000) return "Now";
  if (diff > 0) return `in ${parts.join(" ")}`;
  return `${parts.join(" ")} ago`;
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

function LogoMark({ theme, small = false }) {
  return (
    <div
      style={{
        width: small ? 28 : 38,
        height: small ? 28 : 38,
        borderRadius: "10px",
        background: "linear-gradient(135deg, rgba(96,165,250,.95), rgba(167,139,250,.95) 55%, rgba(45,212,191,.95))",
        color: theme.primaryText,
        display: "grid",
        placeItems: "center",
        fontWeight: 700,
        fontSize: small ? "0.76rem" : "0.94rem",
        boxShadow: "0 8px 24px rgba(98,110,255,.35)",
      }}
    >
      n
    </div>
  );
}

function LoginScreen({ theme, darkMode, onToggleTheme, onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  const checks = useMemo(() => PASSWORD_RULES.map((rule) => ({ ...rule, ok: rule.test(password) })), [password]);
  const isPasswordValid = checks.every((c) => c.ok);
  const isEmailValid = isValidEmail(email);
  const canSubmit = isEmailValid && isPasswordValid;

  const submit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    onLogin({ email: email.trim(), rememberMe });
  };

  return (
    <div style={{ ...styles.authRoot, color: theme.text }}>
      <style>{ANIMATIONS}</style>
      <div style={styles.aurora} />
      <div style={{ ...styles.authCard, background: theme.panelStrong, borderColor: theme.border, boxShadow: theme.shadow }}>
        <div style={styles.authTop}>
          <LogoMark theme={theme} />
          <div>
            <div style={styles.authTitle}>notifi</div>
            <div style={{ ...styles.authSub, color: theme.muted }}>Secure event dashboard</div>
          </div>
          <button
            className="ui-btn"
            style={{ ...styles.themeBtn, marginLeft: "auto", background: theme.panel, color: theme.text, borderColor: theme.border }}
            onClick={onToggleTheme}
          >
            {darkMode ? "☀️ light" : "🌙 dark"}
          </button>
        </div>

        <form onSubmit={submit} style={styles.authForm}>
          <label style={{ ...styles.label, color: theme.muted }}>email</label>
          <input
            style={{ ...styles.input, background: theme.input, borderColor: isEmailValid || !email ? theme.border : "#ef4444", color: theme.text }}
            type="email"
            placeholder="you@college.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label style={{ ...styles.label, color: theme.muted }}>password</label>
          <input
            style={{ ...styles.input, background: theme.input, borderColor: isPasswordValid || !password ? theme.border : "#ef4444", color: theme.text }}
            type="password"
            placeholder="Create a strong password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div style={styles.passwordChecks}>
            {checks.map((rule) => (
              <span key={rule.id} style={{ ...styles.checkChip, color: rule.ok ? "#22c55e" : theme.muted, borderColor: rule.ok ? "rgba(34,197,94,.5)" : theme.border }}>
                {rule.ok ? "✓" : "•"} {rule.label}
              </span>
            ))}
          </div>

          <label style={{ ...styles.toggleRow, color: theme.muted }}>
            <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
            <span>remember me</span>
          </label>

          <button
            type="submit"
            className="ui-btn"
            style={{ ...styles.signInBtn, background: canSubmit ? theme.primary : theme.border, color: canSubmit ? theme.primaryText : theme.muted, cursor: canSubmit ? "pointer" : "not-allowed" }}
            disabled={!canSubmit}
          >
            Sign in to dashboard
          </button>
        </form>
      </div>
    </div>
  );
}

function CategoryLegend({ theme }) {
  return (
    <div style={styles.legendWrap}>
      {Object.entries(CATEGORIES).map(([key, cat]) => (
        <div key={key} style={{ ...styles.legendItem, background: theme.panel, borderColor: theme.border }}>
          <span style={{ ...styles.legendDot, background: cat.color }} />
          <span style={{ ...styles.legendText, color: theme.muted }}>{cat.label}</span>
        </div>
      ))}
    </div>
  );
}

function MonthlyAnalytics({ events, theme }) {
  const monthly = useMemo(() => {
    const now = new Date();
    const buckets = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ key: monthKey(d), label: d.toLocaleDateString("en-US", { month: "short" }), count: 0 });
    }
    const map = new Map(buckets.map((b) => [b.key, b]));
    events.forEach((e) => {
      const d = new Date(`${e.date}T${e.time}`);
      const key = monthKey(d);
      if (map.has(key)) map.get(key).count += 1;
    });
    return buckets;
  }, [events]);

  const max = Math.max(...monthly.map((m) => m.count), 1);

  const byCategory = useMemo(() => {
    const counts = Object.keys(CATEGORIES).map((k) => ({ key: k, label: CATEGORIES[k].label, color: CATEGORIES[k].color, count: 0 }));
    const map = new Map(counts.map((c) => [c.key, c]));
    events.forEach((e) => {
      const key = map.has(e.category) ? e.category : "other";
      map.get(key).count += 1;
    });
    return counts.sort((a, b) => b.count - a.count);
  }, [events]);

  const total = events.length || 1;

  return (
    <div style={styles.sectionStack}>
      <div style={{ ...styles.sectionCard, background: theme.panel, borderColor: theme.glassBorder, boxShadow: theme.shadow }}>
        <div style={styles.sectionTitle}>Monthly Events Analysis (Last 6 Months)</div>
        <div style={styles.chartRow}>
          {monthly.map((m) => (
            <div key={m.key} style={styles.chartCol}>
              <div style={{ ...styles.chartBarTrack, background: theme.input, borderColor: theme.border }}>
                <div style={{ ...styles.chartBarFill, height: `${(m.count / max) * 100}%` }} />
              </div>
              <div style={{ ...styles.chartCount, color: theme.text }}>{m.count}</div>
              <div style={{ ...styles.chartLabel, color: theme.muted }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...styles.sectionCard, background: theme.panel, borderColor: theme.glassBorder, boxShadow: theme.shadow }}>
        <div style={styles.sectionTitle}>Category Distribution</div>
        <div style={styles.distList}>
          {byCategory.map((c) => (
            <div key={c.key} style={styles.distRow}>
              <div style={styles.distLeft}>
                <span style={{ ...styles.legendDot, background: c.color }} />
                <span style={{ color: theme.text, fontSize: "0.76rem" }}>{c.label}</span>
              </div>
              <div style={styles.distRight}>
                <div style={{ ...styles.distTrack, background: theme.input }}>
                  <div style={{ ...styles.distFill, width: `${(c.count / total) * 100}%`, background: c.color }} />
                </div>
                <span style={{ ...styles.distValue, color: theme.muted }}>{c.count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState("");
  const [activeTab, setActiveTab] = useState("events");
  const [settings, setSettings] = useState({ animations: true, compact: false });
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    college: "",
    department: "",
    year: "",
    location: "",
    bio: "",
  });
  const [, forceUpdate] = useState(0);

  const theme = darkMode ? DARK_THEME : LIGHT_THEME;
  const titleRef = useRef();

  useEffect(() => {
    api.getEvents().then(setEvents);
  }, []);

  useEffect(() => {
    if (adding) titleRef.current?.focus();
  }, [adding]);

  useEffect(() => {
    const timer = setInterval(() => forceUpdate((n) => n + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2200);
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
    setEvents((prev) => prev.filter((e) => e.id !== id));
    showToast(`"${title}" removed`, "info");
  };

  const handleToggle = async (id) => {
    await api.toggleNotify(id);
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, notify: !e.notify } : e)));
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
    if (!events.length) return;
    const ok = window.confirm("Delete all events? This cannot be undone.");
    if (!ok) return;
    await Promise.all(events.map((e) => api.deleteEvent(e.id)));
    setEvents([]);
    showToast("All events cleared", "info");
  };

  const handleProfileSave = () => {
    if (!profile.name.trim() || !isValidEmail(profile.email)) return showToast("Enter valid name and email", "error");
    if (profile.phone && !/^\+?[0-9\-\s]{7,15}$/.test(profile.phone)) return showToast("Enter valid phone number", "error");
    showToast("Profile saved", "success");
  };

  const visible = useMemo(() => {
    const byCategory = events.filter((e) => filter === "all" || e.category === filter);
    const q = search.trim().toLowerCase();
    if (!q) return byCategory;

    return byCategory.filter((e) => {
      const catLabel = (CATEGORIES[e.category] || CATEGORIES.other).label.toLowerCase();
      return (
        e.title.toLowerCase().includes(q) ||
        (e.note || "").toLowerCase().includes(q) ||
        e.date.toLowerCase().includes(q) ||
        e.time.toLowerCase().includes(q) ||
        catLabel.includes(q)
      );
    });
  }, [events, filter, search]);

  const orderedVisible = useMemo(
    () => [...visible].sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`)),
    [visible]
  );

  const now = Date.now();
  const upcomingCount = events.filter((e) => new Date(`${e.date}T${e.time}`).getTime() - now > 3600000).length;
  const ongoingCount = events.filter((e) => Math.abs(new Date(`${e.date}T${e.time}`).getTime() - now) <= 3600000).length;
  const completedCount = events.length - upcomingCount - ongoingCount;

  const analytics = [
    { label: "total", value: events.length },
    { label: "upcoming", value: upcomingCount },
    { label: "ongoing", value: ongoingCount },
    { label: "completed", value: completedCount },
  ];

  const renderEventCard = (e, idx) => {
    const cat = CATEGORIES[e.category] || CATEGORIES.other;
    const status = getStatus(e.date, e.time);
    const past = status === "Completed";
    const important = status === "Ongoing";

    return (
      <article
        key={e.id}
        className={`event-card ${important ? "event-card-important" : ""}`}
        style={{
          ...styles.card,
          opacity: past ? 0.72 : 1,
          background: theme.panel,
          borderColor: theme.glassBorder,
          boxShadow: theme.shadow,
          animationDelay: `${idx * 35}ms`,
          ...(settings.compact ? { padding: 0 } : {}),
        }}
      >
        <div style={{ ...styles.cardAccent, background: cat.color }} />
        <div style={{ ...styles.cardBody, ...(settings.compact ? { padding: "0.55rem 0.7rem" } : {}) }}>
          <div style={styles.cardTop}>
            <span style={{ ...styles.cardTitle, color: theme.text }}>{e.title}</span>
            <div style={styles.cardActions}>
              <button className="ui-btn" title="Toggle notification" style={{ ...styles.iconBtn, color: e.notify ? cat.color : theme.muted }} onClick={() => handleToggle(e.id)}>
                {e.notify ? "🔔" : "🔕"}
              </button>
              <button className="ui-btn" title="Copy event details" style={{ ...styles.iconBtn, color: theme.muted }} onClick={() => handleCopy(e)}>
                📋
              </button>
              <button className="ui-btn" title="Delete event" style={{ ...styles.iconBtn, color: theme.muted }} onClick={() => handleDelete(e.id, e.title)}>
                ×
              </button>
            </div>
          </div>

          <div style={styles.cardMeta}>
            <span className="event-badge" style={{ ...styles.badge, background: `${cat.color}22`, color: cat.color }}>
              <span className="badge-dot" style={{ ...styles.badgeDot, background: cat.color }} />
              {cat.label}
            </span>
            <span style={{ ...styles.cardDate, color: theme.muted }}>{fmt(e.date, e.time)}</span>
            <span style={{ ...styles.countdown, color: theme.muted }}>{getCountdown(e.date, e.time)}</span>
            <span style={{ ...styles.statusPill, color: theme.text, borderColor: theme.glassBorder }}>{status}</span>
          </div>

          {e.note && <div style={{ ...styles.cardNote, color: theme.muted }}>{e.note}</div>}
        </div>
      </article>
    );
  };

  if (!isLoggedIn) {
    return <LoginScreen theme={theme} darkMode={darkMode} onToggleTheme={() => setDarkMode((v) => !v)} onLogin={({ email }) => {
      const username = email.split("@")[0];
      setCurrentUser(username);
      setProfile((prev) => ({ ...prev, name: prev.name || username, email }));
      setIsLoggedIn(true);
      showToast("Welcome back", "success");
    }} />;
  }

  return (
    <div style={{ ...styles.root, background: theme.bg, color: theme.text }}>
      <style>{settings.animations ? ANIMATIONS : ".ui-btn,.event-card,.floating-add,.badge-dot{transition:none !important; animation:none !important;}"}</style>
      <div style={styles.aurora} />

      <header style={{ ...styles.header, background: theme.panelStrong, borderColor: theme.border, boxShadow: theme.shadow }}>
        <div style={styles.brandWrap}>
          <LogoMark theme={theme} small />
          <div>
            <div style={styles.logoText}>notifi</div>
            <div style={{ ...styles.subhead, color: theme.muted }}>{events.length} total events · signed in as {currentUser || "user"}</div>
          </div>
        </div>

        <div style={styles.headerControls}>
          <button className="ui-btn" style={{ ...styles.themeBtn, background: theme.panel, color: theme.text, borderColor: theme.border }} onClick={() => setDarkMode((v) => !v)}>
            {darkMode ? "☀️" : "🌙"}
          </button>
          <button className="ui-btn" style={{ ...styles.clearBtn, borderColor: theme.border }} onClick={() => {
            setIsLoggedIn(false);
            setActiveTab("events");
            showToast("Logged out", "info");
          }}>
            logout
          </button>
        </div>
      </header>

      <section style={styles.tabRow}>
        {[
          { id: "events", label: "Events" },
          { id: "analytics", label: "Analytics" },
          { id: "profile", label: "Profile" },
          { id: "settings", label: "Settings" },
        ].map((tab) => (
          <button
            key={tab.id}
            className="ui-btn"
            style={{
              ...styles.tabBtn,
              background: activeTab === tab.id ? theme.primary : theme.panel,
              color: activeTab === tab.id ? theme.primaryText : theme.muted,
              borderColor: theme.border,
            }}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </section>

      {activeTab === "events" && (
        <>
          <section style={styles.analyticsRow}>
            {analytics.map((stat, idx) => (
              <div key={stat.label} style={{ ...styles.statCard, background: theme.panel, borderColor: theme.border, animationDelay: `${idx * 50}ms` }}>
                <div style={{ ...styles.statValue, color: theme.text }}>{stat.value}</div>
                <div style={{ ...styles.statLabel, color: theme.muted }}>{stat.label}</div>
              </div>
            ))}
          </section>

          <section style={styles.controlsRow}>
            <div style={styles.headerControls}>
              <input
                style={{ ...styles.searchInput, background: theme.input, color: theme.text, borderColor: theme.border }}
                placeholder="search events..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button className="ui-btn" style={{ ...styles.exportBtn, color: theme.muted, borderColor: theme.border }} onClick={handleExport}>export</button>
              <button className="ui-btn" style={{ ...styles.clearBtn, borderColor: theme.border }} onClick={handleClearAll} disabled={!events.length}>clear all</button>
            </div>

            <div style={styles.viewToggle}>
              <button className="ui-btn" style={{ ...styles.viewBtn, background: viewMode === "list" ? theme.primary : theme.panel, color: viewMode === "list" ? theme.primaryText : theme.muted, borderColor: theme.border }} onClick={() => setViewMode("list")}>
                list
              </button>
              <button className="ui-btn" style={{ ...styles.viewBtn, background: viewMode === "grid" ? theme.primary : theme.panel, color: viewMode === "grid" ? theme.primaryText : theme.muted, borderColor: theme.border }} onClick={() => setViewMode("grid")}>
                grid
              </button>
            </div>

            <div style={styles.filterBar}>
              {["all", ...Object.keys(CATEGORIES)].map((cat) => (
                <button
                  className="ui-btn"
                  key={cat}
                  style={{ ...styles.filterChip, color: filter === cat ? theme.primaryText : theme.muted, borderColor: theme.border, background: filter === cat ? theme.primary : theme.panel }}
                  onClick={() => setFilter(cat)}
                >
                  {cat === "all" ? "all" : CATEGORIES[cat].label.toLowerCase()}
                </button>
              ))}
            </div>
          </section>

          <CategoryLegend theme={theme} />

          <main style={{ ...styles.main, ...(viewMode === "grid" ? styles.mainGrid : styles.mainList) }}>
            {orderedVisible.length === 0 && (
              <div style={{ ...styles.emptyCard, background: theme.panel, borderColor: theme.border }}>
                <div style={{ ...styles.emptyTitle, color: theme.text }}>No events match your view</div>
                <div style={{ ...styles.emptyText, color: theme.muted }}>Try one quick start template</div>
                <div style={styles.suggestRow}>
                  {["Meeting", "Study session", "Workout"].map((idea) => (
                    <button
                      className="ui-btn"
                      key={idea}
                      style={{ ...styles.suggestChip, background: theme.input, color: theme.text, borderColor: theme.border }}
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

            {viewMode === "list" &&
              orderedVisible.map((e, idx) => (
                <div key={e.id} style={styles.timelineItem}>
                  <div style={styles.timelineRail}>
                    <span style={{ ...styles.timelineDot, background: (CATEGORIES[e.category] || CATEGORIES.other).color }} />
                    <span style={{ ...styles.timelineLine, background: theme.glassBorder, ...(idx === orderedVisible.length - 1 ? { display: "none" } : {}) }} />
                  </div>
                  {renderEventCard(e, idx)}
                </div>
              ))}
            {viewMode === "grid" && orderedVisible.map((e, idx) => renderEventCard(e, idx))}
          </main>
        </>
      )}

      {activeTab === "analytics" && <MonthlyAnalytics events={events} theme={theme} />}

      {activeTab === "profile" && (
        <div style={styles.sectionStack}>
          <div style={{ ...styles.sectionCard, background: theme.panel, borderColor: theme.glassBorder, boxShadow: theme.shadow }}>
            <div style={styles.sectionTitle}>Personal Details</div>
            <div style={styles.profileGrid}>
              {[
                ["name", "Name"],
                ["email", "Email ID"],
                ["phone", "Phone No"],
                ["college", "College Name"],
                ["department", "Department"],
                ["year", "Year / Semester"],
                ["location", "Location"],
              ].map(([key, label]) => (
                <div key={key}>
                  <label style={{ ...styles.label, color: theme.muted }}>{label}</label>
                  <input
                    style={{ ...styles.input, background: theme.input, borderColor: theme.border, color: theme.text }}
                    value={profile[key]}
                    onChange={(e) => setProfile((prev) => ({ ...prev, [key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <label style={{ ...styles.label, color: theme.muted, marginTop: "0.4rem" }}>Bio</label>
            <textarea
              style={{ ...styles.textarea, background: theme.input, borderColor: theme.border, color: theme.text }}
              value={profile.bio}
              onChange={(e) => setProfile((prev) => ({ ...prev, bio: e.target.value }))}
              placeholder="Tell us about you"
            />
            <button className="ui-btn" style={{ ...styles.saveBtn, marginTop: "0.7rem", background: theme.primary, color: theme.primaryText }} onClick={handleProfileSave}>
              save profile
            </button>
          </div>
        </div>
      )}

      {activeTab === "settings" && (
        <div style={styles.sectionStack}>
          <div style={{ ...styles.sectionCard, background: theme.panel, borderColor: theme.glassBorder, boxShadow: theme.shadow }}>
            <div style={styles.sectionTitle}>Settings</div>
            <div style={styles.settingsList}>
              <label style={{ ...styles.toggleRow, color: theme.text }}>
                <input type="checkbox" checked={darkMode} onChange={(e) => setDarkMode(e.target.checked)} />
                <span>Enable dark mode</span>
              </label>
              <label style={{ ...styles.toggleRow, color: theme.text }}>
                <input type="checkbox" checked={settings.animations} onChange={(e) => setSettings((prev) => ({ ...prev, animations: e.target.checked }))} />
                <span>Enable animations</span>
              </label>
              <label style={{ ...styles.toggleRow, color: theme.text }}>
                <input type="checkbox" checked={settings.compact} onChange={(e) => setSettings((prev) => ({ ...prev, compact: e.target.checked }))} />
                <span>Compact event cards</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {adding && (
        <div style={styles.overlay} onClick={(ev) => ev.target === ev.currentTarget && setAdding(false)}>
          <div style={{ ...styles.modal, background: theme.panelStrong, borderColor: theme.border, boxShadow: theme.shadow }}>
            <div style={{ ...styles.modalTitle, color: theme.text }}>New event</div>

            <label style={{ ...styles.label, color: theme.muted }}>title</label>
            <input
              ref={titleRef}
              style={{ ...styles.input, background: theme.input, borderColor: theme.border, color: theme.text }}
              placeholder="What is happening?"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />

            <div style={styles.row}>
              <div style={{ flex: 1 }}>
                <label style={{ ...styles.label, color: theme.muted }}>date</label>
                <input
                  style={{ ...styles.input, background: theme.input, borderColor: theme.border, color: theme.text }}
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ ...styles.label, color: theme.muted }}>time</label>
                <input
                  style={{ ...styles.input, background: theme.input, borderColor: theme.border, color: theme.text }}
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                />
              </div>
            </div>

            <label style={{ ...styles.label, color: theme.muted }}>category</label>
            <div style={styles.catGrid}>
              {Object.entries(CATEGORIES).map(([key, val]) => (
                <button
                  key={key}
                  className="ui-btn"
                  style={{ ...styles.catChip, background: theme.input, borderColor: form.category === key ? val.color : theme.border, color: form.category === key ? val.color : theme.muted }}
                  onClick={() => setForm({ ...form, category: key })}
                >
                  {val.label}
                </button>
              ))}
            </div>

            <label style={{ ...styles.label, color: theme.muted }}>note</label>
            <input
              style={{ ...styles.input, background: theme.input, borderColor: theme.border, color: theme.text }}
              placeholder="Optional details"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />

            <label style={{ ...styles.toggleRow, color: theme.muted }}>
              <input type="checkbox" checked={form.notify} onChange={(e) => setForm({ ...form, notify: e.target.checked })} />
              <span>notify me</span>
            </label>

            <div style={styles.modalActions}>
              <button className="ui-btn" style={{ ...styles.cancelBtn, borderColor: theme.border, color: theme.muted }} onClick={() => setAdding(false)}>
                cancel
              </button>
              <button className="ui-btn" style={{ ...styles.saveBtn, background: theme.primary, color: theme.primaryText }} onClick={handleAdd}>
                save event
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div style={{ ...styles.toast, background: toast.type === "error" ? "#7f1d1d" : toast.type === "info" ? "#1e3a5f" : "#14532d" }}>{toast.msg}</div>}

      {activeTab === "events" && (
        <button className="floating-add ui-btn" title="Add event" style={{ ...styles.fab, background: theme.primary, color: theme.primaryText, boxShadow: theme.shadow }} onClick={() => setAdding(true)}>
          +
        </button>
      )}
    </div>
  );
}

const ANIMATIONS = `
@keyframes riseIn {
  from { opacity: 0; transform: translateY(8px) scale(0.99); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes pulseBg {
  0% { transform: translate3d(0,0,0) scale(1); }
  50% { transform: translate3d(0,-12px,0) scale(1.02); }
  100% { transform: translate3d(0,0,0) scale(1); }
}
@keyframes neonPulse {
  0% { box-shadow: 0 0 0 rgba(56,189,248,0); }
  50% { box-shadow: 0 0 24px rgba(56,189,248,0.35); }
  100% { box-shadow: 0 0 0 rgba(56,189,248,0); }
}
@keyframes badgePulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.12); }
  100% { transform: scale(1); }
}
.ui-btn { transition: transform .2s ease, box-shadow .2s ease, filter .2s ease; }
.ui-btn:hover { transform: translateY(-1px); filter: brightness(1.05); box-shadow: 0 8px 20px rgba(0,0,0,0.18); }
.event-card { transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease; }
.event-card:hover { transform: translateY(-4px) scale(1.01); box-shadow: 0 24px 42px rgba(0,0,0,0.28); }
.event-card-important { animation: neonPulse 2.6s ease-in-out infinite; }
.event-badge { display: inline-flex; align-items: center; gap: 6px; }
.badge-dot { animation: badgePulse 1.6s ease-in-out infinite; }
.floating-add { transition: transform .22s ease, box-shadow .22s ease; }
.floating-add:hover { transform: translateY(-4px) scale(1.06); box-shadow: 0 0 28px rgba(56,189,248,0.45); }
`;

const styles = {
  root: { minHeight: "100vh", padding: "1rem", fontFamily: "'DM Mono', 'Courier New', monospace", position: "relative", overflow: "hidden" },
  aurora: {
    position: "fixed",
    inset: "-30% -20% auto -20%",
    height: "50vh",
    background: "radial-gradient(circle at 25% 25%, rgba(96,165,250,.28), transparent 45%), radial-gradient(circle at 75% 20%, rgba(167,139,250,.25), transparent 40%), radial-gradient(circle at 50% 55%, rgba(45,212,191,.2), transparent 45%)",
    filter: "blur(20px)",
    animation: "pulseBg 8s ease-in-out infinite",
    pointerEvents: "none",
    zIndex: 0,
  },

  authRoot: { minHeight: "100vh", display: "grid", placeItems: "center", padding: "1rem", fontFamily: "'DM Mono', 'Courier New', monospace", position: "relative", overflow: "hidden" },
  authCard: { width: "100%", maxWidth: "560px", borderRadius: "18px", border: "1px solid", backdropFilter: "blur(12px)", padding: "1.2rem", position: "relative", zIndex: 1, animation: "riseIn .45s ease" },
  authTop: { display: "flex", gap: "0.8rem", alignItems: "center" },
  authTitle: { fontSize: "1.35rem", fontWeight: 700, lineHeight: 1.1 },
  authSub: { fontSize: "0.72rem", marginTop: "0.2rem" },
  authForm: { display: "flex", flexDirection: "column", gap: "0.55rem", marginTop: "1rem" },
  passwordChecks: { display: "flex", gap: "0.35rem", flexWrap: "wrap", marginTop: "0.15rem" },
  checkChip: { border: "1px solid", borderRadius: "999px", fontSize: "0.63rem", padding: "0.16rem 0.45rem" },
  signInBtn: { marginTop: "0.5rem", border: "none", borderRadius: "8px", padding: "0.72rem", fontFamily: "inherit", fontSize: "0.8rem", fontWeight: 700 },

  header: { position: "relative", zIndex: 1, border: "1px solid", borderRadius: "16px", padding: "1rem", backdropFilter: "blur(12px)", display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "0.9rem", animation: "riseIn .45s ease" },
  brandWrap: { display: "flex", gap: "0.65rem", alignItems: "center" },
  logoText: { fontSize: "1.4rem", fontWeight: 700, lineHeight: 1 },
  subhead: { fontSize: "0.72rem", marginTop: "0.25rem" },
  headerControls: { display: "flex", alignItems: "center", gap: "0.45rem", flexWrap: "wrap" },

  tabRow: { position: "relative", zIndex: 1, marginTop: "0.7rem", display: "flex", gap: "0.45rem", flexWrap: "wrap" },
  tabBtn: { border: "1px solid", borderRadius: "999px", padding: "0.34rem 0.75rem", fontFamily: "inherit", fontSize: "0.72rem", cursor: "pointer", textTransform: "lowercase" },

  searchInput: { width: "190px", border: "1px solid", borderRadius: "8px", padding: "0.45rem 0.55rem", fontFamily: "inherit", fontSize: "0.75rem", outline: "none" },
  themeBtn: { border: "1px solid", borderRadius: "8px", padding: "0.45rem 0.58rem", fontFamily: "inherit", fontSize: "0.74rem", cursor: "pointer" },
  exportBtn: { background: "transparent", border: "1px solid", borderRadius: "8px", padding: "0.45rem 0.68rem", fontFamily: "inherit", fontSize: "0.72rem", cursor: "pointer", textTransform: "lowercase" },
  clearBtn: { background: "transparent", color: "#cc8d8d", border: "1px solid", borderRadius: "8px", padding: "0.45rem 0.68rem", fontFamily: "inherit", fontSize: "0.72rem", cursor: "pointer", textTransform: "lowercase" },

  analyticsRow: { position: "relative", zIndex: 1, marginTop: "0.75rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "0.55rem" },
  statCard: { border: "1px solid", borderRadius: "12px", backdropFilter: "blur(10px)", padding: "0.65rem 0.72rem", animation: "riseIn .4s ease both" },
  statValue: { fontSize: "1rem", fontWeight: 700 },
  statLabel: { fontSize: "0.66rem", textTransform: "uppercase", letterSpacing: "0.07em", marginTop: "0.15rem" },

  controlsRow: { position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", gap: "0.6rem", alignItems: "center", marginTop: "0.85rem", flexWrap: "wrap" },
  viewToggle: { display: "flex", gap: "0.42rem" },
  viewBtn: { border: "1px solid", borderRadius: "999px", padding: "0.35rem 0.72rem", fontFamily: "inherit", fontSize: "0.72rem", cursor: "pointer", textTransform: "lowercase" },
  filterBar: { display: "flex", gap: "0.4rem", flexWrap: "wrap" },
  filterChip: { border: "1px solid", borderRadius: "999px", padding: "0.34rem 0.72rem", fontFamily: "inherit", fontSize: "0.7rem", cursor: "pointer", textTransform: "lowercase" },

  legendWrap: { position: "relative", zIndex: 1, marginTop: "0.7rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" },
  legendItem: { border: "1px solid", borderRadius: "999px", padding: "0.25rem 0.45rem", display: "inline-flex", gap: "0.35rem", alignItems: "center" },
  legendDot: { width: 8, height: 8, borderRadius: "999px" },
  legendText: { fontSize: "0.66rem", textTransform: "uppercase", letterSpacing: "0.06em" },

  main: { position: "relative", zIndex: 1, marginTop: "0.75rem", paddingBottom: "2.5rem" },
  mainList: { display: "flex", flexDirection: "column", gap: "0.5rem" },
  mainGrid: { display: "grid", gap: "0.5rem", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" },

  timelineItem: { display: "grid", gridTemplateColumns: "26px 1fr", gap: "0.45rem", alignItems: "stretch" },
  timelineRail: { position: "relative", display: "flex", justifyContent: "center" },
  timelineDot: { width: 10, height: 10, borderRadius: "999px", marginTop: "0.95rem", boxShadow: "0 0 0 3px rgba(255,255,255,0.08)" },
  timelineLine: { position: "absolute", top: "1.55rem", bottom: "0.25rem", width: 2, borderRadius: "999px", opacity: 0.65 },

  emptyCard: { border: "1px solid", borderRadius: "12px", padding: "1rem", textAlign: "center" },
  emptyTitle: { fontSize: "0.95rem", fontWeight: 700 },
  emptyText: { fontSize: "0.72rem", marginTop: "0.2rem" },
  suggestRow: { marginTop: "0.7rem", display: "flex", justifyContent: "center", gap: "0.4rem", flexWrap: "wrap" },
  suggestChip: { border: "1px solid", borderRadius: "999px", padding: "0.3rem 0.65rem", fontFamily: "inherit", fontSize: "0.7rem", cursor: "pointer" },

  card: { display: "flex", border: "1px solid", borderRadius: "12px", overflow: "hidden", backdropFilter: "blur(10px)", animation: "riseIn .35s ease both" },
  cardAccent: { width: 3, flexShrink: 0 },
  cardBody: { padding: "0.78rem 0.9rem", flex: 1, minWidth: 0 },
  cardTop: { display: "flex", justifyContent: "space-between", gap: "0.5rem", alignItems: "center" },
  cardTitle: { fontSize: "0.9rem", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  cardActions: { display: "flex", alignItems: "center", gap: "0.15rem" },
  iconBtn: { background: "none", border: "none", fontSize: "1rem", cursor: "pointer", lineHeight: 1, padding: "0.1rem 0.24rem" },
  cardMeta: { display: "flex", alignItems: "center", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.35rem" },
  badge: { fontSize: "0.62rem", borderRadius: "5px", padding: "0.14rem 0.4rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" },
  badgeDot: { width: 6, height: 6, borderRadius: "999px", display: "inline-block" },
  cardDate: { fontSize: "0.68rem" },
  countdown: { fontSize: "0.68rem", fontWeight: 600 },
  statusPill: { fontSize: "0.62rem", border: "1px solid", borderRadius: "999px", padding: "0.12rem 0.42rem", textTransform: "uppercase", letterSpacing: "0.05em" },
  cardNote: { marginTop: "0.32rem", fontSize: "0.72rem", fontStyle: "italic" },

  sectionStack: { position: "relative", zIndex: 1, marginTop: "0.8rem", display: "grid", gap: "0.7rem" },
  sectionCard: { border: "1px solid", borderRadius: "14px", padding: "0.85rem", backdropFilter: "blur(10px)" },
  sectionTitle: { fontSize: "0.84rem", fontWeight: 700, marginBottom: "0.7rem", textTransform: "uppercase", letterSpacing: "0.07em" },

  chartRow: { display: "grid", gridTemplateColumns: "repeat(6, minmax(0,1fr))", gap: "0.5rem", alignItems: "end" },
  chartCol: { display: "grid", gap: "0.2rem", justifyItems: "center" },
  chartBarTrack: { width: "100%", maxWidth: "48px", height: "130px", borderRadius: "8px", border: "1px solid", display: "flex", alignItems: "end", overflow: "hidden", padding: "2px" },
  chartBarFill: { width: "100%", borderRadius: "6px", background: "linear-gradient(180deg, #60A5FA, #A78BFA 55%, #2DD4BF)", transition: "height .35s ease" },
  chartCount: { fontSize: "0.7rem", fontWeight: 700 },
  chartLabel: { fontSize: "0.64rem" },

  distList: { display: "grid", gap: "0.45rem" },
  distRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.6rem" },
  distLeft: { display: "flex", alignItems: "center", gap: "0.4rem", minWidth: "90px" },
  distRight: { display: "flex", alignItems: "center", gap: "0.5rem", flex: 1 },
  distTrack: { height: "8px", borderRadius: "999px", overflow: "hidden", flex: 1 },
  distFill: { height: "100%", borderRadius: "999px" },
  distValue: { fontSize: "0.68rem", minWidth: "16px", textAlign: "right" },

  profileGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "0.55rem" },
  textarea: { width: "100%", minHeight: "96px", border: "1px solid", borderRadius: "8px", padding: "0.58rem 0.62rem", fontFamily: "inherit", fontSize: "0.78rem", resize: "vertical", boxSizing: "border-box", outline: "none" },
  settingsList: { display: "grid", gap: "0.55rem" },

  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", display: "grid", placeItems: "center", zIndex: 20, padding: "1rem" },
  modal: { width: "100%", maxWidth: "440px", border: "1px solid", borderRadius: "14px", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.55rem", backdropFilter: "blur(12px)", animation: "riseIn .25s ease" },
  modalTitle: { fontSize: "1rem", fontWeight: 700, marginBottom: "0.1rem" },
  label: { fontSize: "0.66rem", textTransform: "uppercase", letterSpacing: "0.07em" },
  input: { width: "100%", border: "1px solid", borderRadius: "8px", padding: "0.52rem 0.62rem", fontFamily: "inherit", fontSize: "0.8rem", outline: "none", boxSizing: "border-box" },
  row: { display: "flex", gap: "0.55rem" },
  catGrid: { display: "flex", gap: "0.35rem", flexWrap: "wrap" },
  catChip: { border: "1px solid", borderRadius: "7px", padding: "0.28rem 0.7rem", fontFamily: "inherit", fontSize: "0.72rem", cursor: "pointer" },
  toggleRow: { display: "flex", gap: "0.45rem", alignItems: "center", fontSize: "0.76rem" },
  modalActions: { display: "flex", gap: "0.45rem", marginTop: "0.35rem" },
  cancelBtn: { flex: 1, background: "transparent", border: "1px solid", borderRadius: "8px", padding: "0.56rem", fontFamily: "inherit", fontSize: "0.74rem", cursor: "pointer" },
  saveBtn: { flex: 2, border: "none", borderRadius: "8px", padding: "0.56rem", fontFamily: "inherit", fontSize: "0.74rem", fontWeight: 700, cursor: "pointer" },

  toast: { position: "fixed", left: "50%", bottom: "1.1rem", transform: "translateX(-50%)", borderRadius: "8px", padding: "0.55rem 1rem", fontSize: "0.75rem", color: "#fff", zIndex: 30, border: "1px solid rgba(255,255,255,0.1)" },
  fab: { position: "fixed", right: "1.25rem", bottom: "1.25rem", width: 54, height: 54, borderRadius: "999px", border: "1px solid rgba(255,255,255,0.25)", display: "grid", placeItems: "center", fontSize: "1.7rem", lineHeight: 1, fontWeight: 700, zIndex: 25, cursor: "pointer" },
};
