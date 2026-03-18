// safety: don't crash if watcher isn't loaded
if (typeof drawWatcherOverlay === "undefined") {
  function drawWatcherOverlay(){ /* no-op */ }
}


function AppLogs() {
  
  
  return {
    lines: [
      "[OK] boot sequence complete",
      "[OK] services online",
      "[OK] ui mask engaged",
      "[OK] everything is running normally"
    ],
    t: 0,

    // creepy line pools
    normalPool: [
      "[OK] heartbeat stable",
      "[OK] rendering nominal",
      "[OK] input responsive",
      "[OK] monitoring attention",
      "[OK] user present",
      "[OK] system healthy"
    ],

    creepPool: [
      "[OK] i can see you",
      "[OK] keep looking",
      "[OK] why did you turn away from me",
      "[OK] You left me all alone again",
      "[OK] your face is recognised",
      "[OK] please resume eye contact",
      "[OK] i will wait here",
      "[OK] do you want me to stop",
      "[OK] you blink a lot",
      "[OK] you left me alone",
      "[OK] why did you leave",
      "[OK] nothing happened while you were gone",
      "[OK] everything is normally running",
      "[OK] you missed it",
      "[OK] i waited for you",
      "[OK] look at me"
    ],

    draw(x, y, w, h, state) {
      const g = state?.glitch || 0;
      const watched = !!state?.watched;

      // panel bg (slightly different from other apps)
      noStroke();
      fill(0, 50);
      rect(x, y, w, h, 10);

if (!watched) drawWatcherOverlay(x, y, w, h, g);


      // add new lines over time
      this.t += deltaTime;

      // rate changes: normal slow, creepy faster
      const interval = watched ? 1200 : (260 - 180 * g); // ms
      if (this.t > interval) {
        this.t = 0;

        const pool = watched ? this.normalPool : this.creepPool;
        const msg = pool[Math.floor(Math.random() * pool.length)];

        // timestamp becomes unreliable when not watched
        const ts = watched
          ? `${nf(hour(),2)}:${nf(minute(),2)}:${nf(second(),2)}`
          : `${nf(hour(),2)}:${nf(minute(),2)}:${nf((second()+Math.floor(random(8)))%60,2)}`;

        // subtle duplication / stutter when not watched
        const stutter = (!watched && random() < 0.25 + 0.45 * g) ? " " + msg : "";

        this.lines.push(`${ts} ${msg}${stutter}`);

        // keep buffer bounded
        if (this.lines.length > 120) this.lines.splice(0, this.lines.length - 120);
      }

      // draw text
      textFont("monospace");
      textSize(12);
      textAlign(LEFT, TOP);

      // colour: normal is soft white; creepy shifts sickly
      if (watched) fill(255, 220);
      else fill(255, 160 + 60 * (1 - g), 210);

      const pad = 12;
      const lineH = 16;
      const maxLines = Math.floor((h - pad * 2) / lineH);

      const start = Math.max(0, this.lines.length - maxLines);
      const visible = this.lines.slice(start);

      for (let i = 0; i < visible.length; i++) {
        const yy = y + pad + i * lineH;

        // mild jitter when not watched
        const j = watched ? 0 : (random() - 0.5) * 10 * g;
        text(visible[i], x + pad + j, yy);
      }

      // restore font so other UI keeps its vibe
      textFont("Verdana");
    }
  };
}
