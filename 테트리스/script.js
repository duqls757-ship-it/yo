/**
 * SUNFLOWER TETRIS - SCRIPT.JS
 * 1인용 봄 & 해바라기 테마 테트리스 게임
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. 상수 및 테트로미노 정의
  // ==========================================================================
  const COLS = 10;
  const ROWS = 20;
  const BLOCK_SIZE = 30; // 캔버스 300 x 600

  // 파스텔톤 블록 색상 (메인 색상, 하이라이트 색상, 그림자 색상)
  const TETROMINO_COLORS = {
    I: { main: '#42b5ff', light: '#8fd5ff', dark: '#1e8ecf' }, // 스카이 블루
    O: { main: '#ffca28', light: '#ffe27d', dark: '#d49b0b' }, // 해바라기 옐로우
    T: { main: '#ba68c8', light: '#e1a6eb', dark: '#92419f' }, // 라벤더 퍼플
    S: { main: '#66bb6a', light: '#9de0a0', dark: '#428f46' }, // 민트 그린
    Z: { main: '#ff7979', light: '#ffb2b2', dark: '#d84e4e' }, // 피치 핑크
    J: { main: '#ffa726', light: '#ffd180', dark: '#cc7a05' }, // 라이트 오렌지
    L: { main: '#ff7043', light: '#ffaa91', dark: '#d4471f' }  // 코랄
  };

  // 7종류 테트로미노의 4x4 또는 3x3 회전 매트릭스
  const TETROMINO_SHAPES = {
    I: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    O: [
      [1, 1],
      [1, 1]
    ],
    T: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    S: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0]
    ],
    Z: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0]
    ],
    J: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    L: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0]
    ]
  };

  const SHAPE_KEYS = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

  // ==========================================================================
  // 2. DOM 요소 참조
  // ==========================================================================
  const canvas = document.getElementById('tetrisCanvas');
  const ctx = canvas.getContext('2d');
  const nextCanvas = document.getElementById('nextCanvas');
  const nextCtx = nextCanvas.getContext('2d');

  const scoreDisplay = document.getElementById('scoreDisplay');
  const levelDisplay = document.getElementById('levelDisplay');
  const linesDisplay = document.getElementById('linesDisplay');

  const pauseBtn = document.getElementById('pauseBtn');
  const pauseIcon = document.getElementById('pauseIcon');
  const pauseBtnText = document.getElementById('pauseBtnText');
  const restartBtn = document.getElementById('restartBtn');
  const soundBtn = document.getElementById('soundBtn');
  const soundIcon = document.getElementById('soundIcon');
  const soundBtnText = document.getElementById('soundBtnText');

  const pauseOverlay = document.getElementById('pauseOverlay');
  const overlayResumeBtn = document.getElementById('overlayResumeBtn');

  const gameOverOverlay = document.getElementById('gameOverOverlay');
  const overlayRestartBtn = document.getElementById('overlayRestartBtn');
  const finalScore = document.getElementById('finalScore');
  const finalLevel = document.getElementById('finalLevel');
  const finalLines = document.getElementById('finalLines');

  // ==========================================================================
  // 3. 게임 상태 변수
  // ==========================================================================
  let board = [];
  let currentPiece = null;
  let nextPiece = null;
  let bag = [];

  let score = 0;
  let level = 1;
  let linesCleared = 0;

  let isPaused = false;
  let isGameOver = false;

  let dropInterval = 800; // 레벨 1 기본 800ms
  let lastDropTime = 0;
  let animationFrameId = null;

  // 라인 삭제 애니메이션 & 꽃잎 파티클 효과
  let clearingLines = []; // 현재 깜빡이며 삭제되는 라인 인덱스
  let lineClearProgress = 0; // 0 ~ 1
  let lineClearCallback = null;
  let particles = [];

  // 사운드 관련 (Web Audio API)
  let audioCtx = null;
  let soundEnabled = true;

  // ==========================================================================
  // 4. 간단하고 귀여운 Web Audio 합성기
  // ==========================================================================
  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playSound(type) {
    if (!soundEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;

      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'move') {
        // 부드러운 물방울 톤
        osc.type = 'sine';
        osc.frequency.setValueAtTime(380, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.05);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'rotate') {
        // 밝은 실로폰 톤
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(660, now + 0.08);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'drop') {
        // 가벼운 착지음
        osc.type = 'sine';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'clear') {
        // 화사한 상승 아르페지오 (해바라기 개화 느낌)
        const notes = [440, 554, 659, 880];
        notes.forEach((freq, idx) => {
          const o = audioCtx.createOscillator();
          const g = audioCtx.createGain();
          o.type = 'triangle';
          o.frequency.setValueAtTime(freq, now + idx * 0.06);
          g.gain.setValueAtTime(0.08, now + idx * 0.06);
          g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.14);
          o.connect(g);
          g.connect(audioCtx.destination);
          o.start(now + idx * 0.06);
          o.stop(now + idx * 0.06 + 0.15);
        });
      } else if (type === 'gameover') {
        // 조용한 단조 화음
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(160, now + 0.35);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      }
    } catch (e) {
      // AudioContext 정책 관련 예외 무시
    }
  }

  // ==========================================================================
  // 5. 7-Bag 무작위 생성기
  // ==========================================================================
  function generateNewBag() {
    const newBag = [...SHAPE_KEYS];
    // Fisher-Yates 셔플
    for (let i = newBag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newBag[i], newBag[j]] = [newBag[j], newBag[i]];
    }
    return newBag;
  }

  function getNextPieceFromBag() {
    if (bag.length === 0) {
      bag = generateNewBag();
    }
    const type = bag.pop();
    const matrix = TETROMINO_SHAPES[type].map(row => [...row]);
    // 스폰 위치 계산 (가로 중앙)
    const x = Math.floor((COLS - matrix[0].length) / 2);
    const y = 0;
    return {
      type: type,
      matrix: matrix,
      x: x,
      y: y
    };
  }

  // ==========================================================================
  // 6. 충돌 검사 및 조작 알고리즘
  // ==========================================================================
  function collide(piece, testX = piece.x, testY = piece.y, testMatrix = piece.matrix) {
    for (let r = 0; r < testMatrix.length; r++) {
      for (let c = 0; c < testMatrix[r].length; c++) {
        if (testMatrix[r][c]) {
          const boardX = testX + c;
          const boardY = testY + r;

          // 보드 좌우 벽 또는 바닥 충돌
          if (boardX < 0 || boardX >= COLS || boardY >= ROWS) {
            return true;
          }

          // 천장 위쪽은 아직 충돌이 아니지만, 보드 내부에서 기존 블록과 겹치는지 체크
          if (boardY >= 0 && board[boardY][boardX] !== 0) {
            return true;
          }
        }
      }
    }
    return false;
  }

  // 매트릭스 90도 시계방향 회전
  function rotateMatrix(matrix) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const rotated = [];
    for (let c = 0; c < cols; c++) {
      rotated[c] = [];
      for (let r = rows - 1; r >= 0; r--) {
        rotated[c].push(matrix[r][c]);
      }
    }
    return rotated;
  }

  // 벽차기(Wall Kick)를 지원하는 회전
  function rotatePiece() {
    if (isPaused || isGameOver || !currentPiece || clearingLines.length > 0) return;

    // O 블록은 회전할 필요 없음
    if (currentPiece.type === 'O') return;

    const rotated = rotateMatrix(currentPiece.matrix);

    // 기본 위치 및 좌우 오프셋 시도 (0, -1, +1, -2, +2)
    const kicks = [0, -1, 1, -2, 2];
    for (let i = 0; i < kicks.length; i++) {
      const offsetX = kicks[i];
      if (!collide(currentPiece, currentPiece.x + offsetX, currentPiece.y, rotated)) {
        currentPiece.x += offsetX;
        currentPiece.matrix = rotated;
        playSound('rotate');
        draw();
        return;
      }
    }
  }

  // 블록 좌우 이동
  function moveHorizontal(dir) {
    if (isPaused || isGameOver || !currentPiece || clearingLines.length > 0) return false;
    if (!collide(currentPiece, currentPiece.x + dir, currentPiece.y)) {
      currentPiece.x += dir;
      playSound('move');
      draw();
      return true;
    }
    return false;
  }

  // 블록 1칸 낙하
  function dropStep() {
    if (isPaused || isGameOver || !currentPiece || clearingLines.length > 0) return;

    if (!collide(currentPiece, currentPiece.x, currentPiece.y + 1)) {
      currentPiece.y++;
      draw();
      return true;
    } else {
      // 바닥이나 다른 블록에 닿음 -> 고정
      lockPiece();
      return false;
    }
  }

  // 하드 드롭 (Space Bar: 즉시 바닥까지 이동 후 고정)
  function hardDrop() {
    if (isPaused || isGameOver || !currentPiece || clearingLines.length > 0) return;

    let dropDistance = 0;
    while (!collide(currentPiece, currentPiece.x, currentPiece.y + 1)) {
      currentPiece.y++;
      dropDistance++;
    }

    if (dropDistance > 0) {
      createLandingDust(currentPiece);
    }

    playSound('drop');
    lockPiece();
    draw();
  }

  // 고스트 블록 Y 좌표 계산
  function getGhostY() {
    if (!currentPiece) return 0;
    let ghostY = currentPiece.y;
    while (!collide(currentPiece, currentPiece.x, ghostY + 1)) {
      ghostY++;
    }
    return ghostY;
  }

  // 블록을 보드에 병합 및 라인 체크
  function lockPiece() {
    for (let r = 0; r < currentPiece.matrix.length; r++) {
      for (let c = 0; c < currentPiece.matrix[r].length; c++) {
        if (currentPiece.matrix[r][c]) {
          const boardY = currentPiece.y + r;
          const boardX = currentPiece.x + c;
          if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
            board[boardY][boardX] = currentPiece.type;
          }
        }
      }
    }

    // 완성된 라인 확인
    checkLines();
  }

  // ==========================================================================
  // 7. 가로줄 제거, 점수 및 레벨업
  // ==========================================================================
  function checkLines() {
    const fullLines = [];
    for (let r = 0; r < ROWS; r++) {
      let isFull = true;
      for (let c = 0; c < COLS; c++) {
        if (board[r][c] === 0) {
          isFull = false;
          break;
        }
      }
      if (isFull) {
        fullLines.push(r);
      }
    }

    if (fullLines.length > 0) {
      clearingLines = fullLines;
      lineClearProgress = 0;
      playSound('clear');

      // 라인 클리어 파티클 생성
      fullLines.forEach(lineY => {
        createClearParticles(lineY);
      });

      // 깜빡임 애니메이션 후 실제 줄 삭제
      setTimeout(() => {
        applyLineClear(fullLines);
      }, 160);
    } else {
      spawnNextPiece();
    }
  }

  function applyLineClear(lines) {
    const linesCount = lines.length;

    // 보드에서 줄 제거 및 상단에 새 빈 줄 추가
    // 아래쪽 줄부터 위쪽 순서로 정렬된 lines
    lines.sort((a, b) => b - a);
    for (let lineIndex of lines) {
      board.splice(lineIndex, 1);
      board.unshift(new Array(COLS).fill(0));
    }

    // 점수 계산 (요구사항: 제거하기 전 레벨 기준)
    // 1줄: 100 * 레벨, 2줄: 300 * 레벨, 3줄: 500 * 레벨, 4줄: 800 * 레벨
    let baseScore = 0;
    if (linesCount === 1) baseScore = 100;
    else if (linesCount === 2) baseScore = 300;
    else if (linesCount === 3) baseScore = 500;
    else if (linesCount >= 4) baseScore = 800;

    score += baseScore * level;
    linesCleared += linesCount;

    // 레벨 계산: 누적 10줄 제거할 때마다 레벨 1 증가
    const newLevel = Math.floor(linesCleared / 10) + 1;
    if (newLevel !== level) {
      level = newLevel;
      updateDropInterval();
    }

    clearingLines = [];
    updateUI();
    spawnNextPiece();
  }

  function updateDropInterval() {
    // 요구사항: 레벨 1에서 800ms, 레벨업마다 이전 낙하 간격의 85%로 단축, 최소 100ms
    // formula: 800 * (0.85 ^ (level - 1))
    let interval = 800 * Math.pow(0.85, level - 1);
    dropInterval = Math.max(100, Math.round(interval));
  }

  // ==========================================================================
  // 8. 새 블록 스폰 및 게임 오버 판정
  // ==========================================================================
  function spawnNextPiece() {
    currentPiece = nextPiece;
    nextPiece = getNextPieceFromBag();
    drawNextPiece();

    // 새 블록 생성 공간 충돌 체크 -> 게임 오버
    if (collide(currentPiece)) {
      triggerGameOver();
      return;
    }

    draw();
  }

  function triggerGameOver() {
    isGameOver = true;
    playSound('gameover');

    finalScore.textContent = score.toLocaleString();
    finalLevel.textContent = level;
    finalLines.textContent = linesCleared;

    gameOverOverlay.classList.remove('hidden');
    draw();
  }

  // ==========================================================================
  // 9. 파티클 효과 (꽃잎 & 별빛)
  // ==========================================================================
  function createClearParticles(lineY) {
    const yPos = lineY * BLOCK_SIZE + BLOCK_SIZE / 2;
    for (let i = 0; i < 20; i++) {
      const xPos = Math.random() * (COLS * BLOCK_SIZE);
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1.5;
      particles.push({
        x: xPos,
        y: yPos,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        size: Math.random() * 5 + 3,
        color: ['#ffeb3b', '#ffc107', '#ff9800', '#81c784', '#ffffff'][Math.floor(Math.random() * 5)],
        alpha: 1,
        life: 1,
        decay: Math.random() * 0.03 + 0.02
      });
    }
  }

  function createLandingDust(piece) {
    for (let r = 0; r < piece.matrix.length; r++) {
      for (let c = 0; c < piece.matrix[r].length; c++) {
        if (piece.matrix[r][c]) {
          const xPos = (piece.x + c) * BLOCK_SIZE + BLOCK_SIZE / 2;
          const yPos = (piece.y + r + 1) * BLOCK_SIZE;
          for (let k = 0; k < 2; k++) {
            particles.push({
              x: xPos + (Math.random() - 0.5) * BLOCK_SIZE,
              y: yPos,
              vx: (Math.random() - 0.5) * 2,
              vy: -Math.random() * 1.5,
              size: Math.random() * 3 + 2,
              color: '#dcedc8',
              alpha: 0.8,
              life: 1,
              decay: 0.05
            });
          }
        }
      }
    }
  }

  function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08; // 중력
      p.life -= p.decay;
      p.alpha = Math.max(0, p.life);
      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }
  }

  function drawParticles(targetContext) {
    targetContext.save();
    for (const p of particles) {
      targetContext.globalAlpha = p.alpha;
      targetContext.fillStyle = p.color;
      targetContext.beginPath();
      targetContext.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      targetContext.fill();
    }
    targetContext.restore();
  }

  // ==========================================================================
  // 10. 그래픽 렌더링 (말랑한 젤리/퍼즐 블록 & 고스트 블록)
  // ==========================================================================
  // 둥근 사각형 그리기 헬퍼
  function drawRoundedRect(ctxRef, x, y, width, height, radius) {
    ctxRef.beginPath();
    ctxRef.moveTo(x + radius, y);
    ctxRef.lineTo(x + width - radius, y);
    ctxRef.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctxRef.lineTo(x + width, y + height - radius);
    ctxRef.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctxRef.lineTo(x + radius, y + height);
    ctxRef.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctxRef.lineTo(x, y + radius);
    ctxRef.quadraticCurveTo(x, y, x + radius, y);
    ctxRef.closePath();
  }

  // 단일 블록 그리기
  function drawBlock(ctxRef, x, y, type, isGhost = false) {
    const colors = TETROMINO_COLORS[type];
    if (!colors) return;

    const pad = 1.5;
    const drawX = x * BLOCK_SIZE + pad;
    const drawY = y * BLOCK_SIZE + pad;
    const size = BLOCK_SIZE - pad * 2;
    const radius = 6;

    ctxRef.save();

    if (isGhost) {
      // 반투명 고스트 블록
      ctxRef.globalAlpha = 0.32;
      ctxRef.fillStyle = colors.main;
      drawRoundedRect(ctxRef, drawX, drawY, size, size, radius);
      ctxRef.fill();

      ctxRef.globalAlpha = 0.6;
      ctxRef.strokeStyle = colors.dark;
      ctxRef.lineWidth = 1.5;
      ctxRef.stroke();
    } else {
      // 메인 블록: 부드러운 그라데이션 및 볼륨감
      const grad = ctxRef.createLinearGradient(drawX, drawY, drawX, drawY + size);
      grad.addColorStop(0, colors.light);
      grad.addColorStop(0.35, colors.main);
      grad.addColorStop(1, colors.dark);

      ctxRef.fillStyle = grad;
      drawRoundedRect(ctxRef, drawX, drawY, size, size, radius);
      ctxRef.fill();

      // 상단 귀여운 하이라이트 광채
      ctxRef.fillStyle = 'rgba(255, 255, 255, 0.45)';
      drawRoundedRect(ctxRef, drawX + 3, drawY + 2.5, size - 6, (size - 6) * 0.35, 3);
      ctxRef.fill();

      // 외곽 은은한 테두리
      ctxRef.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctxRef.lineWidth = 1;
      drawRoundedRect(ctxRef, drawX, drawY, size, size, radius);
      ctxRef.stroke();
    }

    ctxRef.restore();
  }

  // 메인 게임 보드 렌더링
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. 은은한 격자선 그리기
    ctx.save();
    ctx.strokeStyle = 'rgba(160, 200, 150, 0.18)';
    ctx.lineWidth = 1;
    for (let c = 1; c < COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * BLOCK_SIZE, 0);
      ctx.lineTo(c * BLOCK_SIZE, ROWS * BLOCK_SIZE);
      ctx.stroke();
    }
    for (let r = 1; r < ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * BLOCK_SIZE);
      ctx.lineTo(COLS * BLOCK_SIZE, r * BLOCK_SIZE);
      ctx.stroke();
    }
    ctx.restore();

    // 2. 보드에 고정된 블록들 그리기
    for (let r = 0; r < ROWS; r++) {
      const isClearing = clearingLines.includes(r);
      for (let c = 0; c < COLS; c++) {
        if (board[r][c] !== 0) {
          if (isClearing) {
            // 삭제 중인 줄 반짝임 효과
            ctx.save();
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#fff59d';
            ctx.shadowBlur = 10;
            drawRoundedRect(ctx, c * BLOCK_SIZE + 1.5, r * BLOCK_SIZE + 1.5, BLOCK_SIZE - 3, BLOCK_SIZE - 3, 6);
            ctx.fill();
            ctx.restore();
          } else {
            drawBlock(ctx, c, r, board[r][c], false);
          }
        }
      }
    }

    // 3. 고스트 블록 그리기
    if (currentPiece && !isGameOver && clearingLines.length === 0) {
      const ghostY = getGhostY();
      for (let r = 0; r < currentPiece.matrix.length; r++) {
        for (let c = 0; c < currentPiece.matrix[r].length; c++) {
          if (currentPiece.matrix[r][c]) {
            drawBlock(ctx, currentPiece.x + c, ghostY + r, currentPiece.type, true);
          }
        }
      }
    }

    // 4. 현재 조작 중인 블록 그리기
    if (currentPiece && !isGameOver && clearingLines.length === 0) {
      for (let r = 0; r < currentPiece.matrix.length; r++) {
        for (let c = 0; c < currentPiece.matrix[r].length; c++) {
          if (currentPiece.matrix[r][c]) {
            drawBlock(ctx, currentPiece.x + c, currentPiece.y + r, currentPiece.type, false);
          }
        }
      }
    }

    // 5. 파티클 이펙트
    drawParticles(ctx);
  }

  // 다음 블록 미리보기 캔버스 렌더링
  function drawNextPiece() {
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    if (!nextPiece) return;

    const matrix = nextPiece.matrix;
    const mRows = matrix.length;
    const mCols = matrix[0].length;

    // 중앙 정렬 오프셋
    const blockSize = 24;
    const offsetX = (nextCanvas.width - mCols * blockSize) / 2;
    const offsetY = (nextCanvas.height - mRows * blockSize) / 2;

    const colors = TETROMINO_COLORS[nextPiece.type];

    for (let r = 0; r < mRows; r++) {
      for (let c = 0; c < mCols; c++) {
        if (matrix[r][c]) {
          const drawX = offsetX + c * blockSize + 1;
          const drawY = offsetY + r * blockSize + 1;
          const size = blockSize - 2;

          nextCtx.save();
          const grad = nextCtx.createLinearGradient(drawX, drawY, drawX, drawY + size);
          grad.addColorStop(0, colors.light);
          grad.addColorStop(0.35, colors.main);
          grad.addColorStop(1, colors.dark);

          nextCtx.fillStyle = grad;
          drawRoundedRect(nextCtx, drawX, drawY, size, size, 5);
          nextCtx.fill();

          nextCtx.fillStyle = 'rgba(255, 255, 255, 0.45)';
          drawRoundedRect(nextCtx, drawX + 2, drawY + 2, size - 4, (size - 4) * 0.35, 2);
          nextCtx.fill();

          nextCtx.restore();
        }
      }
    }
  }

  // ==========================================================================
  // 11. 메인 게임 루프 (타이머 중복 생성 원천 차단)
  // ==========================================================================
  function gameLoop(timestamp) {
    if (!lastDropTime) lastDropTime = timestamp;
    const delta = timestamp - lastDropTime;

    if (!isPaused && !isGameOver && clearingLines.length === 0) {
      if (delta > dropInterval) {
        dropStep();
        lastDropTime = timestamp;
      }
    }

    updateParticles();
    draw();

    animationFrameId = requestAnimationFrame(gameLoop);
  }

  // ==========================================================================
  // 12. 키보드 조작 & DAS (Delayed Auto Shift)
  // ==========================================================================
  const keyState = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowDown: false
  };

  let dasTimer = null;
  let arrInterval = null;
  let softDropInterval = null;

  function startDAS(dir) {
    // 최초 1회 이동
    moveHorizontal(dir);

    clearTimeout(dasTimer);
    clearInterval(arrInterval);

    // 160ms 대기 후 40ms마다 연속 이동
    dasTimer = setTimeout(() => {
      arrInterval = setInterval(() => {
        if ((dir === -1 && keyState.ArrowLeft) || (dir === 1 && keyState.ArrowRight)) {
          moveHorizontal(dir);
        } else {
          clearInterval(arrInterval);
        }
      }, 40);
    }, 160);
  }

  function stopDAS() {
    clearTimeout(dasTimer);
    clearInterval(arrInterval);
  }

  function startSoftDrop() {
    if (softDropInterval) return;
    dropStep();
    softDropInterval = setInterval(() => {
      if (keyState.ArrowDown) {
        dropStep();
      } else {
        clearInterval(softDropInterval);
        softDropInterval = null;
      }
    }, 50);
  }

  function stopSoftDrop() {
    if (softDropInterval) {
      clearInterval(softDropInterval);
      softDropInterval = null;
    }
  }

  window.addEventListener('keydown', (e) => {
    // 방향키와 Space 기본 스크롤 동작 방지
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
      e.preventDefault();
    }

    if (e.key === 'p' || e.key === 'P') {
      togglePause();
      return;
    }

    if (isPaused || isGameOver) return;

    if (e.key === 'ArrowLeft') {
      if (!keyState.ArrowLeft) {
        keyState.ArrowLeft = true;
        keyState.ArrowRight = false;
        startDAS(-1);
      }
    } else if (e.key === 'ArrowRight') {
      if (!keyState.ArrowRight) {
        keyState.ArrowRight = true;
        keyState.ArrowLeft = false;
        startDAS(1);
      }
    } else if (e.key === 'ArrowDown') {
      if (!keyState.ArrowDown) {
        keyState.ArrowDown = true;
        startSoftDrop();
      }
    } else if (e.key === 'ArrowUp') {
      // 1회 누를 때 1회만 회전 (e.repeat 방지)
      if (!e.repeat) {
        rotatePiece();
      }
    } else if (e.key === ' ') {
      // 1회 누를 때 1회만 하드드롭 (e.repeat 방지)
      if (!e.repeat) {
        hardDrop();
      }
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') {
      keyState.ArrowLeft = false;
      if (!keyState.ArrowRight) stopDAS();
      else startDAS(1);
    } else if (e.key === 'ArrowRight') {
      keyState.ArrowRight = false;
      if (!keyState.ArrowLeft) stopDAS();
      else startDAS(-1);
    } else if (e.key === 'ArrowDown') {
      keyState.ArrowDown = false;
      stopSoftDrop();
    }
  });

  // ==========================================================================
  // 13. 게임 제어 (일시정지, 계속하기, 다시 시작)
  // ==========================================================================
  function setPauseState(paused) {
    if (isGameOver) return;
    isPaused = paused;

    stopDAS();
    stopSoftDrop();

    if (isPaused) {
      pauseOverlay.classList.remove('hidden');
      pauseBtnText.textContent = '계속하기';
      pauseIcon.textContent = '▶️';
    } else {
      pauseOverlay.classList.add('hidden');
      pauseBtnText.textContent = '일시정지';
      pauseIcon.textContent = '⏸️';
      lastDropTime = performance.now();
    }
  }

  function togglePause() {
    setPauseState(!isPaused);
  }

  function resetGame() {
    // 1. 기존 게임 루프 중지
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }

    // 2. 입력 및 타이머 초기화
    stopDAS();
    stopSoftDrop();
    keyState.ArrowLeft = false;
    keyState.ArrowRight = false;
    keyState.ArrowDown = false;

    // 3. 보드 2차원 배열 초기화 (10 x 20)
    board = [];
    for (let r = 0; r < ROWS; r++) {
      board[r] = new Array(COLS).fill(0);
    }

    // 4. 점수, 레벨, 라인수 초기화
    score = 0;
    level = 1;
    linesCleared = 0;
    dropInterval = 800;
    particles = [];
    clearingLines = [];

    isPaused = false;
    isGameOver = false;

    // 5. 오버레이 숨기기
    pauseOverlay.classList.add('hidden');
    gameOverOverlay.classList.add('hidden');
    pauseBtnText.textContent = '일시정지';
    pauseIcon.textContent = '⏸️';

    // 6. 블록 생성
    bag = [];
    currentPiece = getNextPieceFromBag();
    nextPiece = getNextPieceFromBag();

    updateUI();
    drawNextPiece();
    draw();

    // 7. 게임 루프 시작
    lastDropTime = performance.now();
    animationFrameId = requestAnimationFrame(gameLoop);
  }

  function updateUI() {
    scoreDisplay.textContent = score.toLocaleString();
    levelDisplay.textContent = level;
    linesDisplay.textContent = linesCleared;
  }

  // ==========================================================================
  // 14. 탭 전환 처리 (Page Visibility API)
  // ==========================================================================
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // 탭을 벗어났을 때 자동 일시정지
      if (!isPaused && !isGameOver) {
        setPauseState(true);
      }
    }
    // 다시 돌아왔을 때: 사용자가 직접 '계속하기'를 눌러야 재개되도록 자동 해제하지 않음
  });

  // 창 포커스를 잃었을 때도 안전하게 키 입력 상태 해제
  window.addEventListener('blur', () => {
    stopDAS();
    stopSoftDrop();
    keyState.ArrowLeft = false;
    keyState.ArrowRight = false;
    keyState.ArrowDown = false;
  });

  // ==========================================================================
  // 15. 버튼 이벤트 리스너 연결
  // ==========================================================================
  pauseBtn.addEventListener('click', togglePause);
  overlayResumeBtn.addEventListener('click', () => setPauseState(false));

  restartBtn.addEventListener('click', resetGame);
  overlayRestartBtn.addEventListener('click', resetGame);

  soundBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    if (soundEnabled) {
      soundBtn.classList.remove('muted');
      soundIcon.textContent = '🔔';
      soundBtnText.textContent = '효과음 켜짐';
      initAudio();
      playSound('move');
    } else {
      soundBtn.classList.add('muted');
      soundIcon.textContent = '🔕';
      soundBtnText.textContent = '효과음 꺼짐';
    }
  });

  // ==========================================================================
  // 16. 배경에 흩날리는 봄날 꽃잎 생성기
  // ==========================================================================
  function initFloatingPetals() {
    const container = document.getElementById('petalsContainer');
    if (!container) return;

    const PETAL_COUNT = 15;

    for (let i = 0; i < PETAL_COUNT; i++) {
      createPetal(container);
    }
  }

  function createPetal(container) {
    const petal = document.createElement('div');
    petal.className = 'petal';

    const size = Math.random() * 8 + 8; // 8px ~ 16px
    petal.style.width = `${size}px`;
    petal.style.height = `${size * 0.75}px`;

    const startX = Math.random() * 100;
    const startY = -20 - Math.random() * 50;
    const duration = Math.random() * 10 + 12; // 12s ~ 22s
    const delay = Math.random() * 10;

    petal.style.left = `${startX}vw`;
    petal.style.top = `${startY}px`;
    petal.style.opacity = (Math.random() * 0.5 + 0.4).toFixed(2);

    container.appendChild(petal);

    // CSS 키프레임 애니메이션 적용
    const swayDistance = (Math.random() - 0.5) * 120;
    const anim = petal.animate([
      { transform: `translate(0, 0) rotate(0deg)` },
      { transform: `translate(${swayDistance}px, 105vh) rotate(${Math.random() * 360 + 360}deg)` }
    ], {
      duration: duration * 1000,
      delay: delay * 1000,
      iterations: Infinity,
      easing: 'linear'
    });
  }

  // ==========================================================================
  // 17. 초기 실행
  // ==========================================================================
  window.addEventListener('DOMContentLoaded', () => {
    initFloatingPetals();
    resetGame();
  });

})();
