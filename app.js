const BOARD_SIZE = 8;
const HUMAN = "human";
const AI = "ai";
const STORAGE_KEY = "mindcheckers-progress-v1";

const boardEl = document.querySelector("#board");
const turnStatusEl = document.querySelector("#turnStatus");
const liveTipEl = document.querySelector("#liveTip");
const reviewStackEl = document.querySelector("#reviewStack");
const insightGridEl = document.querySelector("#insightGrid");
const leaderboardEl = document.querySelector("#leaderboard");
const materialScoreEl = document.querySelector("#materialScore");
const tempoScoreEl = document.querySelector("#tempoScore");
const captureScoreEl = document.querySelector("#captureScore");
const streakValueEl = document.querySelector("#streakValue");
const levelValueEl = document.querySelector("#levelValue");
const xpValueEl = document.querySelector("#xpValue");
const tacticsBarEl = document.querySelector("#tacticsBar");
const foresightBarEl = document.querySelector("#foresightBar");
const endgameBarEl = document.querySelector("#endgameBar");
const gameCountLabelEl = document.querySelector("#gameCountLabel");
const toastEl = document.querySelector("#toast");
const reviewSpotlightEl = document.querySelector("#reviewSpotlight");
const moveHistoryListEl = document.querySelector("#moveHistoryList");
const moveCountLabelEl = document.querySelector("#moveCountLabel");
const trainingPathEl = document.querySelector("#trainingPath");
const copySummaryButton = document.querySelector("#copySummaryButton");
const summaryOutputEl = document.querySelector("#summaryOutput");
const missionTextEl = document.querySelector("#missionText");
const missionBarEl = document.querySelector("#missionBar");
const missionProgressEl = document.querySelector("#missionProgress");
const claimMissionButton = document.querySelector("#claimMissionButton");
const nextMissionButton = document.querySelector("#nextMissionButton");
const levelTitleEl = document.querySelector("#levelTitle");
const nextLevelLabelEl = document.querySelector("#nextLevelLabel");
const levelBarEl = document.querySelector("#levelBar");
const unlockLabelEl = document.querySelector("#unlockLabel");
const leagueButton = document.querySelector("#leagueButton");
const levelDrillButton = document.querySelector("#levelDrillButton");
const upgradeButton = document.querySelector("#upgradeButton");
const proModal = document.querySelector("#proModal");
const closeProModalButton = document.querySelector("#closeProModal");
const activateProButton = document.querySelector("#activateProButton");
const onboardingModal = document.querySelector("#onboardingModal");
const startDemoButton = document.querySelector("#startDemoButton");
const skipOnboardingButton = document.querySelector("#skipOnboardingButton");

let board = createInitialBoard();
let selected = null;
let legalMoves = [];
let hintMove = null;
let currentPlayer = HUMAN;
let gameState = "playing";
let difficulty = "gentle";
let lastMove = null;
let moveLog = [];
let coachEvents = [];
let resultSaved = false;
let progress = loadProgress();

const LEVELS = [
  { xp: 0, title: "Pattern Scout", unlock: "Legal move glow" },
  { xp: 120, title: "Tactical Mapper", unlock: "Focused AI mode" },
  { xp: 280, title: "Capture Planner", unlock: "Mission XP bonuses" },
  { xp: 480, title: "Foresight Builder", unlock: "Sharp AI mode" },
  { xp: 760, title: "Endgame Climber", unlock: "League ranking" },
  { xp: 1100, title: "Strategy Mentor", unlock: "Deep review preview" },
];

const MISSIONS = [
  {
    text: "Land one capture",
    target: 1,
    reward: 18,
    skill: "tactics",
    value: () => coachEvents.filter((event) => event.player === HUMAN && event.capture).length,
  },
  {
    text: "Make three safe moves",
    target: 3,
    reward: 20,
    skill: "foresight",
    value: () => coachEvents.filter((event) => event.player === HUMAN && !event.exposed).length,
  },
  {
    text: "Promote one piece to king",
    target: 1,
    reward: 28,
    skill: "endgame",
    value: () => coachEvents.filter((event) => event.player === HUMAN && event.becameKing).length,
  },
  {
    text: "Reach a 70+ strategy score",
    target: 70,
    reward: 22,
    skill: "foresight",
    value: () => calculateStrategyScore(),
  },
];

