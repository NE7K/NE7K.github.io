/* eslint-disable no-console */

const qs = (sel, root = document) => root.querySelector(sel);

function safeText(value) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (v === null || v === undefined) return;
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2).toLowerCase(), v);
    else node.setAttribute(k, String(v));
  });
  children.forEach((c) => {
    if (c === null || c === undefined) return;
    if (typeof c === "string") node.appendChild(document.createTextNode(c));
    else node.appendChild(c);
  });
  return node;
}

function updateThemeIcon(theme) {
  const iconEl = qs(".theme-toggle__icon");
  if (!iconEl) return;
  // 현재 테마가 light면 다크 모드로 전환할 수 있도록 달 아이콘 표시
  // 현재 테마가 dark면 라이트 모드로 전환할 수 있도록 태양 아이콘 표시
  if (theme === "light") {
    iconEl.textContent = "🌙";
  } else {
    iconEl.textContent = "☀️";
  }
}

function setTheme(mode) {
  const html = document.documentElement;
  if (mode === "light" || mode === "dark") {
    html.setAttribute("data-theme", mode);
    localStorage.setItem("theme", mode);
    updateThemeIcon(mode);
    return;
  }
  html.removeAttribute("data-theme");
  localStorage.removeItem("theme");
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  updateThemeIcon(prefersDark ? "dark" : "light");
}

function initThemeToggle() {
  const btn = qs("#themeToggle");
  if (!btn) return;

  const saved = localStorage.getItem("theme");
  if (saved) {
    setTheme(saved);
  } else {
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    updateThemeIcon(prefersDark ? "dark" : "light");
  }

  btn.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    if (current === "light") setTheme("dark");
    else if (current === "dark") setTheme("light");
    else {
      const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(prefersDark ? "light" : "dark");
    }
  });
}

function renderPills(target, items, { accentFirst = false } = {}) {
  if (!target) return;
  target.innerHTML = "";
  (items || []).forEach((t, idx) => {
    target.appendChild(el("span", { class: `pill${accentFirst && idx === 0 ? " pill--accent" : ""}`, text: safeText(t) }));
  });
}

function renderLinks(target, links) {
  if (!target) return;
  target.innerHTML = "";
  (links || []).forEach((l, idx) => {
    if (!l || !isNonEmptyString(l.url)) return;
    target.appendChild(
      el("a", {
        class: `btn${idx === 0 ? " btn--primary" : ""}`,
        href: l.url,
        target: "_blank",
        rel: "noreferrer",
        text: safeText(l.label || l.url),
      })
    );
  });
}

function renderHighlights(target, highlights) {
  if (!target) return;
  target.innerHTML = "";
  (highlights || []).forEach((h) => {
    if (!isNonEmptyString(h)) return;
    target.appendChild(el("li", {}, [h]));
  });
}

function renderExperience(target, experience) {
  if (!target) return;
  target.innerHTML = "";

  (experience || []).forEach((it) => {
    const details = Array.isArray(it?.details) ? it.details : [];
    const item = el("div", { class: "timeline__item" }, [
      el("div", { class: "timeline__top" }, [
        el("div", {}, [
          el("h3", { class: "timeline__title", text: safeText(it?.title || "") }),
          el("div", { class: "timeline__org", text: safeText(it?.org || "") }),
        ]),
        el("div", { class: "timeline__period", text: safeText(it?.period || "") }),
      ]),
      details.length
        ? el(
            "ul",
            { class: "timeline__details" },
            details.filter(isNonEmptyString).map((d) => el("li", {}, [d]))
          )
        : null,
    ]);
    target.appendChild(item);
  });
}

function renderProjects(target, projects) {
  if (!target) return;
  target.innerHTML = "";

  (projects || []).forEach((p) => {
    const links = p?.links || {};
    const stack = Array.isArray(p?.stack) ? p.stack : [];
    const features = Array.isArray(p?.features) ? p.features : [];
    const impact = Array.isArray(p?.impact) ? p.impact : [];

    const metaParts = [p?.type, p?.year, p?.status].filter(isNonEmptyString).map(String);
    const meta = metaParts.length ? metaParts.join(" · ") : "";

    const linkRow = el("div", { class: "pill-row" }, []);
    const linkItems = [
      { label: "Repo", url: links.repo },
      { label: "Demo", url: links.demo },
      { label: "Store", url: links.store },
    ].filter((l) => isNonEmptyString(l.url));

    linkItems.forEach((l) => {
      linkRow.appendChild(el("a", { class: "pill pill--accent", href: l.url, target: "_blank", rel: "noreferrer" }, [
        safeText(l.label),
        el("span", { class: "pill__hint", text: "↗" }),
      ]));
    });

    const pillRow = el("div", { class: "pill-row" }, []);
    stack.forEach((s) => {
      const stackItem = String(s || "");
      const shouldHighlight = stackItem === "GitAction" || stackItem === "Bidirectional LSTM" || stackItem === "Fl_chart" || stackItem === "Syncfusion_flutter_gauges";
      pillRow.appendChild(el("span", { class: `pill${shouldHighlight ? " pill--accent" : ""}`, text: safeText(s) }));
    });

    const images = Array.isArray(p?.images) ? p.images.filter(isNonEmptyString) : [];
    const imageEl = images.length > 0 ? el("div", { class: "project__image" }, [
      el("img", { src: images[0], alt: safeText(p?.name || "프로젝트 이미지"), loading: "lazy" }),
    ]) : null;

    const card = el("article", { class: "project" }, [
      imageEl,
      el("div", { class: "project__head" }, [
        el("h3", { class: "project__name", text: safeText(p?.name || "") }),
        el("div", { class: "project__meta", text: meta }),
      ]),
      el("p", { class: "project__one", text: safeText(p?.oneLiner || "") }),
      el("div", { class: "project__body" }, [
        el("div", { class: "project__cols" }, [
          el("div", { class: "project__block" }, [
            el("h4", { text: "문제" }),
            el("p", { text: safeText(p?.problem || "") }),
          ]),
          el("div", { class: "project__block" }, [
            el("h4", { text: "해결" }),
            el("p", { text: safeText(p?.solution || "") }),
          ]),
          el("div", { class: "project__block" }, [
            el("h4", { text: "임팩트" }),
            impact.length ? el("ul", { class: "project__list" }, impact.filter(isNonEmptyString).map((i) => el("li", {}, [i]))) : el("p", { text: "—" }),
          ]),
        ]),
        features.length ? el("div", { class: "project__block" }, [
          el("h4", { text: "핵심 기능" }),
          el("ul", { class: "project__list" }, features.filter(isNonEmptyString).map((f) => el("li", {}, [f]))),
        ]) : null,
      ]),
      el("div", { class: "project__foot" }, [
        pillRow,
        linkItems.length ? linkRow : el("div", { class: "pill-row" }, [el("span", { class: "pill pill--accent", text: "링크 추가 예정" })]),
      ]),
    ]);

    target.appendChild(card);
  });
}

