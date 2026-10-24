/* Kids Games shared library: canvas helpers, sound, voice, the family characters and both girls' outfits.
   Made by Gary for Bell and La La. Everything is drawn in code, no image files.
   Every family can set their own names and looks on the Kids Games page; they are kept only in that browser. */
"use strict";
// older iPads (Safari before 16) can't draw rounded rectangles, so add a simple version of it
if (window.CanvasRenderingContext2D && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    let [tl, tr, br, bl] = Array.isArray(r) ? (r.length === 4 ? r : r.length === 2 ? [r[0], r[1], r[0], r[1]] : [r[0], r[0], r[0], r[0]]) : [r || 0, r || 0, r || 0, r || 0];
    const m = Math.min(Math.abs(w), Math.abs(h)) / 2; [tl, tr, br, bl] = [tl, tr, br, bl].map(v => Math.min(Math.max(+v || 0, 0), m));
    this.moveTo(x + tl, y); this.lineTo(x + w - tr, y); this.arcTo(x + w, y, x + w, y + tr, tr); this.lineTo(x + w, y + h - br); this.arcTo(x + w, y + h, x + w - br, y + h, br);
    this.lineTo(x + bl, y + h); this.arcTo(x, y + h, x, y + h - bl, bl); this.lineTo(x, y + tl); this.arcTo(x, y, x + tl, y, tl); this.closePath();
  };
}
const KG = (() => {
  const W = 1280, H = 720, INK = "#2d2340";
  let cv, ctx, scale = 1, offX = 0, offY = 0, dpr = 1;

  // ---------- stage ----------
  function stage(canvas) {
    cv = canvas; ctx = cv.getContext("2d");
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = innerWidth, h = innerHeight;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cv.style.width = w + "px"; cv.style.height = h + "px";
      scale = Math.min(w / W, h / H); offX = (w - W * scale) / 2; offY = (h - H * scale) / 2;
    };
    addEventListener("resize", resize); resize();
    return ctx;
  }
  // fill the whole screen (letterbox) then switch to game coordinates
  function begin(top, bottom, horizon) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = bottom; ctx.fillRect(0, 0, cv.width, cv.height);
    if (top) { ctx.fillStyle = top; ctx.fillRect(0, 0, cv.width, offY + horizon * scale); }
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * offX, dpr * offY);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip(); ctx.lineJoin = "round"; ctx.lineCap = "round";
  }
  function end() { ctx.restore(); }
  function useCtx(c) { ctx = c; ctx.lineJoin = "round"; ctx.lineCap = "round"; }
  const toWorld = e => ({ x: (e.clientX - offX) / scale, y: (e.clientY - offY) / scale });

  // ---------- maths helpers ----------
  const rand = (a, b) => a + Math.random() * (b - a);
  const randInt = (a, b) => Math.floor(rand(a, b + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const f = v => clamp(Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt), 0, 255);
    return "#" + ((1 << 24) | (f(r) << 16) | (f(g) << 8) | f(b)).toString(16).slice(1);
  }

  // ---------- drawing helpers ----------
  function stroke(lw) { if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = INK; ctx.stroke(); } }
  function circ(x, y, r, fill, lw = 3) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); if (fill) { ctx.fillStyle = fill; ctx.fill(); } stroke(lw); }
  function ell(x, y, rx, ry, fill, lw = 3, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); if (fill) { ctx.fillStyle = fill; ctx.fill(); } stroke(lw); }
  function rr(x, y, w, h, r, fill, lw = 3) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); if (fill) { ctx.fillStyle = fill; ctx.fill(); } stroke(lw); }
  function poly(pts, fill, lw = 3) { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); } stroke(lw); }
  function line(x1, y1, x2, y2, col = INK, lw = 3) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = "round"; ctx.stroke(); }
  function cluster(cs, fill, lw = 3) {
    ctx.strokeStyle = INK; ctx.lineWidth = lw * 2;
    cs.forEach(c => { ctx.beginPath(); ctx.arc(c[0], c[1], c[2], 0, Math.PI * 2); ctx.stroke(); });
    ctx.fillStyle = fill; cs.forEach(c => { ctx.beginPath(); ctx.arc(c[0], c[1], c[2], 0, Math.PI * 2); ctx.fill(); });
  }
  function txt(s, x, y, size, col = INK, align = "left", weight = 700, strokeW = 0) {
    ctx.font = `${weight} ${size}px Fredoka, "Trebuchet MS", sans-serif`; ctx.textAlign = align; ctx.textBaseline = "alphabetic";
    if (strokeW) { ctx.lineJoin = "round"; ctx.lineWidth = strokeW; ctx.strokeStyle = INK; ctx.strokeText(s, x, y); }
    ctx.fillStyle = col; ctx.fillText(s, x, y);
  }
  function wrap(s, maxW, size, weight = 600) {
    ctx.font = `${weight} ${size}px Fredoka, sans-serif`; const words = s.split(" "), lines = []; let cur = "";
    words.forEach(w => { const t = cur ? cur + " " + w : w; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; });
    if (cur) lines.push(cur); return lines;
  }
  function star4(x, y, r, col) { poly([[x, y - r], [x + r * .3, y - r * .3], [x + r, y], [x + r * .3, y + r * .3], [x, y + r], [x - r * .3, y + r * .3], [x - r, y], [x - r * .3, y - r * .3]], col, 1.5); }
  function star5(x, y, r, col, lw = 3) { const pts = []; for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 - Math.PI / 2, rr2 = i % 2 ? r * .45 : r; pts.push([x + Math.cos(a) * rr2, y + Math.sin(a) * rr2]); } poly(pts, col, lw); }
  function bubble(text, x, y, size = 22) {
    ctx.font = `700 ${size}px Fredoka, sans-serif`; const w = ctx.measureText(text).width + 30; x = clamp(x, w / 2 + 6, W - w / 2 - 6);
    rr(x - w / 2, y - size - 12, w, size + 20, 20, "#fff", 3); poly([[x - 8, y + 6], [x + 8, y + 6], [x, y + 18]], "#fff", 0); line(x - 8, y + 8, x, y + 18, INK, 3); line(x + 8, y + 8, x, y + 18, INK, 3);
    txt(text, x, y - 6, size, INK, "center");
  }
  function nameTag(name, col, x, y) {
    ctx.font = "700 18px Fredoka, sans-serif"; const w = ctx.measureText(name).width + 22;
    rr(x - w / 2, y - 24, w, 28, 14, col, 2.5); poly([[x - 6, y + 3], [x + 6, y + 3], [x, y + 10]], col, 0); txt(name, x, y - 4, 18, "#fff", "center");
  }

  // ---------- sound & voice ----------
  let muted = false, ac = null, voice = null;
  try { muted = localStorage.getItem("kg_muted") === "1"; } catch (e) {}
  function unlockAudio() { try { if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === "suspended") ac.resume(); } catch (e) {} }
  function tone(f, t0, d, type = "triangle", vol = .16) {
    if (!ac || muted) return;
    const o = ac.createOscillator(), g = ac.createGain(), st = ac.currentTime + t0;
    o.type = type; o.frequency.value = f; g.gain.setValueAtTime(0, st); g.gain.linearRampToValueAtTime(vol, st + .02); g.gain.exponentialRampToValueAtTime(.001, st + d);
    o.connect(g).connect(ac.destination); o.start(st); o.stop(st + d + .05);
  }
  const sfx = {
    pick() { [523, 659, 784].forEach((f, i) => tone(f, i * .07, .25)); },
    boop() { tone(330, 0, .18, "sine", .13); tone(262, .12, .25, "sine", .13); },
    done() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * .1, .4)); },
    win() { [392, 523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, i * .12, .45, "square", .06)); },
    giggle() { [880, 990, 880, 990, 1100].forEach((f, i) => tone(f, i * .08, .1, "sine", .07)); },
    ping(n = 0) { tone(660 + n * 40, 0, .12, "sine", .09); },
    splash() { [300, 220, 180].forEach((f, i) => tone(f, i * .05, .2, "sine", .08)); }
  };
  function pickVoice() {
    if (!("speechSynthesis" in window)) return;
    const vs = speechSynthesis.getVoices();
    voice = vs.find(v => /en-GB/i.test(v.lang) && /Libby|Sonia|Hazel|Serena|Kate|Martha|Maisie|female/i.test(v.name)) || vs.find(v => /en-GB/i.test(v.lang)) || vs.find(v => /^en/i.test(v.lang)) || null;
  }
  if ("speechSynthesis" in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
  function speak(text, pitch = 1.15, interrupt = true, rate = .95) {
    if (muted || !("speechSynthesis" in window)) return;
    if (interrupt) speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/\bLa La\b/g, "Lala")); if (voice) u.voice = voice; u.lang = "en-GB"; u.pitch = pitch; u.rate = rate;
    speechSynthesis.speak(u);
  }
  function setMuted(m) { muted = m; try { localStorage.setItem("kg_muted", m ? "1" : "0"); } catch (e) {} if (m && "speechSynthesis" in window) speechSynthesis.cancel(); }

  // ---------- page chrome: mute + full screen buttons ----------
  function chrome() {
    const mb = document.getElementById("mute"), fb = document.getElementById("fs");
    const label = () => { if (mb) mb.textContent = muted ? "Sound off" : "Sound on"; };
    label();
    if (mb) mb.onclick = e => { setMuted(!muted); label(); e.currentTarget.blur(); };
    if (fb) fb.onclick = e => { e.currentTarget.blur(); const d = document.documentElement; if (!document.fullscreenElement) { d.requestFullscreen && d.requestFullscreen().catch(() => {}); } else document.exitFullscreen(); };
    addEventListener("keydown", e => { if (e.code === "KeyM" && !e.target.closest("input")) { setMuted(!muted); label(); } unlockAudio(); });
    addEventListener("pointerdown", unlockAudio);
  }
  const track = (name, params) => { try { if (window.gtag) gtag("event", name, params || {}); } catch (e) {} };

  // ---------- Bell's outfits (her choice, remembered on this device) ----------
  const OUTFITS = {
    princess: { label: "Princess", top: "#ff9ccf", trim: "#ffd23f", bottom: "gown", leg: "#ffdcc4", shoe: "#ffd23f", hat: "tiara", puff: true },
    speedy: { label: "Speedy", top: "#1fa2ff", trim: "#ffffff", bottom: "leggings", leg: "#2b3a67", shoe: "#ffffff", shoeTrim: "#18c3b0", hat: "band", bolt: true },
    explorer: { label: "Explorer", top: "#ff8a3d", trim: "#7a4a22", bottom: "shorts", leg: "#ffdcc4", shorts: "#3e8e5a", shoe: "#7a4a22", hat: "explorer", pack: true },
    lala: { label: "Teddy Bear", top: "#ff9ccc", trim: "#ffffff", bottom: "dress", leg: "#ffdcc4", shoe: "#db2777", hat: "ears" },
    fairy: { label: "Fairy", top: "#c9a8ff", trim: "#ffffff", bottom: "dress", leg: "#ffdcc4", shoe: "#a855f7", hat: "flowers", wings: true },
    dino: { label: "Dino", top: "#4cc76a", trim: "#ffd23f", bottom: "leggings", leg: "#2f8f4e", shoe: "#ff8a3d", hat: "dino" },
    hero: { label: "Superhero", top: "#ef4444", trim: "#ffd23f", bottom: "leggings", leg: "#2b4fd6", shoe: "#ffd23f", cape: "#2b4fd6", emblem: true, hat: "mask" },
    footie: { label: "Football kit", top: "#2563eb", trim: "#ffffff", bottom: "shorts", leg: "#ffdcc4", shorts: "#ffffff", shoe: "#1f2937", number: "9", hat: "none" }
  };
  // each child picks their own outfit, remembered on this device
  // every child can wear every outfit
  const ALL_OUTFITS = ["princess", "speedy", "explorer", "hero", "footie", "lala", "fairy", "dino"];
  const WARDROBE = { bell: ALL_OUTFITS, lala: ALL_OUTFITS };
  const DEFAULT_OUTFIT = { bell: "princess", lala: "lala" };
  function getOutfit(who = "bell") { try { const o = localStorage.getItem("kg_" + who + "_outfit"); if (OUTFITS[o] && WARDROBE[who].includes(o)) return o; } catch (e) {} return DEFAULT_OUTFIT[who]; }
  function setOutfit(o, who = "bell") { try { localStorage.setItem("kg_" + who + "_outfit", o); } catch (e) {} }

  // ---------- the family: names and looks, chosen on the Kids Games page, kept only on this device ----------
  const SKINS = ["#fde4d2", "#ffdcc4", "#f2c29c", "#dda57a", "#c18758", "#9c6640", "#7a4c2e", "#55331f"];
  const HAIRS = { blonde: "#f7c844", honey: "#e3a94a", ginger: "#d9772e", auburn: "#a4462b", lightbrown: "#b07a45", ashbrown: "#7d6a55", brown: "#6b4426", darkbrown: "#3e2a1e", black: "#262022", grey: "#b9b6b2", white: "#efebe5" };
  const HAIR_LABELS = { blonde: "Blonde", honey: "Honey", ginger: "Ginger", auburn: "Auburn", lightbrown: "Light brown", ashbrown: "Ash brown", brown: "Brown", darkbrown: "Dark brown", black: "Black", grey: "Grey", white: "White" };
  const EYES = { blue: "#3b82f6", bluegrey: "#6f9cc0", green: "#2fa36b", hazel: "#9a7a3a", brown: "#6b4426", darkbrown: "#3a2418", grey: "#7d8a99" };
  const EYE_LABELS = { blue: "Blue", bluegrey: "Blue-grey", green: "Green", hazel: "Hazel", brown: "Brown", darkbrown: "Dark brown", grey: "Grey" };
  const KID_STYLES = { curly: "Long curls", straight: "Long straight", short: "Short", puffs: "Puffs", braids: "Braids", afro: "Afro" };
  const ADULT_STYLES = { short: "Short", long: "Long straight", curly: "Curly", bun: "Bun", afro: "Afro", bald: "Bald" };
  const BEARDS = { none: "None", stubble: "Stubble", beard: "Beard" };
  const KID_BODIES = { girl: "Girl", boy: "Boy" }, ADULT_BODIES = { woman: "Woman", man: "Man" };
  const DEFAULT_FAMILY = {
    bell: { name: "Bell", body: "girl", skin: "#ffdcc4", hair: "blonde", style: "curly", eyes: "blue", glasses: false },
    lala: { name: "La La", body: "girl", skin: "#ffdcc4", hair: "blonde", style: "curly", eyes: "blue", glasses: false },
    adult1: { name: "Daddy", body: "man", skin: "#ffdcc4", hair: "ashbrown", style: "short", eyes: "bluegrey", beard: "stubble", cap: true, capLetter: "G", glasses: false },
    adult2: { name: "Mummy", body: "woman", skin: "#ffdcc4", hair: "blonde", style: "long", eyes: "blue", beard: "none", cap: false, capLetter: "", glasses: false }
  };
  const clean = (v, max) => String(v == null ? "" : v).replace(/[<>]/g, "").trim().slice(0, max);
  function family() {
    let f = {}; try { f = JSON.parse(localStorage.getItem("kg_family") || "{}") || {}; } catch (e) {}
    const out = {};
    Object.keys(DEFAULT_FAMILY).forEach(k => {
      const d = DEFAULT_FAMILY[k], v = Object.assign({}, d, f[k] || {});
      v.name = clean(v.name, 14) || d.name; v.capLetter = clean(v.capLetter, 1).toUpperCase();
      if (!SKINS.includes(v.skin) && !/^#[0-9a-f]{6}$/i.test(v.skin)) v.skin = d.skin;
      if (!HAIRS[v.hair]) v.hair = d.hair; if (!EYES[v.eyes]) v.eyes = d.eyes;
      if (k === "bell" || k === "lala") { if (!KID_STYLES[v.style]) v.style = d.style; if (!KID_BODIES[v.body]) v.body = d.body; }
      else { if (!ADULT_STYLES[v.style]) v.style = d.style; if (!BEARDS[v.beard]) v.beard = d.beard; if (!ADULT_BODIES[v.body]) v.body = d.body; }
      out[k] = v;
    });
    return out;
  }
  function saveFamily(f) { try { localStorage.setItem("kg_family", JSON.stringify(f)); } catch (e) {} }
  function resetFamily() { try { localStorage.removeItem("kg_family"); } catch (e) {} }
  const isCustom = () => { try { return !!localStorage.getItem("kg_family"); } catch (e) { return false; } };
  const name = id => family()[id].name;
  // swap every element marked data-name="bell|lala|adult1|adult2" for the family's own names
  function applyNames(root = document) { const f = family(); root.querySelectorAll("[data-name]").forEach(el => { const k = el.dataset.name; if (f[k]) el.textContent = f[k].name + (el.dataset.suffix || ""); }); }

  const PLAYERS = {
    bell: { id: "bell", get name() { return name("bell"); }, col: "#7c3aed", s: 1.08, hair: 1 },
    lala: { id: "lala", get name() { return name("lala"); }, col: "#db2777", s: .9, hair: .82 }
  };
  function mkPlayer(id, extra) {
    const f = family()[id];
    const p = Object.assign({ x: 640, y: 600, face: 1, walk: 0, moving: false, target: null }, { id, col: PLAYERS[id].col, s: PLAYERS[id].s, hair: PLAYERS[id].hair }, extra || {});
    p.name = f.name; p.look = f; p.outfit = getOutfit(id); return p;
  }
  const hairSet = key => { const c = HAIRS[key] || HAIRS.blonde; return { base: c, dark: shade(c, -.15), light: shade(c, .4) }; };

  // ---------- the girls ----------
  function curls(cx, top, bottom, side, r, hc) {
    for (let y = top, i = 0; y <= bottom; y += r * 1.25, i++) {
      const x = cx + side * (Math.sin(i * 1.7) * 2.5);
      circ(x, y, r, i % 2 ? hc.base : hc.dark, 2);
      ctx.beginPath(); ctx.arc(x + side * 1.5, y, r * .45, 0.4, 4.2); ctx.strokeStyle = hc.light; ctx.lineWidth = 2; ctx.stroke();
    }
  }
  function kidHairBack(lk, hl, hc) {
    const st = lk.style;
    if (st === "curly") { curls(-21, -92, -92 + hl + 30, -1, 10, hc); curls(21, -92, -92 + hl + 30, 1, 10, hc); cluster([[-14, -96, 19], [14, -96, 19], [0, -104, 21]], hc.base, 2); }
    else if (st === "straight") { rr(-26, -106, 52, 46 + hl, [24, 24, 10, 10], hc.base, 2.5); [-17, -9, 9, 17].forEach(dx => line(dx, -80, dx, -66 + hl, hc.dark, 2)); }
    else if (st === "short") { rr(-26, -106, 52, 32, [24, 24, 10, 10], hc.base, 2.5); }
    else if (st === "puffs") { cluster([[-27, -104, 15], [27, -104, 15]], hc.base, 2.5); [[-27, -104], [27, -104]].forEach(([x, y]) => { circ(x - 4, y - 3, 3, hc.light, 0); circ(x + 4, y + 3, 2.5, hc.dark, 0); }); cluster([[0, -94, 25]], hc.base, 2.5); }
    else if (st === "afro") { cluster([[0, -92, 34], [-22, -76, 20], [22, -76, 20]], hc.base, 2.5); for (let i = 0; i < 14; i++) { const a = i * 2.39, r = 8 + (i * 5) % 24; circ(Math.cos(a) * r, -96 + Math.sin(a) * r * .8, 2, i % 2 ? hc.light : hc.dark, 0); } }
    else if (st === "braids") { cluster([[0, -94, 25]], hc.base, 2.5); [-1, 1].forEach(sd => { for (let i = 0; i < 6; i++) ell(sd * 24, -82 + i * 9 + hl * .3, 6, 5.5, i % 2 ? hc.base : hc.dark, 2); circ(sd * 24, -82 + 6 * 9 + hl * .3, 3.5, "#ff7ab6", 1.5); }); }
  }
  function kidHairFront(lk, hc) {
    const st = lk.style;
    if (st === "curly") { cluster([[-14, -96, 9], [-4, -100, 10], [7, -99, 10], [16, -93, 8]], hc.base, 2); [[-14, -96], [-4, -100], [7, -99]].forEach(([cx, cy]) => { ctx.beginPath(); ctx.arc(cx, cy + 1, 4, .3, 4); ctx.strokeStyle = hc.light; ctx.lineWidth = 2; ctx.stroke(); }); }
    else if (st === "afro" || st === "puffs") { ctx.beginPath(); ctx.arc(0, -84, 23, Math.PI * 1.08, Math.PI * 1.92); ctx.quadraticCurveTo(0, -96, -21, -90); ctx.closePath(); ctx.fillStyle = hc.base; ctx.fill(); stroke(2); }
    else { ctx.beginPath(); ctx.moveTo(-23, -84); ctx.quadraticCurveTo(-22, -106, 2, -105); ctx.quadraticCurveTo(24, -104, 23, -82); ctx.quadraticCurveTo(10, -96, -6, -92); ctx.quadraticCurveTo(-16, -90, -23, -84); ctx.closePath(); ctx.fillStyle = hc.base; ctx.fill(); stroke(2); line(-6, -100, 6, -94, hc.light, 2); }
  }
  function glasses(xs, y, r) { xs.forEach(x => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.lineWidth = 2.2; ctx.strokeStyle = INK; ctx.stroke(); }); line(xs[0] + r, y, xs[1] - r, y, INK, 2); }
  function drawKid(p, x, y, sc = 1, opt = {}) {
    const o = OUTFITS[p.outfit] || OUTFITS.lala, lk = p.look || family()[p.id] || DEFAULT_FAMILY.bell, SKIN = lk.skin, hc = hairSet(lk.hair);
    const s = sc * p.s, wv = p.moving ? Math.sin(p.walk) : 0, bob = p.moving ? Math.abs(Math.sin(p.walk)) * 3 : 0, jump = opt.jump || 0, f = p.face || 1;
    ell(x, y, 22 * s, 7 * s, "rgba(0,0,0,.16)", 0);
    ctx.save(); ctx.translate(x, y - bob - jump); ctx.scale(s, s);
    const L = p.id === "bell" ? 14 : 0;   // the older child is taller: longer legs, everything above them lifts up
    ctx.translate(0, -L);
    if (o.pack) rr(-17 * f - 9, -58, 18, 26, 6, "#7a4a22", 2.5);
    if (o.cape) { const fl = Math.sin(performance.now() / 200) * 3; poly([[-12, -58], [12, -58], [20 + fl, -8], [-20 + fl, -8]], o.cape, 2.5); }
    if (o.wings) { const fl = 1 + Math.sin(performance.now() / 160) * .08; ell(-24 * fl, -62, 18, 11, "rgba(205,235,255,.85)", 2.5, -.5); ell(24 * fl, -62, 18, 11, "rgba(205,235,255,.85)", 2.5, .5); ell(-19 * fl, -44, 11, 7, "rgba(255,214,240,.85)", 2.5, .4); ell(19 * fl, -44, 11, 7, "rgba(255,214,240,.85)", 2.5, -.4); }
    kidHairBack(lk, 34 * p.hair, hc);
    // legs and shoes (both shoes always match)
    const legCol = o.bottom === "leggings" ? o.leg : SKIN;
    if (o.bottom !== "gown") { rr(-10 + wv * 3, -24, 8, 22 + L, 4, legCol, 2.5); rr(2 - wv * 3, -24, 8, 22 + L, 4, legCol, 2.5); }
    ell(-6 + wv * 3, -2 + L, 7.5, 4.5, o.shoe, 2.5); ell(6 - wv * 3, -2 + L, 7.5, 4.5, o.shoe, 2.5);
    if (o.shoeTrim) { line(-10 + wv * 3, -2 + L, -2 + wv * 3, -2 + L, o.shoeTrim, 2.5); line(2 - wv * 3, -2 + L, 10 - wv * 3, -2 + L, o.shoeTrim, 2.5); }
    if (o.hat === "dino") { poly([[-8 * f, -26], [-30 * f, -12], [-10 * f, -16]], o.top, 2.5); }
    // arms
    const up = opt.wave ? 26 : 0, sleeve = o.bottom === "dress" || o.bottom === "gown" ? SKIN : o.top;
    line(-13, -52, -22 + (opt.wave ? -7 : wv * 4), -34 - up, INK, 8); line(-13, -52, -22 + (opt.wave ? -7 : wv * 4), -34 - up, sleeve, 4);
    line(13, -52, 22 - wv * 4, -34 - up, INK, 8); line(13, -52, 22 - wv * 4, -34 - up, sleeve, 4);
    circ(-22 + (opt.wave ? -7 : wv * 4), -34 - up, 3, SKIN, 1.5); circ(22 - wv * 4, -34 - up, 3, SKIN, 1.5);
    // body
    if (o.bottom === "gown") { poly([[-12, -58], [12, -58], [24 + L * .3, -6 + L], [-24 - L * .3, -6 + L]], o.top); line(-22 - L * .25, -12 + L, 22 + L * .25, -12 + L, o.trim, 4); line(-13, -40, 13, -40, o.trim, 3); }
    else if (o.bottom === "dress") { poly([[-12, -58], [12, -58], [20, -20], [-20, -20]], o.top); line(-17, -26, 17, -26, shade(o.top, -.2), 3); circ(0, -46, 3, "#fff", 1.5); }
    else {
      if (o.bottom === "shorts") { rr(-13, -34, 26, 14, 4, o.shorts, 2.5); }
      rr(-14, -60, 28, 30, 8, o.top);
      if (o.bolt) poly([[2, -55], [-6, -44], [0, -44], [-4, -34], [6, -47], [0, -47]], "#ffd23f", 1.5);
      else if (o.emblem) { circ(0, -46, 8, "#ffd23f", 2); star5(0, -46, 6, "#ef4444", 1.2); }
      else if (o.number) { line(-13, -50, 13, -50, o.trim, 3); txt(o.number, 0, -34, 14, "#fff", "center", 700); }
      else line(0, -58, 0, -32, o.trim, 2.5);
      if (o.pack) { line(-9, -59, -9, -36, "#7a4a22", 3); line(9, -59, 9, -36, "#7a4a22", 3); }
    }
    if (o.puff) { circ(-14, -55, 6, o.top, 2.5); circ(14, -55, 6, o.top, 2.5); }
    // head and face
    circ(0, -80, 23, SKIN);
    kidHairFront(lk, hc);
    const ex = f * 2, eye = EYES[lk.eyes] || EYES.blue, dark = shade(SKIN, -.3) === SKIN ? INK : INK;
    [-8, 8].forEach(dx => { ell(dx + ex, -79, 5.5, 6.5, "#fff", 2); circ(dx + ex + f, -78.5, 4.2, eye, 0); circ(dx + ex + f, -78.5, 2, "#1d2a55", 0); circ(dx + ex + f - 1.4, -80.5, 1.3, "#fff", 0); if (lk.body !== "boy") line(dx + ex - 4, -85, dx + ex - 6, -87.5, dark, 1.5); });
    if (lk.glasses) glasses([-8 + ex, 8 + ex], -79, 8);
    ell(-13 + ex, -71, 4.5, 3, "rgba(255,120,140,.45)", 0); ell(13 + ex, -71, 4.5, 3, "rgba(255,120,140,.45)", 0);
    ctx.beginPath(); ctx.arc(ex, -71, 6, .2, Math.PI - .2); ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.stroke();
    // headwear
    if (o.hat === "ears") { line(-17, -100, 17, -100, "#9a5b2c", 4); circ(-17, -106, 8, "#a8662f", 2.5); circ(17, -106, 8, "#a8662f", 2.5); circ(-17, -106, 3.5, "#ffb3cf", 0); circ(17, -106, 3.5, "#ffb3cf", 0); }
    else if (o.hat === "tiara") { poly([[-14, -104], [-10, -118], [-4, -108], [0, -122], [4, -108], [10, -118], [14, -104]], "#ffd23f", 2.5); circ(0, -112, 3, "#ff4f9a", 1.5); }
    else if (o.hat === "flowers") { [[-16, -104, "#ff7ab6"], [-6, -110, "#ffd23f"], [6, -110, "#7cc6ff"], [16, -104, "#ff7ab6"]].forEach(([fx, fy, c]) => { for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; circ(fx + Math.cos(a) * 3.5, fy + Math.sin(a) * 3.5, 3, c, 1.2); } circ(fx, fy, 2.2, "#fff", 0); }); }
    else if (o.hat === "dino") { ctx.beginPath(); ctx.ellipse(0, -96, 27, 20, 0, Math.PI, 0); ctx.closePath(); ctx.fillStyle = o.top; ctx.fill(); stroke(2.5); [-16, -6, 5, 15].forEach(dx => poly([[dx - 6, -110 + Math.abs(dx) * .35], [dx + 6, -110 + Math.abs(dx) * .35], [dx, -122 + Math.abs(dx) * .35]], "#ffd23f", 2)); circ(-12, -100, 2.2, "#fff", 0); circ(12, -100, 2.2, "#fff", 0); }
    else if (o.hat === "mask") { const ex2 = f * 2; rr(-20 + ex2, -86, 40, 13, 6, "rgba(43,79,214,.92)", 2); [-8, 8].forEach(dx => { ell(dx + ex2, -79, 5.5, 6.5, "#fff", 0); circ(dx + ex2 + f, -78.5, 3.4, EYES[lk.eyes] || EYES.blue, 0); circ(dx + ex2 + f, -78.5, 1.6, "#1d2a55", 0); }); }
    else if (o.hat === "band") { rr(-24, -100, 48, 8, 4, "#ff4d6d", 2.5); }
    else if (o.hat === "explorer") { ell(0, -101, 32, 7, "#c9a46a", 2.5); ctx.beginPath(); ctx.ellipse(0, -103, 19, 15, 0, Math.PI, 0); ctx.closePath(); ctx.fillStyle = "#d8b67a"; ctx.fill(); stroke(2.5); line(-18, -105, 18, -105, "#7a4a22", 3); }
    ctx.restore();
    if (opt.tag !== false) nameTag(p.name, p.col, x, y - ((122 + L) * s) - bob - jump);
  }

  // ---------- the grown-ups: adult1 hides in Seek & Find, adult2 cheers at the end ----------
  function adultHairBack(lk, hx, hy, r, hc) {
    if (lk.style === "long") { rr(hx - r - 2, hy - r - 2, 2 * r + 4, r + 70, [r, r, 9, 9], hc.base, 2.5); [-r * .7, -r * .35, r * .35, r * .7].forEach(dx => line(hx + dx, hy + 12, hx + dx, hy + r + 48, hc.dark, 2)); }
    else if (lk.style === "curly") cluster([[hx - r, hy - 4, r * .6], [hx + r, hy - 4, r * .6], [hx - r * .9, hy + 14, r * .5], [hx + r * .9, hy + 14, r * .5], [hx, hy - r * .6, r * .9]], hc.base, 2);
    else if (lk.style === "afro") cluster([[hx, hy - 6, r * 1.55]], hc.base, 2.5);
    else if (lk.style === "bun") circ(hx, hy - r - 8, r * .5, hc.base, 2.5);
  }
  function adultHairFront(lk, hx, hy, r, hc) {
    if (lk.style === "bald") { ell(hx - r * .45, hy - r * .55, 4, 2.5, "rgba(255,255,255,.35)", 0); return; }
    if (lk.style === "curly") { cluster([[hx - r * .55, hy - r * .8, r * .38], [hx, hy - r * .95, r * .42], [hx + r * .55, hy - r * .8, r * .38]], hc.base, 2); return; }
    if (lk.style === "afro") { ctx.beginPath(); ctx.arc(hx, hy + 2, r, Math.PI * 1.1, Math.PI * 1.9); ctx.quadraticCurveTo(hx, hy - r * .55, hx - r * .95, hy - r * .3); ctx.closePath(); ctx.fillStyle = hc.base; ctx.fill(); stroke(2); return; }
    if (lk.style === "long") { ctx.beginPath(); ctx.moveTo(hx - r - 1, hy + 2); ctx.quadraticCurveTo(hx - r * .8, hy - r * 1.4, hx + r * .3, hy - r * 1.2); ctx.quadraticCurveTo(hx + r * 1.1, hy - r, hx + r + 1, hy + 4); ctx.quadraticCurveTo(hx + r * .4, hy - r * .9, hx - r - 1, hy + 2); ctx.closePath(); ctx.fillStyle = hc.base; ctx.fill(); stroke(2.5); return; }
    // short and bun: a neat cap of hair
    ctx.beginPath(); ctx.arc(hx, hy - 2, r + 1, Math.PI * 1.02, Math.PI * 1.98); ctx.quadraticCurveTo(hx + r * .2, hy - r * .55, hx - r - 1, hy - 4); ctx.closePath(); ctx.fillStyle = hc.base; ctx.fill(); stroke(2.5);
    rr(hx - r - 1, hy - 10, 6, 12, 3, hc.base, 0); rr(hx + r - 5, hy - 10, 6, 12, 3, hc.base, 0);
  }
  function adultFace(lk, hx, hy, r) {
    const eye = EYES[lk.eyes] || EYES.blue, hc = hairSet(lk.hair);
    if (lk.beard === "stubble") { ctx.save(); ctx.beginPath(); ctx.arc(hx, hy, r - 1, .15, Math.PI - .15); ctx.closePath(); ctx.clip(); ell(hx, hy + 14, r, 13, hc.base === HAIRS.white || hc.base === HAIRS.grey ? "rgba(150,150,150,.45)" : "rgba(120,104,88,.42)", 0); ctx.restore(); }
    if (lk.beard === "beard") { ctx.beginPath(); ctx.arc(hx, hy + 1, r + 1, .05, Math.PI - .05); ctx.quadraticCurveTo(hx, hy + r + 12, hx + r + 1, hy + 4); ctx.closePath(); ctx.fillStyle = hc.base; ctx.fill(); stroke(2.5); }
    [-7, 7].forEach(dx => { circ(hx + dx, hy - 1, 3.6, "#fff", 1.5); circ(hx + dx, hy - 1, 2.2, eye, 0); });
    if (lk.glasses) glasses([hx - 7, hx + 7], hy - 1, 6.5);
    line(hx - 11, hy - 7, hx - 4, hy - 8, shade(hc.base, -.25), 2.5); line(hx + 4, hy - 8, hx + 11, hy - 7, shade(hc.base, -.25), 2.5);
    ctx.beginPath(); ctx.arc(hx, hy + 7, 6, .2, Math.PI - .2); ctx.strokeStyle = lk.beard === "beard" ? "#fff" : INK; ctx.lineWidth = 2.5; ctx.stroke();
  }
  function cap(lk, hx, hy, r) {
    ctx.beginPath(); ctx.arc(hx, hy - 6, r + 1, Math.PI, 0); ctx.closePath(); ctx.fillStyle = "#ffc23d"; ctx.fill(); stroke(3);
    rr(hx - 4, hy - 12, 30, 7, 3, "#f0a920", 2.5); if (lk.capLetter) txt(lk.capLetter, hx - 1, hy - 12, 15, INK, "center", 700);
  }
  function drawAdult(x, y, sc, who, opt = {}) {
    const key = who === "dad" || who === "adult1" ? "adult1" : "adult2", lk = family()[key], SKIN = lk.skin, hc = hairSet(lk.hair);
    const wave = opt.wave ? Math.sin(performance.now() / 125) * .5 : 0, jump = opt.jump || 0, armUp = opt.wave ? -40 : 0;
    ell(x, y, 26 * sc, 8 * sc, "rgba(0,0,0,.16)", 0);
    ctx.save(); ctx.translate(x, y - jump); ctx.scale(sc, sc);
    if (lk.body !== "woman") {
      // tee and jeans
      const hx = 0, hy = -110, r = 20;
      adultHairBack(lk, hx, hy, r, hc);
      rr(-14, -46, 12, 44, 5, "#3b5f9e", 2.5); rr(2, -46, 12, 44, 5, "#3b5f9e", 2.5); ell(-8, -2, 9, 5, "#333", 2.5); ell(8, -2, 9, 5, "#333", 2.5);
      line(16, -82, 34, -52 + armUp + wave * 20, INK, 9); line(16, -82, 34, -52 + armUp + wave * 20, SKIN, 5);
      line(-16, -82, -30, -50, INK, 9); line(-16, -82, -30, -50, SKIN, 5);
      rr(-19, -90, 38, 48, 10, key === "adult1" ? "#ffffff" : "#9fd3ff");
      circ(hx, hy, r, SKIN);
      adultFace(lk, hx, hy, r);
      if (lk.cap) cap(lk, hx, hy, r); else adultHairFront(lk, hx, hy, r, hc);
    } else {
      // sporty top, leggings and matching white trainers
      const hx = 0, hy = -114, r = 18;
      adultHairBack(lk, hx, hy, r, hc);
      rr(-11, -52, 10, 50, 5, "#3a3f63", 2.5); rr(1, -52, 10, 50, 5, "#3a3f63", 2.5);
      const top = key === "adult2" ? "#ff6b6b" : "#2bb3a3";
      [-6, 6].forEach(dx => { rr(dx - 9, -8, 18, 9, 4, "#ffffff", 2.5); line(dx - 6, -4, dx + 4, -4, top, 2.5); });
      line(15, -88, 31, -60 + armUp + wave * 20, INK, 8); line(15, -88, 31, -60 + armUp + wave * 20, SKIN, 4);
      line(-15, -88, -24, -58, INK, 8); line(-15, -88, -24, -58, SKIN, 4);
      poly([[-15, -94], [15, -94], [11, -52], [-11, -52]], top);
      line(-12, -60, 12, -60, "#ffffff", 2.5);
      ell(hx, hy, 17, 19, SKIN);
      adultFace(lk, hx, hy + 1, 17);
      ell(-10, hy + 8, 3.5, 2.2, "rgba(255,120,140,.4)", 0); ell(11, hy + 8, 3.5, 2.2, "rgba(255,120,140,.4)", 0);
      if (lk.cap) cap(lk, hx, hy, r); else adultHairFront(lk, hx, hy, r, hc);
      if (!lk.cap) { circ(-17, -108, 2, "#ffd23f", 0); circ(17, -108, 2, "#ffd23f", 0); }
    }
    ctx.restore();
  }

  // ---------- installable, works offline (only on the real site, not when opened as a file) ----------
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) { const swUrl = new URL("sw.js", document.currentScript.src); addEventListener("load", () => { navigator.serviceWorker.register(swUrl).catch(() => {}); }); }

  return { W, H, INK, stage, begin, end, useCtx, toWorld, get ctx() { return ctx; }, rand, randInt, pick, shuffle, clamp, shade,
    circ, ell, rr, poly, line, cluster, txt, wrap, star4, star5, bubble, nameTag,
    unlockAudio, tone, sfx, speak, get muted() { return muted; }, setMuted, chrome, track,
    OUTFITS, WARDROBE, getOutfit, setOutfit, PLAYERS, mkPlayer, drawKid, drawAdult,
    SKINS, HAIRS, HAIR_LABELS, EYES, EYE_LABELS, KID_STYLES, ADULT_STYLES, BEARDS, KID_BODIES, ADULT_BODIES, DEFAULT_FAMILY, family, saveFamily, resetFamily, isCustom, name, applyNames };
})();
