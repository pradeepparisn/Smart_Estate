import { useState, useEffect, useRef } from "react";
const API_BASE = "/api";
const STORAGE_KEY = "smartestate_user";
// ── DESIGN TOKENS ──────────────────────────────────────────────────────────
const G = {
  bg: "#0A0F1E",
  bgCard: "#111827",
  bgCardHover: "#161f32",
  border: "rgba(255,255,255,0.07)",
  borderHover: "rgba(255,255,255,0.15)",
  accent: "#6C63FF",
  accentLight: "#8B84FF",
  accentDark: "#4B44CC",
  gold: "#F5A623",
  green: "#22C55E",
  red: "#EF4444",
  textPrimary: "#F0F4FF",
  textSecondary: "#8892AA",
  textMuted: "#4A5568",
  gradientHero: "linear-gradient(135deg,#6C63FF22 0%,#F5A62311 50%,#22C55E11 100%)",
};

// ── MOCK DATA ──────────────────────────────────────────────────────────────
const MOCK_USERS = [
  { id: 1, name: "Arjun Sharma", email: "arjun@gmail.com", password: "123456", role: "user", phone: "+91 98765 43210", area: "Koramangala", city: "Bangalore", bio: "Real estate investor with 8+ years experience.", avatar: "AS" },
  { id: 2, name: "Priya Mehta", email: "priya@gmail.com", password: "123456", role: "user", phone: "+91 87654 32109", area: "Indiranagar", city: "Bangalore", bio: "Looking for the perfect home.", avatar: "PM" },
];

const MOCK_PROPERTIES = [
  { id: 1, title: "Luxury 3BHK Apartment", type: "apartment", listingType: "sale", price: 8500000, location: "Koramangala, Bangalore", area: 1850, bhk: 3, address: "245, 5th Block, Koramangala", contact: "+91 98765 43210", description: "Stunning apartment with modern amenities, 24/7 security, gym, pool.", sellerId: 1, sellerName: "Arjun Sharma", images: ["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80"], status: "available", amenities: ["Gym", "Pool", "Parking", "Security"] },
  { id: 2, title: "Independent Villa with Garden", type: "house", listingType: "sale", price: 15000000, location: "Whitefield, Bangalore", area: 3200, bhk: 4, address: "12, Palm Grove, Whitefield", contact: "+91 98765 43210", description: "Spacious independent villa with lush garden, modular kitchen and premium fittings.", sellerId: 1, sellerName: "Arjun Sharma", images: ["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80"], status: "available", amenities: ["Garden", "Parking", "Security", "Solar"] },
  { id: 3, title: "Commercial Plot – Prime Location", type: "plot", listingType: "sale", price: 4500000, location: "Electronic City, Bangalore", area: 2400, bhk: null, address: "Plot 88, KIADB Industrial Area", contact: "+91 98765 43210", description: "KIADB approved commercial plot, excellent connectivity, all utilities available.", sellerId: 1, sellerName: "Arjun Sharma", images: ["https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80"], status: "available", amenities: ["KIADB Approved", "Road Access", "Power"] },
  { id: 4, title: "Cozy 2BHK for Rent", type: "apartment", listingType: "rent", price: 25000, location: "Indiranagar, Bangalore", area: 1100, bhk: 2, address: "14, 12th Main, Indiranagar", contact: "+91 87654 32109", description: "Well-maintained 2BHK in prime Indiranagar. Fully furnished, semi-furnished option available.", sellerId: 2, sellerName: "Priya Mehta", images: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80"], status: "available", amenities: ["Furnished", "Parking", "WiFi Ready"] },
];

const MOCK_REQUESTS = [
  { id: 1, propertyId: 1, propertyTitle: "Luxury 3BHK Apartment", buyerId: 2, buyerName: "Priya Mehta", sellerId: 1, offeredPrice: 8000000, listedPrice: 8500000, status: "pending", date: "2024-01-15", message: "Interested in buying. Please consider my offer." },
];

// ── UTILITIES ──────────────────────────────────────────────────────────────
const fmt = (n) => n >= 10000000 ? `₹${(n/10000000).toFixed(2)} Cr` : n >= 100000 ? `₹${(n/100000).toFixed(1)} L` : `₹${n?.toLocaleString("en-IN")}`;
const uid = () => Math.random().toString(36).slice(2);

// ── SHARED COMPONENTS ──────────────────────────────────────────────────────
const Btn = ({ children, onClick, variant = "primary", size = "md", disabled, style = {}, type = "button" }) => {
  const base = {
    border: "none", cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit",
    fontWeight: 600, borderRadius: 10, transition: "all 0.2s", opacity: disabled ? 0.5 : 1,
    display: "inline-flex", alignItems: "center", gap: 8, ...style,
  };
  const sizes = { sm: { padding: "7px 16px", fontSize: 13 }, md: { padding: "11px 22px", fontSize: 14 }, lg: { padding: "14px 30px", fontSize: 16 } };
  const variants = {
    primary: { background: G.accent, color: "#fff" },
    secondary: { background: "transparent", color: G.textSecondary, border: `1px solid ${G.border}` },
    ghost: { background: "transparent", color: G.textSecondary },
    danger: { background: G.red, color: "#fff" },
    success: { background: G.green, color: "#fff" },
    gold: { background: G.gold, color: "#111" },
  };
  return <button type={type} onClick={onClick} disabled={disabled} style={{ ...base, ...sizes[size], ...variants[variant] }}>{children}</button>;
};

const Input = ({ label, type = "text", value, onChange, placeholder, icon, required, style = {} }) => (
  <div style={{ marginBottom: 18, ...style }}>
    {label && <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: G.textSecondary, marginBottom: 7, letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}{required && <span style={{ color: G.accent, marginLeft: 3 }}>*</span>}</label>}
    <div style={{ position: "relative" }}>
      {icon && <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16, opacity: 0.5 }}>{icon}</span>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid ${G.border}`, borderRadius: 10, padding: icon ? "12px 14px 12px 42px" : "12px 14px", color: G.textPrimary, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box", transition: "border 0.2s" }}
        onFocus={e => e.target.style.borderColor = G.accent} onBlur={e => e.target.style.borderColor = G.border} />
    </div>
  </div>
);

const Select = ({ label, value, onChange, options, required }) => (
  <div style={{ marginBottom: 18 }}>
    {label && <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: G.textSecondary, marginBottom: 7, letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}{required && <span style={{ color: G.accent, marginLeft: 3 }}>*</span>}</label>}
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ width: "100%", background: "#1a2235", border: `1px solid ${G.border}`, borderRadius: 10, padding: "12px 14px", color: G.textPrimary, fontSize: 14, fontFamily: "inherit", outline: "none" }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const Textarea = ({ label, value, onChange, placeholder, rows = 4 }) => (
  <div style={{ marginBottom: 18 }}>
    {label && <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: G.textSecondary, marginBottom: 7, letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</label>}
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid ${G.border}`, borderRadius: 10, padding: "12px 14px", color: G.textPrimary, fontSize: 14, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" }}
      onFocus={e => e.target.style.borderColor = G.accent} onBlur={e => e.target.style.borderColor = G.border} />
  </div>
);

