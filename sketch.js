// 宣告所有狀態的圖片精靈變數
let idleSheet, walkSheet, runSheet;
// 宣告存放切割後畫格的陣列
let idleFrames = [], walkFrames = [], runFrames = [];

// 1. 靜止狀態設定：6張，總寬 805，高 190
const IDLE_WIDTH = 805;
const IDLE_HEIGHT = 190;
const IDLE_TOTAL = 6;

// 2. 走路狀態設定（2/走路/走.png）：9張，總寬 1147，高 195
const WALK_WIDTH = 1147;
const WALK_HEIGHT = 195;
const WALK_TOTAL = 9;

// 3. 跑步狀態設定（2/跑/跑.png）：7張，總寬 1241，高 190
const RUN_WIDTH = 1241;
const RUN_HEIGHT = 190;
const RUN_TOTAL = 7;

// 每張畫格切換時間（毫秒）
const FRAME_INTERVAL = 100;

// 角色狀態與移動控制變數
let currentState = 'idle'; // 'idle'（靜止）、'walk'（走路）、'run'（跑步）
let facing = 1;            // 1 為向右，-1 為向左（水平翻轉）
let charX;                 // 角色 X 座標
const WALK_SPEED = 3.5;    // 走路速度
const RUN_SPEED = 7;       // 跑步速度（較快）

// 動畫播放變數
let currentFrame = 0;
let lastFrameTime = 0;
let imagesLoaded = false;

// p5.js 預載入函式：載入所有圖片精靈
function preload() {
  idleSheet = loadImage('2/靜止/靜止.png', 
    () => console.log('✓ 靜止圖片載入成功'), 
    (err) => console.error('✗ 靜止圖片載入失敗:', err)
  );
  
  walkSheet = loadImage('2/走路/走.png', 
    () => console.log('✓ 走路圖片載入成功'), 
    (err) => console.error('✗ 走路圖片載入失敗:', err)
  );

  runSheet = loadImage('2/跑/跑.png', 
    () => console.log('✓ 跑步圖片載入成功'), 
    (err) => console.error('✗ 跑步圖片載入失敗:', err)
  );
}

// 初始化設定函式
function setup() {
  createCanvas(windowWidth, windowHeight);
  charX = width * 2 / 3; // 初始位置在視窗 2/3 處
  
  if (idleSheet && idleSheet.width > 0 && walkSheet && walkSheet.width > 0 && runSheet && runSheet.width > 0) {
    sliceSheets();
    imagesLoaded = true;
  }
}

// 嚴格切割圖片精靈（使用 Math.floor 確保整數像素，避免畫面抖動）
function sliceSheets() {
  idleFrames = [];
  walkFrames = [];
  runFrames = [];
  
  // 切割靜止圖格
  let idleW = IDLE_WIDTH / IDLE_TOTAL;
  for (let i = 0; i < IDLE_TOTAL; i++) {
    let x = Math.floor(i * idleW);
    let nextX = Math.floor((i + 1) * idleW);
    idleFrames.push(idleSheet.get(x, 0, nextX - x, IDLE_HEIGHT));
  }
  
  // 切割走路圖格
  let walkW = WALK_WIDTH / WALK_TOTAL;
  for (let i = 0; i < WALK_TOTAL; i++) {
    let x = Math.floor(i * walkW);
    let nextX = Math.floor((i + 1) * walkW);
    walkFrames.push(walkSheet.get(x, 0, nextX - x, WALK_HEIGHT));
  }

  // 切割跑步圖格（2/跑/跑.png）
  let runW = RUN_WIDTH / RUN_TOTAL;
  for (let i = 0; i < RUN_TOTAL; i++) {
    let x = Math.floor(i * runW);
    let nextX = Math.floor((i + 1) * runW);
    runFrames.push(runSheet.get(x, 0, nextX - x, RUN_HEIGHT));
  }
}

// 繪圖主迴圈
function draw() {
  background('#87CEEB'); // 天空色背景
  
  // 非同步防呆檢查
  if (!imagesLoaded) {
    if (idleSheet && idleSheet.width > 0 && walkSheet && walkSheet.width > 0 && runSheet && runSheet.width > 0 && idleFrames.length === 0) {
      sliceSheets();
      imagesLoaded = true;
    } else {
      fill(255, 0, 0);
      textSize(18);
      textAlign(CENTER, CENTER);
      text("⚠️ 圖片載入中，或請檢查檔案路徑（確認 2/跑/跑.png 存在）", width / 2, height / 2);
      return;
    }
  }
  
  // 1. 處理按鍵輸入、狀態切換與移動
  handleInputAndMovement();
  
  // 2. 更新動畫畫格
  updateAnimation();
  
  // 3. 繪製角色
  drawCharacter();
}

