/* ============================================
   🌊 고객 - 메뉴 목록 (list.html)
   CafeData / CafeUtils 만 사용하고 데이터에 직접 접근하지 않는다.
   관리자 목록과 달리 수정/삭제가 없고, "담기" 만 제공한다.
   ============================================ */

(function () {
  const {
    $,
    getParam,
    formatPrice,
    escapeHtml,
    showToast,
    addToCart,
    toggleFavorite,
    favButtonHtml,
    emptyStateHtml,
  } = window.CafeUtils;
  const { getMenuById, getCategories, getCategoryById, getMenusByCategory } = window.CafeData;

  /* --- 화면 상태 (카테고리 필터 + 검색어) --- */
  const state = {
    categoryId: 'all',
    keyword: '',
  };

  const grid = $('[data-grid]');
  const filters = $('[data-filters]');
  const searchInput = $('[data-search]');

  /**
   * 이미지 주소 안전장치 (2단계와 동일한 방식).
   * javascript: 같은 위험한 스킴을 막고, http(s) 주소만 통과시킨다.
   */
  function safeImageUrl(url) {
    return /^https?:\/\//i.test(String(url || '')) ? url : '';
  }

  /* ============================================
     렌더 - 카테고리 필터 버튼
     ============================================ */

  function renderFilters() {
    const categories = [{ id: 'all', name: '전체', emoji: '🐚' }, ...getCategories()];
    filters.innerHTML = categories
      .map((c) => {
        const on = c.id === state.categoryId ? ' filter--on' : '';
        return `<button class="btn btn--outline btn--sm filter${on}"
                  data-category="${escapeHtml(c.id)}"
                  aria-pressed="${c.id === state.categoryId}">
                  ${escapeHtml(c.emoji)} ${escapeHtml(c.name)}
                </button>`;
      })
      .join('');
  }

  /* ============================================
     렌더 - 메뉴 카드 그리드
     ============================================ */

  /** 현재 필터 + 검색어를 적용한 메뉴 목록 */
  function getVisibleMenus() {
    const kw = state.keyword.trim().toLowerCase();
    const menus = getMenusByCategory(state.categoryId);
    if (!kw) return menus;
    // 수정 후 (이름만)
    return menus.filter((m) => m.name.toLowerCase().includes(kw));
  }

  function menuCardHtml(menu) {
    const category = getCategoryById(menu.categoryId);
    const categoryLabel = category ? `${category.emoji} ${category.name}` : '미분류';
    const image = safeImageUrl(menu.image);
    const id = encodeURIComponent(menu.id);
    const detailUrl = `./detail.html?id=${id}`;

    // 품절이면 붉은 산호빛 칩, 판매중이면 해조빛 칩
    const flag = menu.soldOut
      ? `<span class="chip chip--danger menu-card__flag">품절</span>`
      : `<span class="chip chip--success menu-card__flag">판매중</span>`;

    const tags = (menu.tags || []).map((t) => `<span class="badge badge--sand">${escapeHtml(t)}</span>`).join('');

    // 품절 메뉴는 담기 버튼을 비활성화한다
    const addButton = menu.soldOut
      ? `<button class="btn btn--primary btn--sm" disabled>품절</button>`
      : `<button class="btn btn--primary btn--sm"
                 data-add="${escapeHtml(menu.id)}">담기</button>`;

    return `
      <article class="card menu-card${menu.soldOut ? ' menu-card--soldout' : ''}">
        <a class="menu-card__thumb" href="${detailUrl}"
           aria-label="${escapeHtml(menu.name)} 상세 보기">
          ${flag}
          ${
            image
              ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(menu.name)}"
                   loading="lazy" onerror="this.style.display='none'">`
              : ''
          }
        </a>
        <!-- 찜 하트 — 썸네일 링크 밖에 두어야 클릭이 상세 이동으로 새지 않는다 -->
        ${favButtonHtml(menu.id)}
        <div class="menu-card__body">
          <div class="menu-card__top">
            <span class="badge">${escapeHtml(categoryLabel)}</span>
            <strong class="menu-card__price">${formatPrice(menu.price)}</strong>
          </div>
          <h3 class="menu-card__name">
            <a href="${detailUrl}">${escapeHtml(menu.name)}</a>
          </h3>
          <p class="menu-card__desc">${escapeHtml(menu.description)}</p>
          ${tags ? `<div class="menu-card__tags">${tags}</div>` : ''}
          <div class="menu-card__actions">
            <a class="btn btn--outline btn--sm" href="${detailUrl}">상세 보기</a>
            ${addButton}
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
            'net', // 빈 그물 — 검색·필터에 아무것도 걸리지 않았다
            '그물에 걸린 메뉴가 없습니다.',
            '다른 카테고리나 검색어로 다시 던져 보세요.'
          )}
        </div>`;
      return;
    }

    grid.innerHTML = menus.map(menuCardHtml).join('');

    // 필터·검색으로 카드를 다시 그릴 때마다 새 카드들을 관찰 대상으로 등록한다
    revealCards(grid.querySelectorAll('.menu-card'));
  }

  /* ============================================
     스크롤 등장 애니메이션 (IntersectionObserver)
     카드가 화면에 들어올 때 아래에서 떠오르듯 나타난다.
     실제 움직임은 list.css 의 .reveal / .is-visible 이 담당한다.
     ============================================ */

  /** 카드마다 주는 시차 — 물결처럼 순차 등장. 과하지 않게 상한을 둔다 */
  const STAGGER_MS = 50;
  const STAGGER_MAX_MS = 300;

  /** 한 번 등장한 카드는 다시 숨기지 않는다 (등장 즉시 관찰 해제) */
  const revealObserver =
    'IntersectionObserver' in window
      ? new IntersectionObserver(
          (entries, obs) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              entry.target.classList.add('is-visible');
              obs.unobserve(entry.target);
            });
          },
          // 카드가 살짝 올라온 뒤에 시작해야 자연스럽다
          { rootMargin: '0px 0px -10% 0px' }
        )
      : null;

  function revealCards(cards) {
    cards.forEach((card, i) => {
      card.classList.add('reveal');
      // 카드 수가 가변이라 시차는 인라인으로 준다 (CSS 로 두면 :nth-child 나열이 지저분해진다)
      card.style.animationDelay = `${Math.min(i * STAGGER_MS, STAGGER_MAX_MS)}ms`;

      // IntersectionObserver 를 못 쓰는 환경에서는 애니메이션 없이 바로 보여 준다
      // (그냥 두면 opacity:0 인 카드가 영영 안 보인다)
      if (!revealObserver) {
        card.classList.add('is-visible');
        return;
      }
      revealObserver.observe(card);
    });
  }

  /* ============================================
     이벤트
     ============================================ */

  // 카테고리 필터 (이벤트 위임)
  filters.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-category]');
    if (!btn) return;
    state.categoryId = btn.dataset.category;
    renderFilters();
    renderGrid();
  });

  // 검색어 입력
  searchInput.addEventListener('input', (e) => {
    state.keyword = e.target.value;
    renderGrid();
  });

  /**
   * 하트 버튼 하나만 현재 상태로 갱신한다.
   * 목록 전체를 다시 그리면 스크롤/포커스가 튀므로, 누른 버튼만 손본다.
   */
  function syncFavButton(btn, on) {
    btn.classList.toggle('fav-btn--on', on);
    btn.setAttribute('aria-pressed', String(on));
    btn.setAttribute('aria-label', on ? '찜 해제' : '찜하기');
    btn.setAttribute('title', on ? '찜 해제' : '찜하기');
    const icon = btn.querySelector('span');
    if (icon) icon.textContent = on ? '❤️' : '🤍';
  }

  // 담기 · 찜 (이벤트 위임 → 카드가 다시 그려져도 동작)
  grid.addEventListener('click', (e) => {
    /* --- 찜 토글 --- */
    const favBtn = e.target.closest('[data-fav]');
    if (favBtn) {
      const menu = getMenuById(favBtn.dataset.fav);
      if (!menu) return;

      const on = toggleFavorite(menu.id);
      syncFavButton(favBtn, on); // 카드 재렌더 없이 하트만 즉시 반영
      showToast(
        on ? `'${menu.name}' 을(를) 찜했습니다.` : `'${menu.name}' 찜을 해제했습니다.`,
        on ? 'success' : 'default'
      );
      return;
    }

    /* --- 장바구니 담기 --- */
    const btn = e.target.closest('[data-add]');
    if (!btn) return;

    const menu = getMenuById(btn.dataset.add);
    if (!menu) return;

    // 목록을 띄운 뒤 관리자가 품절 처리했을 수도 있으니 한 번 더 확인
    if (menu.soldOut) {
      showToast(`'${menu.name}' 은(는) 방금 품절되었습니다.`, 'warning');
      renderGrid();
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

  // 메인 페이지의 카테고리 바로가기(?category=<id>)로 들어오면 그 필터로 시작한다.
  // 없는 카테고리 id 면 무시하고 기본값("전체")을 유지한다.
  const initialCategory = getParam('category');
  if (initialCategory && getCategoryById(initialCategory)) {
    state.categoryId = initialCategory;
  }

  renderFilters();
  renderGrid();
})();
