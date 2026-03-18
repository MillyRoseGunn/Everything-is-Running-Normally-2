// appHelp.js
function AppHelp() {
  let input = "";
  let blinkT = 0;

  let lines = [
    "Help Center",
    "",
    "• Click traffic lights to close/minimise/maximise windows.",
    "• Use the search bar to locate tools.",
    "• Terminal accepts basic commands.",
    "",
    "Everything is running normally."
  ];

  let t = 0;
  let lastWatched = true;

  function pushLine(s) {
    lines.push(s);
    if (lines.length > 90) lines.splice(0, lines.length - 90);
  }

  function respond(msg, watched, g) {
    const cleanReplies = [
      "Thank you. Your request has been logged.",
      "Your response has been collected.",
      "Everything is running normally.",
      "Your action is not required.",
      "You are not required."
    ];

    const creepReplies = [
      "Thank you. I heard you.",
      "You don't need help. You need to look.",
      "Please maintain eye contact.",
      "We are very close to resolving you.",
      "Did you look away? I don't like that.",
      "Everything is running normally.",
      "Everything is running normally..",
      "Everything is running normally..."
    ];

const pool = Math.random() < 0.5 ? cleanReplies : creepReplies;
    let r = pool[Math.floor(Math.random() * pool.length)];

    // slight corruption / doubling when not watched
    if (!watched && random() < 0.25 + 0.55 * g) r = r + " " + r;

    pushLine("> " + msg);
    pushLine(r);
  }

  return {
    draw(x, y, w, h, state) {
      const watched = !!state?.watched;
      const g = state?.glitch || 0;

      // background
      noStroke();
      fill(255, 18);
      rect(x, y, w, h, 10);
    
      // creepy shit inside help only when not watched
if (!watched) drawWatcherOverlay(x, y, w, h, g);


      // watched toggle note
      if (watched !== lastWatched) {
        lastWatched = watched;
        if (!watched) {
          pushLine("");
          pushLine("Everything is running normally.");
          pushLine("Do not look away.");
        } else {
          pushLine("");
          pushLine("Thank you for returning.");
        }
      }

      // while not watched: text subtly rewrites itself over time
      t += deltaTime;
      if (!watched) {
        const interval = 1400 - 900 * g;
        if (t > interval) {
          t = 0;

          const corruptions = [
            "Everything is running normally.",
            "Everything is running n0rma11y.",
            "Everything is running",
            "Watching is running normally..",
            "Everything is n0rm4lly Watch1n9",
            "Running is normal.",
            "Everything is watching normally."
          ];

          // sometimes address the user
          if (random() < 0.25 + 0.45 * g) {
            pushLine("I can still see your face.");
          } else {
            pushLine(corruptions[Math.floor(Math.random() * corruptions.length)]);
          }
        }
      } else {
        t = 0;
      }

      // text area
      const pad = 14;
      const textTop = y + pad;
      const textLeft = x + pad;
      const textRight = x + w - pad;

      textFont("Verdana");
      textSize(12);
      textAlign(LEFT, TOP);

      // colour shifts when not watched
      if (watched) fill(20, 210);
      else fill(30 + 220 * g, 40, 80 + 140 * (1 - g), 220);

      const lineH = 16;
      const inputH = 40;
      const maxLines = Math.floor((h - pad * 2 - inputH) / lineH);

      const start = Math.max(0, lines.length - maxLines);
      let yy = textTop;

      for (let i = start; i < lines.length; i++) {
        const j = watched ? 0 : (random() - 0.5) * 8 * g;
        text(lines[i], textLeft + j, yy);
        yy += lineH;
      }

      // input area (fake support box)
      const boxY = y + h - pad - 28;
      noStroke();
      fill(255, watched ? 90 : (50 + 70 * (1 - g)));
      rect(x + pad, boxY, w - pad * 2, 28, 10);

      fill(20, 220);
      textAlign(LEFT, CENTER);
      const prompt = watched ? "Ask for help…" : "Say it.";
      const shown = input.length ? input : prompt;
      const alpha = input.length ? 230 : 120;
      fill(20, alpha);
      text(shown, x + pad + 10, boxY + 14);

      // cursor blink when focused (handled by DesktopUI focus)
      blinkT += deltaTime;
      const cursorOn = (Math.floor(blinkT / 450) % 2) === 0;
      if (cursorOn && this._focused) {
        const tw = textWidth(input);
        stroke(20, 200);
        line(x + pad + 10 + tw + 2, boxY + 7, x + pad + 10 + tw + 2, boxY + 21);
      }
    },

    // Called by DesktopUI when this window is focused/unfocused
    setFocused(on) {
      this._focused = on;
      if (on) blinkT = 0;
    },

    keyTyped(k) {
      if (!this._focused) return;
      if (k.length === 1 && k !== "\n" && k !== "\r") {
        input += k;
      }
    },

    keyPressed(keyCode, key) {
      if (!this._focused) return;

      if (keyCode === BACKSPACE) {
        input = input.slice(0, -1);
        return;
      }

      if (keyCode === ENTER || keyCode === RETURN) {
        const msg = input.trim();
        if (msg.length) {
          // respond based on current watched state:
          // DesktopUI doesn't pass state here, so we infer from globals:
          // (we’ll improve this next if you want)
          const watched = window.__WATCHED__ === true;
          const g = window.__GLITCH__ || 0;
          respond(msg, watched, g);
        }
        input = "";
        return;
      }

      if (keyCode === ESCAPE) {
        input = "";
      }
    }
  };
}