document.querySelector("#newGameButton").addEventListener("click", startNewGame);
document.querySelector("#hintButton").addEventListener("click", showHint);
document.querySelector("#reviewButton").addEventListener("click", () => finishGame("review"));
upgradeButton.addEventListener("click", openProModal);
closeProModalButton.addEventListener("click", closeProModal);
proModal.addEventListener("click", (event) => {
  if (event.target === proModal) closeProModal();
});
activateProButton.addEventListener("click", activateProPreview);
claimMissionButton.addEventListener("click", claimMissionReward);
nextMissionButton.addEventListener("click", rotateMission);
leagueButton.addEventListener("click", joinLeague);
levelDrillButton.addEventListener("click", startLevelDrill);
copySummaryButton.addEventListener("click", copyDemoSummary);
startDemoButton.addEventListener("click", () => {
  closeOnboardingModal();
  startNewGame();
  showHint();
});
skipOnboardingButton.addEventListener("click", closeOnboardingModal);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeProModal();
    closeOnboardingModal(false);
  }
});

document.querySelectorAll("[data-difficulty]").forEach((button) => {
  button.addEventListener("click", () => {
    setDifficulty(button.dataset.difficulty);
  });
});

render();
if (!progress.onboardingSeen) openOnboardingModal();

function createInitialBoard() {
  const nextBoard = Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => null),
  );

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (!isDarkSquare(row, col)) continue;
      if (row < 3) nextBoard[row][col] = { player: AI, king: false };
      if (row > 4) nextBoard[row][col] = { player: HUMAN, king: false };
    }
  }

  return nextBoard;
}

function startNewGame() {
  board = createInitialBoard();
  selected = null;
  legalMoves = [];
  hintMove = null;
  currentPlayer = HUMAN;
  gameState = "playing";
  lastMove = null;
  moveLog = [];
  coachEvents = [];
  resultSaved = false;
  render();
  showToast("New training game started.");
}

function render() {
  renderBoard();
  renderStatus();
  renderMetrics();
  renderMoveHistory();
  renderReviewSpotlight();
  renderReview();
  renderProgress();
  renderMission();
  renderInsights();
  renderTrainingPath();
  renderLeaderboard();
  renderProductState();
}

function renderBoard() {
  boardEl.innerHTML = "";

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const cell = document.createElement("button");
      const piece = board[row][col];
      const move = legalMoves.find((item) => item.to.row === row && item.to.col === col);
      const isHint =
        hintMove &&
        ((hintMove.from.row === row && hintMove.from.col === col) ||
          (hintMove.to.row === row && hintMove.to.col === col));

      cell.type = "button";
      cell.className = ["cell", isDarkSquare(row, col) ? "dark" : "light"]
        .filter(Boolean)
        .join(" ");
      cell.dataset.row = String(row);
      cell.dataset.col = String(col);
      cell.setAttribute("aria-label", `${squareName(row, col)} ${piece ? piece.player : "empty"}`);

      if (selected?.row === row && selected?.col === col) cell.classList.add("selected");
      if (move) cell.classList.add(move.captured ? "capture" : "legal");
      if (isHint) cell.classList.add("hint");
      if (lastMove?.from.row === row && lastMove?.from.col === col) cell.classList.add("last-from");
      if (lastMove?.to.row === row && lastMove?.to.col === col) cell.classList.add("last-to");

      cell.addEventListener("click", () => handleCellClick(row, col));

      if (piece) {
        const pieceEl = document.createElement("span");
        pieceEl.className = ["piece", piece.player, piece.king ? "king" : ""]
          .filter(Boolean)
          .join(" ");
        pieceEl.setAttribute("aria-hidden", "true");
        cell.append(pieceEl);
      }

      boardEl.append(cell);
    }
  }
}

function renderStatus() {
  turnStatusEl.className = "status-pill";

  if (gameState === "ended") {
    turnStatusEl.classList.add("ended");
    turnStatusEl.textContent = "Review ready";
    return;
  }

  if (currentPlayer === AI) {
    turnStatusEl.classList.add("ai");
    turnStatusEl.textContent = "AI thinking";
    return;
  }

  turnStatusEl.textContent = "Your move";
}

function renderMetrics() {
  const humanPieces = countPieces(board, HUMAN);
  const aiPieces = countPieces(board, AI);
  const material = humanPieces.total - aiPieces.total;
  const humanMoves = getAllMoves(board, HUMAN).length;
  const aiMoves = getAllMoves(board, AI).length;
  const captures = coachEvents.filter((event) => event.player === HUMAN && event.capture).length;

  materialScoreEl.textContent = signed(material);
  tempoScoreEl.textContent = signed(humanMoves - aiMoves);
  captureScoreEl.textContent = String(captures);
}

function renderReview() {
  const cards = getCoachCards();
  reviewStackEl.innerHTML = cards
    .map(
      (card) => `
        <article class="review-card">
          <strong>${card.title}</strong>
          <p>${card.body}</p>
        </article>
      `,
    )
    .join("");
}

