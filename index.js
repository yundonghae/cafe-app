/* ============================================
   🌊 고객 - 메인 페이지 (index.html)
   CafeData / CafeUtils 만 사용하고 데이터에 직접 접근하지 않는다.
   카테고리 바로가기 + 인기 메뉴 추천을 담당한다.
   ============================================ */

(function () {
  const { $, formatPrice, escapeHtml, showToast, addToCart, emptyStateHtml } = window.CafeUtils;
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

    revealCards(categoryBox.querySelectorAll('.category-card'));
  }

  /* ============================================
     스크롤 등장 애니메이션 (IntersectionObserver)
     카드가 화면에 들어올 때 아래에서 떠오르듯 나타난다.
     실제 움직임은 index.css 의 .reveal / .is-visible 이 담당한다.
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

  /** 섹션마다 따로 부르므로 시차(i)는 그 섹션 안에서만 센다 */
  function revealCards(cards) {
    cards.forEach((card, i) => {
      card.classList.add('reveal');
      // 카드 수가 가변이라 시차는 인라인으로 준다
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
          ${emptyStateHtml(
            'shell', // 빈 조개 — 물이 빠진 갯벌
            '지금은 물이 빠졌습니다.',
            '잠시 후 다시 찾아와 주세요.'
          )}
        </div>`;
      return;
    }

    pickBox.innerHTML = menus.map(pickCardHtml).join('');

    // 품절 처리 등으로 다시 그릴 때마다 새 카드를 관찰 대상으로 등록한다
    revealCards(pickBox.querySelectorAll('.pick-card'));
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
