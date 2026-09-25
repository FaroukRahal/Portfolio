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

  // Demo videos play (muted, looping) only while on screen. The slider holds several copies of each
  // project, so this keeps just the visible ones decoding instead of every copy at once.
  const videoObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if (entry.isIntersecting) {
          const playing = video.play();
          if (playing) playing.catch(() => {});
        } else {
          video.pause();
        }
      });
    },
    { threshold: 0.25 }
  );

  // The screenshot or demo that fills the project box, or a quiet placeholder until one is added.
  function renderMedia(media, lang) {
    if (media && media.src && media.type === "video") {
      const video = document.createElement("video");
      video.src = media.src;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = "none";
      if (media.poster) video.poster = media.poster;
      video.setAttribute("aria-hidden", "true");
      videoObserver.observe(video);
      return video;
    }
    if (media && media.src) {
      const img = document.createElement("img");
      img.src = media.src;
      img.alt = (media.alt && media.alt[lang]) || "";
      img.loading = "lazy";
      img.draggable = false; // otherwise the browser's own image drag hijacks the slider drag
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
    videoObserver.disconnect();
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
      if (track.classList.contains("is-dragging")) snapBackOn();
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
    // Snapping stays off from the start of a drag until the glide back to the centre has finished,
    // so the browser's snapping and ours never fight and leave a project slightly off-centre.
    let snapOffTimer = null;
    function snapBackOn() {
      clearTimeout(snapOffTimer);
      if (!drag) track.classList.remove("is-dragging");
    }

    function endDrag() {
      if (!drag) return;
      const d = drag;
      drag = null;
      if (!d.moved) return;
      suppressClick = true;
      setTimeout(() => (suppressClick = false), 0);
      let target = nearestIndex();
      if (target === d.start && Math.abs(d.dx) > 60) target += d.dx < 0 ? 1 : -1;
      goTo(target);
      clearTimeout(snapOffTimer);
      snapOffTimer = setTimeout(snapBackOn, 900); // fallback if no scroll happens
    }

    track.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      drag = { x: e.clientX, left: track.scrollLeft, start: current, dx: 0, moved: false, id: e.pointerId };
    });

    // Never let the browser start its own drag (of an image or text) inside the slider.
    track.addEventListener("dragstart", (e) => e.preventDefault());

    window.addEventListener("pointermove", (e) => {
      if (!drag) return;
      if (!(e.buttons & 1)) {
        endDrag(); // the button was released somewhere we didn't hear about
        return;
      }
      drag.dx = e.clientX - drag.x;
      if (!drag.moved && Math.abs(drag.dx) < 5) return;
      if (!drag.moved) {
        drag.moved = true;
        track.classList.add("is-dragging");
        try {
          track.setPointerCapture(drag.id); // keep receiving the release even outside the slider
        } catch (err) {
          /* not critical */
        }
      }
      track.scrollLeft = drag.left - drag.dx;
    });

    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
    track.addEventListener("lostpointercapture", endDrag);
    window.addEventListener("blur", endDrag);

    // Re-centre whenever the slider's width changes (window resize, or the page layout settling).
    let lastWidth = track.clientWidth;
    new ResizeObserver(() => {
      if (track.clientWidth === lastWidth) return;
      lastWidth = track.clientWidth;
      goTo(current, true);
      update();
    }).observe(track);

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

  // Desktop: the coffee-shop GIF fades in out of the black space above it as it scrolls up
  // towards the middle of the screen.
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
      // Fades in while rising towards the middle of the screen; once past it, stays fully visible
      // (its bottom edge sits on the contact section).
      const dist = Math.max(0, rect.top + rect.height / 2 - half);
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

  // Pixel snow over the whole page, switched on by the coffee cup. Switching it on starts a
  // snowstorm that builds up across the whole sky, holds, and calms down; after that a few flakes
  // fall at the top and more as you scroll down, reaching full snowfall at the coffee-shop GIF.
  const snow = (function () {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return { setOn() {} };

    const MAX_FLAKES = window.innerWidth < 761 ? 140 : 320;
    const START_SHARE = 0.06; // share of flakes falling at the very top of the page
    // Wind from left to right: a light breeze at the top of the page that grows into a gusty wind
    // at the bottom. Set WIND to false to turn it off.
    const WIND = true;
    const WIND_TOP = 0.25; // px per frame at the top of the page
    const WIND_BOTTOM = 2.4; // px per frame at the bottom
    // The storm when the snow is switched on: it builds up over STORM_RISE frames, holds for
    // STORM_HOLD, then calms down over STORM_FADE (60 frames = 1 second).
    const STORM_WIND = 7; // extra px per frame at full strength
    const STORM_RISE = 70;
    const STORM_HOLD = 100;
    const STORM_FADE = 200;

    const canvas = document.createElement("canvas");
    canvas.className = "snow";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d");

    let w = 0;
    let h = 0;
    let density = START_SHARE;
    let lastScroll = window.scrollY;
    let last = performance.now();
    let t = 0;
    let enabled = false; // off until the coffee is "inserted"
    let power = 0; // eases towards 1 (on) or 0 (off), so the snow stops gently
    let stormAge = Infinity; // frames since the blizzard started
    let cleared = true;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    // depth 0 = far away (small, faint, slow), 1 = close (bigger, brighter, faster)
    const flakes = Array.from({ length: MAX_FLAKES }, () => {
      const depth = Math.random();
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        depth: depth,
        size: depth < 0.45 ? 2 : depth < 0.85 ? 3 : 4,
        speed: 0.3 + depth * 0.9,
        sway: 0.2 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
        alpha: 0.35 + depth * 0.5,
        fade: 1, // 0..1: each flake fades in on its own when it (re)appears
        gustPhase: Math.random() * Math.PI * 2, // each flake catches the gusts a little differently
      };
    });

    // Bring a flake back in. With wind the snow falls at a slant, so flakes must come in from the
    // left edge as well as the top, in proportion to the slant, or the bottom-left corner stays empty.
    function respawn(f, vx, vy) {
      const drift = vy > 0 ? Math.max(0, (vx / vy) * h) : 0; // how far right it travels on the way down
      if (Math.random() < drift / (w + drift)) {
        f.x = -8;
        f.y = Math.random() * h;
      } else {
        f.x = Math.random() * w;
        f.y = -6 - Math.random() * 30;
      }
      f.fade = 0;
    }

    function scrollProgress() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    }

    // 0..1: builds up, holds, then eases back down to 0 as the storm calms.
    function stormLevel() {
      const ease = (k) => k * k * (3 - 2 * k);
      if (stormAge < STORM_RISE) return ease(stormAge / STORM_RISE);
      if (stormAge < STORM_RISE + STORM_HOLD) return 1;
      const k = (stormAge - STORM_RISE - STORM_HOLD) / STORM_FADE;
      return k >= 1 ? 0 : 1 - ease(k);
    }

    function frame(now) {
      const dt = Math.min(3, (now - last) / 16.67); // 1 = one 60fps frame
      last = now;
      t += dt;
      stormAge += dt;

      // Ease towards the density for the current scroll position so flakes appear gradually.
      const progress = scrollProgress();
      const target = START_SHARE + (1 - START_SHARE) * Math.pow(progress, 1.6);
      density += (target - density) * 0.04 * dt;
      power += ((enabled ? 1 : 0) - power) * 0.03 * dt;
      if (!enabled && power < 0.002) {
        power = 0;
        if (!cleared) {
          ctx.clearRect(0, 0, w, h);
          cleared = true;
        }
        lastScroll = window.scrollY;
        requestAnimationFrame(frame);
        return;
      }
      cleared = false;
      const storm = stormLevel(); // when switched off, "power" fades everything out together
      const visible = Math.max(density, storm) * MAX_FLAKES * power;
      const speedBoost = 1 + density * 0.6 + storm * 1.4;

      // Wind for this scroll position with slow gusts, plus the storm's stronger, gustier wind.
      const gust = 0.8 + 0.2 * Math.sin(t * 0.008) + 0.12 * Math.sin(t * 0.023 + 1.3);
      const breeze = WIND ? (WIND_TOP + (WIND_BOTTOM - WIND_TOP) * Math.pow(progress, 1.3)) * gust : 0;
      const stormWind = STORM_WIND * storm * (0.8 + 0.2 * Math.sin(t * 0.05));

      // Flakes drift with the page a little while scrolling (closer ones more), for depth.
      const scrollDelta = window.scrollY - lastScroll;
      lastScroll = window.scrollY;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#fff";
      for (let i = 0; i < Math.ceil(visible); i++) {
        const f = flakes[i];
        // Turbulence: each flake catches the storm's gusts a little differently.
        const turbulence = 0.7 + 0.3 * Math.sin(t * 0.045 + f.gustPhase);
        const push = (breeze + stormWind * turbulence) * (0.4 + f.depth * 0.8); // closer flakes pushed harder
        const fall = f.speed * speedBoost;
        f.y += fall * dt - scrollDelta * (0.15 + f.depth * 0.35);
        f.y += storm * Math.sin(t * 0.06 + f.gustPhase) * 0.6 * dt; // tossed up and down a little
        f.x += Math.sin(t * 0.02 * f.sway + f.phase) * f.sway * 0.6 * dt;
        f.x += push * dt;
        if (f.y > h + 6 || f.x > w + 16) {
          respawn(f, push, fall);
        } else if (f.y < -60) {
          f.y = h + 6;
          f.x = Math.random() * w;
        }
        if (f.x < -0.35 * w) f.x = w + 16;
        if (f.fade < 1) f.fade = Math.min(1, f.fade + 0.05 * dt);
        // The newest flake fades in rather than popping into view.
        ctx.globalAlpha = f.alpha * f.fade * Math.min(1, visible - i);
        ctx.fillRect(Math.round(f.x), Math.round(f.y), f.size, f.size);
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    return {
      setOn(on) {
        enabled = on;
        if (!on) return;
        // Storm: scatter every flake that isn't already falling across and above the whole sky,
        // each fading in on its own as the storm builds.
        stormAge = 0;
        power = 1;
        const falling = Math.floor(density * MAX_FLAKES * power);
        for (let i = falling; i < MAX_FLAKES; i++) {
          const f = flakes[i];
          f.x = -0.3 * w + Math.random() * 1.3 * w;
          f.y = -0.4 * h + Math.random() * 1.4 * h;
          f.fade = 0;
        }
      },
    };
  })();

  // Sound for the snow, generated in the browser (no audio files): a retro coin "insert" blip and a
  // rush of storm wind that fades to silence after about 5 seconds. A soft background wind that
  // follows the page is optional, behind the "Wind" button. Browsers only allow sound after a click.
  const snowSound = (function () {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    // No storm sound without the storm (visitors who asked for reduced motion get no snow).
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!AudioCtx || reduceMotion) return { available: false, start() {}, stop() {}, setAmbient() {} };
    let ac = null;
    let storm = null;
    let ambient = null;

    function context() {
      if (!ac) ac = new AudioCtx();
      if (ac.state === "suspended") ac.resume();
      return ac;
    }

    function noiseBuffer(brown) {
      const len = ac.sampleRate * 3;
      const buf = ac.createBuffer(1, len, ac.sampleRate);
      const data = buf.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < len; i++) {
        const white = Math.random() * 2 - 1;
        if (brown) {
          lastOut = (lastOut + 0.02 * white) / 1.02; // deep, rumbling noise
          data[i] = lastOut * 3.5;
        } else {
          data[i] = white;
        }
      }
      return buf;
    }

    // A wind sound: deep noise through a slowly swaying band-pass, plus a faint whistling howl.
    // Returns its two volume controls (wind, howl) and a stop function.
    function windVoice() {
      const master = ac.createGain();
      master.connect(ac.destination);
      const sources = [];
      const layer = (brown, type, freq, q, swayRate, swayDepth) => {
        const src = ac.createBufferSource();
        src.buffer = noiseBuffer(brown);
        src.loop = true;
        const filter = ac.createBiquadFilter();
        filter.type = type;
        filter.frequency.value = freq;
        filter.Q.value = q;
        const gain = ac.createGain();
        gain.gain.value = 0;
        src.connect(filter).connect(gain).connect(master);
        const lfo = ac.createOscillator();
        const lfoAmount = ac.createGain();
        lfo.frequency.value = swayRate;
        lfoAmount.gain.value = swayDepth;
        lfo.connect(lfoAmount).connect(filter.frequency);
        src.start();
        lfo.start();
        sources.push(src, lfo);
        return gain;
      };
      const wind = layer(true, "bandpass", 480, 0.7, 0.13, 220);
      const howl = layer(false, "bandpass", 820, 11, 0.21, 260);
      function stop(fade) {
        const now = ac.currentTime;
        master.gain.cancelScheduledValues(now);
        master.gain.setValueAtTime(master.gain.value, now);
        master.gain.linearRampToValueAtTime(0, now + fade);
        sources.forEach((src) => src.stop(now + fade + 0.05));
        setTimeout(() => master.disconnect(), (fade + 0.3) * 1000);
      }
      return { wind: wind.gain, howl: howl.gain, stop };
    }

    // Two quick square-wave notes, like an arcade coin.
    function coin(at) {
      [
        [988, at, 0.07],
        [1319, at + 0.07, 0.4],
      ].forEach(([freq, begin, len]) => {
        const osc = ac.createOscillator();
        const g = ac.createGain();
        osc.type = "square";
        osc.frequency.value = freq;
        g.gain.setValueAtTime(0.05, begin);
        g.gain.exponentialRampToValueAtTime(0.0001, begin + len);
        osc.connect(g).connect(ac.destination);
        osc.start(begin);
        osc.stop(begin + len + 0.02);
      });
    }

    function start() {
      context();
      if (storm) storm.stop(0.05);
      const now = ac.currentTime;
      coin(now);
      // Storm wind: swells with the snow, holds, then fades to silence by about 5 seconds.
      const voice = windVoice();
      const t0 = now + 0.1;
      voice.wind.setValueAtTime(0, t0);
      voice.wind.linearRampToValueAtTime(0.8, t0 + 1.2);
      voice.wind.setValueAtTime(0.8, t0 + 2.4);
      voice.wind.linearRampToValueAtTime(0, t0 + 5.2);
      voice.howl.setValueAtTime(0, t0);
      voice.howl.linearRampToValueAtTime(0.1, t0 + 1.5);
      voice.howl.setValueAtTime(0.1, t0 + 2.4);
      voice.howl.linearRampToValueAtTime(0, t0 + 5);
      storm = voice;
      const ended = voice;
      setTimeout(() => {
        if (storm === ended) {
          storm.stop(0.1);
          storm = null;
        }
      }, 5600);
    }

    function scrollProgress() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    }

    // Optional background wind: soft at the top of the page, a little stronger further down.
    function followScroll() {
      if (!ambient) return;
      const p = scrollProgress();
      ambient.wind.setTargetAtTime(0.1 + 0.25 * p, ac.currentTime, 0.8);
      ambient.howl.setTargetAtTime(0.012 + 0.04 * p, ac.currentTime, 0.8);
    }

    function setAmbient(on) {
      if (on && !ambient) {
        context();
        ambient = windVoice();
        followScroll();
        window.addEventListener("scroll", followScroll, { passive: true });
      } else if (!on && ambient) {
        window.removeEventListener("scroll", followScroll);
        ambient.stop(1);
        ambient = null;
      }
    }

    function stop() {
      if (storm) {
        storm.stop(1.2);
        storm = null;
      }
      setAmbient(false);
    }

    // Stay quiet while the tab is hidden.
    document.addEventListener("visibilitychange", () => {
      if (!ac) return;
      if (document.hidden) ac.suspend();
      else if (storm || ambient) ac.resume();
    });

    return { available: true, start, stop, setAmbient };
  })();

  // The floating "Wind" button: shown while the snow is on, turns the background wind on and off.
  const windButton = (function () {
    const button = document.querySelector(".wind-toggle");
    if (!button) return { show() {}, hide() {} };
    button.addEventListener("click", () => {
      const on = button.getAttribute("aria-pressed") !== "true";
      button.setAttribute("aria-pressed", String(on));
      snowSound.setAmbient(on);
    });
    return {
      show() {
        if (snowSound.available) button.hidden = false;
      },
      hide() {
        button.hidden = true;
        button.setAttribute("aria-pressed", "false");
      },
    };
  })();

  // The coffee cup in the intro: click it to "insert coffee". The text goes, the steam rises in
  // three rows, a blizzard blows in with sound, and the snow keeps falling. Click again to switch
  // it all back.
  (function () {
    const button = document.querySelector(".coffee-toggle");
    if (!button) return;
    const img = button.querySelector("img");
    const GIF_OFF = img.getAttribute("src");
    const GIF_ON = "Assets/pixel_coffee_hot.gif";
    new Image().src = GIF_ON; // preload, so the swap is instant

    button.addEventListener("click", () => {
      const on = button.getAttribute("aria-pressed") !== "true";
      button.setAttribute("aria-pressed", String(on));
      button.setAttribute("aria-label", UI[LANG][on ? "coffee.stop" : "coffee.start"]);
      img.src = on ? GIF_ON : GIF_OFF;
      snow.setOn(on);
      if (on) {
        snowSound.start();
        windButton.show();
      } else {
        snowSound.stop();
        windButton.hide();
      }
    });
  })();

  // A reload always starts at the top of the page: the browser doesn't restore the old scroll
  // position, and in-page links (Projects, About) scroll smoothly without adding "#projects" to the
  // address, so reloading never jumps back to a section.
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  if (location.hash) history.replaceState(null, "", location.pathname + location.search);
  window.scrollTo(0, 0);
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const id = link.getAttribute("href").slice(1);
      const target = id ? document.getElementById(id) : null;
      e.preventDefault();
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      else window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  applyLang(LANG);
})();
