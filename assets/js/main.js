/*!
 * ATITHYA EVENTS THANE
 * Site behaviour
 *
 * Reads its settings from window.SITE (see site.config.js, which must be
 * loaded first). Everything below is progressive enhancement: with JavaScript
 * disabled the page still renders and reads correctly.
 *
 * Contents
 *   1.  Utilities and WhatsApp / tel link builders
 *   2.  Apply the config to the markup ([data-site], [data-href], [data-wa-direct])
 *   3.  Hero entrance
 *   4.  Scroll reveals (IntersectionObserver)
 *   5.  Nav state and floating WhatsApp button
 *   6.  Active section highlighting in the nav
 *   7.  Mobile drawer
 *   8.  Event-category image stage
 *   9.  Portfolio filter
 *   10. FAQ accordion
 *   11. Signature-experience steps
 *   12. Process hairline
 *   13. Enquiry form — validation and WhatsApp handoff
 */
(function () {
  "use strict";

  /* Settings live in site.config.js. The fallback keeps the page from throwing
     if that file fails to load — links simply stay inert. */
  var SITE = window.SITE || {};

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------------- utils */
  function waDigits() { return String(SITE.whatsappNumber).replace(/\D/g, ""); }
  function waLink(text) {
    return "https://wa.me/" + waDigits() + "?text=" + encodeURIComponent(text);
  }
  function telHref() { return "tel:+" + waDigits(); }

  /* ------------------------------------------------------- apply the config */
  $$("[data-site]").forEach(function (el) {
    var key = el.getAttribute("data-site");
    if (SITE[key]) el.textContent = SITE[key];
  });
  $$("[data-href]").forEach(function (el) {
    var kind = el.getAttribute("data-href");
    if (kind === "tel") el.setAttribute("href", telHref());
    if (kind === "mail") el.setAttribute("href", "mailto:" + SITE.email);
    if (kind === "instagram") el.setAttribute("href", SITE.instagram);
  });
  $$("[data-wa-direct]").forEach(function (el) {
    el.setAttribute("href", waLink(SITE.directMessage));
    el.setAttribute("target", "_blank");
    el.setAttribute("rel", "noopener noreferrer");
  });
  var yearEl = $("[data-year]");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* --------------------------------------------------------- hero entrance */
  requestAnimationFrame(function () { document.body.classList.add("is-ready"); });

  /* ------------------------------------------------------ scroll reveals */
  var revealables = $$("[data-reveal]");
  if ("IntersectionObserver" in window && !reduced) {
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); revealIO.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });
    revealables.forEach(function (el) { revealIO.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add("in"); });
  }

  /* -------------------------------------------------- nav state + wa float */
  var nav = $("[data-nav]");
  var waFloat = $("[data-wa-float]");
  var lastY = -1;
  function onScroll() {
    var y = window.pageYOffset || document.documentElement.scrollTop;
    if (y === lastY) return;
    lastY = y;
    if (nav) nav.classList.toggle("is-solid", y > 40);
    if (waFloat) waFloat.classList.toggle("is-on", y > window.innerHeight * 0.6);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ------------------------------------------------- active section in nav */
  var navLinks = $$(".nav__link");
  var sectionMap = {};
  navLinks.forEach(function (l) {
    var id = l.getAttribute("href");
    if (id && id.length > 1) { var s = $(id); if (s) sectionMap[id] = { link: l, el: s }; }
  });
  if ("IntersectionObserver" in window) {
    var navIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var key = "#" + e.target.id;
        if (sectionMap[key] && e.isIntersecting) {
          navLinks.forEach(function (l) { l.removeAttribute("aria-current"); });
          sectionMap[key].link.setAttribute("aria-current", "true");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(sectionMap).forEach(function (k) { navIO.observe(sectionMap[k].el); });
  }

  /* ------------------------------------------------------- mobile drawer */
  var drawer = $("[data-drawer]");
  var toggle = $("[data-menu-toggle]");
  function focusables() {
    return $$("a[href], button:not([disabled])", drawer).filter(function (el) {
      return el.offsetParent !== null;
    });
  }
  function setMenu(open) {
    if (!drawer || !toggle) return;
    drawer.setAttribute("data-open", open ? "true" : "false");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.classList.toggle("is-locked", open);
    document.documentElement.classList.toggle("menu-open", open);
    document.body.classList.toggle("menu-open", open);
    if (open) {
      var f = focusables();
      if (f.length) setTimeout(function () { f[0].focus(); }, 260);
    } else {
      toggle.focus();
    }
  }
  if (toggle) {
    toggle.addEventListener("click", function () {
      setMenu(drawer.getAttribute("data-open") !== "true");
    });
  }
  if (drawer) {
    drawer.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });
  }
  document.addEventListener("keydown", function (e) {
    if (!drawer || drawer.getAttribute("data-open") !== "true") return;
    if (e.key === "Escape") { setMenu(false); return; }
    if (e.key !== "Tab") return;
    var f = focusables().concat([toggle]);
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  var mq = window.matchMedia("(min-width: 1000px)");
  (mq.addEventListener ? mq.addEventListener.bind(mq, "change") : mq.addListener.bind(mq))(function () {
    if (mq.matches) setMenu(false);
  });

  /* ------------------------------------------- category index image stage */
  var stage = $("[data-stage]");
  if (stage) {
    var stageImgs = $$("[data-stage-img]", stage);
    var nameEl = $("[data-stage-name]");
    var countEl = $("[data-stage-count]");
    var catLinks = $$("[data-cat]", $("[data-cats]"));
    var pad = function (n) { return (n < 10 ? "0" : "") + n; };
    var activate = function (i) {
      stageImgs.forEach(function (img, n) { img.classList.toggle("is-on", n === i); });
      var link = catLinks[i];
      if (link && nameEl) nameEl.textContent = $(".cat__name", link).textContent;
      if (countEl) countEl.textContent = pad(i + 1) + " / " + pad(catLinks.length);
    };
    catLinks.forEach(function (link, i) {
      link.addEventListener("mouseenter", function () { activate(i); });
      link.addEventListener("focus", function () { activate(i); });
    });
  }

  /* ----------------------------------------------------- portfolio filter */
  var masonry = $("[data-masonry]");
  if (masonry) {
    var tiles = $$(".tile", masonry);
    var countOut = $("[data-work-count]");
    var statusOut = $("[data-work-status]");
    $$("[data-filter]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var f = btn.getAttribute("data-filter");
        $$("[data-filter]").forEach(function (b) {
          b.setAttribute("aria-pressed", b === btn ? "true" : "false");
        });
        var shown = 0;
        tiles.forEach(function (t) {
          var match = (f === "all" || t.getAttribute("data-cat") === f);
          t.hidden = !match;
          if (match) shown++;
        });
        if (countOut) countOut.textContent = shown;
        if (statusOut) {
          statusOut.textContent = f === "all"
            ? "Showing all " + shown + " projects."
            : "Showing " + shown + " " + (shown === 1 ? "project" : "projects") + " in " + btn.textContent + ".";
        }
      });
    });
  }

  /* ------------------------------------------------------------ accordion */
  $$("[data-acc]").forEach(function (acc) {
    var btns = $$(".acc__btn", acc);
    btns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var item = btn.closest(".acc__item");
        var open = btn.getAttribute("aria-expanded") === "true";
        btns.forEach(function (b) {
          b.setAttribute("aria-expanded", "false");
          b.closest(".acc__item").classList.remove("is-open");
        });
        if (!open) {
          btn.setAttribute("aria-expanded", "true");
          item.classList.add("is-open");
        }
      });
    });
  });

  /* --------------------------------------------- signature experience steps */
  var expList = $("[data-exp]");
  if (expList && "IntersectionObserver" in window) {
    var steps = $$(".exp__step", expList);
    var expIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          steps.forEach(function (s) { s.classList.remove("is-on"); });
          e.target.classList.add("is-on");
        }
      });
    }, { rootMargin: "-46% 0px -46% 0px" });
    steps.forEach(function (s) { expIO.observe(s); });
  }

  /* ------------------------------------------------------- process hairline */
  var stepsWrap = $("[data-steps]");
  if (stepsWrap && "IntersectionObserver" in window) {
    var lineIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); lineIO.unobserve(e.target); }
      });
    }, { threshold: 0.25 });
    lineIO.observe(stepsWrap);
  }

  /* ======================================================================
     ENQUIRY FORM  →  WhatsApp click-to-chat
     No API, no backend. We build the message, open WhatsApp with it
     pre-filled, and the user presses Send themselves.
     ====================================================================== */
  var form = $("#enquiry-form");
  if (form) {
    var ready      = $("[data-ready]");
    var readyMsg   = $("[data-ready-msg]");
    var readyOpen  = $("[data-ready-open]");
    var readyCopy  = $("[data-ready-copy]");
    var readyTitle = $("[data-ready-title]");

    var MONTHS = ["January","February","March","April","May","June",
                  "July","August","September","October","November","December"];

    function prettyDate(value) {
      if (!value) return "";
      var p = value.split("-");
      if (p.length !== 3) return value;
      var m = parseInt(p[1], 10);
      if (isNaN(m) || m < 1 || m > 12) return value;
      return parseInt(p[2], 10) + " " + MONTHS[m - 1] + " " + p[0];
    }

    function setError(input, message) {
      var field = input.closest(".field");
      var err = field ? $(".field__err", field) : null;
      if (message) {
        field.classList.add("has-err");
        input.setAttribute("aria-invalid", "true");
        if (err) err.textContent = message;
      } else {
        field.classList.remove("has-err");
        input.removeAttribute("aria-invalid");
        if (err) err.textContent = "";
      }
    }

    var rules = {
      name: function (v) {
        if (!v) return "Please tell us your name.";
        if (v.length < 2) return "That name looks a little short.";
        return "";
      },
      phone: function (v) {
        if (!v) return "We need a number to reply on.";
        var digits = v.replace(/\D/g, "");
        if (digits.length < 7 || digits.length > 15) return "Enter a valid phone number with country or area code.";
        return "";
      },
      eventType: function (v) { return v ? "" : "Choose the kind of celebration."; },
      location: function (v) {
        if (!v) return "Where is the event being held?";
        if (v.length < 2) return "Please add a city or venue.";
        return "";
      },
      guests: function (v) {
        if (!v) return "";
        var n = Number(v);
        if (!isFinite(n) || n < 1) return "Enter the approximate number of guests.";
        return "";
      },
      date: function (v) {
        if (!v) return "";
        var d = new Date(v + "T00:00:00");
        if (isNaN(d.getTime())) return "That date doesn't look right.";
        var today = new Date(); today.setHours(0, 0, 0, 0);
        if (d < today) return "Please choose a date in the future.";
        return "";
      }
    };

    function validateField(input) {
      var rule = rules[input.name];
      if (!rule) return "";
      var msg = rule(String(input.value || "").trim());
      setError(input, msg);
      return msg;
    }

    // Clear an error as soon as the visitor fixes it
    $$("input, select, textarea", form).forEach(function (input) {
      var handler = function () {
        if (input.closest(".field").classList.contains("has-err")) validateField(input);
      };
      input.addEventListener("input", handler);
      input.addEventListener("change", handler);
      input.addEventListener("blur", function () {
        if (String(input.value || "").trim()) validateField(input);
      });
    });

    function buildMessage(d) {
      var lines = [];
      lines.push("🎉 *New Event Enquiry*");
      lines.push("");
      lines.push("*Name:* " + d.name);
      lines.push("*WhatsApp:* " + d.phone);
      lines.push("*Event:* " + d.eventType);
      if (d.date)     lines.push("*Date:* " + prettyDate(d.date));
      lines.push("*Location:* " + d.location);
      if (d.guests)   lines.push("*Guests:* " + d.guests);
      if (d.budget)   lines.push("*Budget:* " + d.budget);
      if (d.notes) {
        lines.push("");
        lines.push("*Additional Requirements:*");
        lines.push(d.notes);
      }
      lines.push("");
      lines.push("— Sent from the Atithya Events website");
      return lines.join("\n");
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var fields = $$("input, select, textarea", form);
      var firstBad = null;
      fields.forEach(function (input) {
        if (validateField(input) && !firstBad) firstBad = input;
      });
      if (firstBad) {
        firstBad.focus();
        if (firstBad.scrollIntoView) {
          firstBad.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" });
        }
        return;
      }

      var get = function (n) { return String((form.elements[n] || {}).value || "").trim(); };
      var data = {
        name: get("name"), phone: get("phone"), eventType: get("eventType"),
        date: get("date"), location: get("location"), guests: get("guests"),
        budget: get("budget"), notes: get("notes")
      };

      var message = buildMessage(data);
      var url = waLink(message);

      if (readyMsg) readyMsg.textContent = message;
      if (readyOpen) readyOpen.setAttribute("href", url);

      // Open WhatsApp. wa.me sends mobile visitors to the app and
      // desktop visitors to WhatsApp Web. The user presses Send.
      var win = null;
      try { win = window.open(url, "_blank"); } catch (err) { win = null; }
      if (win) { try { win.opener = null; } catch (err) {} }

      var blocked = !win || win.closed || typeof win.closed === "undefined";
      if (readyTitle) {
        readyTitle.textContent = blocked
          ? "Your enquiry is ready. Open WhatsApp to send it."
          : "WhatsApp is opening — press send there to finish.";
      }
      if (ready) {
        ready.setAttribute("data-show", "true");
        if (blocked && ready.scrollIntoView) {
          ready.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" });
        }
      }
    });

    if (readyCopy) {
      readyCopy.addEventListener("click", function () {
        var text = readyMsg ? readyMsg.textContent : "";
        var done = function () {
          var old = readyCopy.textContent;
          readyCopy.textContent = "Copied";
          setTimeout(function () { readyCopy.textContent = old; }, 2000);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, function () { legacyCopy(text, done); });
        } else {
          legacyCopy(text, done);
        }
      });
    }
    function legacyCopy(text, done) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); done(); } catch (err) {}
      document.body.removeChild(ta);
    }
  }
})();
