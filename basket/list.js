/* ============================================
   🌊 고객 - 장바구니 (list.html)
   CafeUtils 만 사용하고 localStorage 에 직접 접근하지 않는다.
   수량 변경 · 항목 삭제 · 전체 비우기 · 주문하기(checkout) 를 담당한다.
   ============================================ */

(function () {
  const {
    $,
    formatPrice,
    escapeHtml,
    showToast,
    getCartDetail,
    updateCartQty,
    removeFromCart,
    clearCart,
    checkout,
    qtyStepperHtml,
    emptyStateHtml,
  } = window.CafeUtils;

  const root = $("[data-basket]");

  /** 수량 상한 (3단계 detail.js 와 동일) */
  const MAX_QTY = 99;

  /** 주문 처리 후 페이지를 떠나는 중인지 — 이동 전 중복 클릭을 막는다 */
  let leaving = false;

  /** http(s) 주소만 통과시켜 위험한 스킴을 막는다 (2·3단계와 동일) */
  function safeImageUrl(url) {
    return /^https?:\/\//i.test(String(url || "")) ? url : "";
  }

  /* ============================================
     렌더
     ============================================ */

  /** 장바구니가 비었을 때 — 메뉴 목록으로 안내한다 */
  /* 이름이 CafeUtils.emptyStateHtml 과 겹치면 자기 자신을 부르게 되므로 따로 둔다 */
  function emptyBasketHtml() {
    return `
      <div class="card empty-state">
        ${emptyStateHtml(
          "shell", // 빈 조개 — 아무것도 담기지 않았다
          "장바구니에 담긴 메뉴가 없습니다.",
          "수평선 너머의 한 잔을 골라 담아 보세요.",
          `<a class="btn btn--primary" href="../menus/list.html">메뉴 보러가기</a>`
        )}
      </div>`;
  }

  /** 담긴 메뉴 한 줄 (menu 는 getCartDetail 이 조인해 준 원본 메뉴) */
  function itemHtml({ menu, qty, lineTotal }) {
    const image = safeImageUrl(menu.image);
    const detailUrl = `../menus/detail.html?id=${encodeURIComponent(menu.id)}`;

    return `
      <article class="card basket-item${menu.soldOut ? " basket-item--soldout" : ""}"
               data-item="${escapeHtml(menu.id)}">
        <a class="basket-item__thumb" href="${detailUrl}"
           aria-label="${escapeHtml(menu.name)} 상세 보기">
          ${
            image
              ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(menu.name)}"
                   loading="lazy" onerror="this.style.display='none'">`
              : ""
          }
        </a>

        <div class="basket-item__info">
          <h3 class="basket-item__name">
            <a href="${detailUrl}">${escapeHtml(menu.name)}</a>
          </h3>
          <p class="basket-item__unit">${formatPrice(menu.price)} · 1개당</p>
          ${menu.soldOut ? `<span class="chip chip--danger">품절</span>` : ""}
        </div>

        <div class="basket-item__controls">
          ${qtyStepperHtml(menu.id, qty)}
          <strong class="basket-item__line">${formatPrice(lineTotal)}</strong>
          <button class="btn btn--danger btn--sm" data-remove="${escapeHtml(menu.id)}"
                  aria-label="${escapeHtml(menu.name)} 삭제">삭제</button>
        </div>
      </article>`;
  }

  /** 오른쪽 결제 요약 패널 */
  function summaryHtml({ items, total, count }, hasSoldOut) {
    return `
      <aside class="card summary">
        <h2 class="summary__title">결제 요약</h2>

        <dl class="summary__rows">
          <div class="summary__row">
            <dt>담은 메뉴</dt>
            <dd>${items.length}종</dd>
          </div>
          <div class="summary__row">
            <dt>총 수량</dt>
            <dd>${count}개</dd>
          </div>
        </dl>

        <div class="summary__total">
          <span class="summary__total-label">총 결제 금액</span>
          <strong class="summary__total-value">${formatPrice(total)}</strong>
        </div>

        ${
          hasSoldOut
            ? `<p class="summary__notice">품절된 메뉴가 담겨 있습니다. 확인 후 주문해 주세요.</p>`
            : ""
        }

        <div class="summary__actions">
          <button class="btn btn--primary btn--lg btn--block" data-checkout>주문하기</button>
          <a class="btn btn--outline btn--sm btn--block" href="../menus/list.html">메뉴 더 담기</a>
          <button class="btn btn--ghost btn--sm btn--block" data-clear>장바구니 비우기</button>
        </div>
      </aside>`;
  }

  /** 장바구니 상태를 읽어 화면 전체를 다시 그린다 */
  function render() {
    const detail = getCartDetail();

    if (detail.items.length === 0) {
      root.innerHTML = emptyBasketHtml();
      return;
    }

    const hasSoldOut = detail.items.some((i) => i.menu.soldOut);

    root.innerHTML = `
      <div class="basket-layout">
        <div class="basket-items">
          ${detail.items.map(itemHtml).join("")}
        </div>
        ${summaryHtml(detail, hasSoldOut)}
      </div>`;
  }

  /* ============================================
     이벤트 (다시 그려도 동작하도록 전부 위임으로 처리)
     ============================================ */

  root.addEventListener("click", (e) => {
    if (leaving) return;

    /* --- 수량 스텝퍼 --- */
    const stepper = e.target.closest("[data-qty-stepper]");
    if (stepper) {
      const menuId = stepper.dataset.qtyStepper;
      // 화면의 숫자가 아니라 저장된 값을 기준으로 계산한다
      const line = getCartDetail().items.find((i) => i.menuId === menuId);
      if (!line) return;

      if (e.target.closest("[data-qty-inc]")) {
        if (line.qty >= MAX_QTY) {
          showToast(`한 메뉴는 ${MAX_QTY}개까지 담을 수 있습니다.`, "warning");
          return;
        }
        updateCartQty(menuId, line.qty + 1); // 내부에서 장바구니 배지까지 갱신된다
        render();
        return;
      }

      if (e.target.closest("[data-qty-dec]")) {
        // updateCartQty 는 최소 1로 고정하므로, 1에서는 삭제 버튼으로 안내한다
        if (line.qty <= 1) {
          showToast("빼시려면 삭제 버튼을 눌러 주세요.", "warning");
          return;
        }
        updateCartQty(menuId, line.qty - 1);
        render();
      }
      return;
    }

    /* --- 항목 삭제 (삭제는 항상 confirm 후 실행) --- */
    const removeBtn = e.target.closest("[data-remove]");
    if (removeBtn) {
      const menuId = removeBtn.dataset.remove;
      const line = getCartDetail().items.find((i) => i.menuId === menuId);
      if (!line) return;

      if (!confirm(`'${line.menu.name}' 을(를) 장바구니에서 뺄까요?`)) return;

      removeFromCart(menuId);
      showToast(`'${line.menu.name}' 을(를) 뺐습니다.`);
      render();
      return;
    }

    /* --- 장바구니 비우기 --- */
    if (e.target.closest("[data-clear]")) {
      if (!confirm("장바구니를 모두 비울까요?")) return;
      clearCart();
      showToast("장바구니를 비웠습니다.");
      render();
      return;
    }

    /* --- 주문하기 --- */
    if (e.target.closest("[data-checkout]")) {
      // 빈 장바구니면 checkout 이 null 을 돌려준다 → 아무 동작도 하지 않는다
      const order = checkout();
      if (!order) return;

      leaving = true;
      showToast(`주문이 접수되었습니다. (${formatPrice(order.total)})`, "success");

      // checkout 이 장바구니를 비웠으므로 빈 상태로 다시 그린다
      render();

      // 페이지를 이동하면 토스트가 사라지므로 도착 페이지가 대신 띄우도록 남긴다
      // (5단계 완성 → 방금 만든 주문의 상세 페이지로 보낸다)
      sessionStorage.setItem(
        "cafe.flash",
        `주문이 접수되었습니다. 정성껏 준비할게요! ☕`
      );
      setTimeout(() => {
        location.href = `../orders/detail.html?id=${encodeURIComponent(order.id)}`;
      }, 1200);
    }
  });

  /* ============================================
     초기화
     ============================================ */

  // 다른 페이지에서 남긴 안내 메시지가 있으면 이어받아 표시한다
  const flash = sessionStorage.getItem("cafe.flash");
  if (flash) {
    sessionStorage.removeItem("cafe.flash");
    showToast(flash, "success");
  }

  render();
})();