// 處理按鍵、移動與邊界碰撞
function handleInputAndMovement() {
  // 偵測走路按鍵（左右方向鍵）
  let isWalkLeft = keyIsDown(LEFT_ARROW);
  let isWalkRight = keyIsDown(RIGHT_ARROW);
  
  // 偵測跑步按鍵（「4」與「6」鍵：支援主鍵盤 52/54 與數字鍵盤 100/102）
  let isRunLeft = keyIsDown(52) || keyIsDown(100);   // 4 鍵
  let isRunRight = keyIsDown(54) || keyIsDown(102);  // 6 鍵
  
  // 計算目前圖框的一半寬度作為邊界判定
  let currentWidth = IDLE_WIDTH / IDLE_TOTAL;
  if (currentState === 'walk') currentWidth = WALK_WIDTH / WALK_TOTAL;
  if (currentState === 'run') currentWidth = RUN_WIDTH / RUN_TOTAL;
  let halfWidth = currentWidth / 2;
  
  if (isRunRight) {
    // 跑步向右 (6鍵)
    if (currentState !== 'run' || facing !== 1) {
      currentState = 'run';
      facing = 1;
      currentFrame = 0; // 每次起跑從第 1 張開始
      lastFrameTime = millis();
    }
    if (charX < width - halfWidth) {
      charX += RUN_SPEED;
      if (charX > width - halfWidth) charX = width - halfWidth;
    }
  } 
  else if (isRunLeft) {
    // 跑步向左 (4鍵)
    if (currentState !== 'run' || facing !== -1) {
      currentState = 'run';
      facing = -1;
      currentFrame = 0; // 每次起跑從第 1 張開始
      lastFrameTime = millis();
    }
    if (charX > halfWidth) {
      charX -= RUN_SPEED;
      if (charX < halfWidth) charX = halfWidth;
    }
  }
  else if (isWalkRight) {
    // 走路向右 (右方向鍵)
    if (currentState !== 'walk' || facing !== 1) {
      currentState = 'walk';
      facing = 1;
      currentFrame = 0; // 每次起跑從第 1 張開始
      lastFrameTime = millis();
    }
    if (charX < width - halfWidth) {
      charX += WALK_SPEED;
      if (charX > width - halfWidth) charX = width - halfWidth;
    }
  } 
  else if (isWalkLeft) {
    // 走路向左 (左方向鍵)
    if (currentState !== 'walk' || facing !== -1) {
      currentState = 'walk';
      facing = -1;
      currentFrame = 0; // 每次起跑從第 1 張開始
      lastFrameTime = millis();
    }
    if (charX > halfWidth) {
      charX -= WALK_SPEED;
      if (charX < halfWidth) charX = halfWidth;
    }
  } 
  else {
    // 沒有按任何移動鍵時，回到靜止狀態
    if (currentState !== 'idle') {
      currentState = 'idle';
      currentFrame = 0;
      lastFrameTime = millis();
    }
  }
}

// 更新動畫畫格索引
function updateAnimation() {
  if (millis() - lastFrameTime >= FRAME_INTERVAL) {
    lastFrameTime = millis();
    
    if (currentState === 'idle') {
      // 靜止狀態：循環播放 6 張圖 (索引 0~5)
      currentFrame = (currentFrame + 1) % IDLE_TOTAL;
    } 
    else if (currentState === 'walk') {
      // 走路狀態：循環播放第 4~6 張（索引 3, 4, 5）
      currentFrame++;
      if (currentFrame > 5) {
        currentFrame = 3;
      }
    } 
    else if (currentState === 'run') {
      // 跑步狀態：循環播放 7 張圖 (索引 0~6)
      currentFrame = (currentFrame + 1) % RUN_TOTAL;
    }
  }
}

// 繪製角色到畫布上
function drawCharacter() {
  let frames;
  if (currentState === 'walk') frames = walkFrames;
  else if (currentState === 'run') frames = runFrames;
  else frames = idleFrames;
  
  if (frames.length === 0) return;
  currentFrame = constrain(currentFrame, 0, frames.length - 1);
  
  let currentImg = frames[currentFrame];
  if (!currentImg) return;
  
  let posY = height - currentImg.height;
  
  push();
  // 使用 Math.floor 確保座標為整數，消除像素抖動
  translate(Math.floor(charX), Math.floor(posY));
  // 左右翻轉
  scale(facing, 1);
  imageMode(CENTER);
  image(currentImg, 0, currentImg.height / 2);
  pop();
}

// 視窗大小改變時自動調整畫布
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}