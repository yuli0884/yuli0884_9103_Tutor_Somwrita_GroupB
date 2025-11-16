let strokeOption;
let baseSize;
let scale;
let canvas = 800;
let bgColor = [247, 241, 219];

let stripes = [];          // all stripes (black + background)
let stripeCenters = [];    // store stripe centers
let basePoints = [];       // grid base points for even layout
let currentStripe = 0;     // index of stripe being animated
let layer2Drawn = false;

const numGroups = 500;     // auto stripes count = 500
const firstLayerGroups = Math.floor(numGroups * 0.7);

let mainHiddenLineStripe;
let speedMultiplier = 1;
let eHeld = false;

let mainAngle;
let autoAngles = [];

// Scaling Setup
function adjustStrokeAndScale() {
  baseSize = (windowWidth + windowHeight) / 2;
  scale = baseSize / canvas;
  strokeOption = [0.4, 0.8, 1, 2, 3.5].map(s => s * scale);
}


// Fallback base point (used rarely)
function getNewStripeBasePoint() {
  const minDist = 160 * scale;
  let x = 0, y = 0;

  for (let attempt = 0; attempt < 50; attempt++) {
    x = random(-width / 2, width / 2);
    y = random(-height / 2, height / 2);

    let ok = true;
    for (let c of stripeCenters) {
      if (dist(x, y, c.x, c.y) < minDist) {
        ok = false;
        break;
      }
    }
    if (ok) break;
  }
  return { x, y };
}



// Background overlay stripe aligned to a black stripe
function createBgOverlayAlignedToStripe(base) {
  let linesData = [];

  const angleDeg = base.angleDeg;
  const dirX = cos(angleDeg);
  const dirY = sin(angleDeg);
  const perpX = -dirY;
  const perpY = dirX;

  let offsetAmount = 2;

  let idx = 0;
  for (let l of base.data) {
    // keep every second line to make spacing larger
    if (idx % 2 === 0) {
      linesData.push({
        x1: l.x1 + perpX * offsetAmount,
        y1: l.y1 + perpY * offsetAmount,
        x2: l.x2 + perpX * offsetAmount,
        y2: l.y2 + perpY * offsetAmount,
        weight: l.weight * 3,      // thicker background line
        color: color(bgColor),
        length: l.length
      });
    }
    idx++;
  }

  return new LineStripe({
    lines: linesData,
    isBg: true,
    angleDeg
  });
}

// Auto Stripe (90°, 45°, -45°) with ~5% background
function createLineGroups() {

  const isBgStripe = random() < 0.05;   // ~5% background stripes
  const baseAngles = [90, 45, -45];

  // some background stripes follow an existing black stripe
  if (isBgStripe) {
    const blacks = stripes.filter(s => !s.isBg);
    if (blacks.length > 0 && random() < 0.5) {
      return createBgOverlayAlignedToStripe(random(blacks));
    }
  }

  let linesData = [];
  let angleDeg = autoAngles.length > 0 ? autoAngles.pop() : random(baseAngles);
  let lineColor = isBgStripe ? color(bgColor) : color(0);

  // base position from grid or fallback
  let basePoint = basePoints.length > 0 ? basePoints.pop() : getNewStripeBasePoint();

  // small parallel shift to avoid being too rigid
  let shiftAmount = random(5, 12);
  let shiftX = 0, shiftY = 0;
  let dir = floor(random(4));
  if (dir === 0) shiftX = shiftAmount;
  if (dir === 1) shiftX = -shiftAmount;
  if (dir === 2) shiftY = shiftAmount;
  if (dir === 3) shiftY = -shiftAmount;

  const x1 = basePoint.x + shiftX;
  const y1 = basePoint.y + shiftY;

  // longer stripes to go out of canvas
  const lineLength = random(120, 260) * scale;
  const dirX = cos(angleDeg);
  const dirY = sin(angleDeg);

  const x2Base = x1 + dirX * lineLength;
  const y2Base = y1 + dirY * lineLength;

  const perpX = -dirY;
  const perpY = dirX;

  let numLines = floor(random(8, 20));

  // base spacing
  let spacingBase = random(3, 8) * scale;
  // background stripes have bigger spacing
  let spacing = isBgStripe ? spacingBase * 2 : spacingBase;

  for (let i = 0; i < numLines; i++) {
    let offset = spacing * i;

    let w = isBgStripe ? random(strokeOption) * 3 : random(strokeOption);

    linesData.push({
      x1: x1 + perpX * offset,
      y1: y1 + perpY * offset,
      x2: x2Base + perpX * offset,
      y2: y2Base + perpY * offset,
      weight: w,
      color: lineColor,
      length: lineLength
    });
  }

  stripeCenters.push({
    x: (x1 + x2Base) / 2,
    y: (y1 + y2Base) / 2
  });

  return new LineStripe({
    lines: linesData,
    isBg: isBgStripe,
    angleDeg
  });
}



// Hidden Layer Stripe (Layer 2)
function createMainHiddenLine() {
  let angle = random([45, -45]);
  let y1 = -height / 2;
  let y2 = height / 2;
  let shift = height * tan(angle);
  let x1 = -shift;
  let x2 = shift;

  const weight = random(90, 150) * scale;
  const len = dist(x1, y1, x2, y2);

  return new LineStripe({
    lines: [{ x1, y1, x2, y2, weight, color: color(bgColor), length: len }],
    isBg: true,
    angleDeg: angle
  });
}


