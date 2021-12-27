const isMobile = !!navigator.maxTouchPoints;

function dragAndDrop(onDrag, onDrop, onMove) {
  let dx = 0;
  let dy = 0;
  let element = null;
  const dragListener = (e) => {
    e.preventDefault();
    element = e.currentTarget;
    dx = e.pageX - element.offsetLeft;
    dy = e.pageY - element.offsetTop;
    Object.assign(element.style, {
      position: "absolute",
      top: `${element.offsetTop + document.body.scrollTop}px`,
      left: `${element.offsetLeft + document.body.scrollLeft}px`,
      pointerEvents: "none",
    });
    onDrag(element);
  };
  document.addEventListener(isMobile ? "touchmove" : "pointermove", (e) => {
    if (!element) return;
    e.preventDefault();
    Object.assign(element.style, {
      top: `${e.pageY - dy + document.body.scrollTop}px`,
      left: `${e.pageX - dx + document.body.scrollLeft}px`,
    });
    const { clientX, clientY } = isMobile ? e.touches[0] : e;
    onMove(clientX, clientY);
  });
  document.addEventListener("pointerup", (e) => {
    if (!element) return;
    e.preventDefault();
    element = null;
    onDrop();
  });
  return (element) => {
    element.addEventListener(
      isMobile ? "touchstart" : "pointerdown",
      dragListener
    );
  };
}

export default dragAndDrop;
