(() => {
  "use strict";

  document.documentElement.classList.add("js");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const revealItems = document.querySelectorAll("[data-reveal]");

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -32px" }
    );
    revealItems.forEach((item) => observer.observe(item));
  }

  const year = document.querySelector("[data-current-year]");
  if (year) year.textContent = new Date().getFullYear();

  const canvas = document.querySelector("#signal-field");
  if (!canvas || reduceMotion) return;

  const context = canvas.getContext("2d");
  if (!context) return;

  const palette = {
    cyan: [97, 216, 255],
    lime: [183, 243, 107],
    coral: [255, 142, 114],
  };

  let width = 0;
  let height = 0;
  let nodes = [];
  let frame = 0;
  let pointer = { x: -1000, y: -1000 };

  const makeNode = (index) => {
    const colors = [palette.cyan, palette.lime, palette.cyan, palette.coral];
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      radius: index % 7 === 0 ? 2.7 : 1.7,
      color: colors[index % colors.length],
    };
  };

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const count = Math.max(28, Math.min(54, Math.round(width / 10)));
    nodes = Array.from({ length: count }, (_, index) => makeNode(index));
  };

  const draw = () => {
    context.clearRect(0, 0, width, height);
    context.fillStyle = "rgba(7, 17, 31, 0.12)";
    context.fillRect(0, 0, width, height);

    nodes.forEach((node, index) => {
      const dxPointer = pointer.x - node.x;
      const dyPointer = pointer.y - node.y;
      const pointerDistance = Math.hypot(dxPointer, dyPointer);
      if (pointerDistance < 120 && pointerDistance > 0) {
        node.vx -= (dxPointer / pointerDistance) * 0.0025;
        node.vy -= (dyPointer / pointerDistance) * 0.0025;
      }

      node.vx *= 0.998;
      node.vy *= 0.998;
      node.x += node.vx;
      node.y += node.vy;

      if (node.x < 0 || node.x > width) node.vx *= -1;
      if (node.y < 0 || node.y > height) node.vy *= -1;

      for (let otherIndex = index + 1; otherIndex < nodes.length; otherIndex += 1) {
        const other = nodes[otherIndex];
        const dx = node.x - other.x;
        const dy = node.y - other.y;
        const distance = Math.hypot(dx, dy);
        if (distance < 92) {
          const alpha = (1 - distance / 92) * 0.28;
          context.strokeStyle = `rgba(97, 216, 255, ${alpha})`;
          context.lineWidth = 0.75;
          context.beginPath();
          context.moveTo(node.x, node.y);
          context.lineTo(other.x, other.y);
          context.stroke();
        }
      }

      context.fillStyle = `rgb(${node.color.join(",")})`;
      context.beginPath();
      context.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      context.fill();
    });

    frame = window.requestAnimationFrame(draw);
  };

  const updatePointer = (event) => {
    const rect = canvas.getBoundingClientRect();
    pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  canvas.addEventListener("pointermove", updatePointer);
  canvas.addEventListener("pointerleave", () => {
    pointer = { x: -1000, y: -1000 };
  });
  window.addEventListener("resize", resize, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      window.cancelAnimationFrame(frame);
    } else {
      draw();
    }
  });

  resize();
  draw();
})();
