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

const newDiv = (id, className) =>
  Object.assign(document.createElement("div"), { id, className });

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const getRow = (square) => +square.id.substring(1, square.id.indexOf(","));
const getColumn = (square) => +square.id.substring(square.id.indexOf(",") + 1);
const getPlayer = (piece) => piece.id.substring(0, 2);

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
  return document.getElementById(`s${row},${column}`);
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

const { assignDragListener, simulateDragAndDrop } = dragAndDrop(
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
    if (prevActive && getPlayer(prevActive) === "p2") {
      const moves = getPossibleMoves("p1");
      const source = getRandom(Object.keys(moves));
      const square = getRandom(moves[source]);
      const piece = droppables[source].firstElementChild;
      simulateDragAndDrop(
        piece,
        piece.offsetLeft + piece.offsetWidth / 2,
        piece.offsetTop + piece.offsetHeight / 2,
        square.offsetLeft + square.offsetWidth / 2,
        square.offsetTop + square.offsetHeight / 2
      );
    }
  },
  (clientX, clientY) => {
    hoveredSquare.update(document.elementFromPoint(clientX, clientY));
  }
);

const addPiece = (player) => (square, i) => {
  square.appendChild(newDiv(`${player}-${i}`, `piece ${player}`));
};

const squares = Array.from({ length: 64 }, (_, i) =>
  newDiv(`s${Math.floor(i / 8)},${i % 8}`, "square")
);
const droppables = squares.filter(
  (s) => (getColumn(s) + (getRow(s) % 2)) % 2 === 1
);
document.getElementById("board").append(...squares);

function startGame() {
  droppables.forEach((s) => s.firstElementChild?.remove());
  droppables.slice(0, 12).forEach(addPiece("p1"));
  droppables.slice(-12).forEach(addPiece("p2"));
  droppables
    .filter((s) => s.childElementCount)
    .map((s) => s.firstElementChild)
    .forEach(assignDragListener);
  prevActive = null;
  prevCaptured = false;
}

const isOnBoard = (n) => n >= 0 && n < 8;
const addPossibleMoves = (moves, piece, i) => {
  const p = getPlayer(piece);
  const row = getRow(droppables[i]);
  const column = getColumn(droppables[i]);
  const rDirections = p === "p1" ? [1] : [-1];
  if (piece.classList.contains("king")) {
    rDirections.push(rDirections[0] * -1);
  }
  rDirections.forEach((rDirection) => {
    const nextRow = row + rDirection;
    if (!isOnBoard(nextRow)) return;
    [-1, +1].forEach((cDirection) => {
      const nextColumn = column + cDirection;
      if (!isOnBoard(nextColumn)) return;
      const nextSpot = document.getElementById(`s${nextRow},${nextColumn}`);
      if (!nextSpot.childElementCount) {
        moves[i] = moves[i] ?? [];
        moves[i].push(nextSpot);
        return;
      }
      if (getPlayer(nextSpot.firstElementChild) === p) return;
      const capturingRow = row + rDirection * 2;
      const capturingColumn = column + cDirection * 2;
      if (!isOnBoard(capturingRow) || !isOnBoard(capturingColumn)) return;
      const capturingSpot = document.getElementById(
        `s${capturingRow},${capturingColumn}`
      );
      if (!capturingSpot.childElementCount) {
        moves[i] = moves[i] ?? [];
        moves[i].push(capturingSpot);
      }
    });
  });
};

function getPossibleMoves(player) {
  const moves = {};
  droppables.forEach((d, i) => {
    if (!d.childElementCount) return;
    const p = getPlayer(d.firstElementChild);
    if (p !== player) return;
    addPossibleMoves(moves, d.firstElementChild, i);
  });
  return moves;
}

startGame();

document.getElementById("newGame").addEventListener("click", startGame);
