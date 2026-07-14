/* ============================================
   🌊 관리자 - 주문 목록 (list.html)
   CafeUtils 만 사용하고 localStorage 에 직접 접근하지 않는다.
   상태 필터 + 행에서 바로 다음 상태로 넘기는 기능을 제공한다.
   ============================================ */

(function () {
  // 🔐 관리자 세션 가드 — 다른 로직보다 먼저. 통과 못 하면 렌더하지 않고 즉시 빠져나간다.
  if (!window.CafeUtils.requireAdmin("../../index.html")) return;

  const {
    $,
    formatPrice,
    formatDateTime,
    escapeHtml,
    showToast,
    getOrders,
    getOrderById,
    updateOrderStatus,
    ORDER_STATUS,
    statusChipHtml,
    emptyStateHtml,
  } = window.CafeUtils;

  /**
   * 정방향 상태 흐름: pending → making → done
   * 여기 없는 상태(done, canceled)는 더 넘길 곳이 없다는 뜻이다.
   */
  const NEXT_STATUS = {
    pending: "making",
    making: "done",
  };

  /** 다음 상태로 넘기는 버튼에 쓸 문구 */
  const NEXT_LABEL = {
    making: "제조 시작",
    done: "완료 처리",
  };

  /* --- 화면 상태 (상태 필터) --- */
  const state = {
    status: "all",
  };

  const orderBox = $("[data-orders]");
  const filters = $("[data-filters]");

  /* ============================================
     렌더 - 상태 필터 버튼
     (2단계 renderFilters 의 카테고리 버튼 패턴을 그대로 응용)
     ============================================ */

  function renderFilters() {
    const counts = countByStatus(getOrders());

    const items = [
      { id: "all", label: "전체", count: getOrders().length },
      ...Object.keys(ORDER_STATUS).map((key) => ({
        id: key,
        label: ORDER_STATUS[key].label,
        count: counts[key] || 0,
      })),
    ];

    filters.innerHTML = items
      .map((item) => {
        const on = item.id === state.status ? " filter--on" : "";
        return `<button class="btn btn--outline btn--sm filter${on}"
                  data-status="${escapeHtml(item.id)}"
                  aria-pressed="${item.id === state.status}">
                  ${escapeHtml(item.label)} (${item.count})
                </button>`;
      })
      .join("");
  }

  /** 상태별 건수 (없는 상태는 0) */
  function countByStatus(orders) {
    const counts = {};
    orders.forEach((o) => {
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    return counts;
  }

  /* ============================================
     렌더 - 주문 표
     ============================================ */

  /** 현재 필터를 적용한 주문 목록 (getOrders 는 이미 최신순) */
  function getVisibleOrders() {
    const orders = getOrders();
    if (state.status === "all") return orders;
    return orders.filter((o) => o.status === state.status);
  }

  function orderRowHtml(order) {
    const detailUrl = `./detail.html?id=${encodeURIComponent(order.id)}`;
    const next = NEXT_STATUS[order.status];

    // 더 넘길 상태가 없으면(done · canceled) 버튼 대신 자리 표시만 둔다
    const nextButton = next
      ? `<button class="btn btn--primary btn--sm"
                 data-next="${escapeHtml(order.id)}">${escapeHtml(NEXT_LABEL[next])}</button>`
      : `<span class="order-table__done">—</span>`;

    return `
      <tr class="${order.status === "canceled" ? "order-row--canceled" : ""}">
        <td class="order-table__id">
          <a href="${detailUrl}">${escapeHtml(order.id)}</a>
        </td>
        <td class="order-table__date">${escapeHtml(formatDateTime(order.createdAt))}</td>
        <td>${statusChipHtml(order.status)}</td>
        <td class="order-table__amount">${formatPrice(order.total)}</td>
        <td>
          <div class="order-table__actions">
            ${nextButton}
            <a class="btn btn--outline btn--sm" href="${detailUrl}">상세</a>
          </div>
        </td>
      </tr>`;
  }

  function renderOrders() {
    const orders = getVisibleOrders();

    if (orders.length === 0) {
      // 주문 자체가 없는 경우와 필터 결과가 없는 경우를 구분해 안내한다
      const noneAtAll = getOrders().length === 0;
      orderBox.innerHTML = `
        <div class="card empty-state">
          ${emptyStateHtml(
            // 주문 자체가 없으면 "아직 안 왔다"(유리병), 필터 결과가 없으면 "안 걸렸다"(그물)
            noneAtAll ? "bottle" : "net",
            noneAtAll ? "아직 들어온 주문이 없습니다." : "이 상태의 주문이 없습니다.",
            noneAtAll ? "첫 파도를 기다리는 중입니다." : "다른 상태를 골라 보세요."
          )}
        </div>`;
      return;
    }

    orderBox.innerHTML = `
      <div class="card orders">
        <div class="orders__scroll">
          <table class="order-table">
            <thead>
              <tr>
                <th scope="col">주문번호</th>
                <th scope="col">주문 일시</th>
                <th scope="col">상태</th>
                <th scope="col" class="order-table__amount">금액</th>
                <th scope="col"><span class="sr-only">동작</span></th>
              </tr>
            </thead>
            <tbody>
              ${orders.map(orderRowHtml).join("")}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  /** 전체 화면 갱신 (필터의 건수도 함께 바뀐다) */
  function render() {
    renderFilters();
    renderOrders();
  }

  /* ============================================
     이벤트 (다시 그려도 동작하도록 전부 위임으로 처리)
     ============================================ */

  // 상태 필터
  filters.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-status]");
    if (!btn) return;
    state.status = btn.dataset.status;
    render();
  });

  // 다음 상태로 넘기기
  orderBox.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-next]");
    if (!btn) return;

    // 목록을 띄운 뒤 다른 탭/화면에서 상태가 바뀌었을 수 있으니 저장된 값을 다시 읽는다
    const order = getOrderById(btn.dataset.next);
    if (!order) {
      showToast("주문을 찾을 수 없습니다.", "danger");
      render();
      return;
    }

    const next = NEXT_STATUS[order.status];
    if (!next) {
      showToast("더 이상 상태를 바꿀 수 없는 주문입니다.", "warning");
      render();
      return;
    }

    updateOrderStatus(order.id, next);
    showToast(`${order.id} → ${ORDER_STATUS[next].label}`, "success");
    render();
  });

  /* ============================================
     초기화
     ============================================ */

  // 다른 관리자 페이지가 남긴 안내 메시지를 이어받아 표시한다
  const flash = sessionStorage.getItem("cafe.flash");
  if (flash) {
    sessionStorage.removeItem("cafe.flash");
    showToast(flash, "success");
  }

  render();
})();
