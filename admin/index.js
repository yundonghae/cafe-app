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

  /* 🔐 간단한 진입 제한 (실수 방지용 UX — 진짜 보안이 아니다).
     🔐 버튼(checkAdminAccess)을 거치지 않고 주소창에 직접 admin/index.html 을
     친 경우를 대비해, 대시보드를 그리기 전에 관리자 여부를 한 번 더 확인한다.
     하위 관리자 페이지까지 매번 묻지 않도록, 이 대시보드 진입 시점에서만 검사한다. */
  if (localStorage.getItem("cafe.isAdmin") !== "true") {
    // 키가 맞으면 이 페이지로 재진입(리로드)하고, 틀리면 checkAdminAccess 가 토스트만 띄운다.
    // 키를 utils.js 한 곳에만 두기 위해 여기서 직접 비교하지 않고 checkAdminAccess 를 재사용한다.
    window.CafeUtils.checkAdminAccess("index.html");
    // 리로드가 걸리지 않았다면(취소·오답) 여전히 비인가 상태이므로 손님 홈으로 돌려보낸다.
    if (localStorage.getItem("cafe.isAdmin") !== "true") {
      location.href = "../index.html";
    }
    return; // 어느 쪽이든 이번 로드에서는 대시보드를 그리지 않는다
  }

  // 다른 관리자 페이지가 남긴 안내 메시지를 이어받아 표시한다
  const flash = sessionStorage.getItem("cafe.flash");
  if (flash) {
    sessionStorage.removeItem("cafe.flash");
    window.CafeUtils.showToast(flash, "success");
  }

  renderStats();
  renderRecent();
})();
