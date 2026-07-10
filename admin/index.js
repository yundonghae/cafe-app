/* ============================================
   🌊 관리자 - 대시보드 (index.html)
   CafeData / CafeUtils 만 사용하고 localStorage 에 직접 접근하지 않는다.
   메뉴·주문 요약 지표와 최근 주문 미리보기를 보여 준다. (읽기 전용 화면)
   ============================================ */

(function () {
  const {
    $,
    formatPrice,
    formatDateTime,
    escapeHtml,
    getOrders,
    ORDER_STATUS,
    statusChipHtml,
  } = window.CafeUtils;
  const { getMenus } = window.CafeData;

  const statusStatsBox = $("[data-status-stats]");
  const recentBox = $("[data-recent]");

  /** 미리보기로 보여 줄 최근 주문 건수 */
  const RECENT_COUNT = 5;

  /** 매출에서 제외할 상태 (취소된 주문은 돈이 들어오지 않았다) */
  const NON_REVENUE = ["canceled"];

  /* ============================================
     집계
     ============================================ */

  /**
   * 주문을 한 번만 순회하며 상태별 건수와 매출을 함께 계산한다.
   * ORDER_STATUS 의 키를 그대로 써서, 나중에 상태가 늘어도 코드를 고칠 필요가 없다.
   */
  function summarize(orders) {
    const byStatus = {};
    Object.keys(ORDER_STATUS).forEach((key) => (byStatus[key] = 0));

    let revenue = 0;
    orders.forEach((o) => {
      // 알 수 없는 상태가 저장돼 있어도 건수 집계가 깨지지 않도록 방어한다
      if (byStatus[o.status] === undefined) byStatus[o.status] = 0;
      byStatus[o.status] += 1;

      if (!NON_REVENUE.includes(o.status)) revenue += Number(o.total) || 0;
    });

    return { byStatus, revenue };
  }

  /* ============================================
     렌더 - 요약 지표
     ============================================ */

  function renderStats() {
    const menus = getMenus();
    const orders = getOrders();
    const { byStatus, revenue } = summarize(orders);

    // textContent 로 넣는 값은 이스케이프가 필요 없다
    $('[data-stat="menus"]').textContent = menus.length;
    $('[data-stat="soldout"]').textContent = menus.filter((m) => m.soldOut).length;
    $('[data-stat="orders"]').textContent = orders.length;
    $('[data-stat="revenue"]').textContent = formatPrice(revenue);

    // 상태별 카드 — 상태 칩을 써야 해서 innerHTML 로 그린다
    statusStatsBox.innerHTML = Object.keys(ORDER_STATUS)
      .map(
        (key) => `
        <div class="card stat">
          <span class="stat__label stat__chip">${statusChipHtml(key)}</span>
          <strong class="stat__value">${byStatus[key] || 0}건</strong>
        </div>`
      )
      .join("");
  }

  /* ============================================
     렌더 - 최근 주문 미리보기
     ============================================ */

  /** 주문 한 줄 (7단계 my/index.js 의 recentItemHtml 과 같은 구조, 링크만 관리자용) */
  function recentItemHtml(order) {
    const detailUrl = `./orders/detail.html?id=${encodeURIComponent(order.id)}`;

    return `
      <a class="recent-item" href="${detailUrl}">
        <div class="recent-item__top">
          <span class="recent-item__id">${escapeHtml(order.id)}</span>
          ${statusChipHtml(order.status)}
        </div>
        <div class="recent-item__bottom">
          <span class="recent-item__date">${escapeHtml(formatDateTime(order.createdAt))}</span>
          <strong class="recent-item__total">${formatPrice(order.total)}</strong>
        </div>
      </a>`;
  }

  function renderRecent() {
    // getOrders() 는 최신순(unshift)으로 저장되어 있어 앞에서 잘라 쓰면 된다
    const orders = getOrders().slice(0, RECENT_COUNT);

    if (orders.length === 0) {
      recentBox.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">🧾</div>
          <p>아직 들어온 주문이 없습니다.</p>
          <p class="text-muted">첫 파도를 기다리는 중입니다.</p>
        </div>`;
      return;
    }

    recentBox.innerHTML = `
      <div class="recent__list">
        ${orders.map(recentItemHtml).join("")}
      </div>`;
  }

  /* ============================================
     초기화
     ============================================ */

  /* 🔐 관리자 진입 관문 — 이 대시보드 한 곳뿐이다 (실수 방지용 UX, 진짜 보안 아님).
     손님 페이지의 🔐 링크도, 주소창 직접 접근도 결국 여기로 오고,
     이 페이지가 로드될 때마다 키를 물어본다. 그래서 프롬프트는 진입당 딱 한 번이다.
     인증 상태를 어디에도 저장하지 않으므로, 새로고침하거나 다시 들어오면 그때마다 다시 묻는다.
     하위 관리자 페이지(메뉴·주문)는 검사하지 않아, 한 번 들어온 뒤에는 자유롭게 오간다.
     ⚠️ 아래 키는 소스에 그대로 노출되는 비밀 아닌 값이다. */
  const adminKey = prompt("관리자 키를 입력하세요");
  if (adminKey !== "eastsea2026") {
    // 취소(null)면 조용히, 오답이면 안내만 하고 — 어느 쪽이든 손님 홈으로 돌려보낸다
    if (adminKey !== null) {
      window.CafeUtils.showToast("관리자 키가 올바르지 않습니다.", "danger");
    }
    location.href = "../index.html";
    return; // 대시보드를 그리지 않는다
  }
  // 키가 맞으면 이동/리로드 없이 그대로 대시보드를 그린다

  // 다른 관리자 페이지가 남긴 안내 메시지를 이어받아 표시한다
  const flash = sessionStorage.getItem("cafe.flash");
  if (flash) {
    sessionStorage.removeItem("cafe.flash");
    window.CafeUtils.showToast(flash, "success");
  }

  renderStats();
  renderRecent();
})();