function renderReviewSpotlight() {
  const score = calculateStrategyScore();
  const level = getLevelInfo(progress.xp);
  const captures = coachEvents.filter((event) => event.player === HUMAN && event.capture).length;
  const exposures = coachEvents.filter((event) => event.player === HUMAN && event.exposed).length;
  const message =
    gameState === "ended"
      ? `${captures} captures, ${exposures} exposed moves, Lv. ${level.number} ${level.current.title}.`
      : "Your review will summarize tactics, safety, level progress, and the next drill.";

  reviewSpotlightEl.innerHTML = `
    <div class="score-ring" style="--score-angle: ${score * 3.6}deg">${score}</div>
    <div>
      <strong>${gameState === "ended" ? "Review snapshot" : "Coach is watching"}</strong>
      <span>${message}</span>
    </div>
  `;
}

function renderMoveHistory() {
  moveCountLabelEl.textContent = `${moveLog.length} move${moveLog.length === 1 ? "" : "s"}`;

  if (!moveLog.length) {
    moveHistoryListEl.innerHTML = "<li>No moves yet</li>";
    return;
  }

  moveHistoryListEl.innerHTML = moveLog
    .slice(-8)
    .map((move, index) => `<li>${moveLog.length - Math.min(moveLog.length, 8) + index + 1}. ${move}</li>`)
    .join("");
}

function renderProgress() {
  const level = getLevelInfo(progress.xp);
  streakValueEl.textContent = String(progress.streak);
  levelValueEl.textContent = String(level.number);
  xpValueEl.textContent = `${progress.xp} XP`;
  levelTitleEl.textContent = `Lv. ${level.number} - ${level.current.title}`;
  nextLevelLabelEl.textContent = level.next
    ? `${level.xpNeeded} XP to ${level.next.title}`
    : "Peak level reached";
  levelBarEl.style.width = `${level.percent}%`;
  unlockLabelEl.textContent = level.next
    ? `Next unlock: ${level.next.unlock}`
    : "All prototype unlocks active";
  tacticsBarEl.style.width = `${clamp(progress.tactics, 8, 100)}%`;
  foresightBarEl.style.width = `${clamp(progress.foresight, 8, 100)}%`;
  endgameBarEl.style.width = `${clamp(progress.endgame, 8, 100)}%`;
  gameCountLabelEl.textContent = `${progress.games} games analyzed`;
}

function renderMission() {
  const mission = getActiveMission();
  const value = clamp(mission.value(), 0, mission.target);
  const complete = value >= mission.target;
  const percent = Math.round((value / mission.target) * 100);

  missionTextEl.textContent = mission.text;
  missionBarEl.style.width = `${percent}%`;
  missionProgressEl.textContent = progress.missionClaimed
    ? `Claimed +${mission.reward} XP`
    : `${value} / ${mission.target} completed | +${mission.reward} XP`;
  claimMissionButton.disabled = !complete || progress.missionClaimed;
  claimMissionButton.textContent = progress.missionClaimed ? "Claimed" : "Claim mission";
}

function renderInsights() {
  const summary = buildSummary();
  insightGridEl.innerHTML = summary
    .map(
      (item) => `
        <article class="insight-card">
          <strong>${item.title}</strong>
          <p>${item.body}</p>
        </article>
      `,
    )
    .join("");
}

function renderTrainingPath() {
  const level = getLevelInfo(progress.xp);
  const startIndex = clamp(level.number - 1, 0, Math.max(0, LEVELS.length - 3));
  const visibleLevels = LEVELS.slice(startIndex, startIndex + 3);

  trainingPathEl.innerHTML = visibleLevels
    .map((item, index) => {
      const absoluteIndex = startIndex + index;
      const isActive = absoluteIndex === level.number - 1;
      const isLocked = progress.xp < item.xp;
      const state = isActive ? "Current" : isLocked ? `${item.xp - progress.xp} XP away` : "Unlocked";
      return `
        <article class="path-card ${isActive ? "active" : ""} ${isLocked ? "locked" : ""}">
          <strong>Lv. ${absoluteIndex + 1} ${item.title}</strong>
          <span>${item.unlock}</span>
          <small>${state}</small>
        </article>
      `;
    })
    .join("");
}

function renderLeaderboard() {
  const level = getLevelInfo(progress.xp);
  const rows = [
    {
      name: progress.leagueJoined ? "You" : "You (not joined)",
      detail: `${progress.xp} XP | Lv. ${level.number} ${level.current.title}`,
    },
    { name: "Mira", detail: "1240 XP | Center control specialist" },
    { name: "Alex", detail: "1180 XP | Endgame discipline" },
    { name: "Noah", detail: "970 XP | Capture chains" },
  ];

  leaderboardEl.innerHTML = rows
    .map(
      (row) => `
        <li>
          <strong>${row.name}</strong>
          <span>${row.detail}</span>
        </li>
      `,
    )
    .join("");
}

function renderProductState() {
  upgradeButton.textContent = progress.proActive ? "Pro active" : "Upgrade";
  activateProButton.textContent = progress.proActive ? "Pro active" : "Activate demo Pro";
  activateProButton.disabled = progress.proActive;
  leagueButton.textContent = progress.leagueJoined ? "League joined" : "Join league";
  leagueButton.disabled = progress.leagueJoined;
}

