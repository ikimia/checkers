import dragAndDrop from "./drag.js";

let currentTurnMoves = null;
let currentPlayer = null;

const newDiv = (id, className) =>
  Object.assign(document.createElement("div"), { id, className });

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const getRow = (square) => +square.id.substring(1, square.id.indexOf(","));
const getColumn = (square) => +square.id.substring(square.id.indexOf(",") + 1);
const getPlayer = (piece) => piece.id.substring(0, 2);

const { assignDragListener, simulateDragAndDrop } = dragAndDrop(
  (element) => {
    Object.values(currentTurnMoves[element.id] ?? {}).forEach((move) => {
      move.square.classList.add("droppable");
    });
  },
  (element, droppedInTarget, targetSquare) => {
    Object.values(currentTurnMoves[element.id] ?? {}).forEach((move) => {
      move.square.classList.remove("droppable");
    });
    if (!droppedInTarget) return;
    const { capturedSquare } = currentTurnMoves[element.id][targetSquare.id];
    capturedSquare?.firstElementChild.remove();
    const row = getRow(targetSquare);
    const player = getPlayer(element);
    if ((player === "p1" && row === 7) || (player === "p2" && row === 0)) {
      element.classList.add("king");
    }
    startTurn(currentPlayer === "p1" ? "p2" : "p1");
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

function startTurn(player) {
  currentPlayer = player;
  const possibleMoves = getPossibleMoves(player);
  currentTurnMoves = {};
  possibleMoves.forEach((move) => {
    currentTurnMoves[move.piece.id] = {};
  });
  possibleMoves.forEach((move) => {
    currentTurnMoves[move.piece.id][move.square.id] = move;
  });
  if (player === "p1") {
    const randomMove = getRandom(possibleMoves);
    if (!randomMove) return;
    const { piece, square } = randomMove;
    simulateDragAndDrop(piece, square);
  }
}

function startGame() {
  document.querySelectorAll(".piece").forEach((p) => p.remove());
  forEachSquare(0, 3, (square, i) => square.appendChild(newPiece("p1", i++)));
  forEachSquare(5, 8, (square, i) => square.appendChild(newPiece("p2", i++)));
  startTurn("p2");
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
        if (!nextSquare.childElementCount) {
          moves.push({ piece, square: nextSquare });
        }
        const nextPiece = nextSquare.firstElementChild;
        if (!nextPiece || getPlayer(nextPiece) === p) return;
        const capturingSquare = getSquare(row + rdir * 2, column + cdir * 2);
        if (!capturingSquare) return;
        if (!capturingSquare.childElementCount) {
          moves.push({
            piece,
            square: capturingSquare,
            capturedSquare: nextSquare,
          });
        }
      });
    });
  });
  return moves;
}

startGame();

document.getElementById("newGame").addEventListener("click", startGame);
