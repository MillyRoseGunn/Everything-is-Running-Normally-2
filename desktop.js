// desktop.js
// All UI state + interactions live here.

class DesktopUI {
  constructor() {
    this.state = {
      watched: true,
      stability: 1,
      glitch: 0
    };
        // --- look-away 20 times final state ---
    this.prevWatched = true;       // used to detect watched -> not watched edges
    this.lookAwayCount = 0;        // increments each time you look away
    this.blackoutUntil = 0;        // millis() timestamp until which jumpscare stays
    this.hasEverLookedAway = false;
this.bootMask = true;   // NEW: force clean at start

    this.windows = [];

    this.focus = {
      type: null,   // "search"
      id: null
    };

    this.search = {
      x: 0, y: 0, w: 420, h: 30,
      text: "",
      placeholder: "Search",
      focused: false,
      blinkT: 0,
      lastSubmit: ""
    };

    
    this.toast = { text: "", t: 0 };
    this.focusedWindowId = null;
  }
  

  layout(W, H) {
    // static-ish layout; you can tune later
    this.search.x = 18;
    this.search.y = 8;

    // initialise windows if empty
    if (this.windows.length === 0) {
      this.windows = [
        this.makeWindow("System Monitor", 80, 80, 460, 300, AppMonitor()),
        this.makeWindow("Task Queue", 580, 120, 380, 250, AppQueue()),
        this.makeWindow("Logs",120, 420, 840, 220, AppLogs()),
        this.makeWindow("Help", 1000, 400, 320, 200, AppHelp()),
        this.makeWindow("Terminal", 1000, 100, 300, 220, AppTerminal()),
      ];
    }
  }

  makeWindow(title, x, y, w, h, app) {
    return {
      id: title + "_" + Math.floor(Math.random() * 99999),
      title,
      app: app || null,
      x, y, w, h,
      z: 0,
      closed: false,
      minimized: false,
      maximized: false
    };
  }


  update({ watched, stability, glitch }) {
    this.state.watched = watched;
    this.state.stability = stability;
    this.state.glitch = glitch;
    // NEW: if we ever become watched once, boot mask can end
if (watched) this.bootMask = false;


    // --- blackout trigger logic ---
    const now = millis();

    // Count only the transition: watched -> not watched
 // Count transitions using the SAME logic as the visuals (bootMask)
const effectiveWatched = this.bootMask ? true : watched;

// watched -> not watched edge
if (this.prevWatched && !effectiveWatched) {
  this.lookAwayCount++;
  this.hasEverLookedAway = true;

  if (this.lookAwayCount >= 10) {
    this.blackoutUntil = now + 5000; // 5 seconds
    this.lookAwayCount = 0;          // reset so it can happen again
  }
}

this.prevWatched = effectiveWatched;



    this.prevWatched = watched;



    // toast decay
    if (this.toast.t > 0) this.toast.t -= deltaTime;
    if (this.toast.t <= 0) this.toast.text = "";

    window.__WATCHED__ = watched;
window.__GLITCH__ = glitch;

  }

