let video;
let facemesh;
let predictions = []; //store incoming facemesh results. all the faces facemesh can see in the webcam frame
//atm the attention values are between 0.5 - 0.6, so need to account for that.
//update no theyre not 
let attMin = 0.20; //will update these automatically
let attMax = 0.50; //same as above
//are they watching? state
let isWatched = true;
let watchStrength = 0; //value that will be used for visuals later on
let stability = 0.8; //"mask" stability
let t0; //timer for auto-callibration
//attention will be value between 0 and 1
//0 = not attending to screen (turned away hopefully)
//1 = clearly facing the system
let attention = 0;  //need a function to update this tho

let ui; //lives in desktop.js


function setup() {
createCanvas(windowWidth, windowHeight);

  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide(); // hide raw webcam

facemesh = ml5.facemesh(video, modelReady);

let t = millis() //for calibration
t0 = millis(); //for calibration

//facemesh constantly analyse webcam video
//when it finish analysing it fires a "predict" event
//results = the output for that frame, which we can store in predicrions array
facemesh.on("predict", results =>{
  predictions = results;
});

ui = new DesktopUI();
ui.layout(width,height);

}

function modelReady(){
  console.log("facemesh ready!")
}

function draw() {
  //image(video, 0, 0); //main video feed


updateAttention();
//show attention for debugging
updateWatchSignal();


//when watched "mask" heals quickly
//when not watched, SLOW CREEEEPY
let dt = deltaTime / 1000; // seconds since last frame

//watched -> 1, not watched -> 0
let target = isWatched ? 1 : 0

const SNAP_BACK = 0.008 //SUPER QUICK recover when you start watching agagin 
const DECAY = 0.005 // 0.5 seconds after looking away

// convert time constant to a lerp factor that behaves well with variable fps
let k = isWatched ? (1 - Math.exp(-dt / SNAP_BACK))
                  : (1 - Math.exp(-dt / DECAY));

stability = lerp(stability, target, k);
stability = constrain(stability, 0, 1);


let glitch = 1 - stability;

ui.update({watched: isWatched, stability: stability, glitch: glitch});
ui.draw();


// //  DEBUGGING //
// fill(255);
// textSize(14);
// text(`attention: ${attention.toFixed(2)}`, 20, 20);
// //text(`min/max: ${attMin.toFixed(2)} / ${attMax.toFixed(2)}`, 20, 40);
// text(`watchStrength: ${watchStrength.toFixed(2)}`, 20, 60);
// text(`isWatched: ${isWatched}`, 20, 80);
// text(`stability: ${stability.toFixed(2)}`, 20, 100);



// fill(255);
// textSize(16);
//   text( "Attention:" + nf(attention,1,2),20,30)


  if(predictions.length > 0){    //check if at least one face is detected
   //get the nose tip (facemesh knows what that is, wow!)
    // let noseTip = predictions[0].annotations.noseTip[0];  
    // fill(0,255,0);
    // noStroke();
    // circle(noseTip[0], noseTip[1], 10);  //draw nose dot. 
  }
}

function updateAttention(){
//if no face dsetected, slowly reduce attention
if(predictions.length === 0) {
  attention = max(0,attention - 0.02);
  return; 
}
let face = predictions[0].annotations; //landmark data

//pull out named features of face & pick points as landmarks
let nose = face.noseTip[0]; //first point on this which is the middle
let leftEye = face.leftEyeUpper0[3]; //[3] is the 4th point along top edge of left eye
let rightEye = face.rightEyeUpper0[3]; //same as above but right

//measure distance from nose to each eye
let distanceLeft = dist(
  nose[0], nose[1],
  leftEye[0], leftEye[1]
)
let distanceRight = dist(
  nose[0], nose[1],
  rightEye[0], rightEye[1]
);

//if user is facing forward, distances to left and right will be smaller
//if their head turns then the distance should become larger

let difference = abs(distanceLeft - distanceRight);

//make into symmetry score to make it easier later?
let symmetry = 1 - min(
  1,  difference / max(distanceLeft, distanceRight)
);

//smooth attention values over time
attention = lerp(attention,symmetry, 0.1);
}

