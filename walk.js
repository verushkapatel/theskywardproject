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
  var FOLIO = ["The sitting", "The paper", "The letter", "The reading", "Afterward"];
  var NEXT = ["Continue to the paper", "Continue to the letter", "Continue to the reading", "Continue", "Write to us"];
  var PROFILE = {
    a: "The same mark. An ICSE household in the highest income band. On its own, 16.5 looks like a mid-paper sitting. Next to Student B, it is the beginning of a comparison the Index exists to make.",
    b: "The same 16.5. A CBSE household in the lowest income band. The paper did not change. The household did. That is the reading: not who is ‘better’, but who was taught what, and from where."
  };

  var paper = window.SKYWARD_PAPER || [];
  var scene = 0;
  var qIndex = 0;
  var partFilter = "all";
  var lastFocus = null;
  var clockTimer = null;
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
  var profileCopy = walk.querySelector("[data-profile-copy]");

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
      head = "The key.";
      body = q.why;
    } else {
      head = "The temptation.";
      body = (q.wrong && q.wrong[letter]) ? q.wrong[letter] : "This option is designed to sound fair. It does not hold.";
      body += " " + q.why;
    }
    note.hidden = false;
    note.innerHTML = "<p class=\"walk-note__kicker\">" + esc(head) + "</p><p>" + esc(body) + "</p>";
  }

  function startClock() {
    stopClock();
    if (!clockEl) return;
    var seconds = 30 * 60;
    clockEl.textContent = "30:00";
    if (barEl) barEl.style.transform = "scaleX(1)";
    if (reduceMotion) return;
    var start = Date.now();
    var span = 9000;
    clockTimer = setInterval(function () {
      var t = Math.min(1, (Date.now() - start) / span);
      var left = seconds - Math.round(t * 18);
      var m = Math.floor(left / 60);
      var s = left % 60;
      clockEl.textContent = m + ":" + String(s).padStart(2, "0");
      if (barEl) barEl.style.transform = "scaleX(" + (1 - t * 0.12) + ")";
      if (t >= 1) stopClock();
    }, 80);
  }

  function stopClock() {
    if (clockTimer) {
      clearInterval(clockTimer);
      clockTimer = null;
    }
  }

  function setScene(next) {
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
    nextBtn.textContent = NEXT[scene];
    nextBtn.hidden = scene === SCENES - 1;
    if (scene === 0) startClock();
    else stopClock();
    if (scene === 1) renderQuestion();
    walk.querySelector(".walk__stage").scrollTop = 0;
  }

  function openWalk(start) {
    lastFocus = document.activeElement;
    walk.hidden = false;
    document.body.classList.add("is-walking");
    document.body.style.overflow = "hidden";
    if (history.replaceState) history.replaceState(null, "", "#visualisation");
    setScene(typeof start === "number" ? start : 0);
    nextBtn.focus();
  }

  function closeWalk() {
    stopClock();
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

  prevBtn.addEventListener("click", function () {
    setScene(scene - 1);
  });

  nextBtn.addEventListener("click", function () {
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

  envelopeBtn.addEventListener("click", function () {
    var open = letterEl.hidden;
    letterEl.hidden = !open;
    envelopeBtn.classList.toggle("is-open", open);
    envelopeBtn.setAttribute("aria-expanded", open ? "true" : "false");
    envelopeBtn.querySelector(".walk-envelope__open").textContent = open ? "Close the letter" : "Open the letter";
    if (open) letterEl.scrollIntoView({ block: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
  });

  walk.querySelector("[data-profiles]").addEventListener("click", function (event) {
    var btn = event.target.closest("[data-profile]");
    if (!btn) return;
    walk.querySelectorAll("[data-profile]").forEach(function (el) {
      el.classList.toggle("is-on", el === btn);
    });
    profileCopy.textContent = PROFILE[btn.getAttribute("data-profile")];
  });

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