  draw() {
const effectiveWatched = this.bootMask ? true : this.state.watched;
const effectiveGlitch  = (this.bootMask || !this.hasEverLookedAway) ? 0 : this.state.glitch;
const g = effectiveGlitch;

        // --- blackout overlay (blocks the whole UI) ---
    if (millis() < this.blackoutUntil) {
      this.drawBlackout();
      return; // stop drawing the normal desktop
    }


 // Keep the desktop "mask" mostly stable.
// The scary stuff should happen *inside* windows.
this.drawWallpaperAeroClean();
this.drawTaskbarClean();
this.drawDesktopIconsClean();

// Optional: when not watched, add a subtle dim + hue shift wash (NOT full glitch)
if (!effectiveWatched) {
  const g2 = g;
  noStroke();
  fill(0, 80 * g2);
  rect(0, 0, width, height);

  // slight sickly tint
  fill(120, 0, 160, 35 * g2);
  rect(0, 0, width, height);
}


    // menu bar + search
    this.drawMenuBar(g);
    this.drawSearchBar(g);

    // windows (z-order)
    const ws = this.windows
      .filter(w => !w.closed)
      .sort((a, b) => (a.z || 0) - (b.z || 0));

    for (let w of ws) {
      if (w.minimized) continue;
      if (!this.hasEverLookedAway || effectiveWatched) {
  this.drawWindowClean(w, g, effectiveWatched);
} else {
  this.drawWindowGlitchy(w, g, effectiveWatched);
}


    }

    // mask banner (always calm)
    this.drawStatusBannerClean();

    // toast (subtle)
    this.drawToast(g);
  }

drawCorruptionOverlay(x, y, w, h, g) {
  if (g <= 0.01) return;

  push();
  // confine to window content
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.rect(x, y, w, h);
  drawingContext.clip();

  // dark rainbow tearing (your earlier vibe)
  noStroke();
  for (let i = 0; i < 12 + g * 40; i++) {
    const yy = y + random(h);
    const hh = random(1, 10) * (0.3 + g);
    const xx = x + random(-80, 80) * g;
    const ww = w * random(0.2, 1.0);

    // "dark rainbow" palette but low brightness
    fill(
      random(40, 180),   // r
      random(0, 120),    // g
      random(60, 220),   // b
      random(20, 110)    // alpha
    );
    rect(xx, yy, ww, hh);
  }

  // occasional hard “compression blocks”
  if (random() < 0.05 + 0.2 * g) {
    for (let k = 0; k < 8; k++) {
      fill(random(255), random(255), random(255), 30 + 90 * g);
      rect(x + random(w), y + random(h), random(40, 160), random(6, 28));
    }
  }

  // faint vignette inside the window (claustrophobic)
  fill(0, 140 * g);
  rect(x, y, w, 10 + 40 * g);
  rect(x, y + h - (10 + 40 * g), w, 10 + 40 * g);

  drawingContext.restore();
  pop();
}



  // ----------------------------
  // Interaction
  // ----------------------------

  mousePressed(mx, my) {
    // 1) search bar focus
    if (this.pointInRect(mx, my, this.search)) {
      this.focusSearch(true);
      this.bringNothingToFront();
      return;
    } else {
      this.focusSearch(false);
    }

    // 2) click windows from top to bottom
    const topFirst = this.windows
      .filter(w => !w.closed && !w.minimized)
      .sort((a, b) => (b.z || 0) - (a.z || 0));

    for (let w of topFirst) {
      // traffic lights area (top-left)
      const lights = this.trafficLightsRects(w);

      if (this.pointInRect(mx, my, lights.close)) {
        w.closed = true;
        this.toastMsg("Closed “" + w.title + "”. Everything is running normally.");
        return;
      }
      if (this.pointInRect(mx, my, lights.min)) {
        w.minimized = true;
        this.toastMsg("Minimised “" + w.title + "”.");
        return;
      }
      if (this.pointInRect(mx, my, lights.max)) {
        w.maximized = !w.maximized;
        if (w.maximized) {
          // quick maximize: store old, then fill most screen
          w._old = { x: w.x, y: w.y, w: w.w, h: w.h };
          w.x = 40; w.y = 60; w.w = width - 80; w.h = height - 120;
        } else if (w._old) {
          w.x = w._old.x; w.y = w._old.y; w.w = w._old.w; w.h = w._old.h;
        }
        return;
      }

      // click inside window brings to front
      if (this.pointInRect(mx, my, w)) {
        this.bringToFront(w);
        this.focusedWindowId = w.id; //NEW
        // tell apps about focus (only if they care)
for (let ww of this.windows) {
  if (ww.app && typeof ww.app.setFocused === "function") {
    ww.app.setFocused(ww.id === this.focusedWindowId);
  }
}

        return;
      }
    }
  }

  keyTyped(k) {
  // 1) if search focused, it owns typing
  if (this.search.focused) {
    if (k.length === 1 && k !== "\n" && k !== "\r") {
      this.search.text += k;
    }
    return;
  }

  // 2) otherwise, send to focused window app (if any)
  const w = this.windows.find(w => w.id === this.focusedWindowId);
  if (!w || w.closed || w.minimized) return;

  if (w.app && typeof w.app.keyTyped === "function") {
    w.app.keyTyped(k);
  }
}


  keyPressed(keyCode, key) {
  // 1) if search focused, it owns keys
  if (this.search.focused) {
    if (keyCode === BACKSPACE) {
      this.search.text = this.search.text.slice(0, -1);
    }

    if (keyCode === ENTER || keyCode === RETURN) {
      this.search.lastSubmit = this.search.text;
      this.toastMsg("Searching for “" + this.search.text + "”… Everything is running normally.");
      this.search.text = "";
    }

    if (keyCode === ESCAPE) {
      this.focusSearch(false);
    }
    return;
  }

  // 2) otherwise, send to focused window app (if any)
  const w = this.windows.find(w => w.id === this.focusedWindowId);
  if (!w || w.closed || w.minimized) return;

  if (w.app && typeof w.app.keyPressed === "function") {
    w.app.keyPressed(keyCode, key);
  }
}


