/* ============================================
   🌊 카페 앱 - 메뉴 / 카테고리 데이터
   테마: 동해 바다
   localStorage 를 단일 데이터 소스로 사용.
   최초 실행 시 아래 시드 데이터로 초기화된다.

   ⚠️ 내부 선언은 IIFE 로 감싸 전역 스코프 오염을 막는다.
   (window.CafeData 만 외부로 노출)
   ============================================ */

(function () {
/* --- 카테고리 --- */
const CATEGORIES = [
  { id: "ade", name: "에이드 · 소다", emoji: "🌊" },
  { id: "coffee", name: "커피 · 라떼", emoji: "☕" },
  { id: "tea", name: "티 · 밀크티", emoji: "🍵" },
  { id: "smoothie", name: "스무디", emoji: "🥤" },
  { id: "dessert", name: "디저트", emoji: "🍰" },
];

/* --- 시드 메뉴 (바다 컨셉 네이밍) --- */
const SEED_MENUS = [
  {
    id: "m-blue-ocean-ade",
    name: "블루오션 에이드",
    categoryId: "ade",
    price: 6000,
    description: "푸른 바다를 그대로 담은 시그니처. 탄산 위로 층층이 번지는 코발트빛 그라데이션.",
    image: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=600&q=70",
    tags: ["시그니처", "ICE"],
    soldOut: false,
  },
  {
    id: "m-wave-soda",
    name: "파도 소다",
    categoryId: "ade",
    price: 5500,
    description: "톡 쏘는 청량한 탄산이 파도처럼 밀려오는 상쾌한 소다.",
    image: "https://images.unsplash.com/photo-1437418747212-8d9709afab22?w=600&q=70",
    tags: ["ICE"],
    soldOut: false,
  },
  {
    id: "m-lagoon-ade",
    name: "에메랄드 라군 에이드",
    categoryId: "ade",
    price: 6200,
    description: "청록빛 라군을 닮은 라임과 애플민트의 조화. 잔 바닥까지 투명하다.",
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&q=70",
    tags: ["ICE", "시즌"],
    soldOut: false,
  },
  {
    id: "m-deepsea-latte",
    name: "딥씨 라떼",
    categoryId: "coffee",
    price: 5800,
    description: "짙은 에스프레소가 우유 아래 심해처럼 가라앉은 한 잔. 저어 마시면 수면이 열린다.",
    image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=600&q=70",
    tags: ["베스트", "HOT/ICE"],
    soldOut: false,
  },
  {
    id: "m-abyss-coldbrew",
    name: "심해 콜드브루",
    categoryId: "coffee",
    price: 5200,
    description: "18시간 저온 추출로 끌어올린 깊고 묵직한 바디감.",
    image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&q=70",
    tags: ["ICE"],
    soldOut: false,
  },
  {
    id: "m-foam-einspanner",
    name: "물거품 아인슈페너",
    categoryId: "coffee",
    price: 6300,
    description: "파도 거품처럼 소복하게 올린 크림 아래, 진한 커피가 숨어 있다.",
    image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&q=70",
    tags: ["베스트", "HOT/ICE"],
    soldOut: false,
  },
  {
    id: "m-seafog-milktea",
    name: "해무 밀크티",
    categoryId: "tea",
    price: 5900,
    description: "새벽 바다에 내려앉은 안개처럼 뽀얗고 부드러운 홍차 밀크티.",
    image: "https://images.unsplash.com/photo-1558857563-b371033873b8?w=600&q=70",
    tags: ["베스트", "HOT/ICE"],
    soldOut: false,
  },
  {
    id: "m-seaweed-greentea",
    name: "다시마 그린티",
    categoryId: "tea",
    price: 5400,
    description: "동해 해조의 은은한 감칠맛을 더한 이색 녹차. 깔끔한 뒷맛.",
    image: "https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?w=600&q=70",
    tags: ["HOT/ICE", "시즌"],
    soldOut: true,
  },
  {
    id: "m-coral-smoothie",
    name: "산호 스무디",
    categoryId: "smoothie",
    price: 6800,
    description: "산호빛 딸기와 백향과를 곱게 갈아낸 진한 과육 스무디.",
    image: "https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=600&q=70",
    tags: ["시그니처", "ICE"],
    soldOut: false,
  },
  {
    id: "m-sunset-smoothie",
    name: "노을 해변 스무디",
    categoryId: "smoothie",
    price: 6500,
    description: "망고와 라즈베리가 수평선의 노을처럼 번지는 두 겹 스무디.",
    image: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&q=70",
    tags: ["ICE"],
    soldOut: false,
  },
  {
    id: "m-shell-macaron",
    name: "조개 마카롱",
    categoryId: "dessert",
    price: 3200,
    description: "조개껍데기 모양으로 구워낸 파스텔 마카롱. 하루 40개 한정.",
    image: "https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=600&q=70",
    tags: ["한정"],
    soldOut: false,
  },
  {
    id: "m-wave-rollcake",
    name: "물결 롤케이크",
    categoryId: "dessert",
    price: 5600,
    description: "겹겹이 말린 단면이 파도의 결을 닮은 생크림 롤케이크.",
    image: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=600&q=70",
    tags: ["베스트"],
    soldOut: false,
  },
  {
    id: "m-sandbeach-tiramisu",
    name: "모래사장 티라미수",
    categoryId: "dessert",
    price: 6900,
    description: "고운 코코아 가루를 모래처럼 덮은 마스카포네 티라미수.",
    image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&q=70",
    tags: ["베스트"],
    soldOut: false,
  },
  {
    id: "m-wave-croffle",
    name: "파도 크로플",
    categoryId: "dessert",
    price: 5300,
    description: "물결무늬로 바삭하게 눌러 구운 크루아상 와플. 소금 캐러멜을 곁들여.",
    image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&q=70",
    tags: [],
    soldOut: false,
  },

  /* --- 에이드 · 소다 --- */
  {
    id: "m-coralreef-sparkling",
    name: "산호초 스파클링",
    categoryId: "ade",
    price: 6300,
    description: "산호빛 딸기와 애플민트가 탄산 속에서 피어나는 한 잔. 얕은 산호초를 들여다보는 기분.",
    image: "https://images.unsplash.com/photo-1560508180-03f285f67ded?w=600&q=70",
    tags: ["시그니처", "ICE"],
    soldOut: false,
  },
  {
    id: "m-deepberry-soda",
    name: "심해 베리 소다",
    categoryId: "ade",
    price: 6000,
    description: "빛이 닿지 않는 깊이의 검붉은 베리. 민트 한 장이 수면처럼 떠 있다.",
    image: "https://images.unsplash.com/photo-1536935338788-846bb9981813?w=600&q=70",
    tags: ["ICE"],
    soldOut: true,
  },

  /* --- 커피 · 라떼 --- */
  {
    id: "m-hightide-latte",
    name: "만조 라떼",
    categoryId: "coffee",
    price: 5900,
    description: "밀물처럼 차오른 우유 위로 에스프레소가 천천히 밀려든다.",
    image: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&q=70",
    tags: ["HOT/ICE"],
    soldOut: false,
  },
  {
    id: "m-lighthouse-espresso",
    name: "등대 에스프레소",
    categoryId: "coffee",
    price: 5000,
    description: "안개 낀 새벽을 깨우는 한 모금. 짧고 강하게, 등대처럼.",
    image: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=600&q=70",
    tags: ["HOT/ICE"],
    soldOut: false,
  },

  /* --- 티 · 밀크티 --- */
  {
    id: "m-pearl-milktea",
    name: "진주 밀크티",
    categoryId: "tea",
    price: 6200,
    description: "조개가 품은 진주처럼, 잔 바닥에 알알이 가라앉은 타피오카.",
    image: "https://images.unsplash.com/photo-1525803377221-4f6ccdaa5133?w=600&q=70",
    tags: ["베스트", "ICE"],
    soldOut: false,
  },
  {
    id: "m-current-matcha",
    name: "해류 말차 라떼",
    categoryId: "tea",
    price: 6100,
    description: "우유 위에 말차가 해류처럼 굽이쳐 흐른다. 잔잔하게 저어 마실 것.",
    image: "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=600&q=70",
    tags: ["HOT/ICE"],
    soldOut: false,
  },

  /* --- 스무디 --- */
  {
    id: "m-starfish-smoothie",
    name: "불가사리 스무디",
    categoryId: "smoothie",
    price: 6600,
    description: "모래 위에 놓인 불가사리를 닮은 분홍빛. 딸기를 통째로 갈아 넣었다.",
    image: "https://images.unsplash.com/photo-1502741224143-90386d7f8c82?w=600&q=70",
    tags: ["ICE", "시즌"],
    soldOut: false,
  },
  {
    id: "m-sandbar-mango",
    name: "모래섬 망고 스무디",
    categoryId: "smoothie",
    price: 6800,
    description: "썰물에 드러난 모래섬처럼 노랗게 짙은 망고. 라임으로 끝맛을 씻어 낸다.",
    image: "https://images.unsplash.com/photo-1546173159-315724a31696?w=600&q=70",
    tags: ["ICE"],
    soldOut: false,
  },

  /* --- 디저트 --- */
  {
    id: "m-shipwreck-gateau",
    name: "난파선 가토쇼콜라",
    categoryId: "dessert",
    price: 6500,
    description: "해저에 가라앉은 난파선처럼 짙고 묵직한 초콜릿. 포크가 천천히 잠긴다.",
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=70",
    tags: ["시그니처"],
    soldOut: false,
  },
  {
    id: "m-mermaid-raspberry",
    name: "인어 라즈베리 케이크",
    categoryId: "dessert",
    price: 6900,
    description: "물거품처럼 새하얀 크림 사이로 붉은 라즈베리가 비친다.",
    image: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600&q=70",
    tags: ["시즌"],
    soldOut: true,
  },
];

/* ============================================
   저장소 키 & 초기화
   ============================================ */

const STORAGE_KEYS = {
  MENUS: "cafe.menus",
  CATEGORIES: "cafe.categories",
  CART: "cafe.cart",
  ORDERS: "cafe.orders",
  USER: "cafe.user",
};

/** 최초 1회 시드 데이터를 localStorage 에 심는다. */
function seedData() {
  if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(CATEGORIES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.MENUS)) {
    localStorage.setItem(STORAGE_KEYS.MENUS, JSON.stringify(SEED_MENUS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.USER)) {
    localStorage.setItem(
      STORAGE_KEYS.USER,
      JSON.stringify({ name: "손님", point: 1200, stamp: 4 })
    );
  }
}

// 스크립트 로드 즉시 초기화
seedData();

/* ============================================
   메뉴 / 카테고리 조회 (읽기)
   ============================================ */

function getCategories() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORIES)) || [];
}