function handleCellClick(row, col) {
  if (gameState !== "playing" || currentPlayer !== HUMAN) return;

  const piece = board[row][col];
  const chosenMove = legalMoves.find((move) => move.to.row === row && move.to.col === col);

  if (chosenMove && selected) {
    playHumanMove(chosenMove);
    return;
  }

  if (piece?.player === HUMAN) {
    selected = { row, col };
    legalMoves = getLegalMovesForPiece(board, row, col, HUMAN);
    hintMove = null;

    if (!legalMoves.length) {
      liveTipEl.textContent = "That piece is blocked. Try another route or look for a capture.";
    } else if (legalMoves.some((move) => move.captured)) {
      liveTipEl.textContent = "Capture is available. In this trainer, captures are mandatory.";
    } else {
      liveTipEl.textContent = "Good. Pick a glowing square to complete the move.";
    }

    render();
  }
}

function playHumanMove(move) {
  const event = applyMove(board, move, HUMAN);
  coachEvents.push(event);
  moveLog.push(formatMove("You", move));
  selected = null;
  legalMoves = [];
  hintMove = null;

  const chainMoves = move.captured
    ? getPieceCaptures(board, move.to.row, move.to.col, board[move.to.row][move.to.col])
    : [];

  if (chainMoves.length && gameState === "playing") {
    selected = { ...move.to };
    legalMoves = chainMoves;
    liveTipEl.textContent = "Nice capture. A follow-up jump is available from the same piece.";
    render();
    return;
  }

  if (checkGameOver()) {
    render();
    return;
  }

  currentPlayer = AI;
  liveTipEl.textContent = "AI is choosing a move. Watch what it attacks next.";
  render();
  window.setTimeout(playAiTurn, 380);
}

function playAiTurn() {
  if (gameState !== "playing" || currentPlayer !== AI) return;

  let move = chooseAiMove(board, difficulty);
  let chainGuard = 0;

  while (move && chainGuard < 5) {
    const event = applyMove(board, move, AI);
    coachEvents.push(event);
    moveLog.push(formatMove("AI", move));
    chainGuard += 1;

    const movedPiece = board[move.to.row][move.to.col];
    const followUps = move.captured
      ? getPieceCaptures(board, move.to.row, move.to.col, movedPiece)
      : [];

    if (!followUps.length) break;
    move = chooseBestMove(board, followUps, HUMAN);
  }

  if (!checkGameOver()) currentPlayer = HUMAN;
  liveTipEl.textContent = getLiveTip();
  render();
}

function applyMove(targetBoard, move, player) {
  const piece = targetBoard[move.from.row][move.from.col];
  const wasKing = piece.king;
  const materialBefore = evaluateMaterial(targetBoard, HUMAN) - evaluateMaterial(targetBoard, AI);
  const event = {
    player,
    from: { ...move.from },
    to: { ...move.to },
    capture: Boolean(move.captured),
    capturedKing: false,
    becameKing: false,
    exposed: false,
    materialBefore,
    materialAfter: materialBefore,
  };

  targetBoard[move.from.row][move.from.col] = null;

  if (move.captured) {
    const capturedPiece = targetBoard[move.captured.row][move.captured.col];
    event.capturedKing = Boolean(capturedPiece?.king);
    targetBoard[move.captured.row][move.captured.col] = null;
  }

  targetBoard[move.to.row][move.to.col] = piece;

  if (!wasKing && ((player === HUMAN && move.to.row === 0) || (player === AI && move.to.row === 7))) {
    piece.king = true;
    event.becameKing = true;
  }

  event.exposed = getAllCaptures(targetBoard, opponent(player)).some(
    (reply) => reply.captured?.row === move.to.row && reply.captured?.col === move.to.col,
  );
  event.materialAfter = evaluateMaterial(targetBoard, HUMAN) - evaluateMaterial(targetBoard, AI);
  lastMove = { from: { ...move.from }, to: { ...move.to } };

  return event;
}

function checkGameOver() {
  const human = countPieces(board, HUMAN);
  const ai = countPieces(board, AI);
  const humanMoves = getAllMoves(board, HUMAN);
  const aiMoves = getAllMoves(board, AI);

  if (!ai.total || !aiMoves.length) {
    finishGame(HUMAN);
    return true;
  }

  if (!human.total || !humanMoves.length) {
    finishGame(AI);
    return true;
  }

  return false;
}

