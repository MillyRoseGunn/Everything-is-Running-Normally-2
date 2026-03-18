function AppMonitor() {
  let t = 0;
  let residual = 0; // leftover corruption from glitch times

  // helper: draw eyes inside the panel
  function drawHorrificFace(x, y, w, h, g, t) {
   push();
    noStroke();

    const ex = x + w * (0.55 + sin(t * 1.2) * 0.06);
    const ey = y + h * (0.55 + cos(t * 0.9) * 0.06);
    const s = min(w, h) * (0.22 + 0.12 * g);

    fill(0, 120 * g);
    ellipse(ex, ey, s * 1.8, s);

    fill(255, 40 + 140 * g);
    ellipse(ex, ey, s * 1.6, s * 0.8);

    // iris (dark rainbow)
    fill(40 + random(120) * g, 10 + random(80) * g, 80 + random(170) * g, 120 + 80 * g);
    ellipse(ex, ey, s * 0.55, s * 0.55);

    fill(0, 220);
    ellipse(ex + sin(t * 2.0) * 2 * g, ey, s * 0.16, s * 0.16);

    fill(255, 60 + 120 * g);
    ellipse(ex - s * 0.12, ey - s * 0.12, s * 0.10, s * 0.10);

    pop();
  }

  return {
    id: "monitor",

    // IMPORTANT: matches win.app.draw(cx, cy, cw, ch, state)
    draw(cx, cy, cw, ch, state) {
      // time
      t += deltaTime * 0.001;

      const watched = state.watched;
      const g = state.glitch; // 0..1

      // Residual logic:i
// - when not watched, residual climbs fast
// - when watched, it decays slowly (so the mask "sticks")
if (!watched) residual = min(1, residual + 0.06);
else residual = max(0, residual - 0.015);


      // background
      noStroke();
      fill(0, watched ? 60 : 110);
      rect(cx, cy, cw, ch, 10);

      // ---------- CLEAN (mask) ----------
      if (watched) {
        // fake stats (nice + calm)
        let cpu = (sin(t * 1.8) * 0.5 + 0.5);
        let memory = (sin(t * 0.9 + 2) * 0.5 + 0.5);

        fill(255, 220);
        textAlign(LEFT, TOP);
        textSize(12);
        text("CPU", cx + 14, cy + 12);
        text("MEMORY", cx + 14, cy + 62);

        // bars
        noStroke();
        fill(0,255, 100)
        fill(255, 90);
        rect(cx + 80, cy + 10, (cw - 100) * cpu, 14, 6);
        rect(cx + 80, cy + 60, (cw - 100) * memory, 14, 6);

        // status
        fill(255, 180);
        text("status: normal", cx + 14, cy + 110);
        text("watched: " + watched, cx + 14, cy + 130);

        // ---  leak
if (residual > 0.01) {
  const a = 255 * pow(residual, 1.2); // alpha curve
  // choose a phrase 
  const phrases = [
    "still here",
    "i saw you",
    "don't turn away",
    "i don't like it when you do.that ",
    "everything is running normally",
    "smile",
    "please don't do that again",
    "where did you go",
    "i saw that",
    "dont do that",
    "smile",
    "smile",
    "please smile",
  ];
  const idx = Math.floor((t * 0.9) % phrases.length);
  const msg = phrases[idx];

  // place it near the stats so it feels like the UI is "bleeding"
  noStroke();
  fill(0, 120 * residual);

  fill(255,100);
  textAlign(LEFT, CENTER);
  textSize(25);
  text(msg, cx + 22, cy + 162);
}


        return; //
      }

      // ---------- GLITCH----------
      // corrupted stats
      let cpu = 1.2 + sin(t * 7.0) * 0.6 + noise(t * 3.2) * 0.8;     // > 1.0 often
      let memory = 0.2 + noise(t * 1.8) * 1.6;                       // jumps
      let temp = 60 + noise(t * 2.4) * 90 + sin(t * 5.0) * 30;       // nonsense

      // jitter the whole UI slightly
      const jx = (noise(t * 6.1) - 0.5) * 14 * g;
      const jy = (noise(t * 6.8 + 99) - 0.5) * 10 * g;

      // labels go wrong
      fill(255, 220);
      textAlign(LEFT, TOP);
      textSize(12);
      text("CPU", cx + 14 + jx, cy + 12 + jy);
      text("MEMORY", cx + 14 + jx, cy + 62 + jy);

      // bars: dark rainbow + inverted + tearing
      noStroke();
      for (let i = 0; i < 18; i++) {
        const yy = cy + 10 + i * 2.2 + random(-2, 2) * g;
        fill(20 + random(100), 10 + random(80), 40 + random(160), 30 + 80 * g);
        rect(cx + 80, yy, (cw - 100) * constrain(cpu, 0, 2) * 0.6, 2);
      }
      for (let i = 0; i < 18; i++) {
        const yy = cy + 60 + i * 2.2 + random(-2, 2) * g;
        fill(10 + random(120), 20 + random(120), 10 + random(200), 30 + 80 * g);
        rect(cx + 80, yy, (cw - 100) * constrain(memory, 0, 2) * 0.6, 2);
      }

      // horrific face overlay inside the monitor window
      drawHorrificFace(cx + 8, cy + 92, cw - 16, ch - 100, g, t);

      // “data” becomes accusatory
      fill(255, 200);
      textAlign(LEFT, TOP);
      textSize(12);

      const cpuPct = Math.floor(cpu * 100);
      const memPct = Math.floor(memory * 100);
      const tempC = Math.floor(temp);

      // deliberately unsettling lines
      text(`cpu: ${cpuPct}%`, cx + 14 + jx, cy + 110 + jy);
      text(`memory: ${memPct}%`, cx + 14 + jx, cy + 128 + jy);
      text(`temp: ${tempC}°C`, cx + 14 + jx, cy + 146 + jy);

      fill(255, 160);
      text("status: running normally", cx + 14 + jx, cy + 168 + jy);

      // small “heartbeat” dot (feels like surveillance)
      noStroke();
      fill(255, 40 + 160 * (sin(t * 8) * 0.5 + 0.5));
      circle(cx + cw - 18, cy + 18, 6 + 6 * g);
    }
  };
}