function updateWatchSignal() {
  // If no face, treat as not watched
  let raw = (predictions.length === 0) ? 0 : attention;

  // Optional: make it "harder" to count as watched
  raw = pow(raw, 2.2);

  // Faster smoothing for snappy behaviour
  watchStrength = lerp(watchStrength, raw, 0.35);

  // Hysteresis thresholds (tune if needed)
  const ON = 0.8;   // becomes watched
  const OFF = 0.60;  // becomes not watched

  if (!isWatched && watchStrength > ON) isWatched = true;
  if (isWatched && watchStrength < OFF) isWatched = false;
}



function mousePressed() {
  if (typeof ui !== "undefined" && ui) ui.mousePressed(mouseX, mouseY);
  return false;
}

function keyTyped() {
  if (typeof ui !== "undefined" && ui) ui.keyTyped(key);
  return false;
}

function keyPressed() {
  // send keys to desktop UI first
  if (typeof ui !== "undefined" && ui) ui.keyPressed(keyCode, key);

  // keep fullscreen toggle
  if (key === "F") {
    fullscreen(!fullscreen());
  }
  return false;
}


function windowResized() {
  if (fullscreen()) {
    resizeCanvas(windowWidth, windowHeight);
  }
}
function renderDesktopGlitchy() {
  // base desktop still exists
  drawWallpaperGlitchy();
  drawTaskbarGlitchy();
  drawDesktopIconsGlitchy();

  // windows drift + jitter
  let g = 1 - stability;

  drawWindowGlitchy(80, 80, 460, 280, "System Monitor", g);
  drawWindowGlitchy(580, 120, 380, 240, "Task Queue", g);
  drawWindowGlitchy(120, 390, 840, 220, "Logs", g);
  drawWindowGlitchy(1000, 400, 320, 160, "Help", g);
  drawWindowGlitchy(1000, 100, 300, 220, "Terminal", g);

  

  // banner must remain clean (the mask)
  drawStatusBannerClean();
}

function renderDesktopClean() {
  drawWallpaperAeroClean();
  drawTaskbarClean();
  drawDesktopIconsClean();

  // Windows (fixed positions, crisp)
  drawWindowClean(80, 80, 460, 280, "System Monitor");
  drawWindowClean(580, 120, 380, 240, "Task Queue");
  drawWindowClean(120, 390, 840, 220, "Logs");
  drawWindowClean(1000, 400, 320, 160, "Terminal");
  drawWindowClean(1000, 100, 300, 220, "Notes");


  drawStatusBannerClean();
}

function drawWallpaperClean() {
  background(20);
  noStroke();
  // subtle “desktop texture”
  for (let i = 0; i < 30; i++) {
    fill(255, 6);
    rect(random(width), random(height), random(80, 260), 1);
  }
}

function drawTaskbarClean() {
  noStroke();
  fill(255, 26);
  rect(0, height - 46, width, 46);

  // start button
  fill(255, 70);
  rect(12, height - 34, 90, 24, 6);

  fill(20, 220);
  //textFont("monospace");
  textSize(12);
  textAlign(LEFT, CENTER);
  text("start", 26, height - 22);

  // clock
  textAlign(RIGHT, CENTER);
  let t = nf(hour(), 2) + ":" + nf(minute(), 2);
  text(t, width - 16, height - 22);
}

