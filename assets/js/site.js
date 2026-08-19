(function () {
  "use strict";

  function navSpy() {
    var links = Array.prototype.slice.call(document.querySelectorAll(".rail-nav a"));
    var ids = links
      .map(function (a) {
        return a.getAttribute("href");
      })
      .filter(function (h) {
        return h && h.charAt(0) === "#";
      });
    var sections = ids
      .map(function (id) {
        return document.querySelector(id);
      })
      .filter(Boolean);
    if (!sections.length || !("IntersectionObserver" in window)) return;

    var current = "";
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) current = "#" + entry.target.id;
        });
        links.forEach(function (a) {
          a.classList.toggle("is-active", a.getAttribute("href") === current);
        });
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: 0 }
    );
    sections.forEach(function (s) {
      io.observe(s);
    });
  }

  function stackBoard() {
    var board = document.querySelector("[data-stack]");
    if (!board) return;
    var blurb = board.querySelector("[data-stack-blurb]");
    var nodes = board.querySelectorAll(".stack-node");
    function show(node) {
      nodes.forEach(function (n) {
        n.classList.toggle("is-active", n === node);
      });
      blurb.textContent = node.getAttribute("data-blurb") || "";
      blurb.hidden = false;
    }
    nodes.forEach(function (node) {
      node.addEventListener("mouseenter", function () {
        show(node);
      });
      node.addEventListener("focus", function () {
        show(node);
      });
    });
  }

  function driftSketch() {
    var root = document.querySelector("[data-drift]");
    if (!root) return;
    var canvas = root.querySelector("canvas");
    var status = root.querySelector("[data-drift-status]");
    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var points = [];
    var k = 3;
    var drifts = 0;
    var cursor = null;

    function seed() {
      points = [];
      var i;
      for (i = 0; i < 28; i += 1) {
        var left = i < 14;
        points.push({
          x: (left ? 0.22 : 0.72) + (Math.random() - 0.5) * 0.28,
          y: 0.5 + (Math.random() - 0.5) * 0.55,
          label: left ? 0 : 1
        });
      }
      drifts = 0;
    }

    function dist(a, b) {
      var dx = a.x - b.x;
      var dy = a.y - b.y;
      return dx * dx + dy * dy;
    }

    function neighborsAt(x, y) {
      return points
        .map(function (p) {
          return { point: p, d: dist(p, { x: x, y: y }) };
        })
        .sort(function (a, b) {
          return a.d - b.d;
        })
        .slice(0, k);
    }

    function classify(x, y) {
      if (!points.length) return 0;
      var votes = [0, 0];
      neighborsAt(x, y).forEach(function (s) {
        votes[s.point.label] += 1;
      });
      return votes[1] > votes[0] ? 1 : 0;
    }

    function posFromEvent(e) {
      var rect = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height
      };
    }

    function draw() {
      var w = canvas.width;
      var h = canvas.height;
      var step = 16;
      var x, y, c;
      var nearest = cursor ? neighborsAt(cursor.x, cursor.y) : [];
      ctx.clearRect(0, 0, w, h);
      for (y = 0; y < h; y += step) {
        for (x = 0; x < w; x += step) {
          c = classify(x / w, y / h);
          ctx.fillStyle = c ? "rgba(94, 234, 212, 0.12)" : "rgba(251, 146, 60, 0.12)";
          ctx.fillRect(x, y, step, step);
        }
      }
      if (cursor && nearest.length) {
        nearest.forEach(function (s) {
          ctx.beginPath();
          ctx.moveTo(cursor.x * w, cursor.y * h);
          ctx.lineTo(s.point.x * w, s.point.y * h);
          ctx.strokeStyle = s.point.label ? "rgba(94, 234, 212, 0.85)" : "rgba(251, 146, 60, 0.85)";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        });
        ctx.beginPath();
        ctx.arc(cursor.x * w, cursor.y * h, 4, 0, Math.PI * 2);
        ctx.fillStyle = classify(cursor.x, cursor.y) ? "#5eead4" : "#fb923c";
        ctx.fill();
      }
      points.forEach(function (p) {
        var hit = nearest.some(function (s) {
          return s.point === p;
        });
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, hit ? 7 : 5, 0, Math.PI * 2);
        ctx.fillStyle = p.label ? "#5eead4" : "#fb923c";
        ctx.fill();
        if (hit) {
          ctx.lineWidth = 2;
          ctx.strokeStyle = "#e7eaf0";
          ctx.stroke();
        }
      });
    }

    function setStatus() {
      status.textContent = drifts
        ? "Drifted ×" + drifts + " · " + points.length + " points"
        : points.length + " points · k=3";
    }

    canvas.addEventListener("contextmenu", function (e) {
      e.preventDefault();
    });

    canvas.addEventListener("pointermove", function (e) {
      cursor = posFromEvent(e);
      draw();
    });

    canvas.addEventListener("pointerleave", function () {
      cursor = null;
      draw();
    });

    canvas.addEventListener("pointerdown", function (e) {
      if (e.button !== 0 && e.button !== 2) return;
      e.preventDefault();
      var p = posFromEvent(e);
      points.push({ x: p.x, y: p.y, label: e.button === 2 ? 1 : 0 });
      cursor = p;
      draw();
      setStatus();
    });

    root.querySelector("[data-drift-go]").addEventListener("click", function () {
      points.forEach(function (p) {
        p.x = Math.min(0.98, Math.max(0.02, p.x + (Math.random() - 0.5) * 0.28));
        p.y = Math.min(0.98, Math.max(0.02, p.y + (Math.random() - 0.5) * 0.28));
        if (Math.random() < 0.35) p.label = 1 - p.label;
      });
      drifts += 1;
      draw();
      setStatus();
    });

    root.querySelector("[data-drift-reset]").addEventListener("click", function () {
      seed();
      draw();
      setStatus();
    });

    seed();
    draw();
    setStatus();
  }

  navSpy();
  stackBoard();
  driftSketch();
})();