function finishGame(winner) {
  if (gameState === "ended") return;
  gameState = "ended";
  currentPlayer = null;
  selected = null;
  legalMoves = [];
  hintMove = null;

  const humanWon = winner === HUMAN;
  const reviewOnly = winner === "review";

  if (!resultSaved) {
    resultSaved = true;
    const exposures = coachEvents.filter((event) => event.player === HUMAN && event.exposed).length;
    const captures = coachEvents.filter((event) => event.player === HUMAN && event.capture).length;
    const promotions = coachEvents.filter((event) => event.player === HUMAN && event.becameKing).length;
    const xpGain = reviewOnly ? 16 : humanWon ? 44 : 28;
    const levelBefore = getLevelInfo(progress.xp).number;

    progress.games += 1;
    progress.wins += humanWon ? 1 : 0;
    progress.streak = reviewOnly || humanWon ? progress.streak + 1 : 0;
    progress.xp += xpGain;
    progress.tactics = clamp(progress.tactics + captures * 4 + (humanWon ? 3 : 1), 0, 100);
    progress.foresight = clamp(progress.foresight + Math.max(1, 5 - exposures), 0, 100);
    progress.endgame = clamp(progress.endgame + promotions * 6 + (humanWon ? 3 : 1), 0, 100);
    saveProgress(progress);

    const levelAfter = getLevelInfo(progress.xp).number;
    if (levelAfter > levelBefore) {
      showToast(`Level up: Lv. ${levelAfter} ${getLevelInfo(progress.xp).current.title}.`);
    }
  }

  if (reviewOnly) {
    liveTipEl.textContent = "Review generated from the current position and your move history.";
  } else if (humanWon) {
    liveTipEl.textContent = "Win analyzed. Strong conversion and good pressure.";
  } else {
    liveTipEl.textContent = "Loss analyzed. The coach found one habit to improve next game.";
  }

  render();
}

function showHint() {
  if (gameState !== "playing" || currentPlayer !== HUMAN) return;
  const moves = getAllMoves(board, HUMAN);
  if (!moves.length) return;
  hintMove = chooseBestMove(board, moves, AI);
  selected = { ...hintMove.from };
  legalMoves = getLegalMovesForPiece(board, hintMove.from.row, hintMove.from.col, HUMAN);
  liveTipEl.textContent = `Coach hint: consider ${squareName(hintMove.from.row, hintMove.from.col)} to ${squareName(hintMove.to.row, hintMove.to.col)}.`;
  render();
}

function openProModal() {
  proModal.classList.add("show");
  proModal.setAttribute("aria-hidden", "false");
}

function openOnboardingModal() {
  onboardingModal.classList.add("show");
  onboardingModal.setAttribute("aria-hidden", "false");
}

function closeOnboardingModal(markSeen = true) {
  onboardingModal.classList.remove("show");
  onboardingModal.setAttribute("aria-hidden", "true");
  if (!markSeen || progress.onboardingSeen) return;
  progress.onboardingSeen = true;
  saveProgress(progress);
}

function closeProModal() {
  proModal.classList.remove("show");
  proModal.setAttribute("aria-hidden", "true");
}

function activateProPreview() {
  if (progress.proActive) return;
  const levelBefore = getLevelInfo(progress.xp).number;
  progress.proActive = true;
  progress.xp += 24;
  progress.foresight = clamp(progress.foresight + 4, 0, 100);
  saveProgress(progress);
  closeProModal();
  render();

  const levelAfter = getLevelInfo(progress.xp).number;
  showToast(
    levelAfter > levelBefore
      ? `Pro active. Level up to Lv. ${levelAfter}.`
      : "Pro preview activated: deeper review cards are now framed in the product.",
  );
}

function claimMissionReward() {
  const mission = getActiveMission();
  const value = mission.value();

  if (progress.missionClaimed) {
    showToast("Mission reward already claimed. Pick a new mission.");
    return;
  }

  if (value < mission.target) {
    showToast("Mission is not complete yet. Keep training.");
    return;
  }

  const levelBefore = getLevelInfo(progress.xp).number;
  progress.missionClaimed = true;
  progress.xp += mission.reward;
  progress[mission.skill] = clamp(progress[mission.skill] + 8, 0, 100);
  saveProgress(progress);
  render();

  const levelAfter = getLevelInfo(progress.xp).number;
  showToast(
    levelAfter > levelBefore
      ? `Mission claimed. Level up to Lv. ${levelAfter}.`
      : `Mission claimed: +${mission.reward} XP.`,
  );
}

function rotateMission() {
  progress.activeMissionIndex = (progress.activeMissionIndex + 1) % MISSIONS.length;
  progress.missionClaimed = false;
  saveProgress(progress);
  render();
  showToast(`New mission: ${getActiveMission().text}.`);
}

function joinLeague() {
  if (progress.leagueJoined) return;
  const levelBefore = getLevelInfo(progress.xp).number;
  progress.leagueJoined = true;
  progress.xp += 12;
  saveProgress(progress);
  render();

  const levelAfter = getLevelInfo(progress.xp).number;
  showToast(
    levelAfter > levelBefore
      ? `Focus League joined. Level up to Lv. ${levelAfter}.`
      : "Focus League joined. Your XP now appears on the board.",
  );
}