const Card = ({ children, style = {}, onClick, hover = true }) => {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: hov && hover ? G.bgCardHover : G.bgCard, border: `1px solid ${hov && hover ? G.borderHover : G.border}`, borderRadius: 16, transition: "all 0.2s", cursor: onClick ? "pointer" : "default", ...style }}>
      {children}
    </div>
  );
};

const Badge = ({ children, color = G.accent }) => (
  <span style={{ background: color + "22", color, border: `1px solid ${color}44`, borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>{children}</span>
);

const Avatar = ({ initials, size = 42, bg = G.accent }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: size * 0.35, color: "#fff", flexShrink: 0 }}>{initials}</div>
);

const Toast = ({ msg, type = "success", onClose }) => (
  <div style={{ position: "fixed", bottom: 28, right: 28, background: type === "success" ? G.green : type === "error" ? G.red : G.accent, color: "#fff", padding: "14px 22px", borderRadius: 12, fontWeight: 600, fontSize: 14, zIndex: 9999, boxShadow: "0 8px 32px rgba(0,0,0,0.4)", display: "flex", alignItems: "center", gap: 10, animation: "slideUp 0.3s ease" }}>
    {type === "success" ? "✓" : type === "error" ? "✕" : "ℹ"} {msg}
    <span onClick={onClose} style={{ marginLeft: 8, cursor: "pointer", opacity: 0.7 }}>×</span>
  </div>
);

