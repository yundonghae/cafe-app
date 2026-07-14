/* ============================================
   🌊 고객 - 주문 상세 (detail.html)
   ?id=<주문 ID> 쿼리로 단일 주문을 조회한다.
   접수 대기(pending) 상태의 주문만 고객이 취소할 수 있다.
   ============================================ */

(function () {
  const {
    $,
    getParam,
    formatPrice,
    formatDateTime,
    escapeHtml,
    showToast,
    getOrderById,
    updateOrderStatus,
    statusChipHtml,
    ORDER_STATUS,
    emptyStateHtml,
  } = window.CafeUtils;

  const root = $("[data-detail]");
  const id = getParam("id");

  /** 고객이 스스로 취소할 수 있는 상태 (제조가 시작되면 취소 불가) */
  const CANCELABLE = "pending";

  /* ============================================
     렌더
     ============================================ */

  /** 주문을 찾지 못했을 때 (2·3단계 renderNotFound 패턴과 동일) */
  function renderNotFound() {
    root.innerHTML = `
      <div class="card empty-state">
        ${emptyStateHtml(
          "net", // 빈 그물 — 찾았지만 걸리지 않았다
          "찾으시는 주문이 해류에 휩쓸려 사라졌습니다.",
          "이미 지워졌거나 잘못된 주소일 수 있습니다.",
          `<a class="btn btn--primary" href="./list.html">주문 내역 보러 가기</a>`
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

  /* ============================================
     주문 진행 바 (접수 → 제조중 → 완료)
     ============================================ */

  /**
   * 정상 진행 흐름. **배열의 순서가 곧 진행 단계**다.
   * 값은 utils.js 의 ORDER_STATUS 키를 그대로 쓴다 (상태 흐름 자체는 건드리지 않는다).
   * canceled 는 정상 흐름에서 벗어난 상태라 여기 넣지 않는다.
   */
  const FLOW = ["pending", "making", "done"];

  /**
   * 진행 바 마크업.
   *
   * 단계 판정: 현재 status 가 FLOW 의 **몇 번째 인덱스**인지로만 정한다.
   *   current = FLOW.indexOf(order.status)
   *   - i <  current → 이미 지나온 단계 (채움 + ✓)
   *   - i === current → 지금 단계      (채움 + 물빛 강조 + aria-current)
   *   - i >  current → 아직 안 온 단계 (빈 원 + 회색 선)
   * 연결선은 "그 단계에 도달했는가"로 칠하므로 CSS 에서 done/now 단계의 왼쪽 선만 색칠한다.
   */
  function progressHtml(order) {
    // 취소는 흐름 밖이라 스텝퍼에 억지로 끼우지 않고 별도 안내로 대체한다
    if (order.status === "canceled") {
      return `
        <div class="card order-progress order-progress--canceled" role="status">
          <span class="order-progress__cancel-icon" aria-hidden="true">✕</span>
          <div>
            <p class="order-progress__cancel-title">주문이 취소되었습니다.</p>
            <p class="order-progress__cancel-note">
              취소된 주문은 되돌릴 수 없습니다. 새로 주문해 주세요.
            </p>
          </div>
        </div>`;
    }

    const current = FLOW.indexOf(order.status);
    // 흐름에 없는 값(사장님이 임의 상태를 넣은 경우)이면 억지로 그리지 않는다 — 상태 칩은 그대로 뜬다
    if (current < 0) return "";

    const steps = FLOW.map((key, i) => {
      const label = ORDER_STATUS[key] ? ORDER_STATUS[key].label : key;

      const passed = i < current; // 지나온 단계
      const isNow = i === current; // 지금 단계
      const state = passed ? "done" : isNow ? "now" : "todo";

      // 색만으로 구분하지 않는다 — 지나온 단계는 ✓, 나머지는 단계 번호
      const mark = passed ? "✓" : String(i + 1);
      // 스크린리더에는 상태를 말로 알려 준다
      const srState = passed ? "완료됨" : isNow ? "진행 중" : "대기";

      return `
        <li class="order-progress__step order-progress__step--${state}"
            ${isNow ? 'aria-current="step"' : ""}>
          <span class="order-progress__dot" aria-hidden="true">${mark}</span>
          <span class="order-progress__label">${escapeHtml(label)}</span>
          <span class="sr-only">(${srState})</span>
        </li>`;
    }).join("");

    return `
      <ol class="card order-progress" aria-label="주문 진행 상태">
        ${steps}
      </ol>`;
  }

  function renderDetail(order) {
    const cancelable = order.status === CANCELABLE;

    // 접수 대기가 아니면 취소 버튼 대신 이유를 알려 준다
    const statusLabel = ORDER_STATUS[order.status]
      ? ORDER_STATUS[order.status].label
      : order.status;

    const cancelArea = cancelable
      ? `<button class="btn btn--danger" data-cancel>주문 취소</button>`
      : `<p class="order-actions__note">
           '${escapeHtml(statusLabel)}' 상태의 주문은 취소할 수 없습니다.
         </p>`;

    root.innerHTML = `
      <div class="order-detail">
        <!-- 주문 개요 -->
        <div class="card order-head">
          <div>
            <h2 class="order-head__id">${escapeHtml(order.id)}</h2>
            <p class="order-head__date">${escapeHtml(formatDateTime(order.createdAt))}</p>
          </div>
          <div class="order-head__status">
            ${statusChipHtml(order.status)}
          </div>
        </div>

        <!-- 진행 바 (접수 → 제조중 → 완료 / 취소면 취소 안내) -->
        ${progressHtml(order)}

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

        <!-- 하단 동작 -->
        <div class="order-actions">
          <a class="btn btn--outline" href="./list.html">← 주문 내역으로</a>
          ${cancelArea}
        </div>
      </div>`;
  }

  /* ============================================
     이벤트 (다시 그려도 동작하도록 위임 사용)
     ============================================ */

  root.addEventListener("click", (e) => {
    if (!e.target.closest("[data-cancel]")) return;

    // 화면을 띄운 뒤 사장님이 상태를 바꿨을 수도 있으니 저장된 값을 다시 확인한다
    const current = getOrderById(id);
    if (!current) {
      renderNotFound();
      return;
    }
    if (current.status !== CANCELABLE) {
      showToast("이미 제조가 시작되어 취소할 수 없습니다.", "warning");
      renderDetail(current);
      return;
    }

    // 취소는 되돌릴 수 없으므로 항상 confirm 후 실행한다
    if (!confirm(`주문 ${current.id} 을(를) 취소할까요?`)) return;

    const canceled = updateOrderStatus(current.id, "canceled");
    if (!canceled) {
      showToast("주문을 찾을 수 없습니다.", "danger");
      return;
    }

    showToast("주문을 취소했습니다.", "warning");
    renderDetail(canceled);
  });

  /* ============================================
     초기화
     ============================================ */

  // 다른 페이지(basket/list.js 등)가 남긴 안내 메시지를 이어받아 표시한다
  const flash = sessionStorage.getItem("cafe.flash");
  if (flash) {
    sessionStorage.removeItem("cafe.flash");
    showToast(flash, "success");
  }

  const order = id ? getOrderById(id) : null;
  if (order) {
    document.title = `주문 ${order.id} · 동해 카페`;
    renderDetail(order);
  } else {
    renderNotFound();
  }
})();
