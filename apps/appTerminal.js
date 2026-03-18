// appTerminal.js
// Terminal app: wrapped lines + clipped drawing + simple commands

function AppTerminal() {
  // buffer is an array of "logical" lines (before wrapping)
  let buffer = [
    "[monitor] gaze restored",
    "[monitor] type `help`",
  ];

  let input = "";
  let blinkT = 0;

  const prompt = "> ";
  const fontSize = 10;
  const lineH = 18;
  const pad = 16;

  function pushLine(s) {
    if (s === undefined || s === null) return;
    buffer.push(String(s));
    // keep it from growing forever
    if (buffer.length > 200) buffer = buffer.slice(buffer.length - 200);
  }

  // --- WRAP a single line to fit a pixel width ---
  function wrapLineToWidth(str, maxPx) {
    // p5 textWidth() uses current text settings, so set font+size before calling this.
    if (textWidth(str) <= maxPx) return [str];

    const words = str.split(" ");
    const out = [];
    let line = "";

    for (let w of words) {
      const test = line.length ? (line + " " + w) : w;

      if (textWidth(test) <= maxPx) {
        line = test;
      } else {
        if (line.length) out.push(line);

        // if a *single word* is too long, hard-break it
        if (textWidth(w) > maxPx) {
          let chunk = "";
          for (let i = 0; i < w.length; i++) {
            const testChunk = chunk + w[i];
            if (textWidth(testChunk) <= maxPx) {
              chunk = testChunk;
            } else {
              out.push(chunk);
              chunk = w[i];
            }
          }
          line = chunk;
        } else {
          line = w;
        }
      }
    }

    if (line.length) out.push(line);
    return out;
  }

  function buildWrappedLines(maxPx) {
    const wrapped = [];
    for (let ln of buffer) {
      const parts = wrapLineToWidth(ln, maxPx);
      for (let p of parts) wrapped.push(p);
    }
    return wrapped;
  }

  function runCommand(cmdRaw) {
    const cmd = cmdRaw.trim();

    if (!cmd) return;

    if (cmd === "help") {
      pushLine("commands: help, clear, status, echo, whoami");
      return;
    }

    if (cmd === "clear") {
      buffer = [];
      return;
    }

    if (cmd === "status") {
      pushLine("[system] Everything is running normally.");
      pushLine("[monitor] attention stream: OK");
      return;
    }

    if (cmd.startsWith("echo ")) {
      pushLine(cmd.slice(5));
      return;
    }

    if(cmd.startsWith("whoami")){
        pushLine("please don't leave");
        return;
    }
    if(md.startsWith("whoareyou")){
        pushLine("lonely")
        return;
    }
    // default response
    pushLine("[error] command not found: " + cmd);
  }

  return {
    id: "terminal",

    // called by DesktopUI when this window is focused
    keyTyped(k) {
      if (k && k.length === 1 && k !== "\n" && k !== "\r") {
        input += k;
      }
    },

    keyPressed(keyCode, key) {
      if (keyCode === BACKSPACE) {
        input = input.slice(0, -1);
        return;
      }

      if (keyCode === ENTER || keyCode === RETURN) {
        pushLine(prompt + input);
        runCommand(input);
        input = "";
        return;
      }
    },

    draw(x, y, w, h, state) {
      // terminal panel background
      noStroke();
      fill(0, 120);
      rect(x, y, w, h, 14);

      // inner “screen”
      const sx = x + pad;
      const sy = y + pad;
      const sw = w - pad * 2;
      const sh = h - pad * 2;

      fill(10, 170);
      rect(sx, sy, sw, sh, 12);

      // clip so nothing can draw outside terminal content
      drawingContext.save();
      drawingContext.beginPath();
      drawingContext.rect(sx, sy, sw, sh);
      drawingContext.clip();

      // text settings
      textFont("monospace");
      textSize(fontSize);
      textAlign(LEFT, TOP);

      // wrap based on available pixel width
      const wrapped = buildWrappedLines(sw - 10);

      // how many lines can we show?
      const maxLines = Math.floor((sh - 26) / lineH); // leave room for input line
      const start = Math.max(0, wrapped.length - maxLines);

      // draw wrapped history
      fill(170, 255, 170, 220);
      let yy = sy + 10;
      for (let i = start; i < wrapped.length; i++) {
        text(wrapped[i], sx + 10, yy);
        yy += lineH;
      }

      // input line
      const inputY = sy + sh - 22;
      const shown = prompt + input;
      fill(170, 255, 170, 240);
      text(shown, sx + 10, inputY);

      // cursor blink
      blinkT += deltaTime;
      const on = (Math.floor(blinkT / 450) % 2) === 0;
      if (on) {
        const tw = textWidth(shown);
        stroke(170, 255, 170, 240);
        line(sx + 10 + tw + 2, inputY + 2, sx + 10 + tw + 2, inputY + fontSize + 2);
      }

      drawingContext.restore();
    }
  };
}
