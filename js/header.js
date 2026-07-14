/* ============================================
   🌊 고객 헤더 - 모바일 햄버거 메뉴 토글
   좁은 화면에서 내비 링크를 드롭다운 패널로 접었다 펴는 역할만 한다.
   고객 7개 페이지가 공통으로 불러 쓴다 (헤더 마크업이 동일하므로).

   ⚠️ 모든 선언은 IIFE 로 감싸 전역 스코프를 더럽히지 않는다.
      utils.js / data.js 에는 의존하지 않는다 (순수 DOM 토글).

   펼침 여부는 패널의 data-open 속성으로만 표현하고,
   실제로 보이고 감추는 것은 CSS(모바일 미디어쿼리)가 담당한다.
   → 데스크톱에서는 이 속성과 무관하게 링크가 항상 가로로 펼쳐진다.
   ============================================ */

(function () {
  const toggle = document.querySelector("[data-nav-toggle]");
  const panel = document.querySelector("[data-nav-panel]");

  // 헤더가 없는 페이지(관리자 등)에서는 조용히 아무것도 하지 않는다
  if (!toggle || !panel) return;

  /** 데스크톱으로 넘어가는 폭 — index.css 의 미디어쿼리(768px)와 맞춘다 */
  const DESKTOP_MIN_WIDTH = 769;

  /** 펼침/접힘 상태를 패널과 버튼(aria)에 동시에 반영한다 */
  function setOpen(open) {
    panel.dataset.open = open ? "true" : "false";
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    // 스크린리더가 버튼의 현재 동작을 알 수 있도록 라벨도 바꿔 준다
    toggle.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
  }

  function isOpen() {
    return panel.dataset.open === "true";
  }

  // 처음에는 접힌 상태로 시작한다
  setOpen(false);

  /* --- 햄버거 버튼: 누를 때마다 열고 닫는다 --- */
  toggle.addEventListener("click", (e) => {
    e.stopPropagation(); // 아래 "바깥 클릭" 핸들러가 곧바로 닫지 않도록
    setOpen(!isOpen());
  });

  /* --- 패널 안의 링크를 고르면 닫는다 (이동 전에 정리) --- */
  panel.addEventListener("click", (e) => {
    if (e.target.closest("a")) setOpen(false);
  });

  /* --- 헤더 바깥을 클릭하면 닫는다 --- */
  document.addEventListener("click", (e) => {
    if (!isOpen()) return;
    if (!e.target.closest(".site-header__nav")) setOpen(false);
  });

  /* --- ESC 로도 닫고, 포커스를 버튼으로 돌려준다 --- */
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen()) {
      setOpen(false);
      toggle.focus();
    }
  });

  /* --- 데스크톱 폭으로 넓어지면 상태를 초기화한다 ---
     (데스크톱에선 패널이 늘 보이므로 aria-expanded="true" 가 남아 있으면 어색하다) */
  window.addEventListener("resize", () => {
    if (window.innerWidth >= DESKTOP_MIN_WIDTH && isOpen()) setOpen(false);
  });
})();
