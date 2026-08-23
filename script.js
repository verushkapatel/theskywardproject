(function () {
  "use strict";

  var nav = document.querySelector("[data-nav]");
  var toggle = document.querySelector("[data-nav-toggle]");

  if (nav && toggle) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open menu");
      });
    });
  }

  var layer = document.querySelector("[data-bio-layer]");
  if (layer) {
    var card = layer.querySelector(".bio-card");
    var titleEl = layer.querySelector("#bio-title");
    var roleEl = layer.querySelector("[data-bio-role]");
    var photoEl = layer.querySelector(".bio-card__photo");
    var copyEl = layer.querySelector(".bio-card__copy");
    var lastFocus = null;

    var closeBio = function () {
      layer.hidden = true;
      document.body.style.overflow = "";
      if (lastFocus) lastFocus.focus();
    };

    var openBio = function (member, trigger) {
      var name = member.querySelector("h3");
      var role = member.querySelector(".member__role");
      var bio = member.querySelector(".member__bio");
      var img = member.querySelector("img");
      titleEl.textContent = name ? name.textContent : "";
      roleEl.textContent = role ? role.textContent : "";
      copyEl.innerHTML = bio ? bio.innerHTML : "";
      photoEl.innerHTML = "";
      if (img) {
        var clone = img.cloneNode(true);
        clone.removeAttribute("width");
        clone.removeAttribute("height");
        photoEl.appendChild(clone);
      }
      lastFocus = trigger;
      layer.hidden = false;
      document.body.style.overflow = "hidden";
      card.focus();
    };

    document.querySelectorAll("[data-open-bio]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var member = btn.closest(".member");
        if (member) openBio(member, btn);
      });
    });

    layer.addEventListener("click", function (event) {
      if (event.target === layer || event.target.hasAttribute("data-bio-close")) {
        closeBio();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !layer.hidden) closeBio();
    });
  }

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
