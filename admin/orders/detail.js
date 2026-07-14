/* ============================================
   🌊 관리자 - 주문 상세 (detail.html)
   ?id=<주문 ID> 쿼리로 단일 주문을 조회하고 상태를 바꾼다.
   현재 상태에서 갈 수 있는 상태로만 전환 버튼을 노출한다.
   ============================================ */

(function () {
  // 🔐 관리자 세션 가드 — 다른 로직보다 먼저. 통과 못 하면 렌더하지 않고 즉시 빠져나간다.
  if (!window.CafeUtils.requireAdmin("../../index.html")) return;

  const {
    $,
    getParam,
    formatPrice,
    formatDateTime,
    escapeHtml,
    showToast,
    getOrderById,
    updateOrderStatus,
    ORDER_STATUS,
    statusChipHtml,
    emptyStateHtml,
  } = window.CafeUtils;

  const root = $("[data-detail]");
  const id = getParam("id");

  /**
   * 상태 전이표 — 현재 상태에서 갈 수 있는 상태만 나열한다.
   * done · canceled 는 종착 상태라 더 이상 바꿀 수 없다.
   * (utils.js 의 updateOrderStatus 는 아무 값이나 받으므로 검증은 이쪽 책임이다)
   */
  const TRANSITIONS = {
    pending: ["making", "canceled"],
    making: ["done", "canceled"],
    done: [],
    canceled: [],
  };

  /** 전이 버튼의 문구와 색 (취소만 위험한 동작이라 danger) */
  const ACTION = {
    making: { label: "제조 시작", variant: "btn--primary" },
    done: { label: "완료 처리", variant: "btn--primary" },
    canceled: { label: "주문 취소", variant: "btn--danger" },
  };

  /** 되돌릴 수 없어 confirm 이 필요한 전이 */
  const NEEDS_CONFIRM = ["canceled"];

  /* ============================================
     렌더
     ============================================ */

  /** 주문을 찾지 못했을 때 (2단계 renderNotFound 패턴과 동일) */
  function renderNotFound() {
    root.innerHTML = `
      <div class="card empty-state">
        ${emptyStateHtml(
          "net", // 빈 그물 — 찾았지만 걸리지 않았다
          "찾으시는 주문이 해류에 휩쓸려 사라졌습니다.",
          "이미 지워졌거나 잘못된 주소일 수 있습니다.",
          `<a class="btn btn--primary" href="./list.html">주문 목록 보러 가기</a>`
        )}
      </div>`;
  }

  /** 메뉴 한 줄 — 이름 · 단가 · 수량 · 소계 (주문 시점의 스냅샷 값) */
  function itemRowHtml(item) {
    return `
      <tr>
        <td class="order-table__name">${escapeHtml(item.name)}</td>
        <td>${formatPrice(item.price)}</td>
        <td>${item.qty}개</td>
        <td class="order-table__subtotal">${formatPrice(item.price * item.qty)}</td>
      </tr>`;
  }

  /** 상태 변경 패널 — 갈 수 있는 상태가 없으면 안내 문구만 */
  function statusPanelHtml(order) {
    const nextList = TRANSITIONS[order.status] || [];

    const body =
      nextList.length === 0
        ? `<p class="status-panel__note">
             '${escapeHtml(ORDER_STATUS[order.status].label)}' 은(는) 마지막 상태입니다.
             더 이상 변경할 수 없습니다.
           </p>`
        : `<div class="status-panel__actions">
             ${nextList
               .map((next) => {
                 const action = ACTION[next];
                 return `<button class="btn ${action.variant}"
                           data-to="${escapeHtml(next)}">${escapeHtml(action.label)}</button>`;
               })
               .join("")}
           </div>`;

    return `
      <div class="card status-panel">
        <h3 class="status-panel__title">상태 변경</h3>
        <p class="status-panel__now">
          <span>현재 상태</span>
          ${statusChipHtml(order.status)}
        </p>
        ${body}
      </div>`;
  }

  function renderDetail(order) {
    root.innerHTML = `
      <div class="order-detail">
        <!-- 주문 개요 -->
        <div class="card order-head">
          <div>
            <h2 class="order-head__id">${escapeHtml(order.id)}</h2>
            <p class="order-head__date">${escapeHtml(formatDateTime(order.createdAt))}</p>
          </div>
          ${statusChipHtml(order.status)}
        </div>

        <!-- 담긴 메뉴 내역 -->
        <div class="card order-items">
          <h3 class="order-items__title">주문 내역</h3>
          <div class="order-table__scroll">
            <table class="order-table">
              <thead>
                <tr>
                  <th scope="col">메뉴</th>
                  <th scope="col">단가</th>
                  <th scope="col">수량</th>
                  <th scope="col">소계</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map(itemRowHtml).join("")}
              </tbody>
              <tfoot>
                <tr>
                  <td class="order-table__total-label" colspan="3">총 결제 금액</td>
                  <td class="order-table__total-value">${formatPrice(order.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <!-- 상태 변경 -->
        ${statusPanelHtml(order)}

        <!-- 하단 링크 -->
        <div class="order-actions">
          <a class="btn btn--outline" href="./list.html">← 주문 목록으로</a>
        </div>
      </div>`;
  }

  /* ============================================
     이벤트 (다시 그려도 동작하도록 위임 사용)
     ============================================ */

  root.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-to]");
    if (!btn) return;

    const next = btn.dataset.to;

    // 화면을 띄운 뒤 다른 탭에서 상태가 바뀌었을 수 있으니 저장된 값을 다시 읽는다
    const current = getOrderById(id);
    if (!current) {
      renderNotFound();
      return;
    }

    // 화면의 버튼이 아니라 저장된 상태를 기준으로 전이 가능 여부를 판정한다
    const allowed = TRANSITIONS[current.status] || [];
    if (!allowed.includes(next)) {
      showToast(
        `'${ORDER_STATUS[current.status].label}' 에서는 할 수 없는 동작입니다.`,
        "warning"
      );
      renderDetail(current);
      return;
    }

    // 취소는 되돌릴 수 없으므로 항상 confirm 후 실행한다
    if (
      NEEDS_CONFIRM.includes(next) &&
      !confirm(`주문 ${current.id} 을(를) 취소할까요?\n취소한 주문은 되돌릴 수 없습니다.`)
    ) {
      return;
    }

    const updated = updateOrderStatus(current.id, next);
    if (!updated) {
      showToast("주문을 찾을 수 없습니다.", "danger");
      return;
    }

    showToast(
      `${updated.id} → ${ORDER_STATUS[next].label}`,
      next === "canceled" ? "warning" : "success"
    );
    renderDetail(updated);
  });

  /* ============================================
     초기화
     ============================================ */

  const order = id ? getOrderById(id) : null;
  if (order) {
    document.title = `주문 ${order.id} · 동해 카페 관리자`;
    renderDetail(order);
  } else {
    renderNotFound();
  }
})();
