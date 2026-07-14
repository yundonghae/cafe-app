/* ============================================
   🌊 관리자 - 메뉴 상세 (detail.html)
   ?id=<메뉴 ID> 쿼리로 단일 메뉴를 조회한다.
   ============================================ */

(function () {
  // 🔐 관리자 세션 가드 — 다른 로직보다 먼저. 통과 못 하면 렌더하지 않고 즉시 빠져나간다.
  if (!window.CafeUtils.requireAdmin("../../index.html")) return;

  const { $, getParam, formatPrice, escapeHtml, showToast, emptyStateHtml } = window.CafeUtils;
  const { getMenuById, getCategoryById, updateMenu, deleteMenu } = window.CafeData;

  const root = $("[data-detail]");
  const id = getParam("id");

  /** http(s) 주소만 통과시켜 위험한 스킴을 막는다 */
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
        ${emptyStateHtml(
          "net", // 빈 그물 — 찾았지만 걸리지 않았다
          "찾으시는 메뉴가 해류에 휩쓸려 사라졌습니다.",
          "삭제되었거나 잘못된 주소일 수 있습니다.",
          `<a class="btn btn--primary" href="./list.html">메뉴 목록으로</a>`
        )}
      </div>`;
  }

  function renderDetail(menu) {
    const category = getCategoryById(menu.categoryId);
    const categoryLabel = category ? `${category.emoji} ${category.name}` : "미분류";
    const image = safeImageUrl(menu.image);
    const encodedId = encodeURIComponent(menu.id);

    const statusChip = menu.soldOut
      ? `<span class="chip chip--danger">품절</span>`
      : `<span class="chip chip--success">판매중</span>`;

    const tags = (menu.tags || [])
      .map((t) => `<span class="badge badge--sand">${escapeHtml(t)}</span>`)
      .join("");

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

        <!-- 오른쪽: 메뉴 정보 -->
        <div class="detail__info">
          <div class="detail__head">
            <span class="badge">${escapeHtml(categoryLabel)}</span>
            ${statusChip}
          </div>

          <h2 class="detail__name">${escapeHtml(menu.name)}</h2>
          <strong class="detail__price">${formatPrice(menu.price)}</strong>
          <p class="detail__desc">${escapeHtml(menu.description)}</p>

          ${tags ? `<div class="detail__tags">${tags}</div>` : ""}

          <dl class="card detail__meta">
            <div class="detail__meta-row">
              <dt>메뉴 ID</dt>
              <dd>${escapeHtml(menu.id)}</dd>
            </div>
            <div class="detail__meta-row">
              <dt>카테고리</dt>
              <dd>${escapeHtml(categoryLabel)}</dd>
            </div>
            <div class="detail__meta-row">
              <dt>판매 상태</dt>
              <dd>${menu.soldOut ? "품절" : "판매중"}</dd>
            </div>
            <div class="detail__meta-row">
              <dt>이미지 주소</dt>
              <dd>${escapeHtml(menu.image) || "-"}</dd>
            </div>
          </dl>

          <div class="detail__actions">
            <a class="btn btn--primary" href="./edit.html?id=${encodedId}">수정하기</a>
            <button class="btn btn--outline" data-toggle-soldout>
              ${menu.soldOut ? "판매 재개" : "품절 처리"}
            </button>
            <button class="btn btn--danger" data-delete>삭제</button>
          </div>
        </div>
      </div>`;
  }

  /* ============================================
     이벤트 (렌더 후 다시 바인딩 → 위임 사용)
     ============================================ */

  root.addEventListener("click", (e) => {
    const menu = getMenuById(id);
    if (!menu) return;

    // 품절 ↔ 판매중 토글
    if (e.target.closest("[data-toggle-soldout]")) {
      const next = !menu.soldOut;
      updateMenu(menu.id, { soldOut: next });
      showToast(
        next
          ? `'${menu.name}' 은(는) 수면 아래로 내렸습니다. (품절)`
          : `'${menu.name}' 이(가) 다시 파도 위로 올라왔습니다.`,
        next ? "warning" : "success"
      );
      renderDetail(getMenuById(id)); // 갱신된 값으로 다시 그린다
      return;
    }

    // 삭제 → 확인 후 목록으로 이동
    if (e.target.closest("[data-delete]")) {
      if (!confirm(`'${menu.name}' 메뉴를 삭제할까요?\n삭제한 메뉴는 되돌릴 수 없습니다.`))
        return;
      deleteMenu(menu.id);
      // 목록 페이지에서 띄울 안내 메시지를 남긴다
      sessionStorage.setItem("cafe.flash", `'${menu.name}' 메뉴를 물살에 흘려보냈습니다.`);
      location.href = "./list.html";
    }
  });

  /* ============================================
     초기화
     ============================================ */

  const menu = id ? getMenuById(id) : null;
  if (menu) {
    document.title = `${menu.name} · 동해 카페 관리자`;
    renderDetail(menu);
  } else {
    renderNotFound();
  }
})();
