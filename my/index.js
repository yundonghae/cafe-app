/* ============================================
   🌊 고객 - 마이페이지 (my/index.html)
   CafeUtils 만 사용하고 localStorage 에 직접 접근하지 않는다.
   프로필(포인트·스탬프) 표시 · 이름 수정 · 최근 주문 미리보기를 담당한다.
   ============================================ */

(function () {
  const {
    $,
    formatPrice,
    formatDateTime,
    escapeHtml,
    showToast,
    getUser,
    saveUser,
    getOrders,
    statusChipHtml,
    getFavoriteMenus,
    toggleFavorite,
    favButtonHtml,
  } = window.CafeUtils;

  const profileBox = $("[data-profile]");
  const recentBox = $("[data-recent]");
  const favBox = $("[data-favorites]");
  const nameForm = $("[data-name-form]");
  const nameInput = $("[data-name-input]");

  /** 스탬프 한 장(무료 음료 1잔)에 필요한 개수 */
  const STAMP_GOAL = 10;

  /** 미리보기로 보여 줄 최근 주문 건수 */
  const RECENT_COUNT = 3;

  /** 이름 길이 제한 (HTML 의 maxlength 와 동일하게 맞춘다) */
  const NAME_MAX = 20;

  /** 저장된 값이 깨져 있어도(문자열·null·음수) 화면이 깨지지 않도록 정규화 */
  function toCount(value) {
    const n = Math.floor(Number(value));
    return Number.isFinite(n) && n > 0 ? n : 0;
  }

  /* ============================================
     렌더 - 프로필 (포인트 · 스탬프)
     ============================================ */

  /**
   * 스탬프를 숫자 대신 아이콘으로 나열한다.
   * 목표(10개)까지 채운 칸은 ☕, 남은 칸은 빈 물방울로 표시한다.
   */
  function stampsHtml(stamp) {
    const filled = Math.min(stamp, STAMP_GOAL);
    const remaining = STAMP_GOAL - filled;

    const slots = Array.from({ length: STAMP_GOAL }, (_, i) =>
      i < filled
        ? `<span class="stamp stamp--filled" aria-hidden="true">☕</span>`
        : `<span class="stamp stamp--empty" aria-hidden="true">🌊</span>`
    ).join("");

    // 목표를 채웠는지에 따라 안내 문구가 달라진다
    const note =
      remaining === 0
        ? "스탬프를 다 모았어요! 무료 음료 한 잔을 받아 가세요. 🎉"
        : `${remaining}개만 더 모으면 무료 음료 한 잔!`;

    return `
      <div class="stamps">
        <div class="stamps__head">
          <span>스탬프</span>
          <span>${filled} / ${STAMP_GOAL}</span>
        </div>
        <!-- 아이콘은 장식이므로 스크린리더에는 아래 문구로 대신 알린다 -->
        <div class="stamps__list" role="img"
             aria-label="스탬프 ${STAMP_GOAL}개 중 ${filled}개 적립">
          ${slots}
        </div>
        <p class="stamps__note">${escapeHtml(note)}</p>
      </div>`;
  }

  function renderProfile(user) {
    const point = toCount(user.point);
    const stamp = toCount(user.stamp);

    profileBox.innerHTML = `
      <div class="card profile">
        <div class="profile__inner">
          <div class="profile__head">
            <span class="profile__avatar" aria-hidden="true">🐚</span>
            <div>
              <p class="profile__greeting">반갑습니다</p>
              <h2 class="profile__name">${escapeHtml(user.name)} 님</h2>
            </div>
          </div>

          <div class="profile__stats">
            <div class="stat">
              <p class="stat__label">보유 포인트</p>
              <!-- 포인트는 금액이 아니므로 formatPrice("원") 대신 P 를 붙인다 -->
              <p class="stat__value">${point.toLocaleString("ko-KR")} P</p>
            </div>
            <div class="stat">
              <p class="stat__label">모은 스탬프</p>
              <p class="stat__value">${stamp.toLocaleString("ko-KR")} 개</p>
            </div>
          </div>

          ${stampsHtml(stamp)}
        </div>
      </div>`;
  }

  /* ============================================
     렌더 - 최근 주문 미리보기
     ============================================ */

  /** 주문 한 줄 (order.items 는 주문 시점의 스냅샷이라 메뉴를 다시 조인하지 않는다) */
  function recentItemHtml(order) {
    const detailUrl = `../orders/detail.html?id=${encodeURIComponent(order.id)}`;

    return `
      <a class="recent-item" href="${detailUrl}">
        <div class="recent-item__top">
          <span class="recent-item__id">${escapeHtml(order.id)}</span>
          ${statusChipHtml(order.status)}
        </div>
        <div class="recent-item__bottom">
          <span class="recent-item__date">${escapeHtml(formatDateTime(order.createdAt))}</span>
          <strong class="recent-item__total">${formatPrice(order.total)}</strong>
        </div>
      </a>`;
  }

  function renderRecent() {
    // getOrders() 는 최신순(unshift)으로 저장되어 있어 앞에서 잘라 쓰면 된다
    const orders = getOrders().slice(0, RECENT_COUNT);

    if (orders.length === 0) {
      recentBox.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">🧾</div>
          <p>아직 주문 내역이 없습니다.</p>
          <p class="text-muted">첫 잔을 골라 바다를 담아 보세요.</p>
        </div>`;
      return;
    }

    recentBox.innerHTML = `
      <div class="recent__list">
        ${orders.map(recentItemHtml).join("")}
      </div>`;
  }

  /* ============================================
     렌더 - 찜한 메뉴
     ============================================ */

  /** http(s) 주소만 통과시켜 위험한 스킴을 막는다 (다른 페이지와 동일) */
  function safeImageUrl(url) {
    return /^https?:\/\//i.test(String(url || "")) ? url : "";
  }

  /** 찜한 메뉴 한 줄 (하트를 다시 누르면 해제되고 목록에서 사라진다) */
  function favItemHtml(menu) {
    const detailUrl = `../menus/detail.html?id=${encodeURIComponent(menu.id)}`;
    const image = safeImageUrl(menu.image);

    return `
      <article class="fav-item${menu.soldOut ? " fav-item--soldout" : ""}">
        <a class="fav-item__thumb" href="${detailUrl}"
           aria-label="${escapeHtml(menu.name)} 상세 보기">
          ${
            image
              ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(menu.name)}"
                   loading="lazy" onerror="this.style.display='none'">`
              : ""
          }
        </a>

        <div class="fav-item__info">
          <h3 class="fav-item__name">
            <a href="${detailUrl}">${escapeHtml(menu.name)}</a>
          </h3>
          <p class="fav-item__price">${formatPrice(menu.price)}</p>
          ${menu.soldOut ? `<span class="chip chip--danger">품절</span>` : ""}
        </div>

        ${favButtonHtml(menu.id)}
      </article>`;
  }

  function renderFavorites() {
    // 사장님이 지운 메뉴는 getFavoriteMenus 가 이미 걸러 준다
    const menus = getFavoriteMenus();

    if (menus.length === 0) {
      favBox.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">🤍</div>
          <p>아직 찜한 메뉴가 없습니다.</p>
          <p class="text-muted">마음에 드는 한 잔에 하트를 눌러 보세요.</p>
          <p style="margin-top: var(--space-lg);">
            <a class="btn btn--primary" href="../menus/list.html">메뉴 보러가기</a>
          </p>
        </div>`;
      return;
    }

    favBox.innerHTML = `
      <div class="fav-list">
        ${menus.map(favItemHtml).join("")}
      </div>`;
  }

  /* ============================================
     이벤트 - 찜 해제 (이벤트 위임 → 다시 그려도 동작)
     ============================================ */

  favBox.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-fav]");
    if (!btn) return;

    const menuId = btn.dataset.fav;
    const menu = getFavoriteMenus().find((m) => m.id === menuId);

    toggleFavorite(menuId);
    // 이 화면은 "찜한 것만" 보여 주므로, 해제하면 목록에서 사라져야 한다 → 다시 그린다
    renderFavorites();
    showToast(menu ? `'${menu.name}' 찜을 해제했습니다.` : "찜을 해제했습니다.");
  });

  /* ============================================
     이벤트 - 이름 수정
     ============================================ */

  nameForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = nameInput.value.trim();

    // 빈 이름이나 공백만 입력한 경우 저장하지 않는다
    if (!name) {
      showToast("이름을 입력해 주세요.", "warning");
      nameInput.focus();
      return;
    }
    if (name.length > NAME_MAX) {
      showToast(`이름은 ${NAME_MAX}자까지 입력할 수 있습니다.`, "warning");
      return;
    }

    // 저장 직전에 최신 사용자 정보를 다시 읽어 포인트·스탬프를 덮어쓰지 않도록 한다
    const user = saveUser({ ...getUser(), name });

    showToast("이름을 저장했습니다.", "success");
    renderProfile(user);
    syncNameInput(user);
  });

  /** 입력창을 저장된 이름으로 되돌린다 (value 는 속성이 아니라 프로퍼티라 이스케이프 불필요) */
  function syncNameInput(user) {
    nameInput.value = user.name;
  }

  /* ============================================
     초기화
     ============================================ */

  // 다른 페이지에서 남긴 안내 메시지가 있으면 이어받아 표시한다
  const flash = sessionStorage.getItem("cafe.flash");
  if (flash) {
    sessionStorage.removeItem("cafe.flash");
    showToast(flash, "success");
  }

  const user = getUser();
  renderProfile(user);
  syncNameInput(user);
  renderRecent();
  renderFavorites();
})();
