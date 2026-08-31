(function () {
  "use strict";

  var walk = document.querySelector("[data-walk]");
  if (!walk) return;

  var LETTERS = ["A", "B", "C", "D"];
  var PART_NAME = {
    A: "Part A · Warm up",
    B: "Part B · Money in everyday situations",
    C: "Part C · Read carefully",
    D: "Part D · Quick fire on market awareness"
  };
  var SCENES = 5;
  var FOLIO = ["The sitting", "The paper", "The letter", "The reading", "North star"];

  var paper = window.SKYWARD_PAPER || [];
  var scene = 0;
  var qIndex = 0;
  var partFilter = "all";
  var lastFocus = null;
  var clockTimer = null;
  var curtainTimer = null;
  var sittingStarted = false;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var folioEl = walk.querySelector("[data-walk-folio]");
  var prevBtn = walk.querySelector("[data-walk-prev]");
  var nextBtn = walk.querySelector("[data-walk-next]");
  var cardEl = walk.querySelector("[data-paper-card]");
  var gridEl = walk.querySelector("[data-paper-grid]");
  var clockEl = walk.querySelector("[data-clock]");
  var barEl = walk.querySelector("[data-clock-bar]");
  var letterEl = walk.querySelector("[data-letter]");
  var envelopeBtn = walk.querySelector("[data-open-letter]");
  var curtain = walk.querySelector("[data-curtain]");

  function esc(s) {
    return String(s || "").replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function visibleQuestions() {
    if (partFilter === "all") return paper;
    return paper.filter(function (q) { return q.part === partFilter; });
  }

  function currentQuestion() {
    var list = visibleQuestions();
    if (!list.length) return paper[0];
    if (qIndex >= list.length) qIndex = 0;
    return list[qIndex];
  }

  function renderGrid() {
    if (!gridEl) return;
    var list = visibleQuestions();
    gridEl.innerHTML = list.map(function (q, i) {
      return '<button type="button" data-jump-q="' + i + '"' +
        (i === qIndex ? ' class="is-on" aria-current="true"' : "") +
        ">" + q.n + "</button>";
    }).join("");
  }

  function renderQuestion() {
    var q = currentQuestion();
    if (!q || !cardEl) return;
    var bullets = (q.bullets || []).map(function (b) {
      return "<li>" + esc(b) + "</li>";
    }).join("");
    var opts = q.opts.map(function (text, i) {
      var L = LETTERS[i];
      return (
        '<button type="button" class="walk-opt" data-opt="' + L + '">' +
        "<b>" + L + "</b><span>" + esc(text) + "</span></button>"
      );
    }).join("");
    cardEl.innerHTML =
      '<p class="walk-q__meta">' + esc(PART_NAME[q.part]) + " · Q" + q.n + " of 27 · " + q.marks + " mark" + (q.marks === 1 ? "" : "s") + "</p>" +
      "<p class=\"walk-q__text\">" + esc(q.text) + "</p>" +
      (bullets ? "<ul class=\"walk-q__bullets\">" + bullets + "</ul>" : "") +
      (q.prompt ? "<p class=\"walk-q__prompt\">" + esc(q.prompt) + "</p>" : "") +
      '<div class="walk-opts">' + opts + "</div>" +
      '<div class="walk-note" data-q-note hidden></div>';
    renderGrid();
  }

  function revealOption(letter) {
    var q = currentQuestion();
    if (!q || !cardEl) return;
    var note = cardEl.querySelector("[data-q-note]");
    cardEl.querySelectorAll(".walk-opt").forEach(function (btn) {
      var L = btn.getAttribute("data-opt");
      btn.classList.toggle("is-pick", L === letter);
      btn.classList.toggle("is-key", L === q.key);
      btn.classList.toggle("is-miss", L === letter && letter !== q.key);
    });
    if (!note) return;
    var head;
    var body;
    if (letter === q.key) {
      head = "Correct.";
      body = q.why;
    } else {
      head = "Not this one.";
      body = (q.wrong && q.wrong[letter]) ? q.wrong[letter] : "This option does not hold.";
    }
    note.hidden = false;
    note.innerHTML = "<p class=\"walk-note__kicker\">" + esc(head) + "</p><p>" + esc(body) + "</p>";
  }

  function resetClockFace() {
    stopClock();
    sittingStarted = false;
    if (clockEl) clockEl.textContent = "30:00";
    if (barEl) barEl.style.transform = "scaleX(1)";
  }

  function stopClock() {
    if (clockTimer) {
      clearTimeout(clockTimer);
      clockTimer = null;
    }
  }

  function startClock() {
    stopClock();
    if (!clockEl) return;
    sittingStarted = true;
    var start = Date.now();
    var total = 30 * 60;
    function paint(left) {
      var m = Math.floor(left / 60);
      var s = left % 60;
      clockEl.textContent = m + ":" + String(s).padStart(2, "0");
      if (barEl) barEl.style.transform = "scaleX(" + (left / total) + ")";
    }
    paint(total);
    if (reduceMotion) return;
    function tick() {
      var elapsed = Math.floor((Date.now() - start) / 1000);
      var left = Math.max(0, total - elapsed);
      paint(left);
      if (left <= 0) {
        clockTimer = null;
        return;
      }
      var drift = (Date.now() - start) % 1000;
      clockTimer = setTimeout(tick, 1000 - drift);
    }
    clockTimer = setTimeout(tick, 1000);
  }

  function setScene(next, opts) {
    scene = Math.max(0, Math.min(SCENES - 1, next));
    walk.querySelectorAll("[data-scene]").forEach(function (el) {
      var on = Number(el.getAttribute("data-scene")) === scene;
      el.hidden = !on;
      el.classList.toggle("is-on", on);
    });
    walk.querySelectorAll("[data-walk-jump]").forEach(function (btn) {
      btn.classList.toggle("is-on", Number(btn.getAttribute("data-walk-jump")) === scene);
    });
    if (folioEl) folioEl.textContent = FOLIO[scene] + " · " + (scene + 1) + " / " + SCENES;
    prevBtn.disabled = scene === 0;
    nextBtn.textContent = "Continue";
    nextBtn.hidden = scene === SCENES - 1;
    if (scene === 0) {
      if (opts && opts.holdClock) resetClockFace();
      else startClock();
    } else {
      stopClock();
    }
    if (scene === 1) renderQuestion();
    walk.querySelector(".walk__stage").scrollTop = 0;
  }

  function hideCurtain() {
    if (curtainTimer) {
      clearTimeout(curtainTimer);
      curtainTimer = null;
    }
    if (!curtain) return;
    curtain.classList.remove("is-out");
    curtain.hidden = true;
  }

  function openWalk(start) {
    lastFocus = document.activeElement;
    walk.hidden = false;
    document.body.classList.add("is-walking");
    document.body.style.overflow = "hidden";
    if (history.replaceState) history.replaceState(null, "", "#visualisation");
    var begin = typeof start === "number" ? start : 0;
    hideCurtain();
    if (begin === 0 && !reduceMotion && curtain) {
      setScene(0, { holdClock: true });
      curtain.hidden = false;
      curtain.classList.remove("is-out");
      curtainTimer = setTimeout(function () {
        curtain.classList.add("is-out");
        curtainTimer = setTimeout(function () {
          hideCurtain();
          startClock();
          if (!nextBtn.hidden) nextBtn.focus();
        }, 1000);
      }, 1600);
      return;
    }
    setScene(begin);
    if (!nextBtn.hidden) nextBtn.focus();
  }

  function closeWalk() {
    hideCurtain();
    stopClock();
    sittingStarted = false;
    walk.hidden = true;
    document.body.classList.remove("is-walking");
    document.body.style.overflow = "";
    if (history.replaceState) history.replaceState(null, "", location.pathname + location.search);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  document.querySelectorAll("[data-enter-walk]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      openWalk(Number(btn.getAttribute("data-enter-walk")) || 0);
    });
  });

  walk.querySelector("[data-walk-exit]").addEventListener("click", closeWalk);

  walk.querySelectorAll('input[name="walk-device"]').forEach(function (box) {
    box.addEventListener("change", function () {
      var boxes = walk.querySelectorAll('input[name="walk-device"]');
      if (box.value === "None of these" && box.checked) {
        boxes.forEach(function (b) {
          if (b.value !== "None of these") b.checked = false;
        });
      } else if (box.checked) {
        boxes.forEach(function (b) {
          if (b.value === "None of these") b.checked = false;
        });
      }
    });
  });

  prevBtn.addEventListener("click", function () {
    setScene(scene - 1);
  });

  nextBtn.addEventListener("click", function () {
    if (scene >= SCENES - 1) return;
    setScene(scene + 1);
  });

  walk.querySelectorAll("[data-walk-jump]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      setScene(Number(btn.getAttribute("data-walk-jump")));
    });
  });

  walk.querySelector("[data-paper-parts]").addEventListener("click", function (event) {
    var btn = event.target.closest("[data-part]");
    if (!btn) return;
    partFilter = btn.getAttribute("data-part");
    qIndex = 0;
    walk.querySelectorAll("[data-part]").forEach(function (el) {
      el.classList.toggle("is-on", el === btn);
    });
    renderQuestion();
  });

  walk.querySelector("[data-q-prev]").addEventListener("click", function () {
    var list = visibleQuestions();
    qIndex = (qIndex - 1 + list.length) % list.length;
    renderQuestion();
  });

  walk.querySelector("[data-q-next]").addEventListener("click", function () {
    var list = visibleQuestions();
    qIndex = (qIndex + 1) % list.length;
    renderQuestion();
  });

  gridEl.addEventListener("click", function (event) {
    var btn = event.target.closest("[data-jump-q]");
    if (!btn) return;
    qIndex = Number(btn.getAttribute("data-jump-q"));
    renderQuestion();
  });

  cardEl.addEventListener("click", function (event) {
    var btn = event.target.closest("[data-opt]");
    if (!btn) return;
    revealOption(btn.getAttribute("data-opt"));
  });

  if (envelopeBtn && letterEl) {
    envelopeBtn.addEventListener("click", function () {
      var open = letterEl.hidden;
      letterEl.hidden = !open;
      envelopeBtn.classList.toggle("is-open", open);
      envelopeBtn.setAttribute("aria-expanded", open ? "true" : "false");
      var label = envelopeBtn.querySelector(".walk-envelope__open");
      if (label) label.textContent = open ? "Close the letter" : "Open the letter";
      if (open) letterEl.scrollIntoView({ block: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  document.addEventListener("keydown", function (event) {
    if (walk.hidden) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeWalk();
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      if (scene < SCENES - 1) setScene(scene + 1);
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      if (scene > 0) setScene(scene - 1);
    }
  });

  if (location.hash === "#visualisation") openWalk(0);
})();