  focusSearch(on) {
    this.search.focused = on;
    if (on) {
      this.focus.type = "search";
      this.search.blinkT = 0;
    } else {
      this.focus.type = null;
    }
  }

  bringToFront(win) {
    let maxZ = 0;
    for (let w of this.windows) maxZ = max(maxZ, w.z || 0);
    win.z = maxZ + 1;
  }

  bringNothingToFront() {
    // no-op for now, but keeps intent clear
  }

  toastMsg(s) {
    this.toast.text = s;
    this.toast.t = 2200; // ms
  }

  trafficLightsRects(w) {
    // three 12px circles aligned inside titlebar
    const y = w.y + 14;
    return {
      close: { x: w.x + 14 - 6, y: y - 6, w: 12, h: 12 },
      min:   { x: w.x + 34 - 6, y: y - 6, w: 12, h: 12 },
      max:   { x: w.x + 54 - 6, y: y - 6, w: 12, h: 12 },
    };
  }

  pointInRect(px, py, r) {
    return (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h);
  }

  // ----------------------------
  // Drawing: menu/search/toast
  // ----------------------------

  drawMenuBar(g) {
    noStroke();
    fill(255, 70);
    rect(0, 0, width, 34);

    fill(255, 45);
    rect(0, 0, width, 12);

    fill(20, 240);
    textAlign(LEFT, CENTER);
    textSize(13);
    text("Finder  File  Edit  View  Window  Help", 14 + 450, 17);

    textAlign(RIGHT, CENTER);
    textSize(12);
    text(`${nf(hour(),2)}:${nf(minute(),2)}`, width - 14, 17);
  }

 drawSearchBar(g) {
  const s = this.search;

  // you offset the bar down — keep that consistent
  const sy = s.y + 33;

  // glass pill
  noStroke();
  fill(255, s.focused ? 110 : 80);
  rect(s.x, sy, s.w, s.h, 14);

  // inner sheen
  fill(255, 40);
  rect(s.x + 6, sy + 4, s.w - 12, s.h * 0.45, 12);

  // text
  textAlign(LEFT, CENTER);
  textSize(13);

  const display = (s.text.length > 0) ? s.text : s.placeholder;
  const alpha = (s.text.length > 0) ? 230 : 110;

  noStroke();
  fill(0, alpha);
  text(display, s.x + 14, sy + s.h / 2 + 1);

  // cursor blink
  if (s.focused) {
    s.blinkT += deltaTime;
    const on = (Math.floor(s.blinkT / 450) % 2) === 0;
    if (on) {
      const tw = textWidth(s.text);
      const cx = s.x + 14 + tw + 2;
      stroke(0, 200);
      line(cx, sy + 8, cx, sy + s.h - 8);
    }
  }
}


  drawToast(g) {
    if (!this.toast.text) return;

    const a = constrain(this.toast.t / 2200, 0, 1);
    const w = min(560, width - 40);
    const x = (width - w) / 2;
    const y = 44;

    noStroke();
    fill(0, 80 * a);
    rect(x + 4, y + 6, w, 40, 14);

    fill(255, 90 * a);
    rect(x, y, w, 40, 14);

    fill(20, 240 * a);
    textAlign(CENTER, CENTER);
    textSize(12);
    text(this.toast.text, x + w/2, y + 20);
  }

