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
    nodes.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var on = btn.getAttribute("aria-pressed") === "true";
        nodes.forEach(function (n) {
          n.setAttribute("aria-pressed", "false");
        });
        if (on) {
          blurb.hidden = true;
          blurb.textContent = "";
          return;
        }
        btn.setAttribute("aria-pressed", "true");
        blurb.textContent = btn.getAttribute("data-blurb") || "";
        blurb.hidden = false;
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

  function ensembleSketch() {
    var root = document.querySelector("[data-ensemble]");
    if (!root) return;
    var canvas = root.querySelector("canvas");
    var status = root.querySelector("[data-ensemble-status]");
    var voteRow = root.querySelector("[data-ensemble-votes]");
    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var points = [];
    var bags = [];
    var k = 3;
    var nBags = 3;
    var cursor = null;

    function seedPoints() {
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
    }

    function resample() {
      bags = [];
      var b, i, pick;
      for (b = 0; b < nBags; b += 1) {
        var bag = [];
        for (i = 0; i < points.length; i += 1) {
          pick = points[Math.floor(Math.random() * points.length)];
          bag.push(pick);
        }
        bags.push(bag);
      }
    }

    function dist(a, b) {
      var dx = a.x - b.x;
      var dy = a.y - b.y;
      return dx * dx + dy * dy;
    }

    function classifyBag(bag, x, y) {
      if (!bag.length) return 0;
      var scored = bag
        .map(function (p) {
          return { label: p.label, d: dist(p, { x: x, y: y }) };
        })
        .sort(function (a, b) {
          return a.d - b.d;
        })
        .slice(0, k);
      var votes = [0, 0];
      scored.forEach(function (s) {
        votes[s.label] += 1;
      });
      return votes[1] > votes[0] ? 1 : 0;
    }

    function votesAt(x, y) {
      return bags.map(function (bag) {
        return classifyBag(bag, x, y);
      });
    }

    function majority(votes) {
      var teal = 0;
      votes.forEach(function (v) {
        if (v) teal += 1;
      });
      return teal > votes.length / 2 ? 1 : 0;
    }

    function posFromEvent(e) {
      var rect = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height
      };
    }

    function paintVotes(votes) {
      if (!voteRow) return;
      voteRow.hidden = !cursor;
      if (!cursor) return;
      var i;
      for (i = 0; i < nBags; i += 1) {
        var el = voteRow.querySelector('[data-voter="' + i + '"]');
        if (!el) continue;
        el.setAttribute("data-label", String(votes[i]));
      }
      var call = voteRow.querySelector("[data-ensemble-call]");
      if (call) call.setAttribute("data-label", String(majority(votes)));
    }

    function labelColor(label) {
      return label ? "#5eead4" : "#fb923c";
    }

    function drawMark(kind, x, y, r, fill, stroke) {
      ctx.beginPath();
      if (kind === 0) {
        ctx.arc(x, y, r, 0, Math.PI * 2);
      } else if (kind === 1) {
        ctx.rect(x - r, y - r, r * 2, r * 2);
      } else {
        ctx.moveTo(x, y - r);
        ctx.lineTo(x + r * 0.95, y + r * 0.72);
        ctx.lineTo(x - r * 0.95, y + r * 0.72);
        ctx.closePath();
      }
      ctx.fillStyle = fill;
      ctx.fill();
      if (stroke) {
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = stroke;
        ctx.stroke();
      }
    }

    function markAt(cx, cy, kind, radius) {
      var ang = (-Math.PI / 2) + (kind * (Math.PI * 2)) / nBags;
      return {
        x: cx + Math.cos(ang) * radius,
        y: cy + Math.sin(ang) * radius
      };
    }

    function bagHas(bag, point) {
      return bag.indexOf(point) !== -1;
    }

    function draw() {
      var w = canvas.width;
      var h = canvas.height;
      var step = 16;
      var x, y, votes, agree, c, i, pos, used;
      ctx.clearRect(0, 0, w, h);
      for (y = 0; y < h; y += step) {
        for (x = 0; x < w; x += step) {
          votes = votesAt((x + step / 2) / w, (y + step / 2) / h);
          c = majority(votes);
          agree = votes.every(function (v) {
            return v === c;
          });
          ctx.fillStyle = c
            ? agree
              ? "rgba(94, 234, 212, 0.2)"
              : "rgba(94, 234, 212, 0.08)"
            : agree
              ? "rgba(251, 146, 60, 0.2)"
              : "rgba(251, 146, 60, 0.08)";
          ctx.fillRect(x, y, step, step);
        }
      }
      points.forEach(function (p) {
        used = 0;
        for (i = 0; i < nBags; i += 1) {
          if (bagHas(bags[i], p)) used += 1;
        }
        for (i = 0; i < nBags; i += 1) {
          if (!bagHas(bags[i], p)) continue;
          pos = markAt(p.x * w, p.y * h, i, used > 1 ? 8 : 0);
          drawMark(i, pos.x, pos.y, 5.5, labelColor(p.label));
        }
      });
      if (cursor) {
        votes = votesAt(cursor.x, cursor.y);
        paintVotes(votes);
        for (i = 0; i < nBags; i += 1) {
          pos = markAt(cursor.x * w, cursor.y * h, i, 18);
          drawMark(i, pos.x, pos.y, 6, labelColor(votes[i]), "#e7eaf0");
        }
        ctx.beginPath();
        ctx.arc(cursor.x * w, cursor.y * h, 6, 0, Math.PI * 2);
        ctx.fillStyle = labelColor(majority(votes));
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "#e7eaf0";
        ctx.stroke();
      } else if (voteRow) {
        voteRow.hidden = true;
      }
    }

    function setStatus() {
      status.textContent = nBags + " bags · " + points.length + " points · k=3";
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
      resample();
      cursor = p;
      draw();
      setStatus();
    });

    root.querySelector("[data-ensemble-bag]").addEventListener("click", function () {
      resample();
      draw();
    });

    root.querySelector("[data-ensemble-reset]").addEventListener("click", function () {
      seedPoints();
      resample();
      draw();
      setStatus();
    });

    seedPoints();
    resample();
    draw();
    setStatus();
  }

  navSpy();
  stackBoard();
  driftSketch();
  ensembleSketch();
})();