function startLevelDrill() {
  const level = getLevelInfo(progress.xp);
  const drillDifficulty = level.number >= 4 ? "sharp" : level.number >= 2 ? "focused" : "gentle";
  startNewGame();
  setDifficulty(drillDifficulty, false);
  liveTipEl.textContent =
    level.number >= 4
      ? "Level drill started: Sharp AI will punish exposed pieces."
      : "Level drill started: focus on one safe plan before attacking.";
  render();
  showToast(`Level drill started for Lv. ${level.number} ${level.current.title}.`);
}

function copyDemoSummary() {
  const level = getLevelInfo(progress.xp);
  const score = calculateStrategyScore();
  const captures = coachEvents.filter((event) => event.player === HUMAN && event.capture).length;
  const exposures = coachEvents.filter((event) => event.player === HUMAN && event.exposed).length;
  const summary = [
    "MindCheckers demo summary",
    `Strategy score: ${score}/100`,
    `Level: ${level.number} - ${level.current.title}`,
    `XP: ${progress.xp}`,
    `Games analyzed: ${progress.games}`,
    `Captures: ${captures}`,
    `Exposed moves: ${exposures}`,
    "Positioning: a calm AI-style checkers trainer for strategic thinking.",
    "Live demo: https://qu1nty9.github.io/MindCheckers/",
  ].join("\n");

  if (navigator.clipboard?.writeText) {
    navigator.clipboard
      .writeText(summary)
      .then(() => {
        revealSummary(summary);
        showToast("Demo summary copied.");
      })
      .catch(() => revealSummary(summary));
    return;
  }

  revealSummary(summary);
}

function revealSummary(text) {
  summaryOutputEl.textContent = text;
  summaryOutputEl.classList.add("show");
  showToast("Demo summary is ready below.");
}

function setDifficulty(nextDifficulty, announce = true) {
  difficulty = nextDifficulty;
  document.querySelectorAll("[data-difficulty]").forEach((item) => {
    item.classList.toggle("active", item.dataset.difficulty === nextDifficulty);
  });
  if (announce) showToast(`AI difficulty set to ${capitalize(difficulty)}.`);
}

function getActiveMission() {
  const index = progress.activeMissionIndex % MISSIONS.length;
  return MISSIONS[index];
}

function getLevelInfo(xp) {
  const currentIndex = LEVELS.reduce((best, level, index) => (xp >= level.xp ? index : best), 0);
  const current = LEVELS[currentIndex];
  const next = LEVELS[currentIndex + 1] || null;
  const nextXp = next?.xp ?? current.xp + 1;
  const span = nextXp - current.xp;
  const xpInto = xp - current.xp;
  const xpNeeded = Math.max(0, nextXp - xp);
  const percent = next ? clamp(Math.round((xpInto / span) * 100), 0, 100) : 100;

  return {
    number: currentIndex + 1,
    current,
    next,
    xpInto,
    xpNeeded,
    percent,
  };
}

function getAllMoves(sourceBoard, player) {
  const captures = getAllCaptures(sourceBoard, player);
  if (captures.length) return captures;

  const moves = [];
  forEachPiece(sourceBoard, player, (row, col, piece) => {
    moves.push(...getPieceQuietMoves(sourceBoard, row, col, piece));
  });
  return moves;
}

function getAllCaptures(sourceBoard, player) {
  const captures = [];
  forEachPiece(sourceBoard, player, (row, col, piece) => {
    captures.push(...getPieceCaptures(sourceBoard, row, col, piece));
  });
  return captures;
}

function getLegalMovesForPiece(sourceBoard, row, col, player) {
  const piece = sourceBoard[row][col];
  if (!piece || piece.player !== player) return [];

  const globalCaptures = getAllCaptures(sourceBoard, player);
  if (globalCaptures.length) {
    return globalCaptures.filter((move) => move.from.row === row && move.from.col === col);
  }

  return getPieceQuietMoves(sourceBoard, row, col, piece);
}

function getPieceQuietMoves(sourceBoard, row, col, piece) {
  return directionsFor(piece).flatMap(([rowDelta, colDelta]) => {
    const to = { row: row + rowDelta, col: col + colDelta };
    if (!isInside(to.row, to.col) || sourceBoard[to.row][to.col]) return [];
    return [{ from: { row, col }, to, captured: null }];
  });
}

function getPieceCaptures(sourceBoard, row, col, piece) {
  if (!piece) return [];

  return directionsFor(piece).flatMap(([rowDelta, colDelta]) => {
    const middle = { row: row + rowDelta, col: col + colDelta };
    const landing = { row: row + rowDelta * 2, col: col + colDelta * 2 };

    if (!isInside(middle.row, middle.col) || !isInside(landing.row, landing.col)) return [];

    const target = sourceBoard[middle.row][middle.col];
    if (!target || target.player === piece.player || sourceBoard[landing.row][landing.col]) return [];

    return [{ from: { row, col }, to: landing, captured: middle }];
  });
}