// ── NAV ────────────────────────────────────────────────────────────────────
const Nav = ({ user, page, setPage, onLogout }) => {
  const links = [
    { id: "browse", label: "Browse" },
    { id: "list", label: "List Property" },
    { id: "requests", label: "Requests" },
    { id: "ai-tools", label: "AI Tools" },
    { id: "profile", label: "Profile" },
  ];
  return (
    <nav style={{ background: "rgba(10,15,30,0.95)", backdropFilter: "blur(20px)", borderBottom: `1px solid ${G.border}`, position: "sticky", top: 0, zIndex: 100, padding: "0 32px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", height: 64, gap: 8 }}>
        <div onClick={() => setPage("browse")} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 10, marginRight: 32 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: G.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🏠</div>
          <span style={{ fontWeight: 800, fontSize: 20, color: G.textPrimary, letterSpacing: "-0.02em" }}>Smart<span style={{ color: G.accent }}>Estate</span></span>
        </div>
        <div style={{ display: "flex", gap: 4, flex: 1 }}>
          {links.map(l => (
            <button key={l.id} onClick={() => setPage(l.id)}
              style={{ background: page === l.id ? `${G.accent}22` : "transparent", color: page === l.id ? G.accentLight : G.textSecondary, border: page === l.id ? `1px solid ${G.accent}44` : "1px solid transparent", borderRadius: 8, padding: "7px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
              {l.label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, color: G.textSecondary }}>Hi, <strong style={{ color: G.textPrimary }}>{user?.name?.split(" ")[0]}</strong></span>
          <Avatar initials={user?.avatar || user?.name?.slice(0,2).toUpperCase()} size={36} />
          <Btn onClick={onLogout} variant="secondary" size="sm">Sign Out</Btn>
        </div>
      </div>
    </nav>
  );
};

// ── AUTH PAGE ──────────────────────────────────────────────────────────────
const AuthPage = ({ onLogin }) => {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", area: "Koramangala" });
  const [error, setError] = useState("");
  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setError("");
    const payload = { email: form.email, password: form.password };

    try {
      let res;
      if (mode === "login") {
        res = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        const signupPayload = {
          name: form.name,
          email: form.email,
          password: form.password,
          phone: form.phone,
          area: form.area
        };
        res = await fetch(`${API_BASE}/auth/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(signupPayload)
        });
      }

      const data = await res.json();
      if (!res.ok) {
        setError(data.msg || "Authentication failed.");
        return;
      }

      onLogin({ ...data.user, token: data.token, avatar: data.user.name?.slice(0,2).toUpperCase() });
    } catch (err) {
      console.error(err);
      setError("Unable to connect to the server. Please try again.");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: G.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: `${G.accent}08`, filter: "blur(80px)", top: -100, left: -100, pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: `${G.gold}06`, filter: "blur(60px)", bottom: 0, right: 0, pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: 460, position: "relative" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: G.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 16px" }}>🏠</div>
          <h1 style={{ color: G.textPrimary, fontSize: 32, fontWeight: 800, margin: "0 0 8px", letterSpacing: "-0.03em" }}>SmartEstate</h1>
          <p style={{ color: G.textSecondary, fontSize: 15, margin: 0 }}>India's smartest property platform</p>
        </div>

        <Card style={{ padding: "36px 36px 32px" }}>
          <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 4, marginBottom: 28 }}>
            {["login", "register"].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(""); }}
                style={{ flex: 1, padding: "9px", borderRadius: 8, border: "none", background: mode === m ? G.accent : "transparent", color: mode === m ? "#fff" : G.textSecondary, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s", textTransform: "capitalize" }}>
                {m === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          {mode === "register" && <Input label="Full Name" value={form.name} onChange={set("name")} placeholder="Arjun Sharma" icon="👤" required />}
          <Input label="Email Address" type="email" value={form.email} onChange={set("email")} placeholder="you@gmail.com" icon="✉" required />
          <Input label="Password" type="password" value={form.password} onChange={set("password")} placeholder="••••••••" icon="🔒" required />
          {mode === "register" && <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Input label="Phone" value={form.phone} onChange={set("phone")} placeholder="+91 98765 43210" />
              <Select label="Select Bangalore area" value={form.area} onChange={set("area")} options={[
                { value: "Koramangala", label: "Koramangala" },
                { value: "Indiranagar", label: "Indiranagar" },
                { value: "Whitefield", label: "Whitefield" },
                { value: "Jayanagar", label: "Jayanagar" },
                { value: "HSR Layout", label: "HSR Layout" },
                { value: "Malleshwaram", label: "Malleshwaram" },
                { value: "Electronic City", label: "Electronic City" },
                { value: "Sarjapur Road", label: "Sarjapur Road" },
                { value: "Yelahanka", label: "Yelahanka" }
              ]} />
            </div>
          </>}

          {error && <div style={{ background: `${G.red}15`, border: `1px solid ${G.red}40`, borderRadius: 8, padding: "10px 14px", color: G.red, fontSize: 13, marginBottom: 16 }}>{error}</div>}

          <Btn onClick={handleSubmit} style={{ width: "100%", justifyContent: "center" }} size="lg">
            {mode === "login" ? "Sign In →" : "Create Account →"}
          </Btn>

          <div style={{ marginTop: 20, padding: "14px", background: "rgba(255,255,255,0.03)", borderRadius: 10, fontSize: 12, color: G.textMuted, textAlign: "center" }}>
            Demo: <strong style={{ color: G.textSecondary }}>arjun@gmail.com</strong> / <strong style={{ color: G.textSecondary }}>123456</strong>
          </div>
        </Card>
      </div>
    </div>
  );
};

// ── PROPERTY CARD ──────────────────────────────────────────────────────────
const PropertyCard = ({ property, onView, compact }) => (
  <Card onClick={() => onView(property)} style={{ overflow: "hidden" }}>
    <div style={{ position: "relative", height: compact ? 180 : 220, overflow: "hidden", borderRadius: "14px 14px 0 0" }}>
      <img src={property.images?.[0]} alt={property.title} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s" }}
        onMouseEnter={e => e.target.style.transform = "scale(1.05)"} onMouseLeave={e => e.target.style.transform = "scale(1)"} />
      <div style={{ position: "absolute", top: 12, left: 12, display: "flex", gap: 6 }}>
        <Badge color={property.listingType === "sale" ? G.accent : G.green}>{property.listingType === "sale" ? "For Sale" : "For Rent"}</Badge>
        <Badge color={G.gold}>{property.type}</Badge>
      </div>
      {property.images?.length > 1 && (
        <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.6)", padding: "6px 10px", borderRadius: 999, color: "#fff", fontSize: 12, fontWeight: 700 }}>
          {property.images.length} images
        </div>
      )}
      <div style={{ position: "absolute", bottom: 12, right: 12, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", borderRadius: 8, padding: "6px 12px" }}>
        <span style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>{fmt(property.price)}</span>
        {property.listingType === "rent" && <span style={{ color: G.textSecondary, fontSize: 11 }}>/mo</span>}
      </div>
    </div>
    <div style={{ padding: "18px 20px" }}>
      <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: G.textPrimary, lineHeight: 1.3 }}>{property.title}</h3>
      <p style={{ margin: "0 0 12px", fontSize: 13, color: G.textSecondary }}>📍 {property.location}</p>
      <div style={{ display: "flex", gap: 16, fontSize: 12, color: G.textMuted }}>
        {property.bhk && <span>🛏 {property.bhk} BHK</span>}
        <span>📐 {property.area?.toLocaleString()} sqft</span>
        <span>👤 {property.sellerName}</span>
      </div>
    </div>
  </Card>
);

// ── BROWSE PAGE ────────────────────────────────────────────────────────────
const BrowsePage = ({ properties, user, onBuyRequest }) => {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterListing, setFilterListing] = useState("all");
  const [selected, setSelected] = useState(null);
  const [offerMode, setOfferMode] = useState(false);
  const [offerType, setOfferType] = useState("listed");
  const [customOffer, setCustomOffer] = useState("");
  const [toast, setToast] = useState(null);

  const myProperties = properties.filter(p => p.sellerId === user.id);
  const filtered = properties.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.location.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || p.type === filterType;
    const matchListing = filterListing === "all" || p.listingType === filterListing;
    return matchSearch && matchType && matchListing && p.sellerId !== user.id;
  });

  const handleRequest = async () => {
    const price = offerType === "listed" ? selected.price : Number(customOffer);
    if (!price || isNaN(price)) { setToast({ msg: "Enter a valid offer price", type: "error" }); return; }

    const result = await onBuyRequest({ propertyId: selected.id, offeredPrice: price, message: "" });
    if (!result) {
      setToast({ msg: "Unable to send request right now.", type: "error" });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setOfferMode(false); setSelected(null);
    setToast({ msg: "Buy request sent successfully!", type: "success" });
    setTimeout(() => setToast(null), 3000);
  };

  if (selected && !offerMode) return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <Btn onClick={() => setSelected(null)} variant="ghost" size="sm" style={{ marginBottom: 20 }}>← Back to listings</Btn>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24 }}>
        <div>
          <img src={selected.images?.[0]} alt={selected.title} style={{ width: "100%", height: 360, objectFit: "cover", borderRadius: 16, marginBottom: 20 }} />
          {selected.images?.length > 1 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 10, marginBottom: 20 }}>
              {selected.images.slice(0, 4).map((src, idx) => (
                <img key={idx} src={src} alt={`${selected.title} ${idx + 1}`} style={{ width: "100%", height: 96, objectFit: "cover", borderRadius: 12 }} />
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            <Badge color={selected.listingType === "sale" ? G.accent : G.green}>{selected.listingType === "sale" ? "For Sale" : "For Rent"}</Badge>
            <Badge color={G.gold}>{selected.type}</Badge>
            <Badge color={selected.status === "available" ? G.green : G.red}>{selected.status}</Badge>
          </div>
          <h1 style={{ color: G.textPrimary, fontSize: 28, fontWeight: 800, margin: "0 0 8px" }}>{selected.title}</h1>
          <p style={{ color: G.textSecondary, fontSize: 15, margin: "0 0 20px" }}>📍 {selected.address}, {selected.location}</p>
          <Card style={{ padding: "20px", marginBottom: 20 }}>
            <h3 style={{ color: G.textPrimary, margin: "0 0 16px", fontSize: 16 }}>Property Details</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {[["Price", fmt(selected.price) + (selected.listingType === "rent" ? "/mo" : "")], ["Area", `${selected.area?.toLocaleString()} sqft`], selected.bhk && ["BHK", `${selected.bhk} Bedroom`], ["Type", selected.type], ["Location", selected.location]].filter(Boolean).map(([k, v]) => (
                <div key={k}><p style={{ color: G.textMuted, fontSize: 12, margin: "0 0 3px", textTransform: "uppercase", fontWeight: 600 }}>{k}</p><p style={{ color: G.textPrimary, fontWeight: 700, margin: 0, fontSize: 15 }}>{v}</p></div>
              ))}
            </div>
          </Card>
          <Card style={{ padding: "20px", marginBottom: 20 }}>
            <h3 style={{ color: G.textPrimary, margin: "0 0 12px", fontSize: 16 }}>Description</h3>
            <p style={{ color: G.textSecondary, lineHeight: 1.7, margin: 0 }}>{selected.description}</p>
          </Card>
          {selected.amenities?.length > 0 && <Card style={{ padding: "20px" }}>
            <h3 style={{ color: G.textPrimary, margin: "0 0 14px", fontSize: 16 }}>Amenities</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {selected.amenities.map(a => <Badge key={a} color={G.accent}>{a}</Badge>)}
            </div>
          </Card>}
        </div>
        <div>
          <Card style={{ padding: "24px", marginBottom: 16, position: "sticky", top: 80 }}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: G.accent }}>{fmt(selected.price)}{selected.listingType === "rent" && <span style={{ fontSize: 14, color: G.textMuted }}>/mo</span>}</div>
            </div>
            <div style={{ borderTop: `1px solid ${G.border}`, paddingTop: 20, marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <Avatar initials={selected.sellerName?.slice(0,2).toUpperCase()} size={44} />
                <div>
                  <p style={{ color: G.textPrimary, fontWeight: 700, margin: 0 }}>{selected.sellerName}</p>
                  <p style={{ color: G.textSecondary, fontSize: 12, margin: 0 }}>Property Owner</p>
                </div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "12px 14px", marginBottom: 12 }}>
                <p style={{ color: G.textMuted, fontSize: 11, margin: "0 0 3px", textTransform: "uppercase", fontWeight: 600 }}>Contact</p>
                <p style={{ color: G.textPrimary, fontWeight: 600, margin: 0, fontSize: 15 }}>📞 {selected.contact}</p>
              </div>
            </div>
            {user?.id !== selected.sellerId && (
              <Btn onClick={() => setOfferMode(true)} style={{ width: "100%", justifyContent: "center" }} size="lg">
                {selected.listingType === "sale" ? "🤝 Make Buy Request" : "🤝 Make Rent Request"}
              </Btn>
            )}
          </Card>
        </div>
      </div>
    </div>
  );

  if (offerMode) return (
    <div style={{ maxWidth: 520, margin: "60px auto", padding: "0 24px" }}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <Btn onClick={() => setOfferMode(false)} variant="ghost" size="sm" style={{ marginBottom: 20 }}>← Back</Btn>
      <Card style={{ padding: "32px" }}>
        <h2 style={{ color: G.textPrimary, fontSize: 24, fontWeight: 800, margin: "0 0 6px" }}>Make an Offer</h2>
        <p style={{ color: G.textSecondary, margin: "0 0 28px" }}>{selected.title}</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
          {[["listed", `Listed Price`, fmt(selected.price)], ["custom", "Custom Offer", "Type your price"]].map(([v, label, sub]) => (
            <div key={v} onClick={() => setOfferType(v)}
              style={{ border: `2px solid ${offerType === v ? G.accent : G.border}`, borderRadius: 12, padding: "16px", cursor: "pointer", background: offerType === v ? `${G.accent}11` : "transparent", transition: "all 0.2s" }}>
              <p style={{ color: offerType === v ? G.accent : G.textSecondary, fontWeight: 700, margin: "0 0 4px", fontSize: 13 }}>{label}</p>
              <p style={{ color: G.textPrimary, fontWeight: 800, margin: 0, fontSize: 16 }}>{sub}</p>
            </div>
          ))}
        </div>
        {offerType === "custom" && <Input label="Your Offer (₹)" type="number" value={customOffer} onChange={setCustomOffer} placeholder={selected.price} />}
        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "14px", marginBottom: 20 }}>
          <p style={{ color: G.textMuted, fontSize: 12, margin: "0 0 4px" }}>Your offer</p>
          <p style={{ color: G.accent, fontWeight: 800, fontSize: 22, margin: 0 }}>{fmt(offerType === "listed" ? selected.price : (Number(customOffer) || 0))}</p>
        </div>
        <Btn onClick={handleRequest} style={{ width: "100%", justifyContent: "center" }} size="lg">Send Request →</Btn>
      </Card>
    </div>
  );

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ color: G.textPrimary, fontSize: 32, fontWeight: 800, margin: "0 0 6px" }}>Browse Properties</h1>
        <p style={{ color: G.textSecondary, margin: 0 }}>{filtered.length} properties found</p>
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  Search by title or location..." style={{ flex: 1, minWidth: 240, background: "rgba(255,255,255,0.04)", border: `1px solid ${G.border}`, borderRadius: 10, padding: "12px 16px", color: G.textPrimary, fontSize: 14, fontFamily: "inherit", outline: "none" }} />
        {[["all", "All Types"], ["apartment", "Apartment"], ["house", "House"], ["villa", "Villa"], ["plot", "Plot"]].map(([v, l]) => (
          <button key={v} onClick={() => setFilterType(v)}
            style={{ padding: "10px 18px", borderRadius: 10, border: `1px solid ${filterType === v ? G.accent : G.border}`, background: filterType === v ? `${G.accent}22` : "transparent", color: filterType === v ? G.accentLight : G.textSecondary, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{l}</button>
        ))}
        {[["all", "All"], ["sale", "For Sale"], ["rent", "For Rent"]].map(([v, l]) => (
          <button key={v} onClick={() => setFilterListing(v)}
            style={{ padding: "10px 18px", borderRadius: 10, border: `1px solid ${filterListing === v ? G.green : G.border}`, background: filterListing === v ? `${G.green}22` : "transparent", color: filterListing === v ? G.green : G.textSecondary, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{l}</button>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
        {filtered.map(p => <PropertyCard key={p.id} property={p} onView={setSelected} />)}
      </div>
      {filtered.length === 0 && <div style={{ textAlign: "center", padding: "60px", color: G.textSecondary }}>No properties found matching your criteria.</div>}
      {myProperties.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h2 style={{ color: G.textPrimary, fontSize: 26, fontWeight: 800, margin: "0 0 18px" }}>My Properties</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
            {myProperties.map(p => <PropertyCard key={p.id} property={p} onView={setSelected} />)}
          </div>
        </div>
      )}
    </div>
  );
};

// ── LIST PROPERTY PAGE ─────────────────────────────────────────────────────
const ListPage = ({ user, onList }) => {
  const [form, setForm] = useState({ title: "", type: "apartment", listingType: "sale", price: "", location: "", area: "", bhk: "", address: "", contact: user?.phone || "", description: "", imageUrl: "", images: [], amenities: "" });
  const [toast, setToast] = useState(null);
  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.title || !form.price || !form.location || !form.address) {
      setToast({ msg: "Fill all required fields", type: "error" });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    const payload = {
      title: form.title,
      description: form.description,
      price: Number(form.price),
      location: form.location,
      address: form.address,
      contact: form.contact,
      listingType: form.listingType,
      type: form.type,
      bhk: Number(form.bhk) || null,
      area: Number(form.area) || null,
      images: form.images.length ? form.images : ["https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80"],
      amenities: form.amenities.split(",").map(a => a.trim()).filter(Boolean)
    };

    try {
      const res = await fetch(`${API_BASE}/properties`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        setToast({ msg: data.msg || "Unable to list property.", type: "error" });
        setTimeout(() => setToast(null), 3000);
        return;
      }

      const property = {
        id: data._id,
        title: data.title,
        type: data.type,
        listingType: data.listingType,
        price: data.price,
        location: data.location,
        area: data.area,
        bhk: data.bhk,
        address: data.address,
        contact: data.contact,
        description: data.description,
        sellerId: data.seller?._id,
        sellerName: data.seller?.name || user.name,
        images: data.images,
        status: data.status,
        amenities: data.amenities || []
      };

      onList(property);
      setToast({ msg: "Property listed successfully!", type: "success" });
      setTimeout(() => setToast(null), 3000);
      setForm({ title: "", type: "apartment", listingType: "sale", price: "", location: "", area: "", bhk: "", address: "", contact: user?.phone || "", description: "", imageUrl: "", images: [], amenities: "" });
    } catch (err) {
      console.error(err);
      setToast({ msg: "Unable to save property right now.", type: "error" });
      setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px" }}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ color: G.textPrimary, fontSize: 32, fontWeight: 800, margin: "0 0 6px" }}>List Your Property</h1>
        <p style={{ color: G.textSecondary, margin: 0 }}>Fill in the details below to list your property</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <Card style={{ padding: "20px", cursor: "pointer", border: `2px solid ${form.listingType === "sale" ? G.accent : G.border}`, background: form.listingType === "sale" ? `${G.accent}11` : G.bgCard }} onClick={() => set("listingType")("sale")}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🏷️</div>
          <p style={{ color: form.listingType === "sale" ? G.accentLight : G.textPrimary, fontWeight: 700, margin: "0 0 4px" }}>For Sale</p>
          <p style={{ color: G.textSecondary, fontSize: 13, margin: 0 }}>List your property for sale</p>
        </Card>
        <Card style={{ padding: "20px", cursor: "pointer", border: `2px solid ${form.listingType === "rent" ? G.green : G.border}`, background: form.listingType === "rent" ? `${G.green}11` : G.bgCard }} onClick={() => set("listingType")("rent")}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🔑</div>
          <p style={{ color: form.listingType === "rent" ? G.green : G.textPrimary, fontWeight: 700, margin: "0 0 4px" }}>For Rent</p>
          <p style={{ color: G.textSecondary, fontSize: 13, margin: 0 }}>List your property for rent</p>
        </Card>
      </div>

      <Card style={{ padding: "28px", marginBottom: 20 }}>
        <h3 style={{ color: G.textPrimary, margin: "0 0 20px", fontSize: 17 }}>Basic Information</h3>
        <Input label="Property Title" value={form.title} onChange={set("title")} placeholder="e.g. Luxury 3BHK Apartment in Koramangala" required />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Select label="Property Type" value={form.type} onChange={set("type")} options={[{ value: "apartment", label: "Apartment" }, { value: "house", label: "Independent House" }, { value: "villa", label: "Villa" }, { value: "plot", label: "Plot / Land" }, { value: "commercial", label: "Commercial" }]} />
          <Select label="BHK" value={form.bhk} onChange={set("bhk")} options={[{ value: "", label: "Not Applicable (Plot)" }, { value: "1", label: "1 BHK" }, { value: "2", label: "2 BHK" }, { value: "3", label: "3 BHK" }, { value: "4", label: "4 BHK" }, { value: "5", label: "5+ BHK" }]} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Input label={form.listingType === "sale" ? "Sale Price (₹)" : "Monthly Rent (₹)"} type="number" value={form.price} onChange={set("price")} placeholder="8500000" icon="₹" required />
          <Input label="Total Area (sqft)" type="number" value={form.area} onChange={set("area")} placeholder="1850" icon="📐" />
        </div>
      </Card>

      <Card style={{ padding: "28px", marginBottom: 20 }}>
        <h3 style={{ color: G.textPrimary, margin: "0 0 20px", fontSize: 17 }}>Location Details</h3>
        <Input label="City & Area" value={form.location} onChange={set("location")} placeholder="Koramangala, Bangalore" icon="📍" required />
        <Input label="Full Address" value={form.address} onChange={set("address")} placeholder="245, 5th Block, Koramangala, Bangalore - 560095" required />
        <Input label="Google Maps URL (optional)" value={form.mapUrl} onChange={set("mapUrl")} placeholder="https://maps.google.com/..." icon="🗺" />
      </Card>

      <Card style={{ padding: "28px", marginBottom: 20 }}>
        <h3 style={{ color: G.textPrimary, margin: "0 0 20px", fontSize: 17 }}>Media & Description</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, marginBottom: 18 }}>
          <Input label="Property Image URL" value={form.imageUrl} onChange={set("imageUrl")} placeholder="https://example.com/photo.jpg" icon="🖼" />
          <Btn onClick={() => {
            if (!form.imageUrl) return;
            setForm(f => ({ ...f, images: [...f.images, f.imageUrl], imageUrl: "" }));
          }} size="sm" style={{ alignSelf: "end", justifyContent: "center" }}>Add Image</Btn>
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: G.textSecondary, marginBottom: 7, letterSpacing: "0.05em", textTransform: "uppercase" }}>Upload Image</label>
          <input type="file" accept="image/*" onChange={e => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
              setForm(f => ({ ...f, images: [...f.images, reader.result] }));
            };
            reader.readAsDataURL(file);
            e.target.value = null;
          }} style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid ${G.border}`, borderRadius: 10, padding: "12px 14px", color: G.textPrimary, fontSize: 14 }} />
        </div>
        {form.images.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 18 }}>
            {form.images.map((src, idx) => (
              <div key={idx} style={{ borderRadius: 14, overflow: "hidden", border: `1px solid ${G.border}`, position: "relative" }}>
                <img src={src} alt={`Property ${idx + 1}`} style={{ width: "100%", height: 110, objectFit: "cover" }} />
                <button onClick={() => setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }))}
                  style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: 999, width: 26, height: 26, cursor: "pointer" }}>×</button>
              </div>
            ))}
          </div>
        )}
        <Textarea label="Property Description" value={form.description} onChange={set("description")} placeholder="Describe your property — key features, nearby landmarks, unique selling points..." rows={5} />
        <Input label="Amenities (comma separated)" value={form.amenities} onChange={set("amenities")} placeholder="Gym, Pool, Parking, Security, Solar" icon="✨" />
      </Card>

      <Card style={{ padding: "28px", marginBottom: 24 }}>
        <h3 style={{ color: G.textPrimary, margin: "0 0 20px", fontSize: 17 }}>Contact Details</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Input label="Contact Number" value={form.contact} onChange={set("contact")} placeholder="+91 98765 43210" icon="📞" required />
          <Input label="WhatsApp (optional)" value={form.whatsapp} onChange={set("whatsapp")} placeholder="+91 98765 43210" icon="💬" />
        </div>
      </Card>

      <Btn onClick={handleSubmit} size="lg" style={{ width: "100%", justifyContent: "center" }}>
        🚀 Publish Listing
      </Btn>
    </div>
  );
};