function drawDesktopIconsClean() {
  let icons = [
    { label: "inbox", x: 22, y: 22 },
    { label: "work", x: 22, y: 92 },
    { label: "notes", x: 22, y: 162 },
    { label: "trash", x: 22, y: 232 },
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

function drawWindowClean(x, y, w, h, title) {
  // window body
  noStroke();
  fill(255, 55);
  rect(x, y, w, h, 10);

  // title bar
  fill(255, 90);
  rect(x, y, w, 28, 10, 10, 0, 0);

  // title
  fill(20, 230);
  textAlign(LEFT, CENTER);
  textSize(12);
  text(title, x + 70, y + 14);

  // // buttons
  // fill(255,0,0);
  // circle(x + 180, y + 14, 8);
  // fill("orange")
  // circle(x + 34, y + 14, 8);
  // fill(0,255,0);
  // circle(x + 50, y + 14, 8);

  // content (simple placeholders)
  fill(20, 180);
  textAlign(LEFT, TOP);
  textSize(12);
  text("…", x + 12, y + 40);
}

function drawStatusBannerClean() {
  // should NEVER glitch! 
  noStroke();
  fill(255, 220);
  rect(0, 0, width, 34);

  fill(20, 255);
  textAlign(LEFT, CENTER);
  textSize(14);
  text("Everything is running normally.", 14, 17);
}

function drawWallpaperGlitchy() {
  background(20);
  noStroke();

  for (let i = 0; i < 10; i++) {
    fill(random(255), random(255), random(255), 30);
    rect(random(width), random(height), random(80, 400), random(1, 3));
  }
}

function drawTaskbarGlitchy() {
  let j = random(-6, 6);
  noStroke();
  fill(255, 18);
  rect(0 + j, height - 46 + j, width, 46);

  fill(255, 70);
  rect(12 + j, height - 34 + j, 90, 24, 6);

  fill(20, 220);
  //textFont("monospace");
  textSize(12);
  textAlign(LEFT, CENTER);
  text("start", 26 + j, height - 22 + j);

  textAlign(RIGHT, CENTER);
  let t = nf(hour(), 2) + ":" + nf(minute(), 2);
  text(t, width - 16 + j, height - 22 + j);
}

function drawDesktopIconsGlitchy() {
  let icons = [
    { label: "inbox", x: 22, y: 22 },
    { label: "work", x: 22, y: 92 },
    { label: "notes", x: 22, y: 162 },
    { label: "trash", x: 22, y: 232 },
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

function drawWindowGlitchy(x, y, w, h, title, g) {
  // drift + jitter increases with stability loss
  let driftX = random(-40, 40) * (0.2 + g);
  let driftY = random(-40, 40) * (0.2 + g);

  x += driftX;
  y += driftY;

  noStroke();

  fill(255, 40);
  rect(x, y, w, h, 10);

  fill(random(255), random(255), random(255), 120);
  rect(x, y, w, 28, 10, 10, 0, 0);

  fill(20, 230);
  textAlign(LEFT, CENTER);
  textSize(12);
  let t = (random() < 0.2 + 0.6 * g) ? title.split("").join(" ") : title;
  text(t, x + 10, y + 14);

  // buttons!!!
  if (random() > 0.3 * g) {
    fill((255,0,0));
    circle(x + 18, y + 14, 8);
    fill("yellow")
    circle(x + 34, y + 14, 8);
    fill(0,255,0)
    circle(x + 50, y + 14, 8);
  }

  fill(20, 180);
  textAlign(LEFT, TOP);
  textSize(12);
  text("…", x + 12, y + 40);

  fill(255, 220);
  for (let i = 0; i < 6; i++) {
    let ty = y + random(40, h - 10);
    let th = random(4, 18) * (0.4 + g);
    let tx = x + random(-120, 120) * (0.3 + g);
    rect(tx, ty, w, th, 0);
  }
}
function drawWallpaperAeroClean() {

  // bubbles!!!
  noStroke();
  let gap = 10;
  for (let i = 0; i < 38; i+=gap) {
    let x = (noise(i * 10.1, frameCount * 0.0009) * width);
    let y = (noise(i * 20.2, frameCount * 0.0009) * height);
    let s = 80 + noise(i * 30.3, frameCount * 0.003) * 220;

    fill(255, 18);
    circle(x, y, s);
    fill(255, 10);
    circle(x + s * 0.12, y - s * 0.12, s * 0.55);
  }
  // vertical gradxient blues
  for (let y = 0; y < height; y++) {
    let t = y / height;
    let r = lerp(120, 20, t);
    let g = lerp(210, 120, t);
    let b = lerp(255, 180, t);
    stroke(r, g, b, 80);    //unintentional but a low alpha actually makes this look sick af
    line(0, y, width, y);
  }
}

function mousePressed(){
  if (ui) ui.mousePressed(mouseX, mouseY);
}

function mousePressed() {
  if (ui) ui.mousePressed(mouseX, mouseY);
}

function keyTyped() {
  if (ui) ui.keyTyped(key);
}

function keyPressed() {
  // keep fullscreen toggle
  if (key === 'f' || key === 'F') {
    let fs = fullscreen();
    fullscreen(!fs);
    return;
  }

  // forward keys to UI (ENTER/BACKSPACE/etc)
  if (ui) ui.keyPressed(keyCode, key);
}