function getCategoryById(id) {
  return getCategories().find((c) => c.id === id) || null;
}

function getMenus() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.MENUS)) || [];
}

function getMenuById(id) {
  return getMenus().find((m) => m.id === id) || null;
}

/** categoryId 가 없거나 "all" 이면 전체 반환 */
function getMenusByCategory(categoryId) {
  if (!categoryId || categoryId === "all") return getMenus();
  return getMenus().filter((m) => m.categoryId === categoryId);
}

/* ============================================
   메뉴 CRUD (관리자용, 쓰기)
   ============================================ */

function saveMenus(menus) {
  localStorage.setItem(STORAGE_KEYS.MENUS, JSON.stringify(menus));
}

function createMenu(menu) {
  const menus = getMenus();
  const newMenu = {
    id: "m-" + Date.now().toString(36),
    tags: [],
    soldOut: false,
    ...menu,
    price: Number(menu.price) || 0,
  };
  menus.push(newMenu);
  saveMenus(menus);
  return newMenu;
}

function updateMenu(id, patch) {
  const menus = getMenus();
  const idx = menus.findIndex((m) => m.id === id);
  if (idx === -1) return null;
  menus[idx] = { ...menus[idx], ...patch, id };
  if (patch.price !== undefined) menus[idx].price = Number(patch.price) || 0;
  saveMenus(menus);
  return menus[idx];
}

function deleteMenu(id) {
  const menus = getMenus().filter((m) => m.id !== id);
  saveMenus(menus);
}

// 전역 노출 (모듈 번들러 없이 script 태그로 로드)
window.CafeData = {
  STORAGE_KEYS,
  // 카테고리
  getCategories,
  getCategoryById,
  // 메뉴 조회
  getMenus,
  getMenuById,
  getMenusByCategory,
  // 메뉴 CRUD
  createMenu,
  updateMenu,
  deleteMenu,
  saveMenus,
};
})();