// ── REQUESTS PAGE ──────────────────────────────────────────────────────────
const RequestsPage = ({ requests, user, properties, onUpdateRequest }) => {
  const [tab, setTab] = useState("received");
  const [toast, setToast] = useState(null);

  const received = requests.filter(r => r.sellerId === user.id);
  const sent = requests.filter(r => r.buyerId === user.id);
  const list = tab === "received" ? received : sent;

  const handleApprove = async (req) => {
    const data = await onUpdateRequest(req.id, "approved");
    if (data) {
      setToast({ msg: "Request approved! Property marked as sold.", type: "success" });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleReject = async (req) => {
    const data = await onUpdateRequest(req.id, "rejected");
    if (data) {
      setToast({ msg: "Request rejected.", type: "error" });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const statusColor = { pending: G.gold, approved: G.green, rejected: G.red };

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 24px" }}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <h1 style={{ color: G.textPrimary, fontSize: 32, fontWeight: 800, margin: "0 0 28px" }}>Buy Requests</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
        {[["received", `Received (${received.length})`], ["sent", `Sent (${sent.length})`]].map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)}
            style={{ padding: "10px 22px", borderRadius: 10, border: `1px solid ${tab === v ? G.accent : G.border}`, background: tab === v ? `${G.accent}22` : "transparent", color: tab === v ? G.accentLight : G.textSecondary, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{l}</button>
        ))}
      </div>

      {list.length === 0 ? (
        <Card style={{ padding: "48px", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <p style={{ color: G.textSecondary, margin: 0 }}>No {tab} requests yet</p>
        </Card>
      ) : list.map(req => (
        <Card key={req.id} style={{ padding: "24px", marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <Avatar initials={(tab === "received" ? req.buyerName : req.propertyTitle)?.slice(0,2).toUpperCase()} size={40} bg={G.accent} />
                <div>
                  <p style={{ color: G.textPrimary, fontWeight: 700, margin: 0, fontSize: 15 }}>{req.propertyTitle}</p>
                  <p style={{ color: G.textSecondary, fontSize: 13, margin: 0 }}>{tab === "received" ? `From: ${req.buyerName}` : `Seller listed property`} · {req.date}</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 24, marginTop: 14 }}>
                <div><p style={{ color: G.textMuted, fontSize: 11, textTransform: "uppercase", fontWeight: 600, margin: "0 0 3px" }}>Listed Price</p><p style={{ color: G.textPrimary, fontWeight: 700, margin: 0, fontSize: 16 }}>{fmt(req.listedPrice)}</p></div>
                <div><p style={{ color: G.textMuted, fontSize: 11, textTransform: "uppercase", fontWeight: 600, margin: "0 0 3px" }}>Offered Price</p><p style={{ color: req.offeredPrice >= req.listedPrice ? G.green : G.gold, fontWeight: 800, margin: 0, fontSize: 18 }}>{fmt(req.offeredPrice)}</p></div>
                {req.offeredPrice >= req.listedPrice && <div style={{ display: "flex", alignItems: "flex-end" }}><Badge color={G.green}>Above Listed</Badge></div>}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
              <Badge color={statusColor[req.status]}>{req.status}</Badge>
              {tab === "received" && req.status === "pending" && (
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <Btn onClick={() => handleApprove(req)} variant="success" size="sm">✓ Approve</Btn>
                  <Btn onClick={() => handleReject(req)} variant="danger" size="sm">✕ Reject</Btn>
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

// ── AI TOOLS PAGE ──────────────────────────────────────────────────────────
const AIToolsPage = ({ setPage }) => (
  <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>
    <div style={{ textAlign: "center", marginBottom: 48 }}>
      <div style={{ display: "inline-block", background: `${G.accent}22`, border: `1px solid ${G.accent}44`, borderRadius: 999, padding: "6px 18px", fontSize: 12, fontWeight: 700, color: G.accent, letterSpacing: "0.1em", marginBottom: 16, textTransform: "uppercase" }}>Phase 3 — Coming Soon</div>
      <h1 style={{ color: G.textPrimary, fontSize: 40, fontWeight: 900, margin: "0 0 12px", letterSpacing: "-0.03em" }}>AI-Powered Tools</h1>
      <p style={{ color: G.textSecondary, fontSize: 17, maxWidth: 500, margin: "0 auto", lineHeight: 1.6 }}>Next-gen intelligence to help you make smarter property decisions</p>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
      {[
        { icon: "🤖", title: "AI Price Predictor", sub: "Powered by Machine Learning", desc: "Get an instant price estimate for any property based on location, size, BHK, amenities and 50+ other parameters trained on lakhs of real transactions.", features: ["Random Forest ML model", "Location heat mapping", "Price trend analysis", "Confidence score"], color: G.accent, status: "Phase 3" },
        { icon: "📊", title: "Area Livability Scorer", sub: "Neighbourhood Intelligence", desc: "Comprehensive scoring of any area based on proximity to schools, hospitals, metro, markets, crime data, green cover, and air quality index.", features: ["10+ scoring parameters", "Safety index", "School & hospital proximity", "Air quality data"], color: G.green, status: "Phase 3" },
        { icon: "📈", title: "Market Trend Analyser", sub: "Real-Time Insights", desc: "Track price trends over time for any micro-market. See whether prices are rising or falling and identify the best time to buy or sell.", features: ["Historical price charts", "Micro-market analysis", "Buy/sell signal", "Comparative areas"], color: G.gold, status: "Phase 4" },
        { icon: "🔍", title: "Smart Match", sub: "Personalised Recommendations", desc: "AI learns your preferences from browsing history and buy requests, then surfaces the most relevant properties before anyone else sees them.", features: ["Preference learning", "Budget optimisation", "First-mover alerts", "Wishlist tracking"], color: "#E879F9", status: "Phase 4" },
      ].map(tool => (
        <Card key={tool.title} style={{ padding: "28px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -20, right: -20, width: 120, height: 120, borderRadius: "50%", background: `${tool.color}08`, filter: "blur(20px)", pointerEvents: "none" }} />
          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div style={{ fontSize: 36 }}>{tool.icon}</div>
              <Badge color={tool.color}>{tool.status}</Badge>
            </div>
            <h3 style={{ color: G.textPrimary, fontSize: 20, fontWeight: 800, margin: "0 0 4px" }}>{tool.title}</h3>
            <p style={{ color: tool.color, fontSize: 12, fontWeight: 700, margin: "0 0 14px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{tool.sub}</p>
            <p style={{ color: G.textSecondary, fontSize: 13, lineHeight: 1.6, margin: "0 0 18px" }}>{tool.desc}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {tool.features.map(f => <span key={f} style={{ background: `${tool.color}15`, color: tool.color, border: `1px solid ${tool.color}30`, borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>{f}</span>)}
            </div>
            <div style={{ marginTop: 20, padding: "14px", background: "rgba(255,255,255,0.03)", borderRadius: 10, textAlign: "center" }}>
              <p style={{ color: G.textMuted, fontSize: 13, margin: 0 }}>🚧 Implementation guide available — ask me to build this!</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  </div>
);

// ── PROFILE PAGE ───────────────────────────────────────────────────────────
const ProfilePage = ({ user, properties, requests, onUpdateUser }) => {
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ name: user.name, phone: user.phone || "", area: user.area || "", bio: user.bio || "" });
  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  const myListings = properties.filter(p => p.sellerId === user.id);
  const myRequests = requests.filter(r => r.buyerId === user.id || r.sellerId === user.id);
  const approved = myRequests.filter(r => r.status === "approved").length;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 24, alignItems: "start" }}>
        <div>
          <Card style={{ padding: "32px 24px", textAlign: "center", marginBottom: 16 }}>
            <div style={{ width: 88, height: 88, borderRadius: "50%", background: `linear-gradient(135deg, ${G.accent}, ${G.accentDark})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, fontWeight: 700, color: "#fff", margin: "0 auto 16px" }}>{user.avatar || user.name?.slice(0,2).toUpperCase()}</div>
            {!editMode ? <>
              <h2 style={{ color: G.textPrimary, fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>{user.name}</h2>
              <Badge color={user.role === "admin" ? G.gold : G.green}>{user.role === "admin" ? "Admin" : "Member"}</Badge>
              <p style={{ color: G.textSecondary, fontSize: 14, margin: "12px 0 0", lineHeight: 1.6 }}>{user.bio || "No bio yet."}</p>
            </> : <>
              <Input label="Full Name" value={form.name} onChange={set("name")} />
              <Textarea label="Bio" value={form.bio} onChange={set("bio")} rows={3} />
            </>}
            <div style={{ borderTop: `1px solid ${G.border}`, marginTop: 20, paddingTop: 20 }}>
              {!editMode ? <>
                {[
                  ["📞", user.phone || "Not set"],
                  ["📍", `${user.area ? user.area + ', ' : ''}Bangalore`],
                  ["✉", user.email || "Not set"]
                ].map(([ic, val]) => (
                  <div key={val} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, textAlign: "left" }}>
                    <span style={{ fontSize: 16 }}>{ic}</span>
                    <span style={{ color: G.textSecondary, fontSize: 14 }}>{val}</span>
                  </div>
                ))}
                <Btn onClick={() => setEditMode(true)} variant="secondary" size="sm" style={{ width: "100%", justifyContent: "center", marginTop: 8 }}>✏ Edit Profile</Btn>
              </> : <>
                <Input label="Phone" value={form.phone} onChange={set("phone")} />
                <Select label="Area in Bangalore" value={form.area} onChange={set("area")} options={[
                  { value: "Koramangala", label: "Koramangala" },
                  { value: "Indiranagar", label: "Indiranagar" },
                  { value: "Whitefield", label: "Whitefield" },
                  { value: "Jayanagar", label: "Jayanagar" },
                  { value: "HSR Layout", label: "HSR Layout" },
                  { value: "Malleshwaram", label: "Malleshwaram" },
                  { value: "Electronic City", label: "Electronic City" },
                  { value: "Sarjapur Road", label: "Sarjapur Road" },
                  { value: "Yelahanka", label: "Yelahanka" }
                ]} />
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn onClick={() => { onUpdateUser(form); setEditMode(false); }} size="sm" style={{ flex: 1, justifyContent: "center" }}>Save</Btn>
                  <Btn onClick={() => setEditMode(false)} variant="secondary" size="sm" style={{ flex: 1, justifyContent: "center" }}>Cancel</Btn>
                </div>
              </>}
            </div>
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[["Listings", myListings.length, G.accent], ["Requests", myRequests.length, G.gold], ["Approved", approved, G.green], ["Status", user.role === "admin" ? "Admin" : "Member", G.textSecondary]].map(([label, val, color]) => (
              <Card key={label} style={{ padding: "16px", textAlign: "center" }}>
                <p style={{ color, fontWeight: 800, fontSize: 22, margin: "0 0 4px" }}>{val}</p>
                <p style={{ color: G.textMuted, fontSize: 11, margin: 0, textTransform: "uppercase", fontWeight: 600 }}>{label}</p>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h3 style={{ color: G.textPrimary, fontSize: 20, fontWeight: 800, margin: "0 0 16px" }}>My Listings</h3>
          {myListings.length === 0 ? (
            <Card style={{ padding: "40px", textAlign: "center" }}>
              <p style={{ color: G.textMuted, margin: 0 }}>You haven't listed any properties yet.</p>
            </Card>
          ) : myListings.map(p => (
            <Card key={p.id} style={{ padding: "16px 20px", marginBottom: 12, display: "flex", gap: 16, alignItems: "center" }}>
              <img src={p.images?.[0]} alt={p.title} style={{ width: 72, height: 72, borderRadius: 10, objectFit: "cover" }} />
              <div style={{ flex: 1 }}>
                <p style={{ color: G.textPrimary, fontWeight: 700, margin: "0 0 4px" }}>{p.title}</p>
                <p style={{ color: G.textSecondary, fontSize: 13, margin: "0 0 6px" }}>📍 {p.location}</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <Badge color={p.listingType === "sale" ? G.accent : G.green}>{p.listingType}</Badge>
                  <Badge color={p.status === "available" ? G.green : G.red}>{p.status}</Badge>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ color: G.accent, fontWeight: 800, fontSize: 18, margin: "0 0 4px" }}>{fmt(p.price)}</p>
                <p style={{ color: G.textMuted, fontSize: 12, margin: 0 }}>{p.area?.toLocaleString()} sqft</p>
              </div>
            </Card>
          ))}

          <h3 style={{ color: G.textPrimary, fontSize: 20, fontWeight: 800, margin: "24px 0 16px" }}>Recent Activity</h3>
          {myRequests.length === 0 ? (
            <Card style={{ padding: "40px", textAlign: "center" }}><p style={{ color: G.textMuted, margin: 0 }}>No request activity yet.</p></Card>
          ) : myRequests.slice(0, 3).map(r => (
            <Card key={r.id} style={{ padding: "16px 20px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ color: G.textPrimary, fontWeight: 600, margin: "0 0 4px", fontSize: 14 }}>{r.propertyTitle}</p>
                <p style={{ color: G.textSecondary, fontSize: 12, margin: 0 }}>{r.buyerId === user.id ? "You offered" : `${r.buyerName} offered`} {fmt(r.offeredPrice)}</p>
              </div>
              <Badge color={{ pending: G.gold, approved: G.green, rejected: G.red }[r.status]}>{r.status}</Badge>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── APP ROOT ───────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("browse");
  const [properties, setProperties] = useState([]);
  const [requests, setRequests] = useState([]);

  useEffect(() => { fetchProperties(); }, []);
  useEffect(() => { if (user?.token) fetchRequests(); }, [user]);

  const fetchProperties = async () => {
    try {
      const res = await fetch(`${API_BASE}/properties`);
      if (!res.ok) throw new Error("Failed to load properties");
      const data = await res.json();
      const loaded = data.map(p => ({
        id: p._id,
        title: p.title,
        type: p.type,
        listingType: p.listingType,
        price: p.price,
        location: p.location,
        area: p.area,
        bhk: p.bhk,
        address: p.address,
        contact: p.contact,
        description: p.description,
        sellerId: p.seller?._id,
        sellerName: p.seller?.name || "",
        images: p.images || [],
        status: p.status,
        amenities: p.amenities || []
      }));
      setProperties(loaded);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await fetch(`${API_BASE}/requests`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      if (!res.ok) throw new Error("Failed to load requests");
      const data = await res.json();
      setRequests(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSetUser = (userData) => {
    setUser(userData);
  };

  const handleUserUpdate = (updates) => {
    setUser(prev => ({ ...prev, ...updates }));
  };

  const handleLogout = () => {
    setUser(null);
    setPage("browse");
  };

  const handleList = (prop) => { setProperties(p => [prop, ...p]); setPage("browse"); };

  const handleBuyRequest = async (req) => {
    try {
      const res = await fetch(`${API_BASE}/requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify(req)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || "Unable to send request");
      setRequests(r => [...r, data]);
      return data;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const handleUpdateRequest = async (id, status) => {
    try {
      const res = await fetch(`${API_BASE}/requests/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || "Unable to update request");

      setRequests(rs => rs.map(r => {
        if (r.id === data.id) return { ...r, status: data.status };
        if (data.propertyId && data.status === 'approved' && r.propertyId === data.propertyId && r.id !== data.id && r.status === 'pending') {
          return { ...r, status: 'rejected' };
        }
        return r;
      }));
      if (data.propertyId && data.propertyStatus) {
        setProperties(ps => ps.map(p => p.id === data.propertyId ? { ...p, status: data.propertyStatus } : p));
      }
      return data;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  if (!user) return <AuthPage onLogin={handleSetUser} />;

  const pages = {
    browse: <BrowsePage properties={properties} user={user} onBuyRequest={handleBuyRequest} />,
    list: <ListPage user={user} onList={handleList} />,
    requests: <RequestsPage requests={requests} user={user} properties={properties} onUpdateRequest={handleUpdateRequest} />,
    "ai-tools": <AIToolsPage setPage={setPage} />,
    profile: <ProfilePage user={user} properties={properties} requests={requests} onUpdateUser={handleUserUpdate} />,
  };

  return (
    <div style={{ minHeight: "100vh", background: G.bg, fontFamily: "'DM Sans', 'Segoe UI', sans-serif", color: G.textPrimary }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
      <Nav user={user} page={page} setPage={setPage} onLogout={() => { setUser(null); setPage("browse"); }} />
      <main>{pages[page] || pages.browse}</main>
    </div>
  );
}
