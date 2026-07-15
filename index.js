/* ============================================
   🌊 고객 - 메인 페이지 (index.html)
   CafeData / CafeUtils 만 사용하고 데이터에 직접 접근하지 않는다.
   카테고리 바로가기 + 인기 메뉴 추천을 담당한다.
   ============================================ */

(function () {
  const { $, formatPrice, escapeHtml, showToast, addToCart, emptyStateHtml, isMotionOff, toggleMotion } =
    window.CafeUtils;
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
     추천 메뉴 배너 (캐러셀)
     기존 카테고리·인기 메뉴 로직과 독립적으로 동작한다.
     ============================================ */

  const bannerBox = $('[data-banner]');

  /** 배너에 띄울 최대 슬라이드 수 */
  const BANNER_MAX = 6;

  /** 추천으로 끌어올릴 태그 */
  const BANNER_TAGS = ['베스트', '시그니처'];

  /** 태그 추천에 먼저 내줄 자리 (나머지는 신메뉴 몫) */
  const FEATURED_SLOTS = 4;

  /** 신메뉴에 확보해 줄 자리 */
  const RECENT_SLOTS = 2;

  /** 자동 넘김 간격 */
  const AUTOPLAY_MS = 4500;

  /** 기기의 동작 줄이기 설정 (한 번만 읽는다) */
  const deviceReduceMotion =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /**
   * 자동 넘김을 켜면 안 되는 상태인가.
   * 기기 설정 OR 사용자가 애니메이션 토글 버튼으로 끈 경우.
   *
   * ⚠️ CSS 의 .reduce-motion 은 animation/transition 의 "길이"만 0 으로 만든다.
   *    setInterval 로 도는 자동 넘김은 CSS 로 멈출 수 없어, 여기서 따로 확인한다.
   */
  const motionDisabled = () => deviceReduceMotion || isMotionOff();

  let bannerIndex = 0;
  let bannerTimer = null;
  let bannerStopped = motionDisabled(); // 멈춤 버튼 또는 동작 줄이기로 정지 상태인가
  let bannerSlides = [];
  let bannerDots = [];
  let bannerTrack = null;

  /**
   * 배너에 띄울 메뉴를 고른다.
   *
   * 1) 추천 태그(베스트·시그니처) 메뉴 — 지금 데이터엔 10개나 되어서,
   *    이것만 쓰면 신메뉴가 영영 배너에 오르지 못한다.
   * 2) 그래서 신메뉴 몫을 따로 떼어 둔다. data.js 는 수정 금지라 "신메뉴" 플래그가 없는데,
   *    getMenus() 는 SEED_MENUS 순서를 유지하고 새 메뉴는 뒤에 붙으므로
   *    **배열 뒤쪽을 최근 추가분**으로 본다 (id 하드코딩을 피하려는 의도).
   *
   * 품절 메뉴는 제외한다 — 추천해 놓고 못 사면 안 되니까.
   */
  function pickBannerMenus() {
    const sellable = getMenus().filter((m) => !m.soldOut);

    const isFeatured = (m) => (m.tags || []).some((t) => BANNER_TAGS.includes(t));

    const featured = sellable.filter(isFeatured);
    const recent = sellable.slice(-BANNER_MAX).reverse(); // 최근 추가분 (새 것부터)

    const seen = new Set();
    const picked = [];
    const push = (m) => {
      if (!m || seen.has(m.id) || picked.length >= BANNER_MAX) return;
      seen.add(m.id);
      picked.push(m);
    };

    // 태그 메뉴와 신메뉴에 각각 자리를 보장한 뒤, 남는 자리를 마저 채운다
    featured.slice(0, FEATURED_SLOTS).forEach(push);
    recent.slice(0, RECENT_SLOTS).forEach(push);
    featured.forEach(push);
    recent.forEach(push);

    return picked;
  }

  function bannerSlideHtml(menu, i, total) {
    const image = safeImageUrl(menu.image);
    const detailUrl = `menus/detail.html?id=${encodeURIComponent(menu.id)}`;
    const tag = (menu.tags || []).find((t) => BANNER_TAGS.includes(t));

    return `
      <article class="banner__slide"
               role="group"
               aria-roledescription="슬라이드"
               aria-label="${i + 1} / ${total} ${escapeHtml(menu.name)}">
        ${
          image
            ? `<img class="banner__img" src="${escapeHtml(image)}"
                 alt="${escapeHtml(menu.name)}" loading="lazy"
                 onerror="this.style.display='none'">`
            : ''
        }
        <div class="banner__body">
          ${tag ? `<span class="badge banner__tag">${escapeHtml(tag)}</span>` : ''}
          <h3 class="banner__name">${escapeHtml(menu.name)}</h3>
          <p class="banner__desc">${escapeHtml(menu.description)}</p>
          <strong class="banner__price">${formatPrice(menu.price)}</strong>
          <div class="banner__actions">
            <button class="btn btn--primary" data-banner-add="${escapeHtml(menu.id)}">담기</button>
            <a class="btn btn--outline banner__more" href="${detailUrl}">상세 보기</a>
          </div>
        </div>
      </article>`;
  }

  function renderBanner() {
    if (!bannerBox) return;

    const menus = pickBannerMenus();

    // 추천할 게 없으면(전부 품절 등) 배너 섹션 자체를 숨긴다 — 빈 상자를 남기지 않는다
    const section = bannerBox.closest('.banner-section');
    if (menus.length === 0) {
      if (section) section.hidden = true;
      return;
    }
    if (section) section.hidden = false;

    const total = menus.length;

    bannerBox.innerHTML = `
      <div class="banner__viewport">
        <div class="banner__track" data-banner-track>
          ${menus.map((m, i) => bannerSlideHtml(m, i, total)).join('')}
        </div>
      </div>

      <button class="banner__arrow banner__arrow--prev" type="button"
              data-banner-prev aria-label="이전 슬라이드">‹</button>
      <button class="banner__arrow banner__arrow--next" type="button"
              data-banner-next aria-label="다음 슬라이드">›</button>

      <div class="banner__controls">
        <div class="banner__dots" data-banner-dots>
          ${menus
            .map(
              (m, i) => `
            <button class="banner__dot" type="button"
                    data-banner-go="${i}"
                    aria-label="${i + 1}번째 슬라이드로 (${escapeHtml(m.name)})"></button>`
            )
            .join('')}
        </div>
        <button class="banner__toggle" type="button" data-banner-toggle></button>
      </div>`;

    bannerTrack = bannerBox.querySelector('[data-banner-track]');
    bannerSlides = [...bannerBox.querySelectorAll('.banner__slide')];
    bannerDots = [...bannerBox.querySelectorAll('.banner__dot')];

    bannerIndex = 0;
    syncBanner();
    syncToggleButton();
    startAutoplay();
  }

  /** 현재 슬라이드에 맞춰 위치·점·접근성 상태를 한 번에 맞춘다 */
  function syncBanner() {
    if (!bannerTrack) return;

    // transform 만 움직인다 (레이아웃 유발 없이 GPU 합성)
    bannerTrack.style.transform = `translateX(-${bannerIndex * 100}%)`;

    bannerSlides.forEach((slide, i) => {
      const active = i === bannerIndex;
      slide.setAttribute('aria-hidden', String(!active));
      // 화면 밖 슬라이드의 버튼·링크는 탭 순서에서 빼 준다 (안 보이는데 포커스되면 혼란)
      slide.querySelectorAll('a, button').forEach((el) => {
        el.tabIndex = active ? 0 : -1;
      });
    });

    bannerDots.forEach((dot, i) => {
      const active = i === bannerIndex;
      dot.classList.toggle('banner__dot--on', active);
      dot.setAttribute('aria-current', active ? 'true' : 'false');
    });
  }

  function goToSlide(i) {
    if (bannerSlides.length === 0) return;
    // 무한 순환 — 마지막 다음은 처음으로
    bannerIndex = (i + bannerSlides.length) % bannerSlides.length;
    syncBanner();
  }

  const nextSlide = () => goToSlide(bannerIndex + 1);
  const prevSlide = () => goToSlide(bannerIndex - 1);

  /* --- 자동 넘김 --- */

  function startAutoplay() {
    stopAutoplay(); // 타이머가 겹쳐 쌓이지 않게 항상 먼저 정리한다
    if (bannerStopped || bannerSlides.length < 2) return;
    bannerTimer = setInterval(nextSlide, AUTOPLAY_MS);
  }

  function stopAutoplay() {
    if (bannerTimer === null) return;
    clearInterval(bannerTimer);
    bannerTimer = null;
  }

  /** 멈춤/재생 버튼의 라벨·아이콘을 현재 상태에 맞춘다 */
  function syncToggleButton() {
    const btn = bannerBox && bannerBox.querySelector('[data-banner-toggle]');
    if (!btn) return;
    btn.textContent = bannerStopped ? '▶' : '❚❚';
    btn.setAttribute('aria-label', bannerStopped ? '자동 넘김 재생' : '자동 넘김 멈춤');
  }

  /* --- 배너 이벤트 (이벤트 위임 → 다시 그려도 동작) --- */

  if (bannerBox) {
    bannerBox.addEventListener('click', (e) => {
      if (e.target.closest('[data-banner-prev]')) {
        prevSlide();
        startAutoplay(); // 수동 조작 직후엔 타이머를 다시 세어 곧바로 넘어가지 않게 한다
        return;
      }
      if (e.target.closest('[data-banner-next]')) {
        nextSlide();
        startAutoplay();
        return;
      }

      const dot = e.target.closest('[data-banner-go]');
      if (dot) {
        goToSlide(Number(dot.dataset.bannerGo));
        startAutoplay();
        return;
      }

      // 자동 넘김 멈춤/재생 (WCAG — 자동으로 움직이는 콘텐츠는 멈출 수 있어야 한다)
      if (e.target.closest('[data-banner-toggle]')) {
        bannerStopped = !bannerStopped;
        syncToggleButton();
        startAutoplay(); // 멈춤 상태면 내부에서 타이머를 걸지 않는다
        return;
      }

      // 배너에서 담기
      const addBtn = e.target.closest('[data-banner-add]');
      if (!addBtn) return;

      const menu = getMenuById(addBtn.dataset.bannerAdd);
      if (!menu) return;

      // 배너를 띄운 뒤 사장님이 품절 처리했을 수도 있으니 한 번 더 확인
      if (menu.soldOut) {
        showToast(`'${menu.name}' 은(는) 방금 품절되었습니다.`, 'warning');
        renderBanner();
        return;
      }

      addToCart(menu.id, 1);
      showToast(`'${menu.name}' 을(를) 장바구니에 담았습니다.`, 'success');
    });

    // 읽는 중에 넘어가지 않도록, 마우스를 올리거나 키보드 포커스가 들어오면 잠시 멈춘다
    bannerBox.addEventListener('mouseenter', stopAutoplay);
    bannerBox.addEventListener('mouseleave', startAutoplay);
    bannerBox.addEventListener('focusin', stopAutoplay);
    bannerBox.addEventListener('focusout', startAutoplay);
  }

  /* --- 타이머 정리 (메모리 누수 방지) --- */

  // 탭이 백그라운드면 굳이 돌릴 이유가 없다
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopAutoplay();
    else startAutoplay();
  });

  // 페이지를 떠날 때 반드시 정리한다
  window.addEventListener('pagehide', stopAutoplay);

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

  /* ============================================
     애니메이션 켜기/끄기 버튼
     실제 적용(<html>.reduce-motion + localStorage)은 CafeUtils 가 담당하고,
     여기서는 버튼의 문구·aria 상태만 맞춘다.
     ============================================ */

  const motionBtn = $("[data-motion-toggle]");

  /** 현재 상태를 버튼에 반영한다 (off = 애니메이션 꺼짐) */
  function syncMotionButton(off) {
    motionBtn.textContent = off ? "🌊 애니메이션 켜기" : "🌊 애니메이션 끄기";
    // 버튼이 "눌린 상태" = 애니메이션을 끈 상태
    motionBtn.setAttribute("aria-pressed", String(off));
  }

  if (motionBtn) {
    // 저장된 설정을 읽어 문구를 맞춘다 (utils.js 가 이미 <html> 클래스는 반영했다)
    syncMotionButton(isMotionOff());

    motionBtn.addEventListener("click", () => {
      syncMotionButton(toggleMotion()); // 토글 후 상태를 그대로 받아 반영

      // 배너 자동 넘김은 setInterval 이라 CSS 로 못 멈춘다 → 여기서 함께 맞춘다
      bannerStopped = motionDisabled();
      syncToggleButton(); // 배너의 멈춤/재생 버튼 표시도 같이 갱신
      startAutoplay(); // 꺼진 상태면 내부에서 타이머를 걸지 않는다
    });
  }

  renderBanner();
  renderCategories();
  renderPicks();
})();