  // ----------------------------
  // Drawing: windows (clean/glitch)
  // ----------------------------

drawWindowClean(win, g, effectiveWatched) {
    const x = win.x, y = win.y, w = win.w, h = win.h;

    // body
    noStroke();
    fill(255, 55);
    rect(x, y, w, h, 10);

    // title bar
    fill(255, 90);
    rect(x, y, w, 28, 10, 10, 0, 0);

    // traffic light buttons NOW EDITABLE HERE NOT IN SKETCH.JS !!
    fill(255,0,0);
    circle(x + 14, y + 14, 10);
    fill("orange");
    circle(x + 34, y + 14, 10);
    fill(0,255,0)
    circle(x + 54, y + 14, 10);

    // title
    fill(20, 230);
    textAlign(LEFT, CENTER);
    textSize(12);
    text(win.title, x + 76, y + 14);

    // content
    const cx = x + 12;
    const cy = y + 36;
    const cw = w - 24;
    const ch = h - 48;

    noStroke();
    fill(255, 30);
    rect(cx,cy,cw,ch, 8);

    if(win.app && typeof win.app.draw === "function"){
      win.app.draw(cx, cy,cw,ch, {
        // clean mode: no corruption overlay
        watched: this.state.watched,
        stability: this.state.stability,
        glitch: this.state.glitch
      });
    } else{
      //fallback just in cases 
      fill(20,180);
      textAlign(LEFT, TOP);
      textSize(12);
      text("no app attached", cx + 8, cy + 8);
    }


  }

drawWindowGlitchy(win, g, effectiveWatched) {
    // drift + jitter increases with stability loss
    let driftX = random(-40, 40) * (0.2 + g);
    let driftY = random(-40, 40) * (0.2 + g);

    const x = win.x + driftX, y = win.y + driftY, w = win.w, h = win.h;

    noStroke();

    // window body flickers
    fill(255, 40);
    rect(x, y, w, h, 10);

    // title bar
    fill(random(255), random(255), random(255), 120);
    rect(x, y, w, 28, 10, 10, 0, 0);

    // traffic lights still clickable (hitboxes use original win.x/win.y)
    fill(0,0,255);
    circle(x + 14, y + 14, 10);
    fill(255,90,10);
    circle(x + 34, y + 14, 10);
    fill(40,200,100);
    circle(x + 54, y + 14, 10);

    // title (sometimes corrupt)
    fill(20, 230);
    textAlign(LEFT, CENTER);
    textSize(12);
    let t = (random() < 0.2 + 0.6 * g) ? win.title.split("").join(" ") : win.title;
    text(t, x + 76, y + 14);

    // crude “content”
    fill(20, 180);
    textAlign(LEFT, TOP);
    textSize(12);
    text("…", x + 12, y + 40);

    // tear slices across the window
    fill(255, 220);
    for (let i = 0; i < 6; i++) {
      let ty = y + random(40, h - 10);
      let th = random(4, 18) * (0.4 + g);
      let tx = x + random(-120, 120) * (0.3 + g);
      rect(tx, ty, w, th, 0);
    }
    // content area (match clean layout)
const cx = x + 12;
const cy = y + 36;
const cw = w - 24;
const ch = h - 48;

// base content panel
noStroke();
fill(0, 60);
rect(cx, cy, cw, ch, 8);

// draw app if present
// draw app if present
if (win.app && typeof win.app.draw === "function") {
  win.app.draw(cx, cy, cw, ch, {
    watched: effectiveWatched,   // ✅ FIX
    stability: this.state.stability,
    glitch: g                   // already correct
  });

}


// NOW: corruption overlay confined to content area
this.drawCorruptionOverlay(cx, cy, cw, ch, g);

  }

  drawStatusBannerClean() {
    // should NEVER glitch
    noStroke();
    fill(255, 220);
    rect(0, 0, width, 34);

    fill(20, 255);
    textAlign(LEFT, CENTER);
    textSize(14);
    text("Everything is running normally.", 14, 17);
  }

  // ----------------------------
  // Your existing “desktop feel” functions
  // (I’ve kept these close to what you already had)
  // ----------------------------

  drawWallpaperAeroClean() {
    // bubbles
    noStroke();
    let gap = 10;
    for (let i = 0; i < 38; i += gap) {
      let x = (noise(i * 10.1, frameCount * 0.0009) * width);
      let y = (noise(i * 20.2, frameCount * 0.0009) * height);
      let s = 80 + noise(i * 30.3, frameCount * 0.003) * 220;

      fill(255, 18);
      circle(x, y, s);
      fill(255, 10);
      circle(x + s * 0.12, y - s * 0.12, s * 0.55);
    }

    // vertical gradient blues
    for (let yy = 0; yy < height; yy++) {
      let t = yy / height;
      let r = lerp(120, 20, t);
      let g = lerp(210, 120, t);
      let b = lerp(255, 180, t);
      stroke(r, g, b, 80);
      line(0, yy, width, yy);
    }
  }

  drawWallpaperGlitchy() {
    background(20);
    noStroke();

    // harsher “tearing” lines
    for (let i = 0; i < 10; i++) {
      fill(random(255), random(255), random(255), 30);
      rect(random(width), random(height), random(80, 400), random(1, 3));
    }
  }