function renderContact(target, profile) {
  if (!target) return;
  target.innerHTML = "";

  const email = profile?.email;
  const phone = profile?.phone;
  const discord = profile?.discord;
  const links = Array.isArray(profile?.links) ? profile.links : [];

  const contactItems = el("div", { class: "pill-row" }, []);

  if (isNonEmptyString(phone)) {
    contactItems.appendChild(el("a", { class: "btn btn--primary", href: `tel:${phone.replace(/-/g, "")}`, text: `📞 ${phone}` }));
  }
  if (isNonEmptyString(email) && !email.includes("your@email.com")) {
    contactItems.appendChild(el("a", { class: "btn", href: `mailto:${email}`, text: `✉️ ${email}` }));
  }
  if (isNonEmptyString(discord)) {
    contactItems.appendChild(el("span", { class: "btn", text: `💬 Discord: ${discord}` }));
  }

  links.forEach((l) => {
    if (!l || !isNonEmptyString(l.url)) return;
    contactItems.appendChild(el("a", { class: "btn", href: l.url, target: "_blank", rel: "noreferrer", text: safeText(l.label || l.url) }));
  });

  target.appendChild(contactItems);
}

async function loadData() {
  const res = await fetch("app/profile.json", { cache: "no-store" });
  if (!res.ok) throw new Error(`profile.json 로드 실패: ${res.status}`);
  return await res.json();
}

function applyData(data) {
  const site = data?.site || {};
  const profile = data?.profile || {};

  // title / meta
  if (isNonEmptyString(site.title)) document.title = site.title;

  const nameEl = qs("#profileName");
  const roleEl = qs("#profileRole");
  const taglineEl = qs("#profileTagline");
  const avatarEl = qs("#profileAvatar");
  const metaEl = qs("#profileMeta");

  if (nameEl) nameEl.textContent = safeText(profile.name || site.title || "포트폴리오");
  if (roleEl) roleEl.textContent = safeText(profile.role || "애플리케이션 개발자");
  if (taglineEl) taglineEl.textContent = safeText(profile.summary || site.tagline || "");
  if (avatarEl && isNonEmptyString(profile.avatar)) avatarEl.setAttribute("src", profile.avatar);
  if (avatarEl && isNonEmptyString(profile.name)) avatarEl.setAttribute("alt", `${profile.name} 프로필 사진`);

  if (metaEl) {
    metaEl.innerHTML = "";
    const parts = [];
    if (isNonEmptyString(profile.location)) parts.push(`📍 ${profile.location}`);
    if (isNonEmptyString(profile.email) && !profile.email.includes("your@email.com")) parts.push(`✉️ ${profile.email}`);
    if (parts.length) parts.forEach((p) => metaEl.appendChild(el("span", { text: p })));
  }

  renderLinks(qs("#profileLinks"), profile.links);
  renderHighlights(qs("#profileHighlights"), profile.highlights);

  renderPills(qs("#skillsPrimary"), data?.skills?.primary, { accentFirst: true });
  renderPills(qs("#skillsTools"), data?.skills?.tools);

  renderProjects(qs("#projectGrid"), data?.projects);
  renderExperience(qs("#experienceTimeline"), data?.experience);
  renderContact(qs("#contactRow"), profile);

  const footerEl = qs("#footerText");
  if (footerEl && isNonEmptyString(data?.footer?.text)) footerEl.textContent = data.footer.text;
}

function showFatal(message) {
  console.error(message);
  const main = qs("#main");
  if (!main) return;
  const box = el("div", { class: "section", style: "border-color: rgba(255,92,122,.35);" }, [
    el("div", { class: "section__head" }, [
      el("h2", { text: "데이터 로딩 실패" }),
      el("p", { class: "section__sub", text: "페이지 콘텐츠를 불러오지 못했습니다. 아래 메시지를 확인해 주세요." }),
    ]),
    el("pre", { style: "white-space: pre-wrap; color: rgba(255,255,255,.85); background: rgba(0,0,0,.25); padding: 12px; border-radius: 14px; border: 1px solid rgba(255,255,255,.12);" }, [
      safeText(message),
    ]),
  ]);
  main.prepend(box);
}

function initScrollAnimations() {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) return;

  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("animate-in");
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  const sections = document.querySelectorAll(".section");
  sections.forEach((section) => observer.observe(section));
}

initThemeToggle();
loadData()
  .then((data) => {
    applyData(data);
    setTimeout(initScrollAnimations, 100);
  })
  .catch((e) => showFatal(e?.message || String(e)));

