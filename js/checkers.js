import dragAndDrop from "./drag.js";

let currentTurnMoves = null;

const newDiv = (id, className) =>
  Object.assign(document.createElement("div"), { id, className });

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const getRow = (square) => +square.id.substring(1, square.id.indexOf(","));
const getColumn = (square) => +square.id.substring(square.id.indexOf(",") + 1);
const getPlayer = (piece) => piece.id.substring(0, 2);
const getPieces = (player) =>
  Array.from(document.querySelectorAll(`.piece.${player}`));

const forEachMoveSquare = (element, fn) =>
  Object.values(currentTurnMoves[element.id]).forEach((m) => {
    fn(m.square.classList);
  });

const { draggable, simulateDragAndDrop } = dragAndDrop(
  (element) => {
    forEachMoveSquare(element, (cl) => cl.add("droppable"));
  },
  (element, targetSquare) => {
    forEachMoveSquare(element, (cl) => cl.remove("droppable"));
    if (!targetSquare) return;
    const row = getRow(targetSquare);
    const player = getPlayer(element);
    if ((player === "p1" && row === 7) || (player === "p2" && row === 0)) {
      element.classList.add("king");
    }
    const move = currentTurnMoves[element.id][targetSquare.id];
    if (move.capturedSquare) {
      move.capturedSquare.firstElementChild.remove();
      const multiCaptureMoves = getPossibleMoves(move.piece).filter(
        (m) => m.capturedSquare
      );
      if (multiCaptureMoves.length) {
        return startTurn(multiCaptureMoves);
      }
    }
    const nextPlayer = player === "p2" ? "p1" : "p2";
    const nextPlayerPieces = getPieces(nextPlayer);
    if (nextPlayerPieces.length === 0) {
      const message = player === "p1" ? "The compter wins!" : "You win!";
      return startGame(`GAME OVER\n${message}`);
    }
    const possibleMoves = nextPlayerPieces.flatMap(getPossibleMoves);
    if (possibleMoves.length === 0) {
      return startGame("No possible moves");
    }
    startTurn(possibleMoves);
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

const newPiece = (player, i) => newDiv(`${player}-${i}`, `piece ${player}`);

function startTurn(possibleMoves) {
  currentTurnMoves = new Proxy({}, { get: (t, p) => t[p] ?? (t[p] = {}) });
  possibleMoves.forEach((move) => {
    currentTurnMoves[move.piece.id][move.square.id] = move;
  });
  if (possibleMoves[0] && getPlayer(possibleMoves[0].piece) === "p1") {
    const capturingMoves = possibleMoves.filter((move) => move.capturedSquare);
    const randomMove = capturingMoves.length
      ? getRandom(capturingMoves)
      : getRandom(possibleMoves);
    if (!randomMove) return;
    const { piece, square } = randomMove;
    simulateDragAndDrop(piece, square);
  }
}

function startGame(message) {
  if (message) alert(message);
  [...getPieces("p1"), ...getPieces("p2")].forEach((p) => p.remove());
  forEachSquare(0, 3, (square, i) => square.appendChild(newPiece("p1", i++)));
  forEachSquare(5, 8, (square, i) =>
    square.appendChild(draggable(newPiece("p2", i++)))
  );
  startTurn(getPieces("p2").flatMap(getPossibleMoves));
}

function getPossibleMoves(piece) {
  const moves = [];
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
  return moves;
}

startGame();

const firstSquare = board.firstElementChild;
firstSquare.classList.add("newGame");
firstSquare.addEventListener("click", () => startGame());
