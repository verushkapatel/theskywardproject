(function () {
  "use strict";

  var nav = document.querySelector("[data-nav]");
  var supportsObserver = "IntersectionObserver" in window;
  var reduceMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isDesktop =
    window.matchMedia &&
    window.matchMedia("(min-width: 1025px)").matches;

  /* ----------------------------------------------------------------------
     Navigation height. The bar is always visible on phones. On a wide
     screen the homepage bar still waits until the opening screen has
     scrolled away.
     ---------------------------------------------------------------------- */

  var sentinel = document.querySelector("[data-nav-sentinel]");

  var syncNavHeight = function () {
    if (!nav) return;
    document.documentElement.style.setProperty(
      "--nav-height",
      nav.offsetHeight + "px"
    );
  };

  if (nav && isDesktop && sentinel && supportsObserver) {
    new IntersectionObserver(
      function (entries) {
        nav.classList.toggle("is-visible", !entries[0].isIntersecting);
      },
      { threshold: 0 }
    ).observe(sentinel);
  } else if (nav) {
    nav.classList.add("is-visible");
    document.body.classList.add("has-fixed-nav");
  }

  syncNavHeight();
  window.addEventListener("resize", function () {
    syncNavHeight();
  });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(syncNavHeight);
  }

  /* ----------------------------------------------------------------------
     Reading progress, drawn along the hairline under the bar.
     ---------------------------------------------------------------------- */

  if (nav) {
    var ticking = false;

    var writeProgress = function () {
      var doc = document.documentElement;
      var scrollable = doc.scrollHeight - window.innerHeight;
      var ratio = scrollable > 0 ? window.pageYOffset / scrollable : 0;
      nav.style.setProperty(
        "--progress",
        Math.min(1, Math.max(0, ratio)).toFixed(4)
      );
      ticking = false;
    };

    var queueProgress = function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(writeProgress);
    };

    window.addEventListener("scroll", queueProgress, { passive: true });
    window.addEventListener("resize", queueProgress);
    writeProgress();
  }

  /* ----------------------------------------------------------------------
     Parallax on editorial plates — desktop only.
     ---------------------------------------------------------------------- */

  var plates = document.querySelectorAll("[data-parallax] img");

  if (plates.length && !reduceMotion && isDesktop) {
    var plateTick = false;

    var writeParallax = function () {
      var vh = window.innerHeight || 1;
      for (var i = 0; i < plates.length; i++) {
        var img = plates[i];
        var stage = img.parentElement;
        var rect = stage.getBoundingClientRect();
        var mid = rect.top + rect.height / 2;
        var offset = ((mid - vh / 2) / vh) * -28;
        img.style.transform = "translate3d(0, " + offset.toFixed(1) + "px, 0)";
      }
      plateTick = false;
    };

    var queueParallax = function () {
      if (plateTick) return;
      plateTick = true;
      window.requestAnimationFrame(writeParallax);
    };

    window.addEventListener("scroll", queueParallax, { passive: true });
    window.addEventListener("resize", queueParallax);
    writeParallax();
  }

  /* ----------------------------------------------------------------------
     Scroll reveals. Word-splitting is desktop-only: inline-block words
     overflow a phone screen and shove the whole page left.
     ---------------------------------------------------------------------- */

  if (supportsObserver && !reduceMotion) {
    var WORD_STEP = 55;
    var revealer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-revealed");
          revealer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );

    var ruleRevealer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-revealed");
          ruleRevealer.unobserve(entry.target);
        });
      },
      { threshold: 0 }
    );

    var select = function (selector, root) {
      return Array.prototype.slice.call(
        (root || document).querySelectorAll(selector)
      );
    };

    var reveal = function (el, delay) {
      el.classList.add("reveal");
      if (delay) el.style.setProperty("--delay", delay + "ms");
      revealer.observe(el);
    };

    if (isDesktop) {
      select(
        ".open__name, .open__statement, .page-head h1, .section-title, .thanks p"
      ).forEach(function (el) {
        var words = el.textContent.trim().split(/\s+/);
        el.textContent = "";
        words.forEach(function (word, i) {
          var span = document.createElement("span");
          span.className = "word";
          span.style.setProperty("--delay", i * WORD_STEP + "ms");
          span.textContent = word;
          el.appendChild(span);
          if (i < words.length - 1) {
            el.appendChild(document.createTextNode(" "));
          }
        });
        el.classList.add("split");
        revealer.observe(el);
      });
    } else {
      /* Opening screen stays visible on phones. Hiding it for a reveal
         left the first screen blank when the observer was late. */
      select(".page-head h1, .section-title, .thanks p").forEach(function (el) {
        reveal(el, 0);
      });
    }

    [
      [".columns", ".column", 120],
      [".team", ".member", 140],
      [".card-pair", ".card", 120],
      [".tiers", "li", 90],
      [".form", ".field, .button", 70]
    ].forEach(function (group) {
      select(group[0]).forEach(function (container) {
        select(group[1], container).forEach(function (child, i) {
          reveal(child, i * group[2]);
        });
      });
    });

    select(".article section").forEach(function (section) {
      var step = 0;
      Array.prototype.forEach.call(section.children, function (child) {
        if (child.classList.contains("tiers")) return;
        reveal(child, step * 80);
        step += 1;
      });
    });

    if (isDesktop) {
      select(
        ".open__emblem, .masthead__edition, .page-head .eyebrow, .pull-quote, .latest__label, .footer__row"
      ).forEach(function (el) {
        reveal(el, 0);
      });
    } else {
      select(
        ".page-head .eyebrow, .pull-quote, .latest__label, .footer__row"
      ).forEach(function (el) {
        reveal(el, 0);
      });
    }

    select(".rule, .rule--double").forEach(function (el) {
      el.classList.add("reveal--rule");
      ruleRevealer.observe(el);
    });
  }

  /* ----------------------------------------------------------------------
     Web3Forms submission.
     ---------------------------------------------------------------------- */

  var form = document.querySelector("[data-contact-form]");
  if (!form) return;

  var status = form.querySelector("[data-form-status]");
  var button = form.querySelector("button[type=submit]");

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    if (button.disabled) return;
    button.disabled = true;
    if (status) status.textContent = "Sending\u2026";

    fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { Accept: "application/json" },
      body: new FormData(form)
    })
      .then(function (response) {
        if (!response.ok) throw new Error("Request failed");
        window.location.href = "thank-you.html";
      })
      .catch(function () {
        button.disabled = false;
        if (status) {
          status.textContent =
            "That did not send. Please try again, or email us directly.";
        }
      });
  });
})();
