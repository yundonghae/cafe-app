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
   관리자 진입 가드 (referrer 기반)
   ⚠️ 다시 강조: 진짜 인증이 아니라 실수 방지용 UX 장치다.
   인증 상태를 어디에도 저장하지 않고, "직전 페이지가 어디였나" 로만 판단한다.
   ============================================ */

/**
 * 직전 페이지(document.referrer)가 "같은 사이트의 관리자 페이지" 였는지 판단한다.
 * 외부 사이트 주소에 우연히 admin 이 들어 있을 수 있으므로,
 * 경로에 "/admin/" 이 있는지와 **출처(origin)가 현재 사이트와 같은지** 를 함께 본다.
 */
function isFromAdminPage() {
  const ref = document.referrer;
  // 주소창 직접 입력 · 새 탭 · referrer 미전송 → 관리자 내부 이동이 아니다
  if (!ref) return false;

  try {
    const url = new URL(ref);
    // 출처가 다르면(외부 사이트) 경로에 admin 이 있어도 절대 통과시키지 않는다
    if (url.origin !== location.origin) return false;
    return url.pathname.includes("/admin/");
  } catch {
    return false; // 파싱할 수 없는 referrer 는 안전하게 거부한다
  }
}

/**
 * 관리자 페이지 진입을 허용할지 판단한다. 모든 관리자 페이지 JS 최상단에서 호출한다.
 * - 직전 페이지가 같은 사이트의 관리자 페이지면 → 관리자 내부 이동으로 보고 묻지 않고 통과.
 * - 그 외(손님 페이지 · 외부 · 빈 referrer)면 → 키를 묻는다.
 *   맞으면 통과, 취소·오답이면 손님 홈으로 돌려보내고 false 를 반환한다.
 *   (오답일 때만 토스트로 안내하고, 취소는 조용히 보낸다)
 *
 * 인증 상태를 어디에도 저장하지 않으므로(sessionStorage · localStorage 미사용),
 * 손님 페이지에서 관리자로 넘어올 때는 **매번** 키를 묻는다.
 *
 * @param {string} homePath 인증 실패 시 돌아갈 손님 홈 경로 (호출 파일 기준 상대경로)
 * @returns {boolean} 통과하면 true, 막히면 false (호출부는 false 면 즉시 return 할 것)
 */
function requireAdmin(homePath) {
  if (isFromAdminPage()) return true; // 관리자 → 관리자 이동은 묻지 않는다

  const input = prompt("관리자 키를 입력하세요");

  if (input === ADMIN_KEY) return true;

  // 틀린 경우에만 안내한다 (취소(null)는 조용히 돌려보낸다)
  if (input !== null) {
    showToast("관리자 키가 올바르지 않습니다.", "danger");
  }
  location.href = homePath;
  return false;
}

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
  // 즐겨찾기(찜)
  getFavorites,
  isFavorite,
  toggleFavorite,
  getFavoriteMenus,
  // 컴포넌트
  qtyStepperHtml,
  statusChipHtml,
  favButtonHtml,
};

// 페이지 로드 시 장바구니 배지 동기화
document.addEventListener("DOMContentLoaded", updateCartBadges);
})();
