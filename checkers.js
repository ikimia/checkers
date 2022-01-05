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
      const [piece, square] = getRandom(getPossibleMoves("p1"));
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

const board = document.getElementById("board");

for (let row = 0; row < 8; row++) {
  for (let column = 0; column < 8; column++) {
    board.appendChild(newDiv(`s${row},${column}`, "square"));
  }
}

const isOnBoard = (n) => n >= 0 && n < 8;
function getSquare(row, column) {
  if (!isOnBoard(row) || !isOnBoard(column)) return null;
  return board.children[row * 8 + column];
}

function forEachSquare(fromRow, toRow, fn) {
  let i = 0;
  for (let row = fromRow; row < toRow; row++) {
    for (let col = 1 - (row % 2); col < 8; col += 2) {
      fn(getSquare(row, col), i++);
    }
  }
}

function newPiece(player, i) {
  const piece = newDiv(`${player}-${i}`, `piece ${player}`);
  assignDragListener(piece);
  return piece;
}

function startGame() {
  document.querySelectorAll(".piece").forEach((p) => p.remove());
  forEachSquare(0, 3, (square, i) => square.appendChild(newPiece("p1", i++)));
  forEachSquare(5, 8, (square, i) => square.appendChild(newPiece("p2", i++)));
  prevActive = null;
  prevCaptured = false;
}

function getPossibleMoves(player) {
  const moves = [];
  document.querySelectorAll(`.piece.${player}`).forEach((piece) => {
    const p = getPlayer(piece);
    const row = getRow(piece.parentElement);
    const column = getColumn(piece.parentElement);
    const rdirs = [p === "p1" ? 1 : -1];
    if (piece.classList.contains("king")) rdirs.push(rdirs[0] * -1);
    rdirs.forEach((rdir) => {
      [-1, +1].forEach((cdir) => {
        const nextSquare = getSquare(row + rdir, column + cdir);
        if (!nextSquare) return;
        if (!nextSquare.childElementCount) moves.push([piece, nextSquare]);
        const nextPiece = nextSquare.firstElementChild;
        if (!nextPiece || getPlayer(nextPiece) === p) return;
        const capturingSquare = getSquare(row + rdir * 2, column + cdir * 2);
        if (!capturingSquare) return;
        if (!capturingSquare.childElementCount)
          moves.push([piece, capturingSquare]);
      });
    });
  });
  return moves;
}

startGame();

document.getElementById("newGame").addEventListener("click", startGame);
