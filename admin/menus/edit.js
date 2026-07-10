/* ============================================
   🌊 관리자 - 메뉴 수정 (edit.html)
   ?id=<메뉴 ID> 로 기존 값을 불러와 폼을 채우고,
   CafeData.updateMenu() 로 저장한다.
   ============================================ */

(function () {
  const { $, getParam, formatPrice, escapeHtml } = window.CafeUtils;
  const { getMenuById, getCategories, getCategoryById, updateMenu } = window.CafeData;

  const form = $("#menu-form");
  const missing = $("[data-missing]");
  const id = getParam("id");
  const menu = id ? getMenuById(id) : null;

  /* ============================================
     메뉴를 찾지 못한 경우 — 폼을 감추고 안내만 띄운다
     ============================================ */

  if (!menu) {
    form.hidden = true;
    missing.hidden = false;
    missing.innerHTML = `
      <div class="card empty-state">
        <div class="empty-state__icon">🧭</div>
        <p>수정할 메뉴가 해류에 휩쓸려 사라졌습니다.</p>
        <p class="text-muted">삭제되었거나 잘못된 주소일 수 있습니다.</p>
        <p style="margin-top: var(--space-lg);">
          <a class="btn btn--primary" href="./list.html">메뉴 목록으로</a>
        </p>
      </div>`;
    return; // 아래 로직은 실행하지 않는다
  }

  document.title = `${menu.name} 수정 · 동해 카페 관리자`;

  const fields = {
    name: $("#name"),
    categoryId: $("#categoryId"),
    price: $("#price"),
    image: $("#image"),
    description: $("#description"),
    tags: $("#tags"),
    soldOut: $("#soldOut"),
  };

  /* ============================================
     카테고리 셀렉트 채우기 + 기존 값 선택
     ============================================ */

  fields.categoryId.innerHTML =
    `<option value="">카테고리를 선택하세요</option>` +
    getCategories()
      .map(
        (c) =>
          `<option value="${escapeHtml(c.id)}">${escapeHtml(
            `${c.emoji} ${c.name}`
          )}</option>`
      )
      .join("");

  /* ============================================
     기존 값으로 폼 채우기
     ============================================ */

  fields.name.value = menu.name;
  fields.categoryId.value = menu.categoryId;
  fields.price.value = menu.price;
  fields.image.value = menu.image || "";
  fields.description.value = menu.description || "";
  fields.tags.value = (menu.tags || []).join(", ");
  fields.soldOut.checked = Boolean(menu.soldOut);

  // 취소 버튼은 원래 보던 상세 페이지로 돌려보낸다
  $("[data-cancel]").href = `./detail.html?id=${encodeURIComponent(menu.id)}`;

  /* ============================================
     유효성 검사
     ============================================ */

  /** 오류 메시지를 지우고 입력칸을 정상 상태로 되돌린다 */
  function clearError(key) {
    $(`[data-error="${key}"]`).textContent = "";
    fields[key].classList.remove("input--invalid");
  }

  /** 오류 메시지를 표시하고 입력칸을 산호빛으로 강조한다 */
  function setError(key, message) {
    $(`[data-error="${key}"]`).textContent = message;
    fields[key].classList.add("input--invalid");
  }

  /**
   * 폼 전체를 검사한다.
   * @returns {object|null} 통과하면 저장할 값 객체, 실패하면 null
   */
  function validate() {
    ["name", "categoryId", "price", "image", "description"].forEach(clearError);

    const name = fields.name.value.trim();
    const categoryId = fields.categoryId.value;
    const priceRaw = fields.price.value.trim();
    const image = fields.image.value.trim();
    const description = fields.description.value.trim();

    let firstInvalid = null;
    const fail = (key, msg) => {
      setError(key, msg);
      if (!firstInvalid) firstInvalid = fields[key];
    };

    if (!name) fail("name", "메뉴 이름을 입력해 주세요.");
    if (!categoryId) fail("categoryId", "카테고리를 선택해 주세요.");

    const price = Number(priceRaw);
    if (!priceRaw) {
      fail("price", "가격을 입력해 주세요.");
    } else if (!Number.isFinite(price) || price < 0) {
      fail("price", "가격은 0 이상의 숫자여야 합니다.");
    }

    // 이미지는 선택 항목이지만, 입력했다면 http(s) 주소여야 한다
    if (image && !/^https?:\/\//i.test(image)) {
      fail("image", "http:// 또는 https:// 로 시작하는 주소를 입력해 주세요.");
    }

    if (!description) fail("description", "메뉴 설명을 입력해 주세요.");

    if (firstInvalid) {
      firstInvalid.focus();
      return null;
    }

    // 태그: 쉼표로 나누고 공백 제거, 빈 값은 버린다
    const tags = fields.tags.value
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    return {
      name,
      categoryId,
      price,
      image,
      description,
      tags,
      soldOut: fields.soldOut.checked,
    };
  }

  /* ============================================
     실시간 미리보기
     ============================================ */

  function updatePreview() {
    const name = fields.name.value.trim();
    const price = Number(fields.price.value) || 0;
    const description = fields.description.value.trim();
    const image = fields.image.value.trim();
    const category = getCategoryById(fields.categoryId.value);

    // textContent 로 넣으므로 이스케이프가 따로 필요 없다 (XSS 안전)
    $("[data-preview-name]").textContent = name || "메뉴 이름";
    $("[data-preview-price]").textContent = formatPrice(price);
    $("[data-preview-desc]").textContent =
      description || "메뉴 설명이 이곳에 나타납니다.";
    $("[data-preview-category]").textContent = category
      ? `${category.emoji} ${category.name}`
      : "카테고리";

    // 유효한 http(s) 주소일 때만 이미지를 띄운다
    const img = $("[data-preview-image]");
    if (/^https?:\/\//i.test(image)) {
      img.src = image;
      img.alt = name;
      img.hidden = false;
    } else {
      img.removeAttribute("src");
      img.hidden = true;
    }
  }

  // 이미지 주소가 깨졌다면 미리보기에서 감춘다
  $("[data-preview-image]").addEventListener("error", (e) => {
    e.target.hidden = true;
  });

  // 검증 대상이 되는 칸 (오류 표시를 붙였다 떼는 대상)
  const VALIDATED = new Set(["name", "categoryId", "price", "image", "description"]);

  // 입력할 때마다 미리보기 갱신 + 해당 칸의 오류 표시 해제
  Object.entries(fields).forEach(([key, el]) => {
    el.addEventListener("input", () => {
      if (VALIDATED.has(key)) clearError(key);
      updatePreview();
    });
  });

  /* ============================================
     제출
     ============================================ */

  form.addEventListener("submit", (e) => {
    e.preventDefault(); // 정적 사이트라 서버 전송은 없다

    const values = validate();
    if (!values) return;

    const updated = updateMenu(menu.id, values);

    // 삭제된 뒤에 저장을 눌렀다면 updateMenu 가 null 을 돌려준다
    if (!updated) {
      sessionStorage.setItem(
        "cafe.flash",
        "이미 사라진 메뉴라 저장하지 못했습니다."
      );
      location.href = "./list.html";
      return;
    }

    // 목록 페이지에서 띄울 안내 메시지를 남기고 이동한다
    sessionStorage.setItem("cafe.flash", `'${updated.name}' 메뉴를 다듬었습니다.`);
    location.href = "./list.html";
  });

  // 첫 진입 시 기존 값 기준으로 미리보기 초기화
  updatePreview();
})();