// Stripe from E + Click (black, 90/45/-45)
function createOverlayStripeAtClick(cx, cy) {
  let linesData = [];
  const angleDeg = random([90, 45, -45]);

  let lineLength = random(150, 300) * scale;

  let dirX = cos(angleDeg);
  let dirY = sin(angleDeg);

  let shiftAmount = random(5, 15);
  cx += random([-shiftAmount, shiftAmount]);
  cy += random([-shiftAmount, shiftAmount]);

  let half = lineLength / 2;
  let x1 = cx - dirX * half;
  let y1 = cy - dirY * half;
  let x2 = cx + dirX * half;
  let y2 = cy + dirY * half;

  const perpX = -dirY;
  const perpY = dirX;

  let numLines = floor(random(8, 18));
  let spacing = random(3, 7) * scale;

  for (let i = 0; i < numLines; i++) {
    let offset = (i - numLines / 2) * spacing;

    linesData.push({
      x1: x1 + perpX * offset,
      y1: y1 + perpY * offset,
      x2: x2 + perpX * offset,
      y2: y2 + perpY * offset,
      weight: random(strokeOption),
      color: color(0),
      length: lineLength
    });
  }

  return new LineStripe({
    lines: linesData,
    isBg: false,
    angleDeg: angleDeg
  });
}



// Stripe Animation Class
class LineStripe {
  constructor(g) {
    this.data = g.lines;
    this.currentLen = 0;
    this.maxLen = g.lines[0].length;
    this.drawSpeed = 15;
    this.done = false;
    this.isBg = g.isBg;
    this.angleDeg = g.angleDeg;
  }

  displayStep() {
    if (this.done) return;

    push();
    noFill();

    for (let l of this.data) {
      stroke(l.color);
      strokeWeight(l.weight);

      let p2X = l.x1 + (l.x2 - l.x1) * (this.currentLen / this.maxLen);
      let p2Y = l.y1 + (l.y2 - l.y1) * (this.currentLen / this.maxLen);

      line(l.x1, l.y1, p2X, p2Y);
    }

    pop();

    this.currentLen += this.drawSpeed * speedMultiplier;

    if (this.currentLen >= this.maxLen) {
      this.currentLen = this.maxLen;
      this.done = true;
    }
  }
}



// Reset Drawing
function resetSketch() {
  background(bgColor);
  stripes = [];
  stripeCenters = [];
  basePoints = [];
  autoAngles = [];
  currentStripe = 0;
  layer2Drawn = false;

  // make angles even: 90 / 45 / -45
  const baseAngles = [90, 45, -45];
  let per = Math.floor(numGroups / 3);
  let rem = numGroups - per * 3;

  for (let a of baseAngles) {
    for (let i = 0; i < per; i++) autoAngles.push(a);
  }
  for (let i = 0; i < rem; i++) autoAngles.push(baseAngles[i % 3]);

  shuffle(autoAngles, true);

  // grid layout with margin so stripes can extend out of canvas
  const cols = 18; // grid columns
  const rows = Math.ceil(numGroups / cols);
  const marginX = width * 0.2;
  const marginY = height * 0.2;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (basePoints.length >= numGroups) break;
      basePoints.push({
        x: map(c + 0.5, 0, cols, -width / 2 - marginX, width / 2 + marginX),
        y: map(r + 0.5, 0, rows, -height / 2 - marginY, height / 2 + marginY)
      });
    }
  }

  shuffle(basePoints, true);

  // create auto stripes
  for (let g = 0; g < numGroups; g++) {
    stripes.push(createLineGroups());
  }

  mainHiddenLineStripe = createMainHiddenLine();
}



// Setup
function setup() {
  createCanvas(windowWidth, windowHeight);
  angleMode(DEGREES);
  adjustStrokeAndScale();
  background(bgColor);

  mainAngle = 45;
  resetSketch();
}



// Draw Loop
function draw() {
  translate(width / 2, height / 2);

  if (!layer2Drawn && currentStripe === firstLayerGroups) {
    stripes.splice(currentStripe, 0, mainHiddenLineStripe);
    layer2Drawn = true;
  }

  if (currentStripe < stripes.length) {
    stripes[currentStripe].displayStep();
    if (stripes[currentStripe].done) currentStripe++;
  }
}



// Keyboard Controls
function keyPressed() {
  if (key === ' ') speedMultiplier = speedMultiplier === 0 ? 1 : 0; // pause / continue
  if (key === 'f' || key === 'F') speedMultiplier = 2;              // faster
  if (key === 's' || key === 'S') speedMultiplier = 0.5;            // slower

  if (key === 'r' || key === 'R') {
    resetSketch();
    speedMultiplier = 1;
  }

  if (key === 'e' || key === 'E') eHeld = true;                     // hold E
}

function keyReleased() {
  if (key === 'e' || key === 'E') eHeld = false;
}



// Mouse: E + Click = new stripe
function mousePressed() {
  if (eHeld) {
    let cx = mouseX - width / 2;
    let cy = mouseY - height / 2;
    let overlay = createOverlayStripeAtClick(cx, cy);
    stripes.splice(currentStripe + 1, 0, overlay);
  }
}



// Resize Window
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  adjustStrokeAndScale();
  background(bgColor);
  resetSketch();
}
