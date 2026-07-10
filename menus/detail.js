/* ============================================
   🌊 고객 - 메뉴 상세 (detail.html)
   ?id=<메뉴 ID> 쿼리로 단일 메뉴를 조회하고,
   수량 스텝퍼로 고른 만큼 장바구니에 담는다.
   ============================================ */

(function () {
  const {
    $,
    getParam,
    formatPrice,
    escapeHtml,
    showToast,
    addToCart,
    qtyStepperHtml,
  } = window.CafeUtils;
  const { getMenuById, getCategoryById } = window.CafeData;

  const root = $("[data-detail]");
  const id = getParam("id");

  /** 현재 선택한 수량 (스텝퍼로 조절, 최소 1 · 최대 99) */
  let quantity = 1;
  const MIN_QTY = 1;
  const MAX_QTY = 99;

  /** http(s) 주소만 통과시켜 위험한 스킴을 막는다 (2단계와 동일) */
  function safeImageUrl(url) {
    return /^https?:\/\//i.test(String(url || "")) ? url : "";
  }

  /* ============================================
     렌더
     ============================================ */

  /** 메뉴를 찾지 못했을 때 */
  function renderNotFound() {
    root.innerHTML = `
      <div class="card empty-state">
        <div class="empty-state__icon">🧭</div>
        <p>찾으시는 메뉴가 해류에 휩쓸려 사라졌습니다.</p>
        <p class="text-muted">판매가 끝났거나 잘못된 주소일 수 있습니다.</p>
        <p style="margin-top: var(--space-lg);">
          <a class="btn btn--primary" href="./list.html">메뉴 보러 가기</a>
        </p>
      </div>`;
  }

  function renderDetail(menu) {
    const category = getCategoryById(menu.categoryId);
    const categoryLabel = category ? `${category.emoji} ${category.name}` : "미분류";
    const image = safeImageUrl(menu.image);

    const statusChip = menu.soldOut
      ? `<span class="chip chip--danger">품절</span>`
      : `<span class="chip chip--success">판매중</span>`;

    const tags = (menu.tags || [])
      .map((t) => `<span class="badge badge--sand">${escapeHtml(t)}</span>`)
      .join("");

    // 품절이면 스텝퍼 대신 안내 문구를 두고, 담기 버튼을 비활성화한다
    const buyBox = menu.soldOut
      ? `<div class="card buy">
           <p class="buy__soldout">지금은 물이 빠졌습니다 — 품절된 메뉴예요.</p>
           <div class="buy__actions">
             <button class="btn btn--primary btn--lg" disabled>품절</button>
             <a class="btn btn--outline btn--lg" href="./list.html">다른 메뉴 보기</a>
           </div>
         </div>`
      : `<div class="card buy">
           <div class="buy__row">
             <span class="buy__label">수량</span>
             ${qtyStepperHtml(menu.id, quantity)}
           </div>
           <div class="buy__row buy__total">
             <span class="buy__label">합계</span>
             <strong class="buy__total-value" data-total>
               ${formatPrice(menu.price * quantity)}
             </strong>
           </div>
           <div class="buy__actions">
             <button class="btn btn--primary btn--lg" data-add>장바구니 담기</button>
             <a class="btn btn--outline btn--lg" href="../basket/list.html">장바구니로</a>
           </div>
         </div>`;

    root.innerHTML = `
      <div class="detail">
        <!-- 왼쪽: 메뉴 이미지 -->
        <figure class="card detail__visual${menu.soldOut ? " detail__visual--soldout" : ""}">
          ${statusChip}
          ${
            image
              ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(menu.name)}"
                   onerror="this.style.display='none'">`
              : ""
          }
        </figure>

        <!-- 오른쪽: 메뉴 정보 + 주문 상자 -->
        <div class="detail__info">
          <div class="detail__head">
            <span class="badge">${escapeHtml(categoryLabel)}</span>
            ${statusChip}
          </div>

          <h2 class="detail__name">${escapeHtml(menu.name)}</h2>
          <strong class="detail__price">${formatPrice(menu.price)}</strong>
          <p class="detail__desc">${escapeHtml(menu.description)}</p>

          ${tags ? `<div class="detail__tags">${tags}</div>` : ""}

          ${buyBox}
        </div>
      </div>`;
  }

  /** 수량이 바뀔 때 스텝퍼 숫자와 합계 금액을 갱신한다 */
  function syncQuantity(menu) {
    const valueEl = $("[data-qty-value]");
    const totalEl = $("[data-total]");
    if (valueEl) valueEl.textContent = quantity;
    if (totalEl) totalEl.textContent = formatPrice(menu.price * quantity);
  }

  /* ============================================
     이벤트 (렌더 후에도 동작하도록 위임 사용)
     ============================================ */

  root.addEventListener("click", (e) => {
    const menu = getMenuById(id);
    if (!menu || menu.soldOut) return;

    // 수량 증가 / 감소
    if (e.target.closest("[data-qty-inc]")) {
      quantity = Math.min(MAX_QTY, quantity + 1);
      syncQuantity(menu);
      return;
    }
    if (e.target.closest("[data-qty-dec]")) {
      quantity = Math.max(MIN_QTY, quantity - 1);
      syncQuantity(menu);
      return;
    }

    // 장바구니 담기
    if (e.target.closest("[data-add]")) {
      addToCart(menu.id, quantity); // 내부에서 장바구니 배지까지 갱신된다
      showToast(
        `'${menu.name}' ${quantity}개를 장바구니에 담았습니다.`,
        "success"
      );
      quantity = 1; // 담은 뒤에는 수량을 초기화한다
      syncQuantity(menu);
    }
  });

  /* ============================================
     초기화
     ============================================ */

  const menu = id ? getMenuById(id) : null;
  if (menu) {
    document.title = `${menu.name} · 동해 카페`;
    renderDetail(menu);
  } else {
    renderNotFound();
  }
})();
