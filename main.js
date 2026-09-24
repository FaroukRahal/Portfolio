(function () {
  // English only for now. The French text is still in content.js; to bring the toggle back,
  // restore the EN/FR buttons in index.html and call applyLang() from their click handlers.
  const LANG = "en";

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  const touchOnly = window.matchMedia("(hover: none) and (pointer: coarse)");

  // The screenshot or demo that fills the project box, or a quiet placeholder until one is added.
  function renderMedia(media, lang) {
    if (media && media.src && media.type === "video") {
      const video = document.createElement("video");
      video.src = media.src;
      video.muted = true;
      video.autoplay = true;
      video.loop = true;
      video.playsInline = true;
      video.setAttribute("aria-hidden", "true");
      return video;
    }
    if (media && media.src) {
      const img = document.createElement("img");
      img.src = media.src;
      img.alt = (media.alt && media.alt[lang]) || "";
      img.loading = "lazy";
      return img;
    }
    return el("div", "project-placeholder", UI[lang]["projects.preview"]);
  }

  // The details shown over the blurred media on hover (or tap on touch screens).
  function renderOverlay(p, lang) {
    const t = UI[lang];
    const overlay = el("div", "project-overlay");

    const meta = el("p", "project-meta", p.context[lang]);
    if (p.team) {
      const label = typeof p.team === "number" ? t["projects.teamOf"].replace("{n}", p.team) : t["projects.team"];
      meta.appendChild(document.createTextNode(" · "));
      meta.appendChild(el("span", "team", label));
    }
    overlay.appendChild(meta);

    if (p.metrics && p.metrics.length) {
      const stats = el("dl", "project-stats");
      p.metrics.forEach((m) => {
        const stat = el("div", "stat");
        stat.appendChild(el("dt", null, m.value[lang]));
        stat.appendChild(el("dd", null, m.label[lang]));
        stats.appendChild(stat);
      });
      overlay.appendChild(stats);
    }

    overlay.appendChild(el("p", "project-summary", p.summary[lang]));

    const tags = el("ul", "project-tags");
    p.stack.forEach((s) => tags.appendChild(el("li", null, s)));
    overlay.appendChild(tags);

    return overlay;
  }

  // Several copies of the list are rendered with the real one in the middle. The outer copies let the
  // slider keep going in both directions; once scrolling settles on a copy it jumps to the matching
  // real one. Enough copies that even a few fast flings never reach the physical end of the track.
  const COPIES = 7;
  const REAL_COPY = Math.floor(COPIES / 2);

  function buildProject(p, lang, isClone) {
    const t = UI[lang];
    const project = el("div", "project");
    if (isClone) {
      project.setAttribute("aria-hidden", "true");
    } else {
      project.id = "project-" + p.id;
    }

    project.appendChild(el("div", "project-description", p.title[lang]));

    const box = el("div", "project-thumbnail");
    box.tabIndex = isClone ? -1 : 0;
    box.setAttribute("aria-label", p.title[lang]);
    box.appendChild(renderMedia(p.media, lang));
    box.appendChild(renderOverlay(p, lang));
    box.appendChild(el("span", "project-hint", t["projects.hint"]));
    box.addEventListener("click", () => {
      // Only the centred project opens; tapping a side project slides to it instead.
      if (touchOnly.matches && project.classList.contains("is-current")) box.classList.toggle("is-open");
    });
    project.appendChild(box);
    return project;
  }

  function renderProjects(lang) {
    const list = document.getElementById("project-list");
    list.replaceChildren();
    for (let copy = 0; copy < COPIES; copy++) {
      PROJECTS.forEach((p) => list.appendChild(buildProject(p, lang, copy !== REAL_COPY)));
    }
  }

  // Endless horizontal slider: swipe, trackpad, mouse drag, arrows, dots or keyboard arrows.
  // Projects scale down and fade with their distance from the centre, so sliding animates them.
  const slider = (function () {
    const SIDE_SCALE = 0.75;
    // How much of the space freed by shrinking the side projects is closed up (0 = none, 1 = all).
    const SIDE_PULL = 0.6;
    const SIDE_OPACITY = 0.4;

    const track = document.getElementById("project-list");
    const prev = document.getElementById("slider-prev");
    const next = document.getElementById("slider-next");
    const dots = document.getElementById("slider-dots");
    let current = 0; // index among all rendered children, copies included
    let ticking = false;
    let settleTimer = null;
    let drag = null;
    let touching = false;
    let suppressClick = false;

    const items = () => Array.from(track.children);
    const count = () => PROJECTS.length;

    function nearestIndex() {
      const center = track.scrollLeft + track.clientWidth / 2;
      let best = 0;
      let bestDist = Infinity;
      items().forEach((item, i) => {
        const dist = Math.abs(item.offsetLeft + item.offsetWidth / 2 - center);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      return best;
    }

    function goTo(i, instant) {
      const list = items();
      if (!list.length) return;
      const item = list[Math.max(0, Math.min(list.length - 1, i))];
      const left = item.offsetLeft - (track.clientWidth - item.offsetWidth) / 2;
      track.scrollTo({ left: left, behavior: instant ? "instant" : "smooth" });
    }

    // Size and fade every project by its distance from the centre.
    function paint() {
      const list = items();
      if (!list.length) return;
      const center = track.scrollLeft + track.clientWidth / 2;
      const step = list[0].offsetWidth + (parseFloat(getComputedStyle(track).columnGap) || 0);
      list.forEach((item) => {
        const offset = item.offsetLeft + item.offsetWidth / 2 - center;
        const d = Math.min(Math.abs(offset) / step, 1);
        // Slide side projects towards the centre so shrinking them doesn't leave a wide gap.
        const pull = -Math.sign(offset) * d * SIDE_PULL * item.offsetWidth * (1 - SIDE_SCALE) / 2;
        item.style.transform = "translateX(" + pull + "px) scale(" + (1 - (1 - SIDE_SCALE) * d) + ")";
        item.style.opacity = String(1 - (1 - SIDE_OPACITY) * d);
      });
    }

    function update() {
      current = nearestIndex();
      const logical = current % count();
      items().forEach((item, i) => item.classList.toggle("is-current", i === current));
      Array.from(dots.children).forEach((dot, i) => dot.setAttribute("aria-current", String(i === logical)));
      paint();
    }

    // When scrolling has come to rest on a copy, jump to the same project in the real set.
    // Never while a finger or the mouse is still holding the slider.
    function settle() {
      if (drag || touching) return;
      const n = count();
      if (Math.floor(current / n) !== REAL_COPY) {
        current = REAL_COPY * n + (current % n);
        goTo(current, true);
        update();
      }
    }

    track.addEventListener("touchstart", () => (touching = true), { passive: true });
    const endTouch = () => {
      touching = false;
      clearTimeout(settleTimer);
      settleTimer = setTimeout(settle, 150);
    };
    track.addEventListener("touchend", endTouch, { passive: true });
    track.addEventListener("touchcancel", endTouch, { passive: true });

    track.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(() => {
            ticking = false;
            update();
          });
        }
        clearTimeout(settleTimer);
        settleTimer = setTimeout(settle, 150);
      },
      { passive: true }
    );

    prev.addEventListener("click", () => goTo(current - 1));
    next.addEventListener("click", () => goTo(current + 1));

    track.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goTo(current - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goTo(current + 1);
      }
    });

    // Clicking a side project slides it to the centre; a finished drag never counts as a click.
    track.addEventListener(
      "click",
      (e) => {
        if (suppressClick) {
          suppressClick = false;
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        const project = e.target.closest(".project");
        if (project && !project.classList.contains("is-current")) {
          e.stopPropagation();
          goTo(items().indexOf(project));
        }
      },
      true
    );

    // Mouse drag (touch screens already swipe natively).
    track.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      drag = { x: e.clientX, left: track.scrollLeft, start: current, dx: 0, moved: false };
    });

    window.addEventListener("pointermove", (e) => {
      if (!drag) return;
      drag.dx = e.clientX - drag.x;
      if (!drag.moved && Math.abs(drag.dx) < 5) return;
      if (!drag.moved) {
        drag.moved = true;
        track.classList.add("is-dragging");
      }
      track.scrollLeft = drag.left - drag.dx;
    });

    window.addEventListener("pointerup", () => {
      if (!drag) return;
      const d = drag;
      drag = null;
      if (!d.moved) return;
      suppressClick = true;
      setTimeout(() => (suppressClick = false), 0);
      track.classList.remove("is-dragging");
      let target = nearestIndex();
      if (target === d.start && Math.abs(d.dx) > 60) target += d.dx < 0 ? 1 : -1;
      goTo(target);
    });

    window.addEventListener("resize", () => {
      goTo(current, true);
      update();
    });

    // Called after the projects are (re)rendered, e.g. on a language switch. Keeps the same project centred.
    function refresh(lang) {
      const t = UI[lang];
      const n = count();
      const logical = current % n;
      dots.replaceChildren();
      PROJECTS.forEach((p, i) => {
        const dot = el("button", "slider-dot");
        dot.type = "button";
        dot.setAttribute("aria-label", t["slider.goto"].replace("{n}", i + 1));
        // Go to whichever copy of that project is closest, so the slider takes the short way round.
        dot.addEventListener("click", () => {
          const copy = Math.floor(current / n);
          const options = [copy - 1, copy, copy + 1]
            .filter((c) => c >= 0 && c < COPIES)
            .map((c) => c * n + i);
          goTo(options.reduce((a, b) => (Math.abs(b - current) < Math.abs(a - current) ? b : a)));
        });
        dots.appendChild(dot);
      });
      current = REAL_COPY * n + logical;
      goTo(current, true);
      update();
    }

    return { refresh: refresh };
  })();

  function applyLang(lang) {
    const t = UI[lang];
    document.documentElement.lang = lang;
    document.title = t["meta.title"];
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", t["meta.description"]);

    document.querySelectorAll("[data-i18n]").forEach((node) => {
      const key = node.getAttribute("data-i18n");
      if (t[key] != null) node.textContent = t[key];
    });

    // Multi-line text: one line per array entry, separated by <br> like the original layout.
    document.querySelectorAll("[data-i18n-lines]").forEach((node) => {
      const lines = t[node.getAttribute("data-i18n-lines")] || [];
      node.replaceChildren();
      lines.forEach((line, i) => {
        if (i > 0) node.appendChild(document.createElement("br"));
        node.appendChild(document.createTextNode(line));
      });
    });

    document.querySelectorAll("[data-i18n-label]").forEach((node) => {
      const key = node.getAttribute("data-i18n-label");
      if (t[key] != null) node.setAttribute("aria-label", t[key]);
    });

    renderProjects(lang);
    slider.refresh(lang);
  }

  // Desktop: the coffee-shop GIF is fully visible in the middle of the screen and fades into the
  // black space around it as it scrolls towards the top or bottom edge.
  (function () {
    const gif = document.querySelector(".background-img");
    const desktop = window.matchMedia("(min-width: 761px)");
    let ticking = false;

    function fade() {
      ticking = false;
      if (!desktop.matches) {
        gif.style.opacity = "";
        return;
      }
      const rect = gif.getBoundingClientRect();
      const half = window.innerHeight / 2;
      const dist = Math.abs(rect.top + rect.height / 2 - half);
      gif.style.opacity = String(Math.max(0, Math.min(1, (1 - dist / half) * 1.6)));
    }

    function schedule() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(fade);
      }
    }

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("load", schedule);
    fade();
  })();

  applyLang(LANG);
})();
