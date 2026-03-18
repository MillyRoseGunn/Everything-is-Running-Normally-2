function AppQueue() {
  let t = 0;
  let residue = 0;

let lastHorrorLines = [];       // cached creepy lines to show in clean mode
let lastHorrorStamp = 0;        


  // Persistent “queue” so it feels like the system has memory
  const base = [
    { name: "Rendering UI",        eta: "00:00:01", status: "ok" },
    { name: "Syncing Preferences", eta: "00:00:02", status: "ok" },
    { name: "Indexing Files",      eta: "00:00:04", status: "ok" },
    { name: "Checking for Updates",    eta: "00:00:06", status: "ok" },
  ];

  // These appear only when not watched (and escalate)
  const corrupted = [
    "Calibrate gaze model",
    "Extract facial landmarks",
    "Rebuild you from attention",
    "Schedule blink removal",
    "Compress memory of self",
    "Archive doubt",
    "Queue replacement process",
    "Push compliance patch",
    "Deploy watcher instance",
    "Persist observer",
    "Rewrite intent",
    "Finalize: YOU"
  ];

function glitchText(s, g) {
return s;
}
  


  function drawProgressBar(x, y, w, h, p, g) {
    noStroke();
    fill(255, 22);
    rect(x, y, w, h, 8);

    // dark rainbow tearing fill
    const slices = 22;
    for (let i = 0; i < slices; i++) {
      const yy = y + (i / slices) * h;
      const hh = h / slices;
      const wob = (noise(i * 1.7, t * 3.2) - 0.5) * 18 * g;
      const ww = w * constrain(p + wob / w, 0, 1);
const hue = noise(i * 10.1, t * 0.2); // stable drift
fill(
  40 + 120 * hue * residue,
  10 + 60  * (1 - hue) * residue,
  60 + 160 * hue * residue,
);

      rect(x, yy, ww, hh + 1);
    }

    // glossy sheen (wrong)
    fill(255, 12 + 35 * g);
    rect(x + 6, y + 3, w - 12, h * 0.35, 8);
  }

  function drawCreepyStamp(x, y, w, h, g) {
    if (g < 0.12) return;
    push();
    noFill();
    stroke(255, 30 + 80 * g);
    strokeWeight(2);

    const cx = x + w * 0.75;
    const cy = y + h * 0.28;

    // “SEEN” ring
    ellipse(cx, cy, 120, 120);

    // jagged inner ring
    for (let i = 0; i < 30; i++) {
      const a = (i / 30) * TWO_PI;
      const rr = 46 + sin(t * 6 + i) * 8 * g;
      const px = cx + cos(a) * rr;
      const py = cy + sin(a) * rr;
      point(px, py);
    }

    noStroke();
    fill(255, 50 + 120 * g);
    textAlign(CENTER, CENTER);
    textSize(18);
    text("SEEN", cx, cy);

    pop();
  }

  function drawEyeInProgress(x, y, w, h, g) {
    if (g < 0.18) return;
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
    id: "queue",

    draw(x, y, w, h, state) {
      t += deltaTime * 0.001;

      const watched = state.watched;
      const g = state.glitch; // 0..1

      // Residue ramps fast when not watched, decays slow when watched.
// This is what makes the horror "stick" to the mask.
if (!watched) {
  residue = min(1, residue + 0.08);
  lastHorrorStamp = 1; // refresh watermark whenever horror is active
} else {
  residue = max(0, residue - 0.012);
  lastHorrorStamp = max(0, lastHorrorStamp - 0.02);
}


      // panel base
      noStroke();
      fill(0, watched ? 50 : 90);
      rect(x, y, w, h, 10);

      // header
      fill(255, 210);
      textAlign(LEFT, TOP);
      textSize(12);
      text("ACTIVE TASKS", x + 12, y + 10);

      // clean list (mask)
      if (watched) {
        let yy = y + 34;

        for (let i = 0; i < base.length; i++) {
          const item = base[i];
          fill(255, 150);
          text(item.name, x + 12, yy);

          fill(255, 120);
          textAlign(RIGHT, TOP);
          text(item.eta, x + w - 12, yy);

          yy += 20;
          textAlign(LEFT, TOP);
        }

        // calm progress
        const p = 0.25 + (sin(t * 0.7) * 0.5 + 0.5) * 0.35;
        drawProgressBar(x + 12, y + h - 36, w - 24, 16, p, 0);

        fill(255, 140);
        textAlign(LEFT, TOP);
        text("status: normal", x + 12, y + h - 58);

        // --- lingering traces (ONLY when recently unwatched) ---
if (residue > 0.02) {
  const a = 220 * pow(residue, 1.15);

  // 1) faint watermark
  push();
  textAlign(CENTER, CENTER);
  textSize(34);
  fill(255, a * 0.12);
  text("SEEN", x + w * 0.72, y + h * 0.28);
  pop();

  // 2) a couple of old corrupted lines bleeding through
  const showN = min(3, lastHorrorLines.length);
  if (showN > 0) {
    textAlign(LEFT, TOP);
    textSize(11);

    for (let i = 0; i < showN; i++) {
      const msg = lastHorrorLines[lastHorrorLines.length - 1 - i];

      // dark rainbow but low alpha
      fill(
        40 + random(120) * residue,
        10 + random(60) * residue,
        60 + random(160) * residue,
        a
      );

      // place them subtly near bottom like “log remnants”
      const yy = y + h - 86 - i * 16;
      text(msg, x + 12, yy);
    }
  }

  // 3) tiny “status lie” that fades last
  fill(255, a * 0.5);
  textAlign(RIGHT, TOP);
  textSize(11);
  text("status: normal", x + w - 12, y + h - 58);
}

        return;
      }

      // -------------------------
      // HORROR MODE
      // -------------------------

      // list becomes… personal
      let yy = y + 34;

      // escalation controls
      const intensity = pow(g, 1.2);
      const nBad = 2 + Math.floor(8 * intensity);

      // draw “good” tasks but corrupted
      for (let i = 0; i < base.length; i++) {
        const item = base[i];

        const txt = glitchText(item.name, g);
        fill(255, 120 + 80 * intensity);
        text(txt, x + 12 + random(-6, 6) * intensity, yy + random(-2, 2) * intensity);

        fill(255, 90);
        textAlign(RIGHT, TOP);
        const eta = (random() < 0.35 + 0.4 * intensity) ? "??:??:??" : item.eta;
        text(eta, x + w - 12 + random(-8, 8) * intensity, yy);

        yy += 20;
        textAlign(LEFT, TOP);
      }

      // then inject corrupted tasks underneath
      fill(255, 200);
      text("PENDING", x + 12, yy + 6);
      yy += 26;

      lastHorrorLines = [];

      for (let i = 0; i < nBad; i++) {
        // cache the last horror lines so they can haunt the clean state
        const idx = Math.floor((t * 1.5 + i * 3) % corrupted.length);
        let name = corrupted[idx];

        // occasionally replace with "you"
        if (random() < 0.08 + 0.20 * intensity) name = "Observe: YOU";

        

        // make it feel like it’s being typed by something else
        const typed = name.slice(0, Math.floor((t * 10 + i * 9) % (name.length + 1)));
        const out = glitchText(typed, g);

        // store for later (clean residue mode)
if (out && out.length > 0) lastHorrorLines.push(out);


        // dark rainbow text
        fill(60 + random(140) * intensity, 20 + random(80) * intensity, 80 + random(160) * intensity, 150 + 90 * intensity);
        text(out, x + 12 + random(-10, 10) * intensity, yy);

        // fake priority
        fill(255, 90 + 80 * intensity);
        textAlign(RIGHT, TOP);
        const pri = ["low", "med", "high", "urgent", "YOU"][Math.floor(random(5))];
        text(pri, x + w - 12, yy);

        yy += 18;
        textAlign(LEFT, TOP);

        if (yy > y + h - 70) break;
      }

      // progress becomes “possession”
      const p = constrain(0.45 + noise(t * 0.9) * 0.9, 0, 1);
      drawProgressBar(x + 12, y + h - 36, w - 24, 16, p, g);

      // status lies
      fill(255, 140);
      textAlign(LEFT, TOP);
      const statusLine = (random() < 0.35 + 0.4 * intensity)
        ? "status: running normally"
        : "status: YOU ARE SAFE";
      text(glitchText(statusLine, g), x + 12, y + h - 58);

      // stamp + eye inside the panel (horrific)
      drawCreepyStamp(x, y, w, h, g);
      drawEyeInProgress(x, y, w, h, g);

      // extra: subtle watcher overlay if available (won’t crash if missing)
      if (typeof drawWatcherOverlay === "function") {
        if (g > 0.22) drawWatcherOverlay(x, y, w, h, g);
      }
    }
  };
}
