import dragAndDrop from "./drag.js";

let activePiece = null;
let prevSquare = null;
let capturedSquare = null;

let prevActive = null;
let prevCaptured = false;

const observed = (onUpdate) => ({
  _value: null,
  update(value) {
    if (value === this._value) return;
    onUpdate(this._value, value);
    this._value = value;
  },
});

const newDiv = (className, data) => {
  const div = document.createElement("div");
  div.className = className;
  Object.entries(data ?? {}).forEach(([name, value]) => {
    div.setAttribute(`data-${name}`, value);
  });
  return div;
};

const getRow = (square) => +square.dataset.row;
const getColumn = (square) => +square.dataset.column;
const getPlayer = (piece) => piece.dataset.player;

const getRowDiff = (piece, square) => {
  const diff = getRow(square) - getRow(prevSquare);
  if (piece.classList.contains("king")) return Math.abs(diff);
  if (getPlayer(piece) === "p1") return diff;
  return diff * -1;
};

const assertDiff = (piece, square, expected) =>
  getRowDiff(piece, square) === expected &&
  Math.abs(getColumn(prevSquare) - getColumn(square)) === expected;

const getMiddleSquare = (square) => {
  const row = (getRow(prevSquare) + getRow(square)) / 2;
  const column = (getColumn(prevSquare) + getColumn(square)) / 2;
  const selector = `.square[data-row="${row}"][data-column="${column}"]`;
  return document.querySelector(selector);
};

const targetSquare = observed((prev, updated) => {
  prev?.classList.remove("target");
  updated?.classList.add("target");
});

const isChangedPlayer = () =>
  !prevActive || getPlayer(prevActive) !== getPlayer(activePiece);

const isInMultiCapture = () => prevCaptured && prevActive === activePiece;

const hoveredSquare = observed((_, square) => {
  targetSquare.update(null);
  capturedSquare = null;
  if (!square?.classList.contains("square")) return;
  if (!activePiece) return;
  if (square.childElementCount > 0) return;
  if (assertDiff(activePiece, square, 1)) {
    if (!isChangedPlayer()) return;
    targetSquare.update(square);
    return;
  }
  if (assertDiff(activePiece, square, 2)) {
    const middleSquare = getMiddleSquare(square);
    if (
      middleSquare.childElementCount > 0 &&
      getPlayer(middleSquare.firstElementChild) !== getPlayer(activePiece)
    ) {
      if (!isChangedPlayer() && !isInMultiCapture()) return;
      capturedSquare = middleSquare;
      targetSquare.update(square);
    }
  }
});

const assignDragListener = dragAndDrop(
  (element) => {
    activePiece = element;
    prevSquare = element.parentNode;
    document.body.appendChild(activePiece);
  },
  () => {
    if (!activePiece) return;
    if (targetSquare._value) {
      targetSquare._value.appendChild(activePiece);
      if (capturedSquare) {
        capturedSquare.firstElementChild.remove();
        prevCaptured = true;
      } else {
        prevCaptured = false;
      }
      const row = getRow(targetSquare._value);
      const player = getPlayer(activePiece);
      if ((player === "p1" && row === 7) || (player === "p2" && row === 0)) {
        activePiece.classList.add("king");
      }
      prevActive = activePiece;
    } else {
      prevSquare.appendChild(activePiece);
    }
    Object.assign(activePiece.style, { position: null, pointerEvents: null });
    activePiece = null;
    prevSquare = null;
    hoveredSquare.update(null);
  },
  (clientX, clientY) => {
    hoveredSquare.update(document.elementFromPoint(clientX, clientY));
  }
);

const addPiece = (player) => (square) => {
  const piece = newDiv("piece", { player });
  assignDragListener(piece);
  square.appendChild(piece);
};

const squares = Array.from({ length: 64 }, (_, i) =>
  newDiv("square", { row: Math.floor(i / 8), column: i % 8 })
);
const droppables = squares.filter(
  (s) => (getColumn(s) + (getRow(s) % 2)) % 2 === 1
);
document.getElementById("board").append(...squares);

function startGame() {
  droppables.forEach((s) => s.firstElementChild?.remove());
  droppables.slice(0, 12).forEach(addPiece("p1"));
  droppables.slice(-12).forEach(addPiece("p2"));
  prevActive = null;
  prevCaptured = false;
}

startGame();

document.getElementById("newGame").addEventListener("click", startGame);
