const isMobile = !!navigator.maxTouchPoints;

function dragAndDrop(onDrag, onDrop) {
  let dx = 0;
  let dy = 0;
  let element = null;
  let inSimulation = false;
  let source = null;
  let target = null;

  const pick = (el, x, y) => {
    element = el;
    dx = x - element.offsetLeft;
    dy = y - element.offsetTop;
    Object.assign(element.style, {
      position: "absolute",
      top: `${element.offsetTop + document.body.scrollTop}px`,
      left: `${element.offsetLeft + document.body.scrollLeft}px`,
      pointerEvents: "none",
    });
    source = element.parentNode;
    document.body.appendChild(element);
    onDrag(element);
  };
  const dragListener = (e) => {
    if (inSimulation) return;
    e.preventDefault();
    pick(e.currentTarget, e.pageX, e.pageY);
  };

  const moveTo = (clientX, clientY) => {
    Object.assign(element.style, {
      top: `${clientY - dy + document.body.scrollTop}px`,
      left: `${clientX - dx + document.body.scrollLeft}px`,
    });
    target?.classList.remove("target");
    target = null;
    const potentialTarget = document.elementFromPoint(clientX, clientY);
    if (!potentialTarget.classList.contains("droppable")) return;
    target = potentialTarget;
    target.classList.add("target");
  };
  document.addEventListener(isMobile ? "touchmove" : "pointermove", (e) => {
    if (!element || inSimulation) return;
    e.preventDefault();
    const { clientX, clientY } = isMobile ? e.touches[0] : e;
    moveTo(clientX, clientY);
  });

  const drop = () => {
    const dropIn = target ?? source;
    dropIn.appendChild(element);
    Object.assign(element.style, { position: null, pointerEvents: null });
    source = null;
    target?.classList.remove("target");
    onDrop(element, dropIn === target, target);
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
      element.addEventListener(
        isMobile ? "touchstart" : "pointerdown",
        dragListener
      );
    },
    simulateDragAndDrop(element, fromX, fromY, toX, toY) {
      inSimulation = true;
      new Promise((resolve) => setTimeout(resolve, 250)).then(() => {
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
