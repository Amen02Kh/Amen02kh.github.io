/* K-HA$H theme scripts: code blocks, copy buttons, table of contents,
   reading progress, cheat sheet filters and the contact form. No dependencies. */
(function () {
  "use strict";

  var COPY_ICON = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"></rect><path d="M5 15V5a2 2 0 0 1 2-2h10"></path></svg>';

  function copyText(text, btn, doneLabel) {
    var original = btn.innerHTML;
    var finish = function () {
      btn.classList.add("is-done");
      btn.innerHTML = COPY_ICON + (doneLabel || "Copied");
      setTimeout(function () { btn.classList.remove("is-done"); btn.innerHTML = original; }, 1600);
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(finish, function () { fallback(text); finish(); });
    } else { fallback(text); finish(); }
  }
  function fallback(text) {
    var ta = document.createElement("textarea");
    ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(ta);
  }
  function makeCopyButton(label, aria) {
    var b = document.createElement("button");
    b.type = "button"; b.className = "copy-btn";
    b.setAttribute("aria-label", aria || label);
    b.innerHTML = COPY_ICON + label;
    return b;
  }

  /* Split highlighted HTML into lines, re-opening any spans that cross a newline. */
  function splitLines(html) {
    var lines = [], cur = "", stack = [], re = /(<[^>]+>)|([^<]+)/g, m;
    while ((m = re.exec(html))) {
      if (m[1]) {
        if (m[1].charAt(1) === "/") stack.pop();
        else if (m[1].slice(-2) !== "/>") stack.push(m[1]);
        cur += m[1];
      } else {
        var parts = m[2].split("\n");
        for (var i = 0; i < parts.length; i++) {
          if (i > 0) {
            cur += new Array(stack.length + 1).join("</span>");
            lines.push(cur);
            cur = stack.join("");
          }
          cur += parts[i];
        }
      }
    }
    lines.push(cur);
    while (lines.length && lines[lines.length - 1].replace(/<[^>]+>/g, "").trim() === "") lines.pop();
    return lines;
  }

  function parseMarks(spec) {
    var set = {};
    if (!spec) return set;
    spec.split(",").forEach(function (part) {
      var r = part.trim().split("-"), a = parseInt(r[0], 10), b = parseInt(r[1] || r[0], 10);
      for (var n = a; n <= b; n++) set[n] = true;
    });
    return set;
  }

  /* ── game menu: arrows, keyboard, slide direction ── */
  var DIR_KEY = "khash-nav-dir";
  var menuEl = document.querySelector("[data-game-menu]");
  if (menuEl) {
    var current = parseInt(menuEl.getAttribute("data-current"), 10);
    var setDir = function (dir) { try { sessionStorage.setItem(DIR_KEY, dir); } catch (e) {} };

    menuEl.querySelectorAll(".game-menu__item").forEach(function (a) {
      a.addEventListener("click", function () {
        var i = parseInt(a.getAttribute("data-index"), 10);
        setDir(current >= 0 && i < current ? "back" : "forward");
      });
    });
    menuEl.querySelectorAll(".game-menu__arrow").forEach(function (a) {
      a.addEventListener("click", function () { setDir(a.getAttribute("data-dir")); });
    });

    // keep the selected item in view when the menu scrolls (small screens)
    var sel = menuEl.querySelector('.game-menu__item[aria-current="page"]');
    if (sel && sel.scrollIntoView) sel.scrollIntoView({ block: "nearest", inline: "center" });

    // left/right arrow keys switch pages, like the game menu
    document.addEventListener("keydown", function (e) {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      var t = e.target;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (t && t.closest && t.closest("pre, .city-map__scroll, .prose table")) return;
      var arrow = menuEl.querySelector(e.key === "ArrowLeft" ? ".game-menu__arrow--prev" : ".game-menu__arrow--next");
      if (!arrow) return;
      e.preventDefault();
      setDir(e.key === "ArrowLeft" ? "back" : "forward");
      window.location.href = arrow.href;
    });
  }

  /* ── code blocks ─────────────────────── */
  document.querySelectorAll(".prose div.highlighter-rouge, .prose figure.highlight").forEach(function (block) {
    var code = block.querySelector("pre code");
    if (!code || block.querySelector(".code-head")) return;

    var langMatch = (block.className + " " + code.className).match(/language-([\w+-]+)/);
    var lang = langMatch ? langMatch[1] : "";
    var terminal = /^(console|shell-session|terminal)$/.test(lang);
    var file = block.getAttribute("file") || block.getAttribute("data-file") || block.getAttribute("title");
    var marks = parseMarks(block.getAttribute("highlight") || block.getAttribute("data-highlight"));
    if (terminal) block.classList.add("is-terminal");

    var lines = splitLines(code.innerHTML);
    code.innerHTML = lines.map(function (l, i) {
      return '<span class="line' + (marks[i + 1] ? " is-marked" : "") + '">' + (l || " ") + "</span>";
    }).join("");
    if (lines.length > 1 && !terminal) block.classList.add("has-lines");

    var head = document.createElement("div");
    head.className = "code-head";
    var info = document.createElement("span");
    info.className = "code-head__info";
    if (file) { var f = document.createElement("span"); f.className = "code-head__file"; f.textContent = file; info.appendChild(f); }
    if (lang || terminal) { var lg = document.createElement("span"); lg.className = "code-head__lang"; lg.textContent = terminal ? "terminal" : lang; info.appendChild(lg); }
    head.appendChild(info);

    var btn = makeCopyButton(terminal ? "Copy command" : "Copy", terminal ? "Copy commands" : "Copy code");
    btn.addEventListener("click", function () {
      var text;
      if (terminal && code.querySelector(".gp")) {
        text = Array.prototype.map.call(code.querySelectorAll(".line"), function (line) {
          if (!line.querySelector(".gp")) return null;           // output line
          var clone = line.cloneNode(true);
          clone.querySelectorAll(".gp, .go").forEach(function (n) { n.remove(); });
          return clone.textContent.replace(/\s+$/, "");
        }).filter(function (t) { return t !== null; }).join("\n");
      } else {
        text = Array.prototype.map.call(code.querySelectorAll(".line"), function (l) { return l.textContent; }).join("\n");
      }
      copyText(text, btn);
    });
    head.appendChild(btn);
    block.insertBefore(head, block.firstChild);
  });

  /* ── copy page link ─────────────────── */
  document.querySelectorAll("[data-copy-link]").forEach(function (b) {
    b.addEventListener("click", function () {
      var label = b.textContent;
      var done = function () { b.textContent = "Link copied"; setTimeout(function () { b.textContent = label; }, 1600); };
      if (navigator.clipboard) navigator.clipboard.writeText(b.getAttribute("data-copy-link")).then(done, function () { fallback(b.getAttribute("data-copy-link")); done(); });
      else { fallback(b.getAttribute("data-copy-link")); done(); }
    });
  });

  /* ── table of contents ──────────────── */
  var toc = document.querySelector(".toc");
  var content = document.querySelector(".post-content");
  if (toc && content) {
    // give headings without an id (e.g. raw <h1> in Markdown) one, so they can be linked
    var used = {};
    content.querySelectorAll("h1, h2, h3").forEach(function (h) {
      if (h.closest(".note, .callout, .share")) return;
      if (!h.id) {
        var base = h.textContent.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").slice(0, 60) || "section";
        var id = base, n = 2;
        while (used[id] || document.getElementById(id)) id = base + "-" + n++;
        h.id = id;
      }
      used[h.id] = true;
    });
    var heads = Array.prototype.filter.call(content.querySelectorAll("h1[id], h2[id], h3[id]"), function (h) {
      return !h.closest(".note, .callout, .share");
    });
    if (heads.length >= 2) {
      var list = toc.querySelector(".toc__list");
      var top = heads[0].tagName;
      heads.forEach(function (h) {
        var li = document.createElement("li");
        if (h.tagName !== top && h.tagName === "H3") li.className = "toc__sub";
        var a = document.createElement("a");
        var label = h.textContent.trim();
        if (label.length > 60) label = label.slice(0, 57).replace(/\s+\S*$/, "") + "…";
        a.href = "#" + h.id; a.textContent = label; a.title = h.textContent.trim();
        li.appendChild(a); list.appendChild(li);
      });
      toc.hidden = false;
      if ("IntersectionObserver" in window) {
        var links = list.querySelectorAll("a");
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            if (!en.isIntersecting) return;
            links.forEach(function (l) { l.classList.toggle("is-active", l.getAttribute("href") === "#" + en.target.id); });
          });
        }, { rootMargin: "0px 0px -70% 0px" });
        heads.forEach(function (h) { io.observe(h); });
      }
    }
  }

  /* ── reading progress ───────────────── */
  var bar = document.querySelector(".read-progress__bar");
  if (bar && content) {
    var update = function () {
      var r = content.getBoundingClientRect();
      var total = r.height - window.innerHeight;
      var p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 1;
      bar.style.width = (p * 100).toFixed(1) + "%";
    };
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* ── cheat sheet: copy buttons on commands ── */
  document.querySelectorAll(".sheet td code").forEach(function (code) {
    var wrap = document.createElement("span");
    wrap.className = "cmd";
    code.parentNode.insertBefore(wrap, code);
    wrap.appendChild(code);
    var row = code.closest("tr");
    var task = row && row.cells[0] ? row.cells[0].textContent.trim() : "command";
    var btn = makeCopyButton("Copy", "Copy: " + task);
    btn.addEventListener("click", function () { copyText(code.textContent, btn); });
    wrap.appendChild(btn);
  });

  /* ── cheat sheet index: filter and search ── */
  var filter = document.querySelector("[data-sheet-filter]");
  if (filter) {
    var cards = filter.querySelectorAll(".sheet-card");
    var chips = filter.querySelectorAll(".chip");
    var search = filter.querySelector("[data-sheet-search]");
    var empty = filter.querySelector("[data-sheet-empty]");
    var stage = "all";
    var apply = function () {
      var q = (search.value || "").trim().toLowerCase();
      var shown = 0;
      cards.forEach(function (c) {
        var ok = (stage === "all" || c.getAttribute("data-stage") === stage) &&
                 (!q || c.getAttribute("data-search").indexOf(q) !== -1);
        c.hidden = !ok; if (ok) shown++;
      });
      empty.hidden = shown !== 0;
    };
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        stage = chip.getAttribute("data-stage");
        chips.forEach(function (c) { c.setAttribute("aria-pressed", c === chip ? "true" : "false"); });
        apply();
      });
    });
    search.addEventListener("input", apply);
  }

  /* ── contact form ───────────────────── */
  var form = document.querySelector("[data-contact-form]");
  if (form) {
    var sent = document.querySelector(".form-sent");
    var err = form.querySelector(".form__error");
    var submit = form.querySelector('button[type="submit"]');
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      err.hidden = true;
      var data = new FormData(form);
      if (data.get("_gotcha")) return;
      var endpoint = form.getAttribute("data-endpoint");

      if (!endpoint) {   // no form service configured: hand off to the visitor's email app
        var body = data.get("message") + "\n\n" + data.get("name") + " <" + data.get("email") + ">";
        window.location.href = "mailto:" + form.getAttribute("data-email") +
          "?subject=" + encodeURIComponent(data.get("topic")) + "&body=" + encodeURIComponent(body);
        return;
      }

      submit.disabled = true; submit.textContent = "Sending…";
      fetch(endpoint, { method: "POST", body: data, headers: { Accept: "application/json" } })
        .then(function (r) {
          if (!r.ok) throw new Error("bad status");
          form.hidden = true; sent.hidden = false; form.reset();
          sent.setAttribute("tabindex", "-1"); sent.focus();
        })
        .catch(function () {
          err.textContent = "That didn't send. Check your connection and try again, or email " + form.getAttribute("data-email") + " directly.";
          err.hidden = false;
        })
        .then(function () { submit.disabled = false; submit.textContent = "Send message"; });
    });
    var reset = document.querySelector("[data-contact-reset]");
    if (reset) reset.addEventListener("click", function () { sent.hidden = true; form.hidden = false; form.querySelector("input").focus(); });
  }
})();
