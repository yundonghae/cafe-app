/* ============================================
   🌊 고객 - 주문 내역 목록 (list.html)
   CafeUtils 만 사용하고 localStorage 에 직접 접근하지 않는다.
   getOrders() 는 이미 최신순(unshift)으로 저장되어 있어 따로 정렬하지 않는다.
   ============================================ */

(function () {
  const {
    $,
    formatPrice,
    formatDateTime,
    escapeHtml,
    showToast,
    getOrders,
    statusChipHtml,
    emptyStateHtml,
  } = window.CafeUtils;

  const root = $("[data-orders]");

  /** 요약에 이름을 그대로 보여 줄 대표 메뉴 개수 */
  const PREVIEW_COUNT = 2;

  /* ============================================
     렌더
     ============================================ */

  /** 주문이 하나도 없을 때 — 메뉴 목록으로 안내한다 */
  /* 이름이 CafeUtils.emptyStateHtml 과 겹치면 자기 자신을 부르게 되므로 따로 둔다 */
  function emptyOrdersHtml() {
    return `
      <div class="card empty-state">
        ${emptyStateHtml(
          "bottle", // 물결 위 유리병 — 아직 도착한 기록이 없다
          "아직 주문한 내역이 없습니다.",
          "첫 잔을 골라 바다를 담아 보세요.",
          `<a class="btn btn--primary" href="../menus/list.html">메뉴 보러가기</a>`
        )}
      </div>`;
  }

  /**
   * 담긴 메뉴 요약 문구.
   * 대표 메뉴 이름을 최대 2개까지 보여 주고, 나머지는 "외 N건" 으로 접는다.
   * (order.items 는 주문 시점의 스냅샷이라 메뉴가 삭제돼도 이름이 남아 있다)
   */
  function summaryText(items) {
    const names = items.slice(0, PREVIEW_COUNT).map((i) => i.name);
    const rest = items.length - names.length;
    return names.join(", ") + (rest > 0 ? ` 외 ${rest}건` : "");
  }

  function orderCardHtml(order) {
    const detailUrl = `./detail.html?id=${encodeURIComponent(order.id)}`;
    // 주문에 담긴 총 잔 수 (품목 수가 아니라 수량 합계)
    const totalQty = order.items.reduce((sum, i) => sum + i.qty, 0);

    return `
      <article class="card order-card${order.status === "canceled" ? " order-card--canceled" : ""}">
        <div class="order-card__head">
          <div>
            <p class="order-card__id">${escapeHtml(order.id)}</p>
            <p class="order-card__date">${escapeHtml(formatDateTime(order.createdAt))}</p>
          </div>
          ${statusChipHtml(order.status)}
        </div>

        <div class="order-card__summary">
          <span class="badge">${order.items.length}종 · ${totalQty}개</span>
          <span>${escapeHtml(summaryText(order.items))}</span>
        </div>

        <div class="order-card__foot">
          <div>
            <span class="order-card__total-label">총 결제 금액</span>
            <strong class="order-card__total">${formatPrice(order.total)}</strong>
          </div>
          <a class="btn btn--outline btn--sm" href="${detailUrl}">상세 보기</a>
        </div>
      </article>`;
  }

  /** 주문 목록 전체를 다시 그린다 */
  function render() {
    const orders = getOrders();

    if (orders.length === 0) {
      root.innerHTML = emptyOrdersHtml();
      return;
    }

    root.innerHTML = `
      <div class="order-list">
        ${orders.map(orderCardHtml).join("")}
      </div>`;
  }

  /* ============================================
     초기화
     ============================================ */

  // 다른 페이지(basket/list.js 등)가 남긴 안내 메시지를 이어받아 표시한다
  const flash = sessionStorage.getItem("cafe.flash");
  if (flash) {
    sessionStorage.removeItem("cafe.flash");
    showToast(flash, "success");
  }

  render();
})();
