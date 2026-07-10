/* ============================================
   🌊 고객 - 메인 페이지 (index.html)
   CafeData / CafeUtils 만 사용하고 데이터에 직접 접근하지 않는다.
   카테고리 바로가기 + 인기 메뉴 추천을 담당한다.
   ============================================ */

(function () {
  const { $, formatPrice, escapeHtml, showToast, addToCart } = window.CafeUtils;
  const { getCategories, getMenus, getMenuById, getCategoryById } = window.CafeData;

  const categoryBox = $('[data-categories]');
  const pickBox = $('[data-picks]');

  /** 인기 메뉴로 노출할 개수 (요구사항: 4~6개) */
  const PICK_COUNT = 6;

  /** "인기"로 먼저 끌어올릴 태그 */
  const POPULAR_TAGS = ['베스트', '시그니처'];

  /** http(s) 주소만 통과시켜 위험한 스킴을 막는다 (2·3단계와 동일) */
  function safeImageUrl(url) {
    return /^https?:\/\//i.test(String(url || '')) ? url : '';
  }

  /** Fisher-Yates 셔플 (원본 배열을 건드리지 않는다) */
  function shuffle(list) {
    const arr = [...list];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /* ============================================
     렌더 - 카테고리 바로가기
     클릭하면 menus/list.html?category=<id> 로 이동하고,
     menus/list.js 가 그 쿼리를 읽어 해당 필터로 목록을 연다.
     ============================================ */

  function renderCategories() {
    const categories = getCategories();

    categoryBox.innerHTML = categories
      .map((c) => {
        const href = `menus/list.html?category=${encodeURIComponent(c.id)}`;
        return `
          <a class="card category-card" href="${href}">
            <span class="category-card__icon" aria-hidden="true">${escapeHtml(c.emoji)}</span>
            <span class="category-card__name">${escapeHtml(c.name)}</span>
          </a>`;
      })
      .join('');
  }

  /* ============================================
     렌더 - 인기 메뉴
     ============================================ */

  /**
   * 품절을 제외하고 최대 PICK_COUNT 개를 고른다.
   * '베스트'·'시그니처' 태그가 붙은 메뉴를 먼저 채우고,
   * 모자라면 나머지 메뉴에서 임의로 채운다. (매번 순서는 섞인다)
   */
  function pickPopularMenus() {
    const sellable = getMenus().filter((m) => !m.soldOut);

    const isPopular = (m) => (m.tags || []).some((t) => POPULAR_TAGS.includes(t));

    const featured = shuffle(sellable.filter(isPopular));
    const rest = shuffle(sellable.filter((m) => !isPopular(m)));

    return [...featured, ...rest].slice(0, PICK_COUNT);
  }

  function pickCardHtml(menu) {
    const category = getCategoryById(menu.categoryId);
    const categoryLabel = category ? `${category.emoji} ${category.name}` : '미분류';
    const image = safeImageUrl(menu.image);
    const detailUrl = `menus/detail.html?id=${encodeURIComponent(menu.id)}`;

    // 대표 태그 하나만 카드 위에 띄운다 (없으면 표시하지 않음)
    const badge = (menu.tags || []).find((t) => POPULAR_TAGS.includes(t));
    const flag = badge ? `<span class="chip chip--info pick-card__flag">${escapeHtml(badge)}</span>` : '';

    return `
      <article class="card pick-card">
        <a class="pick-card__thumb" href="${detailUrl}"
           aria-label="${escapeHtml(menu.name)} 상세 보기">
          ${flag}
          ${
            image
              ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(menu.name)}"
                   loading="lazy" onerror="this.style.display='none'">`
              : ''
          }
        </a>
        <div class="pick-card__body">
          <div class="pick-card__top">
            <span class="badge">${escapeHtml(categoryLabel)}</span>
            <strong class="pick-card__price">${formatPrice(menu.price)}</strong>
          </div>
          <h3 class="pick-card__name">
            <a href="${detailUrl}">${escapeHtml(menu.name)}</a>
          </h3>
          <p class="pick-card__desc">${escapeHtml(menu.description)}</p>
          <div class="pick-card__actions">
            <a class="btn btn--outline btn--sm" href="${detailUrl}">상세 보기</a>
            <button class="btn btn--primary btn--sm"
                    data-add="${escapeHtml(menu.id)}">담기</button>
          </div>
        </div>
      </article>`;
  }

  function renderPicks() {
    const menus = pickPopularMenus();

    // 판매 가능한 메뉴가 하나도 없을 때 (관리자가 전부 품절 처리한 경우)
    if (menus.length === 0) {
      pickBox.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state__icon">🌊</div>
          <p>지금은 물이 빠졌습니다.</p>
          <p class="text-muted">잠시 후 다시 찾아와 주세요.</p>
        </div>`;
      return;
    }

    pickBox.innerHTML = menus.map(pickCardHtml).join('');
  }

  /* ============================================
     이벤트 (다시 그려도 동작하도록 위임 사용)
     ============================================ */

  pickBox.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-add]');
    if (!btn) return;

    const menu = getMenuById(btn.dataset.add);
    if (!menu) return;

    // 화면을 띄운 뒤 사장님이 품절 처리했을 수도 있으니 한 번 더 확인
    if (menu.soldOut) {
      showToast(`'${menu.name}' 은(는) 방금 품절되었습니다.`, 'warning');
      renderPicks();
      return;
    }

    addToCart(menu.id, 1); // 내부에서 장바구니 배지까지 갱신된다
    showToast(`'${menu.name}' 을(를) 장바구니에 담았습니다.`, 'success');
  });

  /* ============================================
     초기화
     ============================================ */

  // 다른 페이지에서 남긴 안내 메시지가 있으면 이어받아 표시한다
  const flash = sessionStorage.getItem('cafe.flash');
  if (flash) {
    sessionStorage.removeItem('cafe.flash');
    showToast(flash, 'success');
  }

  renderCategories();
  renderPicks();
})();
