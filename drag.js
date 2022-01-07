const getXY = (e) => {
  const { clientX, clientY } = e;
  return [clientX, clientY];
};
const getCenter = (el) => [
  el.offsetLeft + el.offsetWidth / 2 - document.documentElement.scrollLeft,
  el.offsetTop + el.offsetHeight / 2 - document.documentElement.scrollTop,
];

function dragAndDrop(onPick, onDrop) {
  let dx = 0;
  let dy = 0;
  let element = null;
  let inSimulation = false;
  let source = null;
  let target = null;
  let lastHovered = null;

  const pick = (el, x, y) => {
    element = el;
    dx = x - el.offsetLeft;
    dy = y - el.offsetTop;
    Object.assign(element.style, {
      position: "absolute",
      top: `${y - dy}px`,
      left: `${x - dx}px`,
      pointerEvents: "none",
    });
    source = element.parentNode;
    document.body.appendChild(element);
    onPick(element);
  };
  const onPointerDown = (e) => {
    if (inSimulation) return;
    e.preventDefault();
    pick(e.currentTarget, ...getXY(e));
  };

  const moveTo = (x, y) => {
    Object.assign(element.style, {
      top: `${y - dy}px`,
      left: `${x - dx}px`,
    });
    const hovered = document.elementFromPoint(x, y);
    if (hovered === lastHovered) return;
    lastHovered = hovered;
    target?.classList.remove("target");
    target = null;
    if (!hovered.classList.contains("droppable")) return;
    target = hovered;
    target.classList.add("target");
  };
  document.addEventListener("pointermove", (e) => {
    if (!element || inSimulation) return;
    e.preventDefault();
    moveTo(...getXY(e));
  });

  const drop = () => {
    const dropIn = target ?? source;
    dropIn.appendChild(element);
    Object.assign(element.style, { position: null, pointerEvents: null });
    target?.classList.remove("target");
    onDrop(element, dropIn === target, target);
    source = null;
    target = null;
    element = null;
  };
  document.addEventListener("pointerup", (e) => {
    if (!element || inSimulation) return;
    e.preventDefault();
    drop();
  });

  return {
    assignDragListener(element) {
      element.addEventListener("pointerdown", onPointerDown);
    },
    simulateDragAndDrop(element, target) {
      inSimulation = true;
      new Promise((resolve) => setTimeout(resolve, 250)).then(() => {
        const [fromX, fromY] = getCenter(element);
        const [toX, toY] = getCenter(target);
        pick(element, fromX, fromY);
        const xStep = (toX - fromX) / 30;
        const yStep = (toY - fromY) / 30;
        let moveX = fromX;
        let moveY = fromY;
        const interval = setInterval(() => {
          moveX += xStep;
          moveY += yStep;
          moveTo(moveX, moveY);
          if (Math.abs(moveX - toX) < 1 && Math.abs(moveY - toY) < 1) {
            clearInterval(interval);
            drop();
            inSimulation = false;
          }
        }, 1);
      });
    },
  };
}

export default dragAndDrop;