  drawTaskbarClean() {
    noStroke();
    fill(255, 26);
    rect(0, height - 46, width, 46);

    fill(255, 70);
    rect(12, height - 34, 90, 24, 6);

    fill(20, 220);
    textFont("Verdana");
    textSize(12);
    textAlign(LEFT, CENTER);
    text("start", 26, height - 22);

    textAlign(RIGHT, CENTER);
    let t = nf(hour(), 2) + ":" + nf(minute(), 2);
    text(t, width - 16, height - 22);
  }

  drawTaskbarGlitchy() {
    let j = random(-6, 6);
    noStroke();
    fill(255, 18);
    rect(0 + j, height - 46 + j, width, 46);

    fill(255, 70);
    rect(12 + j, height - 34 + j, 90, 24, 6);

    fill(20, 220);
    textFont("Veranda");
    textSize(12);
    textAlign(LEFT, CENTER);
    text("start", 26 + j, height - 22 + j);

    textAlign(RIGHT, CENTER);
    let t = nf(hour(), 2) + ":" + nf(minute(), 2);
    text(t, width - 16 + j, height - 22 + j);
  }

  drawDesktopIconsClean() {
    let icons = [
      { label: "inbox", x: 22, y: 100 },
      { label: "work", x: 22, y: 170 },
      { label: "notes", x: 22, y: 240 },
      { label: "trash", x: 22, y: 310 },
    ];

    textAlign(LEFT, TOP);
    textSize(12);

    for (let ic of icons) {
      noStroke();
      fill(255, 55);
      rect(ic.x, ic.y, 34, 34, 6);
      fill(255, 160);
      text(ic.label, ic.x, ic.y + 40);
    }
  }

  drawDesktopIconsGlitchy() {
    let icons = [
      { label: "inbox", x: 22, y: 60 },
      { label: "work", x: 22, y: 130 },
      { label: "notes", x: 22, y: 200 },
      { label: "trash", x: 22, y: 270 },
    ];

    textAlign(LEFT, TOP);
    textSize(12);

    for (let ic of icons) {
      let jx = random(-18, 18);
      let jy = random(-18, 18);

      noStroke();
      fill(random(255), random(255), random(255), 80);
      rect(ic.x + jx, ic.y + jy, 34, 34, 6);

      fill(255, 160);
      text(ic.label, ic.x + jx, ic.y + 40 + jy);
    }
  }

  drawBlackout(){
    // full black screen
    background(0);

    const t = frameCount * 0.04;

    // subtle flicker
    noStroke();
    fill(0, 120);
    rect(0, 0, width, height);

    // creepy “face” (simple, stylised)
    const cx = width / 2;
    const cy = height / 2 - 20;
    const s = min(width, height) * 0.42;

    // head shadow
    fill(0, 220);
    ellipse(cx, cy, s * 0.95, s * 1.08);

    // faint outer glow
    fill(255, 10);
    ellipse(cx, cy, s * 1.05, s * 1.18);

    // eyes (drifting slightly)
    const ex = s * 0.22;
    const ey = s * 0.08;
    const wobX = sin(t * 1.3) * 6;
    const wobY = cos(t * 1.1) * 4;

    // sclera
    fill(255, 22);
    ellipse(cx - ex + wobX, cy - ey + wobY, s * 0.22, s * 0.14);
    ellipse(cx + ex + wobX, cy - ey - wobY, s * 0.22, s * 0.14);

    // iris (dark rainbow)
    fill(50 + random(140), 10 + random(80), 80 + random(160), 120);
    ellipse(cx - ex + wobX, cy - ey + wobY, s * 0.09, s * 0.09);
    ellipse(cx + ex + wobX, cy - ey - wobY, s * 0.09, s * 0.09);

    // pupils
    fill(0, 240);
    ellipse(cx - ex + wobX + sin(t * 2.0) * 2, cy - ey + wobY, s * 0.04, s * 0.04);
    ellipse(cx + ex + wobX - sin(t * 2.0) * 2, cy - ey - wobY, s * 0.04, s * 0.04);

  

    // scanlines
    fill(255, 8);
    for (let y = 0; y < height; y += 6) rect(0, y, width, 1);


    fill(255, 90);
    textSize(25);
    text("everything is running normally", cx, cy + s * 0.50);
  }
}