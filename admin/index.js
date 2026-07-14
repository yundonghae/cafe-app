/* ============================================
   🌊 관리자 - 대시보드 (index.html)
   CafeData / CafeUtils 만 사용하고 localStorage 에 직접 접근하지 않는다.
   메뉴·주문 요약 지표와 최근 주문 미리보기를 보여 준다. (읽기 전용 화면)
   ============================================ */

(function () {
  // 🔐 관리자 세션 가드 — 다른 로직보다 먼저. 통과 못 하면 렌더하지 않고 즉시 빠져나간다.
  //    (이 탭에서 이미 인증했으면 묻지 않고 통과 / 실패 시 손님 홈으로 보내진다)
  if (!window.CafeUtils.requireAdmin("../index.html")) return;

  const {
    $,
    formatPrice,
    formatDateTime,
    escapeHtml,
    getOrders,
    ORDER_STATUS,
    statusChipHtml,
    emptyStateHtml,
  } = window.CafeUtils;
  const { getMenus } = window.CafeData;

  const statusStatsBox = $("[data-status-stats]");
  const recentBox = $("[data-recent]");
  const rankingBox = $("[data-ranking]");

  /** 미리보기로 보여 줄 최근 주문 건수 */
  const RECENT_COUNT = 5;

  /** 매출에서 제외할 상태 (취소된 주문은 돈이 들어오지 않았다) */
  const NON_REVENUE = ["canceled"];

  /* ============================================
     집계
     ============================================ */

  /**
   * 주문을 한 번만 순회하며 상태별 건수와 매출을 함께 계산한다.
   * ORDER_STATUS 의 키를 그대로 써서, 나중에 상태가 늘어도 코드를 고칠 필요가 없다.
   */
  function summarize(orders) {
    const byStatus = {};
    Object.keys(ORDER_STATUS).forEach((key) => (byStatus[key] = 0));

    let revenue = 0;
    orders.forEach((o) => {
      // 알 수 없는 상태가 저장돼 있어도 건수 집계가 깨지지 않도록 방어한다
      if (byStatus[o.status] === undefined) byStatus[o.status] = 0;
      byStatus[o.status] += 1;

      if (!NON_REVENUE.includes(o.status)) revenue += Number(o.total) || 0;
    });

    return { byStatus, revenue };
  }

  /* ============================================
     렌더 - 요약 지표
     ============================================ */

  function renderStats() {
    const menus = getMenus();
    const orders = getOrders();
    const { byStatus, revenue } = summarize(orders);

    // textContent 로 넣는 값은 이스케이프가 필요 없다
    $('[data-stat="menus"]').textContent = menus.length;
    $('[data-stat="soldout"]').textContent = menus.filter((m) => m.soldOut).length;
    $('[data-stat="orders"]').textContent = orders.length;
    $('[data-stat="revenue"]').textContent = formatPrice(revenue);

    // 상태별 카드 — 상태 칩을 써야 해서 innerHTML 로 그린다
    statusStatsBox.innerHTML = Object.keys(ORDER_STATUS)
      .map(
        (key) => `
        <div class="card stat">
          <span class="stat__label stat__chip">${statusChipHtml(key)}</span>
          <strong class="stat__value">${byStatus[key] || 0}건</strong>
        </div>`
      )
      .join("");
  }

  /* ============================================
     렌더 - 최근 주문 미리보기
     ============================================ */

  /** 주문 한 줄 (7단계 my/index.js 의 recentItemHtml 과 같은 구조, 링크만 관리자용) */
  function recentItemHtml(order) {
    const detailUrl = `./orders/detail.html?id=${encodeURIComponent(order.id)}`;

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
          ${emptyStateHtml(
            "bottle", // 물결 위 유리병 — 아직 도착한 주문이 없다
            "아직 들어온 주문이 없습니다.",
            "첫 파도를 기다리는 중입니다."
          )}
        </div>`;
      return;
    }

    recentBox.innerHTML = `
      <div class="recent__list">
        ${orders.map(recentItemHtml).join("")}
      </div>`;
  }

  /* ============================================
     인기 메뉴 TOP 5 (판매 수량 랭킹)
     ============================================ */

  /** 랭킹에 보여 줄 개수 */
  const RANK_COUNT = 5;

  /** 1~3위에 붙일 메달 (4위부터는 숫자만) */
  const MEDALS = ["🥇", "🥈", "🥉"];

  /**
   * 메뉴별 판매 수량을 집계해 상위 RANK_COUNT 개를 돌려준다.
   *
   * - **취소된 주문은 제외한다.** 실제로 팔린 게 아니므로 판매 실적에 넣지 않는다.
   * - 집계는 `menuId` 로 묶고, **표시 이름은 order.items 의 name 스냅샷**을 쓴다.
   *   getMenuById 로 다시 조회하지 않는 이유: 메뉴가 삭제·개명돼도
   *   "그때 그 이름으로 이만큼 팔렸다"는 실적은 그대로 남아야 하기 때문이다.
   *   getOrders() 는 최신순이므로 **처음 만난 이름 = 가장 최근 이름**을 쓴다.
   */
  function rankMenus() {
    const tally = new Map(); // menuId → { name, qty }

    getOrders().forEach((order) => {
      if (order.status === "canceled") return; // 취소분은 판매가 아니다

      (order.items || []).forEach((item) => {
        const key = item.menuId || item.name; // menuId 가 없더라도 이름으로는 묶이게
        const qty = Number(item.qty) || 0;
        if (!key || qty <= 0) return;

        const row = tally.get(key);
        if (row) {
          row.qty += qty; // 이름은 덮어쓰지 않는다 (먼저 본 = 더 최근 주문의 이름)
        } else {
          tally.set(key, { name: item.name, qty });
        }
      });
    });

    return [...tally.values()]
      .sort((a, b) => b.qty - a.qty) // 판매 수량 내림차순
      .slice(0, RANK_COUNT);
  }

  function renderRanking() {
    const rows = rankMenus();

    if (rows.length === 0) {
      rankingBox.innerHTML = `
        <div class="empty-state">
          ${emptyStateHtml(
            "bottle", // 아직 도착한 판매 기록이 없다
            "아직 판매 데이터가 없습니다.",
            "주문이 쌓이면 잘 팔리는 메뉴를 여기에 모아 보여 드립니다."
          )}
        </div>`;
      return;
    }

    // 막대 길이는 1위 대비 비율 (1위가 항상 100%)
    const top = rows[0].qty;

    rankingBox.innerHTML = `
      <ol class="ranking__list">
        ${rows
          .map((row, i) => {
            const percent = Math.round((row.qty / top) * 100);
            const medal = MEDALS[i] || "";

            return `
              <li class="ranking__item${i < MEDALS.length ? " ranking__item--top" : ""}">
                <span class="ranking__rank" aria-hidden="true">${medal || i + 1}</span>

                <div class="ranking__body">
                  <div class="ranking__line">
                    <span class="ranking__name">${escapeHtml(row.name)}</span>
                    <strong class="ranking__qty">${row.qty}잔</strong>
                  </div>
                  <!-- 막대는 장식 — 수치는 위 텍스트로 이미 읽힌다 -->
                  <div class="ranking__bar" aria-hidden="true">
                    <span class="ranking__bar-fill" style="width: ${percent}%"></span>
                  </div>
                </div>

                <span class="sr-only">${i + 1}위, ${escapeHtml(row.name)}, ${row.qty}잔 판매</span>
              </li>`;
          })
          .join("")}
      </ol>`;
  }

  /* ============================================
     초기화
     ============================================ */

  // 다른 관리자 페이지가 남긴 안내 메시지를 이어받아 표시한다
  const flash = sessionStorage.getItem("cafe.flash");
  if (flash) {
    sessionStorage.removeItem("cafe.flash");
    window.CafeUtils.showToast(flash, "success");
  }

  renderStats();
  renderRanking();
  renderRecent();
})();
