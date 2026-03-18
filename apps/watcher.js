// watcher.js
// Subtle creepy imagery helper: only call this inside window content areas.

function drawWatcherOverlay(x, y, w, h, g) {
  if (g <= 0.02) return;

  push();
  noStroke();

  // darken content area a bit
  fill(0, 40 + 120 * g);
  rect(x, y, w, h, 10);

  // faint scanlines
  fill(255, 6 + 18 * g);
  for (let yy = y; yy < y + h; yy += 6) {
    rect(x, yy + sin(frameCount * 0.04 + yy * 0.05) * 2 * g, w, 1);
  }

  // eyes: appear in “clusters”
  const n = 2 + Math.floor(4 * g);
  for (let i = 0; i < n; i++) {
    // anchor positions drift slowly
    const ex = x + noise(i * 10.2, frameCount * 0.01) * w;
    const ey = y + noise(i * 22.7, frameCount * 0.01 + 99) * h;

    const s = 22 + noise(i * 33.1, frameCount * 0.02) * 40; // eye size
    const alpha = 10 + 70 * g;

    // sclera glow
    fill(255, alpha);
    ellipse(ex, ey, s * 1.6, s);

    // iris (dark rainbow)
    fill(40 + random(80) * g, 10 + random(60) * g, 60 + random(160) * g, 80 + 120 * g);
    ellipse(ex, ey, s * 0.7, s * 0.7);

    // pupil
    fill(0, 160 + 80 * g);
    ellipse(ex + sin(frameCount * 0.03 + i) * 2 * g, ey, s * 0.22, s * 0.22);

    // specular highlight
    fill(255, 60 + 120 * g);
    ellipse(ex - s * 0.12, ey - s * 0.12, s * 0.12, s * 0.12);
  }

  // wrong-way reflection sweep
  fill(255, 8 + 30 * g);
  const sweepW = w * 0.35;
  const sx = x + w - ((frameCount * (2 + 18 * g)) % (w + sweepW));
  rect(sx, y, sweepW, h, 40);

  pop();
}
