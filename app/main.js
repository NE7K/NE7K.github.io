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
  try {
    const iconEl = qs(".theme-toggle__icon");
    if (!iconEl) return;
    // 현재 테마가 light면 다크 모드로 전환할 수 있도록 달 아이콘 표시
    // 현재 테마가 dark면 라이트 모드로 전환할 수 있도록 태양 아이콘 표시
    if (theme === "light") {
      iconEl.textContent = "🌙";
    } else {
      iconEl.textContent = "☀️";
    }
  } catch (e) {
    console.warn("테마 아이콘 업데이트 실패:", e);
  }
}

function setTheme(mode) {
  try {
    const html = document.documentElement;
    if (mode === "light" || mode === "dark") {
      html.setAttribute("data-theme", mode);
      try {
        localStorage.setItem("theme", mode);
      } catch (e) {
        console.warn("localStorage 저장 실패:", e);
      }
      updateThemeIcon(mode);
      return;
    }
    html.removeAttribute("data-theme");
    try {
      localStorage.removeItem("theme");
    } catch (e) {
      console.warn("localStorage 삭제 실패:", e);
    }
    let prefersDark = false;
    try {
      prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch (e) {
      console.warn("matchMedia 확인 실패:", e);
    }
    updateThemeIcon(prefersDark ? "dark" : "light");
  } catch (e) {
    console.error("테마 설정 실패:", e);
  }
}

function initThemeToggle() {
  try {
    const btn = qs("#themeToggle");
    if (!btn) return;

    let saved = null;
    try {
      saved = localStorage.getItem("theme");
    } catch (e) {
      console.warn("localStorage 읽기 실패:", e);
    }
    
    if (saved) {
      setTheme(saved);
    } else {
      let prefersDark = false;
      try {
        prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      } catch (e) {
        console.warn("matchMedia 확인 실패:", e);
      }
      updateThemeIcon(prefersDark ? "dark" : "light");
    }

    btn.addEventListener("click", () => {
      try {
        const current = document.documentElement.getAttribute("data-theme");
        if (current === "light") setTheme("dark");
        else if (current === "dark") setTheme("light");
        else {
          let prefersDark = false;
          try {
            prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
          } catch (e) {
            console.warn("matchMedia 확인 실패:", e);
          }
          setTheme(prefersDark ? "light" : "dark");
        }
      } catch (e) {
        console.error("테마 전환 실패:", e);
      }
    });
  } catch (e) {
    console.error("테마 토글 초기화 실패:", e);
  }
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
  try {
    target.innerHTML = "";

    if (!Array.isArray(projects)) {
      console.warn("프로젝트 데이터가 배열이 아닙니다:", projects);
      return;
    }

    projects.forEach((p) => {
      try {
    const links = p?.links || {};
    const stack = Array.isArray(p?.stack) ? p.stack : [];
    const features = Array.isArray(p?.features) ? p.features : [];
    const impact = Array.isArray(p?.impact) ? p.impact : [];

    const metaParts = [p?.type, p?.year, p?.status].filter(isNonEmptyString).map(String);
    if (isNonEmptyString(p?.duration)) {
      metaParts.push(`(${p.duration})`);
    }
    const meta = metaParts.length ? metaParts.join(" · ") : "";

    const linkRow = el("div", { class: "pill-row" }, []);
    const linkItems = [
      { label: "Repo", url: links.repo },
      { label: "WBS Download", url: links.workflow },
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
    let imageEl = null;
    if (images.length > 0) {
      const img = el("img", { 
        src: images[0], 
        alt: safeText(p?.name || "프로젝트 이미지"), 
        loading: "lazy",
        decoding: "async"
      });
      img.addEventListener("error", function() {
        console.error(`이미지 로드 실패: ${images[0]}`);
        this.style.display = "none";
        const parent = this.parentElement;
        if (parent && parent.classList.contains("project__image")) {
          parent.style.background = "linear-gradient(135deg, var(--accent), var(--accent2))";
          parent.style.display = "flex";
          parent.style.alignItems = "center";
          parent.style.justifyContent = "center";
          parent.innerHTML = `<span style="color: rgba(255,255,255,0.8); font-size: 14px;">이미지를 불러올 수 없습니다</span>`;
        }
      });
      img.addEventListener("load", function() {
        this.style.opacity = "1";
      });
      imageEl = el("div", { class: "project__image" }, [img]);
    }

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
      } catch (e) {
        console.error("프로젝트 카드 생성 실패:", e, p);
      }
    });
  } catch (e) {
    console.error("프로젝트 렌더링 실패:", e);
  }
}

function renderPersonalInfo(target, profile) {
  if (!target || !profile) {
    console.warn("renderPersonalInfo: target 또는 profile이 없습니다.");
    return;
  }
  
  try {
    target.innerHTML = "";
    
    const personalInfo = profile?.personalInfo || {};
    if (!personalInfo || Object.keys(personalInfo).length === 0) {
      console.log("인적사항 데이터가 없습니다.");
      return;
    }
    
    console.log("인적사항 데이터:", personalInfo);
    
    const infoItems = [];
    
    // 예시 텍스트인지 확인하는 헬퍼 함수 (더 유연하게)
    const isExampleText = (text, fieldName) => {
      if (!text) return true;
      const trimmed = text.trim();
      
      // 빈 문자열 체크
      if (trimmed === "" || trimmed.length === 0) return true;
      
      // 생년월일 필드의 경우
      if (fieldName === "birthDate") {
        return trimmed === "YYYY-MM-DD" || trimmed === "yyyy-mm-dd" || trimmed.toLowerCase() === "yyyy-mm-dd";
      }
      
      // 다른 필드의 경우 - 정확히 "예:"로 시작하는 경우만 필터링
      // "예: " (공백 포함)도 체크하되, 실제 데이터가 "예:"로 시작할 수도 있으므로 더 신중하게
      const examplePatterns = ["예:", "예: "];
      for (const pattern of examplePatterns) {
        if (trimmed.startsWith(pattern) && trimmed.length <= pattern.length + 30) {
          // "예:" 다음에 30자 이내면 예시 텍스트로 간주
          return true;
        }
      }
      
      return false;
    };
    
    // 생년월일
    if (isNonEmptyString(personalInfo.birthDate)) {
      const birthDate = personalInfo.birthDate.trim();
      if (!isExampleText(birthDate, "birthDate")) {
        infoItems.push({
          icon: "🎂",
          label: "생년월일",
          value: birthDate
        });
      } else {
        console.log("생년월일 필터링됨 (예시 텍스트):", birthDate);
      }
    }
    
    // 학력
    if (isNonEmptyString(personalInfo.education)) {
      const education = personalInfo.education.trim();
      if (!isExampleText(education, "education")) {
        infoItems.push({
          icon: "🎓",
          label: "학력",
          value: education
        });
      } else {
        console.log("학력 필터링됨 (예시 텍스트):", education);
      }
    }
    
    // 경력
    if (isNonEmptyString(personalInfo.experience)) {
      const experience = personalInfo.experience.trim();
      if (!isExampleText(experience, "experience")) {
        infoItems.push({
          icon: "💼",
          label: "경력",
          value: experience
        });
      } else {
        console.log("경력 필터링됨 (예시 텍스트):", experience);
      }
    }
    
    // 기타 정보
    if (isNonEmptyString(personalInfo.other)) {
      const other = personalInfo.other.trim();
      if (!isExampleText(other, "other")) {
        infoItems.push({
          icon: "⭐",
          label: "기타",
          value: other
        });
      } else {
        console.log("기타 정보 필터링됨 (예시 텍스트):", other);
      }
    }
    
    // 주소
    if (isNonEmptyString(personalInfo.address)) {
      const address = personalInfo.address.trim();
      if (!isExampleText(address, "address")) {
        infoItems.push({
          icon: "📍",
          label: "주소",
          value: address,
          isWide: true  // 2칸짜리 카드로 표시
        });
      } else {
        console.log("주소 필터링됨 (예시 텍스트):", address);
      }
    }
    
    console.log("표시할 인적사항 항목 수:", infoItems.length);
    
    // 인적사항이 없으면 반환
    if (infoItems.length === 0) {
      return;
    }
    
    // 각 항목을 개별 작은 카드로 표시 (외부 테두리 없이)
    const personalInfoContainer = el("div", { class: "personal-info-grid" }, 
      infoItems.map((item) => 
        el("div", { 
          class: `personal-info-card${item.isWide ? " personal-info-card--wide" : ""}` 
        }, [
          el("div", { class: "personal-info-card__icon", text: item.icon }),
          el("div", { class: "personal-info-card__content" }, [
            el("div", { class: "personal-info-card__label", text: item.label }),
            el("div", { class: "personal-info-card__value", text: item.value })
          ])
        ])
      )
    );
    
    target.appendChild(personalInfoContainer);
  } catch (e) {
    console.error("인적사항 렌더링 실패:", e);
  }
}

function renderContact(target, profile) {
  if (!target) return;
  try {
    target.innerHTML = "";

    const email = profile?.email;
    const phone = profile?.phone;
    const discord = profile?.discord;
    const discordLink = profile?.discordLink;
    const links = Array.isArray(profile?.links) ? profile.links : [];

    const contactItems = el("div", { class: "pill-row" }, []);

    if (isNonEmptyString(phone)) {
      try {
        contactItems.appendChild(el("a", { class: "btn btn--primary", href: `tel:${phone.replace(/-/g, "")}`, text: `📞 ${phone}` }));
      } catch (e) {
        console.warn("전화번호 버튼 생성 실패:", e);
      }
    }
    if (isNonEmptyString(email) && !email.includes("your@email.com")) {
      try {
        contactItems.appendChild(el("a", { class: "btn", href: `mailto:${email}`, text: `✉️ ${email}` }));
      } catch (e) {
        console.warn("이메일 버튼 생성 실패:", e);
      }
    }
    if (isNonEmptyString(discord)) {
      try {
        if (isNonEmptyString(discordLink)) {
          contactItems.appendChild(el("a", { class: "btn", href: discordLink, target: "_blank", rel: "noreferrer", text: `💬 Discord : ${discord}` }));
        } else {
          contactItems.appendChild(el("span", { class: "btn", text: `💬 Discord : ${discord}` }));
        }
      } catch (e) {
        console.warn("Discord 버튼 생성 실패:", e);
      }
    }

    // 연락 섹션에서는 links 배열의 링크를 표시하지 않음 (소개 섹션에서만 표시)
    // links.forEach((l) => {
    //   if (!l || !isNonEmptyString(l.url)) return;
    //   try {
    //     contactItems.appendChild(el("a", { class: "btn", href: l.url, target: "_blank", rel: "noreferrer", text: safeText(l.label || l.url) }));
    //   } catch (e) {
    //     console.warn("링크 버튼 생성 실패:", e);
    //   }
    // });

    target.appendChild(contactItems);
  } catch (e) {
    console.error("연락처 렌더링 실패:", e);
  }
}

async function loadData() {
  try {
    const res = await fetch("app/profile.json", { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`profile.json 로드 실패: ${res.status} ${res.statusText}`);
    }
    try {
      return await res.json();
    } catch (e) {
      throw new Error(`JSON 파싱 실패: ${e.message}`);
    }
  } catch (e) {
    if (e instanceof TypeError && e.message.includes("fetch")) {
      throw new Error("네트워크 오류: profile.json 파일을 불러올 수 없습니다.");
    }
    throw e;
  }
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
    
    // 위치 정보
    if (isNonEmptyString(profile.location)) {
      parts.push(`📍 ${profile.location}`);
    }
    
    // 소개 섹션에서는 이메일 표시 안 함 (연락 섹션에서만 표시)
    
    if (parts.length) {
      parts.forEach((p) => {
        try {
          if (typeof p === "string") {
            metaEl.appendChild(el("span", { text: p }));
          } else if (p instanceof Node) {
            metaEl.appendChild(p);
          }
        } catch (e) {
          console.warn("메타 정보 추가 실패:", e);
        }
      });
    }
  }

  // 인적사항 별도 렌더링
  const personalInfoEl = qs("#profilePersonalInfo");
  if (personalInfoEl) {
    try {
      renderPersonalInfo(personalInfoEl, profile);
    } catch (e) {
      console.error("인적사항 렌더링 중 오류:", e);
    }
  } else {
    console.warn("인적사항 컨테이너를 찾을 수 없습니다: #profilePersonalInfo");
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
  try {
    let prefersReducedMotion = false;
    try {
      prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (e) {
      console.warn("matchMedia 확인 실패:", e);
    }
    if (prefersReducedMotion) return;

    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    };

    let observer;
    try {
      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-in");
            observer.unobserve(entry.target);
          }
        });
      }, observerOptions);
    } catch (e) {
      console.warn("IntersectionObserver 생성 실패:", e);
      return;
    }

    try {
      const sections = document.querySelectorAll(".section");
      sections.forEach((section) => {
        try {
          observer.observe(section);
        } catch (e) {
          console.warn("섹션 관찰 실패:", e);
        }
      });
    } catch (e) {
      console.warn("섹션 선택 실패:", e);
    }
  } catch (e) {
    console.error("스크롤 애니메이션 초기화 실패:", e);
  }
}

try {
  initThemeToggle();
  loadData()
    .then((data) => {
      try {
        applyData(data);
        setTimeout(() => {
          try {
            initScrollAnimations();
          } catch (e) {
            console.error("스크롤 애니메이션 초기화 실패:", e);
          }
        }, 100);
      } catch (e) {
        console.error("데이터 적용 실패:", e);
        showFatal(e?.message || String(e));
      }
    })
    .catch((e) => {
      console.error("데이터 로드 실패:", e);
      showFatal(e?.message || String(e));
    });
} catch (e) {
  console.error("초기화 실패:", e);
  showFatal(e?.message || String(e));
}