function chooseAiMove(sourceBoard, selectedDifficulty) {
  const moves = getAllMoves(sourceBoard, AI);
  if (!moves.length) return null;

  if (selectedDifficulty === "gentle" && Math.random() < 0.42) {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  if (selectedDifficulty === "focused") {
    return Math.random() < 0.22
      ? moves[Math.floor(Math.random() * moves.length)]
      : chooseBestMove(sourceBoard, moves, HUMAN);
  }

  return chooseBestMove(sourceBoard, moves, HUMAN);
}

function chooseBestMove(sourceBoard, moves, replyPlayer) {
  return [...moves]
    .map((move) => ({ move, score: scoreMove(sourceBoard, move, replyPlayer) }))
    .sort((a, b) => b.score - a.score)[0].move;
}

function scoreMove(sourceBoard, move, replyPlayer) {
  const simulation = cloneBoard(sourceBoard);
  const piece = simulation[move.from.row][move.from.col];
  let score = 0;

  if (move.captured) {
    const captured = simulation[move.captured.row][move.captured.col];
    score += captured?.king ? 34 : 24;
  }

  simulation[move.from.row][move.from.col] = null;
  if (move.captured) simulation[move.captured.row][move.captured.col] = null;
  simulation[move.to.row][move.to.col] = piece;

  const willPromote =
    !piece.king &&
    ((piece.player === HUMAN && move.to.row === 0) || (piece.player === AI && move.to.row === 7));
  if (willPromote) score += 22;

  const centerDistance = Math.abs(move.to.row - 3.5) + Math.abs(move.to.col - 3.5);
  score += 8 - centerDistance;

  const replyCaptures = getAllCaptures(simulation, replyPlayer);
  const unsafe = replyCaptures.some(
    (reply) => reply.captured?.row === move.to.row && reply.captured?.col === move.to.col,
  );
  if (unsafe) score -= 18;

  score += evaluateMaterial(simulation, piece.player) - evaluateMaterial(simulation, opponent(piece.player));
  return score + Math.random() * 0.15;
}

function directionsFor(piece) {
  const forward = piece.player === HUMAN ? -1 : 1;
  const dirs = [
    [forward, -1],
    [forward, 1],
  ];

  if (piece.king) {
    dirs.push([-forward, -1], [-forward, 1]);
  }

  return dirs;
}

function forEachPiece(sourceBoard, player, callback) {
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const piece = sourceBoard[row][col];
      if (piece?.player === player) callback(row, col, piece);
    }
  }
}

function getCoachCards() {
  if (gameState === "ended") {
    const score = calculateStrategyScore();
    const events = coachEvents.filter((event) => event.player === HUMAN);
    const exposures = events.filter((event) => event.exposed).length;
    const captures = events.filter((event) => event.capture).length;
    const promotions = events.filter((event) => event.becameKing).length;

    const cards = [
      {
        title: `Strategy score: ${score}/100`,
        body: score > 76
          ? "You created pressure without rushing. That is the core habit of strategic checkers."
          : "Your main growth area is seeing the opponent's immediate reply before moving.",
      },
      {
        title: exposures ? "Key mistake" : "Best habit",
        body: exposures
          ? `You left ${exposures} piece${exposures > 1 ? "s" : ""} open to immediate capture. Pause for one reply before each move.`
          : "You kept your pieces relatively safe after moving, which protects long-term plans.",
      },
      {
        title: "Next drill",
        body: promotions
          ? "Practice converting kings into material wins. You already reached promotion territory."
          : captures
            ? "Play a capture-chain drill next. You found tactical chances; now connect them."
            : "Play a center-control drill next. Better central routes create more forcing moves.",
      },
    ];

    if (progress.proActive) {
      cards.push({
        title: "Pro pattern",
        body: exposures
          ? "Deep review tags your main leak as reply awareness. Your next three drills should start by predicting the opponent capture."
          : "Deep review tags your strongest habit as position safety. Now convert that stability into planned captures.",
      });
    }

    return cards;
  }

  const captures = getAllCaptures(board, HUMAN);
  if (captures.length) {
    return [
      {
        title: "Forced tactic available",
        body: "You have a capture. Take it and look for a second jump from the landing square.",
      },
      {
        title: "Coach focus",
        body: "Before moving, ask: what does this piece protect after it lands?",
      },
    ];
  }

  const lastHumanEvent = [...coachEvents].reverse().find((event) => event.player === HUMAN);
  if (lastHumanEvent?.exposed) {
    return [
      {
        title: "Live warning",
        body: "Your last move can be captured. The lesson is not speed, it is reply awareness.",
      },
      {
        title: "Micro habit",
        body: "After every move, imagine the opponent's strongest capture before celebrating the plan.",
      },
    ];
  }

  return [
    {
      title: "Training lens",
      body: "Use the board as a thinking gym: control center squares, trade only with purpose, and aim for promotion.",
    },
    {
      title: "Current goal",
      body: "Build a position where your next move creates either a capture or a safe route to king.",
    },
  ];
}

