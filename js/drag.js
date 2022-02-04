const getCenter = (el) => {
  const rect = el.getBoundingClientRect();
  return [rect.left + el.offsetWidth / 2, rect.top + el.offsetHeight / 2];
};

function dragAndDrop(onPick, onDrop) {
  let dx = 0;
  let dy = 0;
  let element = null;
  let inSimulation = false;
  let target = null;
  let lastHovered = null;

  const pick = (el, x, y) => {
    element = el;
    dx = x;
    dy = y;
    element.style.pointerEvents = "none";
    onPick(element);
  };
  const onPointerDown = (e) => {
    if (inSimulation) return;
    e.preventDefault();
    pick(e.currentTarget, e.clientX, e.clientY);
  };

  const moveTo = (x, y) => {
    element.style.transform = `translate(${x - dx}px, ${y - dy}px)`;
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
    moveTo(e.clientX, e.clientY);
  });

  const drop = () => {
    if (target) {
      target.appendChild(element);
      target.classList.remove("target");
    }
    Object.assign(element.style, { transform: null, pointerEvents: null });
    onDrop(element, target);
    target = null;
    element = null;
  };
  document.addEventListener("pointerup", (e) => {
    if (!element || inSimulation) return;
    e.preventDefault();
    drop();
  });

  return {
    draggable(element) {
      element.addEventListener("pointerdown", onPointerDown);
      return element;
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
