let strokeOption;
let baseSize;
let scale;
let canvas = 800;
let bgColor = [247, 241, 219];

let stripes = [];          
let stripeCenters = [];    
let basePoints = [];       
let currentStripe = 0;     
let layer2Drawn = false;

const numGroups = 500;
const firstLayerGroups = Math.floor(numGroups * 0.7);

let mainHiddenLineStripe;
let speedMultiplier = 1;
let eHeld = false;

let mainAngle;
let autoAngles = [];

const ANGLE_EPS = 2;
const MIN_OVERLAP_ANGLE = 10;


// Scaling 
function adjustStrokeAndScale() {
  baseSize = (windowWidth + windowHeight) / 2;
  scale = baseSize / canvas;
  strokeOption = [0.4, 0.8, 1, 2, 3.5].map(s => s * scale);
}



function getNewStripeBasePoint() {
  const minDist = 130 * scale; 
  const rx = width * 0.4;   // 0.4 * 2 = 0.8
  const ry = height * 0.4;

  let x = 0, y = 0;

  for (let attempt = 0; attempt < 50; attempt++) {
    x = random(-rx, rx);
    y = random(-ry, ry);

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



// Stripe Creation 
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
    if (idx % 2 === 0) {
      linesData.push({
        x1: l.x1 + perpX * offsetAmount,
        y1: l.y1 + perpY * offsetAmount,
        x2: l.x2 + perpX * offsetAmount,
        y2: l.y2 + perpY * offsetAmount,
        weight: l.weight * 3,
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




function createLineGroups() {
  const isBgStripe = random() < 0.05;
  const baseAngles = [90, 45, -45];

  if (isBgStripe) {
    const blacks = stripes.filter(s => !s.isBg);
    if (blacks.length > 0 && random() < 0.5) {
      return createBgOverlayAlignedToStripe(random(blacks));
    }
  }

  let linesData = [];
  let angleDeg = autoAngles.length > 0 ? autoAngles.pop() : random(baseAngles);
  let lineColor = isBgStripe ? color(bgColor) : color(0);

  let basePoint = basePoints.length > 0 ? basePoints.pop() : getNewStripeBasePoint();

  let shiftAmount = random(5, 12);
  let shiftX = random([-shiftAmount, shiftAmount]);
  let shiftY = random([-shiftAmount, shiftAmount]);

  const x1 = basePoint.x + shiftX;
  const y1 = basePoint.y + shiftY;

  const lineLength = random(120, 260) * scale;
  const dirX = cos(angleDeg);
  const dirY = sin(angleDeg);

  const x2Base = x1 + dirX * lineLength;
  const y2Base = y1 + dirY * lineLength;

  const perpX = -dirY;
  const perpY = dirX;

  let numLines = floor(random(8, 20));
  let spacingBase = random(3, 8) * scale;
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



// Hidden Main Line 
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



// Overlay on Click
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
    angleDeg
  });
}



// Stripe Class 
class LineStripe {
  constructor(g) {
    this.data = g.lines;
    this.currentLen = 0;
    this.maxLen = g.lines[0].length;
    this.drawSpeed = 15;
    this.done = false;
    this.isBg = g.isBg;
    this.angleDeg = g.angleDeg;

    const l = g.lines[0];
    this.x1 = l.x1;
    this.y1 = l.y1;
    this.x2 = l.x2;
    this.y2 = l.y2;
    this.cx = (l.x1 + l.x2) / 2;
    this.cy = (l.y1 + l.y2) / 2;
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



// Angle + Overlap Rules 
function angleDiff(a1, a2) {
  let diff = abs(a1 - a2) % 360;
  if (diff > 180) diff = 360 - diff;
  return diff;
}

function segmentIntersection(x1, y1, x2, y2, x3, y3, x4, y4) {
  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (abs(denom) < 0.0001) return null;

  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  const u = ((x1 - x3) * (y1 - y2) - (y1 - y3) * (x1 - x2)) / denom;

  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return {
      x: x1 + t * (x2 - x1),
      y: y1 + t * (y2 - y1)
    };
  }
  return null;
}


function canOverlap(stripeA, stripeB) {
  const p = segmentIntersection(
    stripeA.x1, stripeA.y1, stripeA.x2, stripeA.y2,
    stripeB.x1, stripeB.y1, stripeB.x2, stripeB.y2
  );

  if (!p) return true;

  const diff = angleDiff(stripeA.angleDeg, stripeB.angleDeg);

  if (diff < ANGLE_EPS) {
    const dA = dist(p.x, p.y, stripeA.cx, stripeA.cy);
    const dB = dist(p.x, p.y, stripeB.cx, stripeB.cy);

    return (dA < stripeA.maxLen * 0.4) && (dB < stripeB.maxLen * 0.4);
  }

  return diff > MIN_OVERLAP_ANGLE;
}


function isStripeValid(newStripe) {
  for (let s of stripes) {
    if (!canOverlap(newStripe, s)) {
      return false;
    }
  }
  return true;
}



// Reset Sketch 
function resetSketch() {
  background(bgColor);
  stripes = [];
  stripeCenters = [];
  basePoints = [];
  autoAngles = [];
  currentStripe = 0;
  layer2Drawn = false;

  const baseAngles = [90, 45, -45];
  let per = floor(numGroups / 3);
  let rem = numGroups - per * 3;

  for (let a of baseAngles) {
    for (let i = 0; i < per; i++) autoAngles.push(a);
  }
  for (let i = 0; i < rem; i++) autoAngles.push(baseAngles[i % 3]);

  shuffle(autoAngles, true);

  const cxw = width * 0.8;
  const cyh = height * 0.8;

  const cols = 14;
  const rows = ceil(numGroups / cols);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (basePoints.length >= numGroups) break;

      basePoints.push({
        x: map(c + 0.5, 0, cols, -cxw / 2, cxw / 2),
        y: map(r + 0.5, 0, rows, -cyh / 2, cyh / 2)
      });
    }
  }

  shuffle(basePoints, true);

  for (let g = 0; g < numGroups; g++) {
    let tries = 0;
    let stripe;
    do {
      stripe = createLineGroups();
      tries++;
    } while (!isStripeValid(stripe) && tries < 40);

    if (isStripeValid(stripe)) stripes.push(stripe);
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



// Draw 
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



// Controls 
function keyPressed() {
  if (key === ' ') speedMultiplier = speedMultiplier === 0 ? 1 : 0;
  if (key === 'f' || key === 'F') speedMultiplier = 2;
  if (key === 's' || key === 'S') speedMultiplier = 0.5;

  if (key === 'r' || key === 'R') {
    resetSketch();
    speedMultiplier = 1;
  }

  if (key === 'e' || key === 'E') eHeld = true;
}

function keyReleased() {
  if (key === 'e' || key === 'E') eHeld = false;
}



function mousePressed() {
  if (eHeld) {
    let cx = mouseX - width / 2;
    let cy = mouseY - height / 2;

    let overlay = createOverlayStripeAtClick(cx, cy);
    if (isStripeValid(overlay)) {
      stripes.splice(currentStripe + 1, 0, overlay);
    }
  }
}



function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  adjustStrokeAndScale();
  background(bgColor);
  resetSketch();
}
