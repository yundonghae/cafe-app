/* ============================================
   🌊 관리자 - 메뉴 목록 (list.html)
   CafeData / CafeUtils 만 사용하고 데이터에 직접 접근하지 않는다.
   ============================================ */

(function () {
  // 🔐 관리자 세션 가드 — 다른 로직보다 먼저. 통과 못 하면 렌더하지 않고 즉시 빠져나간다.
  if (!window.CafeUtils.requireAdmin("../../index.html")) return;

  const { $, $$, formatPrice, escapeHtml, showToast, emptyStateHtml } = window.CafeUtils;
  const { getMenus, getCategories, getCategoryById, getMenusByCategory, deleteMenu } =
    window.CafeData;

  /* --- 화면 상태 (카테고리 필터 + 검색어) --- */
  const state = {
    categoryId: "all",
    keyword: "",
  };

  const grid = $("[data-grid]");
  const filters = $("[data-filters]");
  const searchInput = $("[data-search]");

  /**
   * 이미지 주소 안전장치.
   * javascript: 같은 위험한 스킴을 막고, http(s) 주소만 통과시킨다.
   * 통과하지 못하면 빈 문자열 → 썸네일은 수면 배경만 남는다.
   */
  function safeImageUrl(url) {
    return /^https?:\/\//i.test(String(url || "")) ? url : "";
  }

  /* ============================================
     렌더 - 카테고리 필터 버튼
     ============================================ */

  function renderFilters() {
    const categories = [{ id: "all", name: "전체", emoji: "🐚" }, ...getCategories()];
    filters.innerHTML = categories
      .map((c) => {
        const on = c.id === state.categoryId ? " filter--on" : "";
        return `<button class="btn btn--outline btn--sm filter${on}"
                  data-category="${escapeHtml(c.id)}"
                  aria-pressed="${c.id === state.categoryId}">
                  ${escapeHtml(c.emoji)} ${escapeHtml(c.name)}
                </button>`;
      })
      .join("");
  }

  /* ============================================
     렌더 - 요약 지표 (전체 메뉴 기준)
     ============================================ */

  function renderStats() {
    const menus = getMenus();
    const soldOut = menus.filter((m) => m.soldOut).length;
    $('[data-stat="total"]').textContent = menus.length;
    $('[data-stat="onsale"]').textContent = menus.length - soldOut;
    $('[data-stat="soldout"]').textContent = soldOut;
  }

  /* ============================================
     렌더 - 메뉴 카드 그리드
     ============================================ */

  /** 현재 필터 + 검색어를 적용한 메뉴 목록 */
  function getVisibleMenus() {
    const kw = state.keyword.trim().toLowerCase();
    const menus = getMenusByCategory(state.categoryId);
    if (!kw) return menus;
    return menus.filter(
      (m) =>
        m.name.toLowerCase().includes(kw) ||
        String(m.description || "").toLowerCase().includes(kw)
    );
  }

  function menuCardHtml(menu) {
    const category = getCategoryById(menu.categoryId);
    const categoryLabel = category
      ? `${category.emoji} ${category.name}`
      : "미분류";
    const image = safeImageUrl(menu.image);
    const id = encodeURIComponent(menu.id);

    // 품절/판매중 상태 칩
    const flag = menu.soldOut
      ? `<span class="chip chip--danger menu-card__flag">품절</span>`
      : `<span class="chip chip--success menu-card__flag">판매중</span>`;

    // 태그는 .badge 재사용
    const tags = (menu.tags || [])
      .map((t) => `<span class="badge badge--sand">${escapeHtml(t)}</span>`)
      .join("");

    return `
      <article class="card menu-card${menu.soldOut ? " menu-card--soldout" : ""}">
        <div class="menu-card__thumb">
          ${flag}
          ${
            image
              ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(menu.name)}"
                   loading="lazy" onerror="this.style.display='none'">`
              : ""
          }
        </div>
        <div class="menu-card__body">
          <div class="menu-card__top">
            <span class="badge">${escapeHtml(categoryLabel)}</span>
            <strong class="menu-card__price">${formatPrice(menu.price)}</strong>
          </div>
          <h3 class="menu-card__name">${escapeHtml(menu.name)}</h3>
          <p class="menu-card__desc">${escapeHtml(menu.description)}</p>
          ${tags ? `<div class="menu-card__tags">${tags}</div>` : ""}
          <div class="menu-card__actions">
            <a class="btn btn--outline btn--sm" href="./detail.html?id=${id}">상세</a>
            <a class="btn btn--outline btn--sm" href="./edit.html?id=${id}">수정</a>
            <button class="btn btn--danger btn--sm"
                    data-delete="${escapeHtml(menu.id)}"
                    data-name="${escapeHtml(menu.name)}">삭제</button>
          </div>
        </div>
      </article>`;
  }

  function renderGrid() {
    const menus = getVisibleMenus();

    if (menus.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          ${emptyStateHtml(
            "net", // 빈 그물 — 필터·검색에 아무것도 잡히지 않았다
            "수면 아래 아무것도 잡히지 않았습니다.",
            "필터를 바꾸거나 새 메뉴를 띄워 보세요."
          )}
        </div>`;
      return;
    }

    grid.innerHTML = menus.map(menuCardHtml).join("");
  }

  /** 전체 화면 갱신 */
  function render() {
    renderFilters();
    renderStats();
    renderGrid();
  }

  /* ============================================
     이벤트
     ============================================ */

  // 카테고리 필터 (이벤트 위임)
  filters.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-category]");
    if (!btn) return;
    state.categoryId = btn.dataset.category;
    render();
  });

  // 검색어 입력
  searchInput.addEventListener("input", (e) => {
    state.keyword = e.target.value;
    renderGrid();
  });

  // 삭제 (이벤트 위임 → 카드가 다시 그려져도 동작)
  grid.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-delete]");
    if (!btn) return;

    const { delete: id, name } = btn.dataset;
    if (!confirm(`'${name}' 메뉴를 삭제할까요?\n삭제한 메뉴는 되돌릴 수 없습니다.`)) return;

    deleteMenu(id);
    showToast(`'${name}' 메뉴를 물살에 흘려보냈습니다.`, "danger");
    render();
  });

  /* ============================================
     초기화
     ============================================ */

  // create.js / edit.js 가 남긴 안내 메시지를 이어받아 표시한다.
  const flash = sessionStorage.getItem("cafe.flash");
  if (flash) {
    sessionStorage.removeItem("cafe.flash");
    showToast(flash, "success");
  }

  render();
})();
