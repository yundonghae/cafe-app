/* ============================================
   🌊 카페 앱 - 공통 유틸리티
   포맷 · 장바구니 · 주문 · 토스트 · DOM 헬퍼
   data.js 의 CafeData / STORAGE_KEYS 에 의존한다.
   (HTML 에서 data.js 를 utils.js 보다 먼저 로드할 것)

   ⚠️ 모든 내부 선언은 IIFE 로 감싸 전역 스코프 오염을 막는다.
   (같은 페이지의 다른 <script> 가 window.CafeUtils 를 구조분해하며
    같은 이름을 다시 const 로 선언 → "Identifier already declared" 방지)
   ============================================ */

(function () {
const KEYS = window.CafeData.STORAGE_KEYS;

/* ⚠️ 관리자 키 — 진짜 보안이 아니다.
   이 JS 는 브라우저에 그대로 내려가므로 아래 값도 누구나 소스에서 볼 수 있다.
   손님이 관리자 화면에 "실수로" 들어가는 것을 막는 UX 장치일 뿐이며,
   마음먹은 사람은 얼마든지 우회할 수 있다.
   키 리터럴이 여기저기 흩어지지 않도록 requireAdmin() 안에서만 쓴다. */
const ADMIN_KEY = "eastsea2026";

/* ============================================
   포맷
   ============================================ */

/** 6,000원 형태의 통화 문자열 */
function formatPrice(value) {
  return (Number(value) || 0).toLocaleString("ko-KR") + "원";
}

/** 2026. 07. 10 형태의 날짜 */
function formatDate(input) {
  const d = input instanceof Date ? input : new Date(input);
  if (isNaN(d)) return "";
  return `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, "0")}. ${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/** 2026. 07. 10 14:30 형태의 날짜+시간 */
function formatDateTime(input) {
  const d = input instanceof Date ? input : new Date(input);
  if (isNaN(d)) return "";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${formatDate(d)} ${hh}:${mm}`;
}

/* ============================================
   DOM 헬퍼
   ============================================ */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** 위험 문자 이스케이프 (사용자 입력을 innerHTML 로 렌더할 때 필수) */
function escapeHtml(str) {
  return String(str ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c]
  );
}

/** URL 쿼리 파라미터 값 (?id=m-wave-soda → getParam("id")) */
function getParam(name) {
  return new URLSearchParams(location.search).get(name);
}

/* ============================================
   토스트
   ============================================ */

function showToast(message, type = "default", duration = 2200) {
  let container = $(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.className = "toast" + (type !== "default" ? ` toast--${type}` : "");
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = "opacity .3s, transform .3s";
    toast.style.opacity = "0";
    toast.style.transform = "translateY(8px)";
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/* ============================================
   장바구니
   구조: [{ menuId, qty }]
   ============================================ */

function getCart() {
  return JSON.parse(localStorage.getItem(KEYS.CART)) || [];
}

function saveCart(cart) {
  localStorage.setItem(KEYS.CART, JSON.stringify(cart));
  updateCartBadges();
}

/** 이미 담긴 메뉴면 수량만 증가 */
function addToCart(menuId, qty = 1) {
  const cart = getCart();
  const item = cart.find((i) => i.menuId === menuId);
  if (item) {
    item.qty += qty;
  } else {
    cart.push({ menuId, qty });
  }
  saveCart(cart);
  return cart;
}

/** 수량 직접 지정 (최소 1) */
function updateCartQty(menuId, qty) {
  const cart = getCart();
  const item = cart.find((i) => i.menuId === menuId);
  if (!item) return cart;
  item.qty = Math.max(1, qty);
  saveCart(cart);
  return cart;
}

function removeFromCart(menuId) {
  const cart = getCart().filter((i) => i.menuId !== menuId);
  saveCart(cart);
  return cart;
}

function clearCart() {
  localStorage.removeItem(KEYS.CART);
  updateCartBadges();
}

/** 장바구니 총 수량 (삭제된 메뉴는 getCartDetail 이 걸러낸 count 를 재사용) */
function getCartCount() {
  return getCartDetail().count;
}

/** 메뉴 정보를 조인한 상세 라인 + 합계 반환 (삭제된 메뉴는 제외) */
function getCartDetail() {
  const items = getCart()
    .map((i) => {
      const menu = window.CafeData.getMenuById(i.menuId);
      if (!menu) return null;
      return { ...i, menu, lineTotal: menu.price * i.qty };
    })
    .filter(Boolean);
  const total = items.reduce((sum, i) => sum + i.lineTotal, 0);
  return { items, total, count: items.reduce((s, i) => s + i.qty, 0) };
}

/** [data-cart-badge] 요소에 현재 수량을 반영 (0이면 숨김) */
function updateCartBadges() {
  const count = getCartCount();
  $$("[data-cart-badge]").forEach((el) => {
    el.textContent = count;
    el.hidden = count === 0;
  });
}

/* ============================================
   주문
   구조: { id, items:[{menuId,name,price,qty}], total, status, createdAt }
   상태 흐름: pending(접수 대기) → making(제조 중) → done(완료)
              └ canceled(취소됨)
   ============================================ */

const ORDER_STATUS = {
  pending: { label: "접수 대기", color: "warning" },
  making: { label: "제조 중", color: "info" },
  done: { label: "완료", color: "success" },
  canceled: { label: "취소됨", color: "danger" },
};

function getOrders() {
  return JSON.parse(localStorage.getItem(KEYS.ORDERS)) || [];
}

function saveOrders(orders) {
  localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
}

function getOrderById(id) {
  return getOrders().find((o) => o.id === id) || null;
}

/** 같은 ms 안에 만든 주문끼리 id 가 겹치지 않게 붙이는 순차 카운터.
   새로고침하면 0 으로 리셋되지만, 한 세션에서 연속 생성되는 주문의 유일성은 보장된다. */
let orderSeq = 0;

/** 현재 장바구니를 주문으로 확정. 성공 시 주문 객체 반환, 빈 카트면 null */
function checkout() {
  const { items, total } = getCartDetail();
  if (items.length === 0) return null;
  const order = {
    id: "o-" + Date.now().toString(36) + "-" + orderSeq++,
    items: items.map((i) => ({
      menuId: i.menuId,
      name: i.menu.name,
      price: i.menu.price,
      qty: i.qty,
    })),
    total,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  const orders = getOrders();
  orders.unshift(order); // 최신 주문이 위로
  saveOrders(orders);
  clearCart();
  return order;
}

/** 주문 상태 변경 (관리자) */
function updateOrderStatus(id, status) {
  const orders = getOrders();
  const order = orders.find((o) => o.id === id);
  if (!order) return null;
  order.status = status;
  saveOrders(orders);
  return order;
}

/* ============================================
   사용자
   ============================================ */

function getUser() {
  return (
    JSON.parse(localStorage.getItem(KEYS.USER)) || {
      name: "손님",
      point: 0,
      stamp: 0,
    }
  );
}

function saveUser(user) {
  localStorage.setItem(KEYS.USER, JSON.stringify(user));
  return user;
}

/* ============================================
   즐겨찾기(찜)
   구조: ["m-wave-soda", ...]  (menuId 문자열 배열)

   ⚠️ data.js 의 STORAGE_KEYS 에는 찜 키가 없고 data.js 는 수정 금지이므로,
      "cafe.favorites" 리터럴을 여기서만 쓴다 (다른 파일로 흩어지지 않게).
   ============================================ */

const FAVORITES_KEY = "cafe.favorites";

/** 찜한 menuId 배열 (없거나 값이 깨져 있으면 빈 배열) */
function getFavorites() {
  try {
    const list = JSON.parse(localStorage.getItem(FAVORITES_KEY));
    // 저장값이 배열이 아닌 경우(수동 조작 등)에도 화면이 깨지지 않게 막는다
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function saveFavorites(list) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
  return list;
}

/** 이 메뉴가 찜되어 있는가 */
function isFavorite(menuId) {
  return getFavorites().includes(menuId);
}

/** 찜 토글 — 토글 뒤의 상태를 반환한다 (true = 찜됨) */
function toggleFavorite(menuId) {
  const list = getFavorites();
  const i = list.indexOf(menuId);

  if (i >= 0) {
    list.splice(i, 1);
    saveFavorites(list);
    return false; // 해제됨
  }

  list.push(menuId);
  saveFavorites(list);
  return true; // 찜됨
}

/**
 * 찜한 메뉴의 실제 메뉴 객체 배열.
 * 사장님이 지운 메뉴(getMenuById 가 null)는 걸러낸다.
 * (getCartDetail 이 삭제된 메뉴를 거르는 것과 같은 방어 패턴)
 */
function getFavoriteMenus() {
  return getFavorites()
    .map((id) => window.CafeData.getMenuById(id))
    .filter(Boolean);
}

/* ============================================
   재사용 컴포넌트 마크업
   ============================================ */

/** 하트(찜) 버튼 — 호출: favButtonHtml(menuId) · 찜 여부에 따라 ❤️/🤍 */
function favButtonHtml(menuId) {
  const on = isFavorite(menuId);
  return `
    <button class="fav-btn${on ? " fav-btn--on" : ""}"
            type="button"
            data-fav="${escapeHtml(menuId)}"
            aria-pressed="${on}"
            aria-label="${on ? "찜 해제" : "찜하기"}"
            title="${on ? "찜 해제" : "찜하기"}">
      <span aria-hidden="true">${on ? "❤️" : "🤍"}</span>
    </button>`;
}

/* --------------------------------------------
   빈 상태(.empty-state) 일러스트

   바다 모티브 라인아트 3종. 상황에 맞게 골라 쓴다.
   - shell  : 빈 조개  → "담긴 게 없다" (장바구니 · 찜)
   - bottle : 물결 위 유리병 → "아직 기록이 없다" (주문 내역 · 최근 주문)
   - net    : 빈 그물  → "찾았지만 안 잡혔다" (검색·필터 결과 없음 · 못 찾음)

   ⚠️ 스타일을 인라인으로 둔 이유:
      헤더처럼 클래스로 빼면 콜로케이션 규약상 9개 페이지 CSS 에 전부 복제된다.
      일러스트를 이 파일 한 곳에만 두기 위해 색·크기를 인라인으로 지정한다.
      색은 variables.css 변수만 쓴다 (새 hex 없음).
   -------------------------------------------- */

const EMPTY_ART = {
  // 모래 위에 놓인 빈 조개
  shell: `
    <path d="M80 32 C 52 32, 32 56, 32 80 L 128 80 C 128 56, 108 32, 80 32 Z" />
    <path d="M80 32 L 80 80 M 61 37 L 49 80 M 99 37 L 111 80 M 46 50 L 36 80 M 114 50 L 124 80" />
    <path d="M32 80 L 128 80" style="stroke: var(--sea-teal)" />
    <path d="M18 96 C 44 89, 68 101, 92 94 C 112 88, 130 96, 146 93"
          style="stroke: var(--sea-sky)" />`,

  // 물결 위를 떠다니는 유리병 (메시지를 기다리는 중)
  bottle: `
    <path d="M71 22 h18 v14 l8 13 v31 a7 7 0 0 1 -7 7 h-20 a7 7 0 0 1 -7 -7 v-31 l8 -13 z" />
    <path d="M71 22 h18" style="stroke: var(--sea-teal)" />
    <path d="M69 60 h22 M 69 70 h14" style="stroke: var(--sea-sky)" />
    <path d="M14 98 C 32 88, 50 108, 68 98 C 86 88, 104 108, 122 98 C 132 92, 140 96, 148 99"
          style="stroke: var(--sea-teal)" />
    <path d="M14 110 C 32 100, 50 118, 68 110 C 86 100, 104 118, 122 110 C 132 105, 140 108, 148 111"
          style="stroke: var(--sea-sky)" />`,

  // 아무것도 걸리지 않은 빈 그물
  net: `
    <path d="M34 28 L 126 28" style="stroke: var(--sea-teal)" />
    <path d="M44 28 C 44 68, 62 96, 80 96 C 98 96, 116 68, 116 28" />
    <path d="M54 44 L 106 44 M 49 60 L 111 60 M 57 76 L 103 76"
          style="stroke: var(--sea-sky)" />
    <path d="M64 30 L 69 90 M 80 30 L 80 96 M 96 30 L 91 90"
          style="stroke: var(--sea-sky)" />
    <path d="M80 106 C 76 110, 76 116, 80 116 C 84 116, 84 110, 80 106 Z"
          style="stroke: var(--sea-aqua)" />`,
};

/** 일러스트 한 장 (장식이므로 스크린리더에서 감춘다) */
function emptyArtHtml(type) {
  const art = EMPTY_ART[type] || EMPTY_ART.shell;
  return `
    <svg viewBox="0 0 160 125" width="150" height="117"
         aria-hidden="true" focusable="false" fill="none"
         style="display: block; margin: 0 auto var(--space-md); max-width: 100%;
                stroke: var(--sea-aqua); stroke-width: 2;
                stroke-linecap: round; stroke-linejoin: round;">
      ${art}
    </svg>`;
}

/**
 * 빈 상태 내용물 — 일러스트 + 문구(+ 선택적 버튼).
 * 바깥 래퍼(<div class="empty-state">)는 페이지마다 클래스가 달라서(card / grid-column 등)
 * 각 페이지가 그대로 유지하고, 이 함수는 그 **안쪽 내용**만 만들어 준다.
 *
 * @param {"shell"|"bottle"|"net"} iconType 일러스트 종류
 * @param {string} title   굵은 첫 줄 (이스케이프됨)
 * @param {string} message 회색 보조 문구 (이스케이프됨)
 * @param {string} [actionHtml] 버튼/링크 마크업 (페이지가 만든 신뢰된 HTML — 이스케이프하지 않음)
 */
function emptyStateHtml(iconType, title, message, actionHtml) {
  return `
    ${emptyArtHtml(iconType)}
    <p>${escapeHtml(title)}</p>
    <p class="text-muted">${escapeHtml(message)}</p>
    ${actionHtml ? `<p style="margin-top: var(--space-lg);">${actionHtml}</p>` : ""}`;
}

/** 수량 스텝퍼 — 호출: qtyStepperHtml(menuId, qty) */
function qtyStepperHtml(id, qty) {
  return `
    <div class="qty-stepper" data-qty-stepper="${id}">
      <button class="qty-stepper__btn" data-qty-dec aria-label="수량 감소">−</button>
      <span class="qty-stepper__value" data-qty-value>${qty}</span>
      <button class="qty-stepper__btn" data-qty-inc aria-label="수량 증가">+</button>
    </div>`;
}

/** 주문 상태 칩 — 호출: statusChipHtml("making") */
function statusChipHtml(status) {
  const meta = ORDER_STATUS[status];
  if (!meta) return "";
  return `<span class="chip chip--${meta.color}">${meta.label}</span>`;
}

/* ============================================
   관리자 진입 가드 (sessionStorage 세션 기반)
   ⚠️ 다시 강조: 진짜 인증이 아니라 실수 방지용 UX 장치다.

   흐름:
     - 관리자 페이지끼리 이동 → 세션 플래그가 살아 있어 묻지 않고 통과.
     - **손님 페이지를 한 번이라도 거치면** js/header.js 가 플래그를 지운다.
       (header.js 는 손님 7개 페이지만 로드하고 관리자 페이지는 로드하지 않는다)
       → 손님을 거쳐 관리자로 들어가면 반드시 키를 다시 묻는다.
     - 탭을 닫으면 sessionStorage 가 비므로 다음에 또 묻는다.
   ============================================ */

/**
 * 관리자 페이지 진입을 허용할지 판단한다. 모든 관리자 페이지 JS 최상단에서 호출한다.
 * - 이 세션에서 이미 통과했으면 묻지 않고 바로 통과한다.
 * - 아니면 키를 묻는다. 맞으면 세션에 표시하고 통과,
 *   취소·오답이면 손님 홈으로 돌려보내고 false 를 반환한다.
 *   (오답일 때만 토스트로 안내하고, 취소는 조용히 보낸다)
 *
 * @param {string} homePath 인증 실패 시 돌아갈 손님 홈 경로 (호출 파일 기준 상대경로)
 * @returns {boolean} 통과하면 true, 막히면 false (호출부는 false 면 즉시 return 할 것)
 */
function requireAdmin(homePath) {
  // 이미 이 세션에서 관리자 인증을 통과했으면 다시 묻지 않는다.
  // (관리자 페이지 사이를 오갈 때는 계속 통과)
  try {
    if (sessionStorage.getItem("cafe.adminAuthed") === "true") return true;
  } catch (e) {
    /* sessionStorage 못 쓰는 환경이면 아래로 진행해 매번 묻는다 */
  }

  const input = prompt("관리자 키를 입력하세요");

  if (input === ADMIN_KEY) {
    // 인증 성공 → 세션에 저장. 손님 페이지를 방문하면 header.js 가 이 값을 지운다.
    try {
      sessionStorage.setItem("cafe.adminAuthed", "true");
    } catch (e) {
      /* 저장 못 해도 통과는 시킨다 (이 페이지 한정) */
    }
    return true;
  }

  // 틀린 경우에만 안내한다 (취소(null)는 조용히 돌려보낸다)
  if (input !== null) {
    showToast("관리자 키가 올바르지 않습니다.", "danger");
  }
  location.href = homePath;
  return false;
}

/* ============================================
   애니메이션 켜기/끄기 (사용자 토글)

   저장: localStorage "cafe.motionOff" ("true" = 사용자가 껐다)
   적용: <html> 에 .reduce-motion 클래스 → variables.css 의 전역 규칙이
         모든 animation/transition 을 0.01ms 로 만든다.
         utils.js 는 전 페이지 공통이므로, 아래 initMotion() 을 로드 즉시 호출해
         **모든 페이지에서 자동으로** 저장된 설정이 반영된다.

   ⚠️ 기기 설정(prefers-reduced-motion: reduce)을 켠 사용자는
      localStorage 에 아무것도 없어도 이미 애니메이션이 꺼져 있다 (미디어쿼리가 처리).
      버튼의 표시 상태는 **localStorage 값 기준**이라, 그런 사용자에게는
      버튼이 "끄기"로 보여도 실제로는 이미 꺼져 있을 수 있다.
      (기기 설정을 코드로 뒤집지 않는 게 맞으므로 의도한 동작이다)
   ============================================ */

const MOTION_OFF_KEY = "cafe.motionOff";

/** 사용자가 직접 끈 상태인가 (기기 설정과는 별개) */
function isMotionOff() {
  try {
    return localStorage.getItem(MOTION_OFF_KEY) === "true";
  } catch (e) {
    return false; // localStorage 를 못 쓰는 환경이면 켜진 것으로 본다
  }
}

/** 저장된 설정을 <html> 클래스에 반영한다 (페이지 로드 시 자동 실행) */
function initMotion() {
  document.documentElement.classList.toggle("reduce-motion", isMotionOff());
}

/** 애니메이션을 켜고 끈다. 토글 뒤의 상태를 반환한다 (true = 꺼짐) */
function toggleMotion() {
  const off = !isMotionOff();

  try {
    localStorage.setItem(MOTION_OFF_KEY, off ? "true" : "false");
  } catch (e) {
    /* 저장을 못 해도 이 페이지에서는 아래 클래스 반영으로 즉시 적용된다 */
  }

  document.documentElement.classList.toggle("reduce-motion", off);
  return off;
}

// 저장된 설정을 즉시 반영한다. (defer 로 로드되므로 <html> 은 이미 존재한다)
// DOMContentLoaded 를 기다리지 않아야 애니메이션이 잠깐 튀지 않는다.
initMotion();

/* ============================================
   전역 노출
   ============================================ */

window.CafeUtils = {
  // 포맷
  formatPrice,
  formatDate,
  formatDateTime,
  // DOM
  $,
  $$,
  escapeHtml,
  getParam,
  // 토스트
  showToast,
  // 장바구니
  getCart,
  addToCart,
  updateCartQty,
  removeFromCart,
  clearCart,
  getCartCount,
  getCartDetail,
  updateCartBadges,
  // 주문
  ORDER_STATUS,
  getOrders,
  getOrderById,
  checkout,
  updateOrderStatus,
  // 사용자
  getUser,
  saveUser,
  // 관리자 진입 가드 (세션 단위 · 실수 방지용)
  requireAdmin,
  // 애니메이션 켜기/끄기
  isMotionOff,
  toggleMotion,
  initMotion,
  // 즐겨찾기(찜)
  getFavorites,
  isFavorite,
  toggleFavorite,
  getFavoriteMenus,
  // 컴포넌트
  qtyStepperHtml,
  statusChipHtml,
  favButtonHtml,
  emptyStateHtml,
};

// 페이지 로드 시 장바구니 배지 동기화
document.addEventListener("DOMContentLoaded", updateCartBadges);
})();