function buildSummary() {
  const score = calculateStrategyScore();
  const humanEvents = coachEvents.filter((event) => event.player === HUMAN);
  const captures = humanEvents.filter((event) => event.capture).length;
  const exposures = humanEvents.filter((event) => event.exposed).length;
  const promotions = humanEvents.filter((event) => event.becameKing).length;

  return [
    {
      title: "Thinking score",
      body: `${score}/100 based on material, safety, captures, and promotion progress.`,
    },
    {
      title: "Strongest pattern",
      body: captures
        ? `You converted ${captures} capture opportunity${captures > 1 ? "ies" : "y"}.`
        : "No captures yet. Try building central pressure to create forcing moves.",
    },
    {
      title: "Weak spot",
      body: exposures
        ? `${exposures} exposed move${exposures > 1 ? "s" : ""}. Train one-move-ahead defense.`
        : promotions
          ? "Endgame conversion is next: use kings to squeeze the board."
          : "The next unlock is foresight: predict the reply before each move.",
    },
  ];
}

function calculateStrategyScore() {
  const material = evaluateMaterial(board, HUMAN) - evaluateMaterial(board, AI);
  const humanEvents = coachEvents.filter((event) => event.player === HUMAN);
  const captures = humanEvents.filter((event) => event.capture).length;
  const exposed = humanEvents.filter((event) => event.exposed).length;
  const promotions = humanEvents.filter((event) => event.becameKing).length;
  return clamp(62 + material * 4 + captures * 7 + promotions * 9 - exposed * 8, 35, 96);
}

function getLiveTip() {
  const captures = getAllCaptures(board, HUMAN);
  if (captures.length) return "There is a capture on the board. Tactical moments are where games turn.";

  const material = evaluateMaterial(board, HUMAN) - evaluateMaterial(board, AI);
  if (material > 0) return "You are ahead. Trade carefully and keep routes to promotion open.";
  if (material < 0) return "You are behind. Look for forcing captures instead of quiet trades.";
  return "Balanced position. Improve one piece before starting a fight.";
}

function evaluateMaterial(sourceBoard, player) {
  let score = 0;
  forEachPiece(sourceBoard, player, (_row, _col, piece) => {
    score += piece.king ? 2 : 1;
  });
  return score;
}

function countPieces(sourceBoard, player) {
  let men = 0;
  let kings = 0;
  forEachPiece(sourceBoard, player, (_row, _col, piece) => {
    if (piece.king) kings += 1;
    else men += 1;
  });
  return { men, kings, total: men + kings };
}

function cloneBoard(sourceBoard) {
  return sourceBoard.map((row) => row.map((piece) => (piece ? { ...piece } : null)));
}

function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved) return normalizeProgress(saved);
  } catch (_error) {
    localStorage.removeItem(STORAGE_KEY);
  }

  return normalizeProgress({});
}

function normalizeProgress(saved) {
  return {
    ...defaultProgress(),
    ...saved,
    activeMissionIndex: Number.isInteger(saved.activeMissionIndex) ? saved.activeMissionIndex : 0,
    missionClaimed: Boolean(saved.missionClaimed),
    leagueJoined: Boolean(saved.leagueJoined),
    proActive: Boolean(saved.proActive),
    onboardingSeen: Boolean(saved.onboardingSeen),
  };
}

function defaultProgress() {
  return {
    games: 0,
    wins: 0,
    streak: 0,
    xp: 80,
    tactics: 42,
    foresight: 38,
    endgame: 31,
    activeMissionIndex: 0,
    missionClaimed: false,
    leagueJoined: false,
    proActive: false,
    onboardingSeen: false,
  };
}

function saveProgress(nextProgress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProgress));
}

function isDarkSquare(row, col) {
  return (row + col) % 2 === 1;
}

function isInside(row, col) {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

function opponent(player) {
  return player === HUMAN ? AI : HUMAN;
}

function squareName(row, col) {
  return `${"abcdefgh"[col]}${BOARD_SIZE - row}`;
}

function formatMove(label, move) {
  const divider = move.captured ? "x" : "-";
  return `${label}: ${squareName(move.from.row, move.from.col)}${divider}${squareName(move.to.row, move.to.col)}`;
}

function signed(value) {
  if (value > 0) return `+${value}`;
  return String(value);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("show");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => toastEl.classList.remove("show"), 2600);
}
