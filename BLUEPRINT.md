# ☕ 카페 앱 - 프로젝트 청사진

## 📁 폴더 구조 (완전 코로케이션)

```
cafe-app/
│
├── index.html                        # 메인 (고객)
├── index.css                         # 메인 페이지 스타일
└── index.js                          # 메인 페이지 로직
│
├── 👤 고객 - 메뉴
│   └── menus/
│       ├── list.html                 # 메뉴 목록
│       ├── list.css
│       ├── list.js
│       ├── detail.html               # 메뉴 상세
│       ├── detail.css
│       └── detail.js
│
├── 👤 고객 - 마이페이지
│   └── my/
│       ├── index.html                # 마이페이지 메인
│       ├── index.css
│       └── index.js
│
├── 👤 고객 - 장바구니
│   └── basket/
│       ├── list.html                 # 장바구니
│       ├── list.css
│       └── list.js
│
├── 👤 고객 - 주문 내역
│   └── orders/
│       ├── list.html                 # 주문 내역 목록
│       ├── list.css
│       ├── list.js
│       ├── detail.html               # 주문 상세
│       ├── detail.css
│       └── detail.js
│
├── 🔴 관리자/사장
│   └── admin/
│       ├── index.html                # 대시보드
│       ├── index.css
│       ├── index.js
│       │
│       ├── menus/
│       │   ├── list.html             # 메뉴 목록
│       │   ├── list.css
│       │   ├── list.js
│       │   ├── detail.html           # 메뉴 상세
│       │   ├── detail.css
│       │   ├── detail.js
│       │   ├── create.html           # 메뉴 추가
│       │   ├── create.css
│       │   ├── create.js
│       │   ├── edit.html             # 메뉴 수정
│       │   ├── edit.css
│       │   └── edit.js
│       │
│       └── orders/
│           ├── list.html             # 주문 목록
│           ├── list.css
│           ├── list.js
│           ├── detail.html           # 주문 상세
│           ├── detail.css
│           └── detail.js
│
├── 📦 공유 자원
│   ├── css/
│   │   └── variables.css             # CSS 변수 (전역)
│   └── js/
│       ├── data.js                   # 메뉴/카테고리 데이터
│       └── utils.js                  # 공통 유틸리티
│
└── jsconfig.json                     # 편집기 설정 (순수 JS · checkJs: false)
```

## 👥 역할별 기능

| 역할            | 경로                                           | 주요 기능                                        |
| --------------- | ---------------------------------------------- | ------------------------------------------------ |
| **고객**        | `/`, `/menus/`, `/my/`, `/basket/`, `/orders/` | 메인, 메뉴 조회, 마이페이지, 장바구니, 주문 내역 |
| **관리자/사장** | `/admin/`, `/admin/menus/`, `/admin/orders/`   | 대시보드, 메뉴 CRUD, 주문 관리                   |

## 🎨 디자인 — "동해 바다"

- **테마**: 깊은 바다색 계열 (딥오션 네이비 `#0a2540` · 코발트블루 · 청록 · 밝은 하늘색)
- **포인트**: 파도 흰색 거품 · 모래빛 베이지
- **분위기**: 시원하고 청량한 바다, 그라데이션으로 수면 느낌
- **카드 스타일**: Glass morphism (반투명 + 블러 → 물결/물방울 질감)
- **폰트**: 깔끔한 산세리프 (Pretendard)
- **레이아웃**: 반응형 (모바일/데스크톱)

## 📐 코로케이션 원칙

- **HTML과 동일한 디렉토리에 css, js 파일을 평탄하게 배치** (별도 하위 폴더 없음)
- **파일명은 HTML 파일명과 동일하게 매칭** (`index.html` → `index.css`, `index.js`)
- 전역 공통 자원만 `/css/`, `/js/` 폴더에 분리
- 역할별 독립 폴더로 관심사를 분리

## 🧩 구현 규약 (2단계에서 확정)

- **스크립트 로드 순서**: `data.js` → `utils.js` → 페이지 JS. `defer` 로 순서를 보장한다.
  (`utils.js` 는 `window.CafeData` 에 의존)
- **페이지 JS 는 IIFE 로 감싸고**, `window.CafeData` / `window.CafeUtils` 를 통해서만 데이터에 접근한다.
- **색상은 하드코딩 금지.** 새 CSS 는 `variables.css` 의 `var(--*)` 만 사용한다.
- **공통 컴포넌트 클래스**(`.card` `.btn` `.badge` `.chip` `.field` `.input` `.glass`)는
  재정의하지 않고, 하위·조합 선택자로만 확장한다.
- **XSS 방어**: `innerHTML` 로 출력하는 모든 사용자 입력에 `CafeUtils.escapeHtml()` 적용.
  단, **이미지 주소는 이스케이프만으로 부족**하므로 `http(s)` 스킴만 통과시키는
  `safeImageUrl()` 을 각 페이지에 둔다 (`javascript:` 차단).
  `textContent` 로 넣는 값은 이스케이프가 필요 없다.
- **페이지 이동 후 토스트**: 이동하면 토스트가 사라지므로, 보낼 메시지를
  `sessionStorage` 의 `cafe.flash` 키에 남기고 **도착 페이지가 읽어서 `showToast()`** 한다.
  (등록·수정·삭제 결과를 목록 페이지에서 표시)
- **삭제는 항상 `confirm()` 후 실행**하고, 목록/그리드의 버튼은 **이벤트 위임**으로 처리한다
  (다시 렌더해도 동작하도록).
- **관리자 헤더**(`.admin-top`)는 현재 각 페이지 CSS 에 중복 정의되어 있다.
  코로케이션 원칙 때문에 생긴 의도적 중복이며, **8단계에서 공용화 여부를 재검토**한다.

---

## ✅ 구현 TODO

### 1단계: 공유 자원

- [x] `css/variables.css` — 전역 CSS 변수, 리셋
- [x] `js/data.js` — 메뉴/카테고리 데이터
- [x] `js/utils.js` — 공통 유틸리티 (카트, 포맷 등)

### 2단계: 관리자 - 메뉴 관리 시스템 ✅

- [x] `admin/menus/list.html` — 메뉴 목록
- [x] `admin/menus/list.css`
- [x] `admin/menus/list.js`
- [x] `admin/menus/detail.html` — 메뉴 상세
- [x] `admin/menus/detail.css`
- [x] `admin/menus/detail.js`
- [x] `admin/menus/create.html` — 메뉴 추가
- [x] `admin/menus/create.css`
- [x] `admin/menus/create.js`
- [x] `admin/menus/edit.html` — 메뉴 수정
- [x] `admin/menus/edit.css`
- [x] `admin/menus/edit.js`

### 3단계: 고객 - 메뉴 조회 시스템 ✅

- [x] `menus/list.html` — 메뉴 목록 (카테고리 필터 · 검색 · 카드에서 바로 담기)
- [x] `menus/list.css`
- [x] `menus/list.js`
- [x] `menus/detail.html` — 메뉴 상세 (수량 스텝퍼 · 합계 · 장바구니 담기)
- [x] `menus/detail.css`
- [x] `menus/detail.js`

> 고객 헤더는 `.site-header` 로 새로 정의 (관리자의 `.admin-top` 과 구분).
> 장바구니 아이콘은 `data-cart-badge` 를 달아 `CafeUtils.updateCartBadges()` 가 자동으로 채운다.
> 품절 메뉴는 담기 버튼을 `disabled` 처리한다.

### 4단계: 고객 - 장바구니 관리 시스템 ✅

- [x] `basket/list.html` — 장바구니 (수량 스텝퍼 · 항목 삭제 · 결제 요약 · 주문하기)
- [x] `basket/list.css`
- [x] `basket/list.js`

> 헤더는 3단계의 `.site-header` 를 그대로 재사용한다 (코로케이션 중복, 8단계에서 재검토).
> 장바구니 본문 전체를 `render()` 가 다시 그리므로 모든 조작은 **이벤트 위임**으로 처리한다.
> 수량은 화면 숫자가 아니라 `getCartDetail()` 의 저장값을 기준으로 계산한다.
> `updateCartQty()` 는 최소 1로 고정되므로, 1개에서 감소는 삭제 버튼으로 안내한다.
> `checkout()` 이 `null`(빈 장바구니)이면 아무 동작도 하지 않는다.
> 주문 성공 시 `sessionStorage` 의 `cafe.flash` 에 메시지를 남기고
> 방금 만든 주문의 `orders/detail.html?id=...` 로 이동한다 (5단계에서 교체 완료).

### 5단계: 고객 - 주문 관리 시스템 ✅

- [x] `orders/list.html` — 주문 내역 목록 (상태 칩 · 메뉴 요약 · 총액 · 상세보기)
- [x] `orders/list.css`
- [x] `orders/list.js`
- [x] `orders/detail.html` — 주문 상세 (메뉴 표 · 총액 · 주문 취소)
- [x] `orders/detail.css`
- [x] `orders/detail.js`

> `getOrders()` 는 `unshift` 로 저장되어 이미 최신순이므로 페이지에서 다시 정렬하지 않는다.
> `order.items` 는 주문 시점의 **스냅샷**(`{menuId,name,price,qty}`)이다.
> 메뉴가 삭제·가격 변경돼도 주문 내역은 그대로 남아야 하므로 `getMenuById()` 로 다시 조인하지 않는다.
> 같은 이유로 메뉴명은 상세 페이지로 링크하지 않는다 (삭제된 메뉴로 이어질 수 있음).
> 취소는 `pending`(접수 대기) 주문만 가능하다. 클릭 시점에 상태를 다시 읽어
> 그 사이 사장님이 `making` 으로 바꿨다면 취소를 거부한다.
> `cafe.flash` 는 `orders/list.js` 와 `orders/detail.js` 양쪽에서 읽는다.
>
> ⚠️ 아직 `.site-header` 내비게이션에 **주문 내역 링크가 없다.** 현재 `orders/` 는
> 결제 후 리다이렉트로만 진입한다. 헤더는 3·4단계와 동일하게 유지하라는 제약 때문에
> 건드리지 않았으니, **6단계(메인 페이지)에서 헤더 내비를 함께 확장**할 것.

### 6단계: 고객 - 메인 페이지 ✅

- [x] `index.html` — 히어로 · 카테고리 바로가기 · 인기 메뉴 · 카페 소개 · 푸터
- [x] `index.css`
- [x] `index.js`

> **루트 페이지라 경로 규칙이 다르다.** `index.html` 만 `../` 없이
> `css/variables.css` · `js/data.js` · `menus/list.html` 처럼 루트 기준으로 참조한다.
> 헤더 마크업은 3·4·5단계와 동일하고 링크에서 `../` 만 뺐다.
>
> 카테고리 바로가기는 `menus/list.html?category=<id>` 로 이동한다.
> 이를 위해 **`menus/list.js` 초기화부에 4줄을 추가**했다 (기존 로직은 그대로):
> `getParam("category")` 가 실재하는 카테고리 id 일 때만 `state.categoryId` 기본값으로 쓴다.
> 없는 id 는 무시하고 "전체" 를 유지하므로 잘못된 쿼리로 빈 화면이 뜨지 않는다.
>
> 인기 메뉴는 품절을 제외하고 `베스트`·`시그니처` 태그 메뉴를 먼저 채운 뒤
> 나머지를 임의로 채워 최대 6개를 노출한다 (매 방문마다 순서가 섞인다).
>
> 헤더 내비에 **주문 내역 링크는 여전히 없다.** 대신 히어로의 보조 버튼으로
> `orders/list.html` 진입점을 열어 두었다. 헤더 내비 확장은 7·8단계에서 재검토.

### 7단계: 고객 - 마이페이지 ✅

- [x] `my/index.html` — 프로필(포인트·스탬프) · 이름 수정 · 최근 주문 · 바로가기
- [x] `my/index.css`
- [x] `my/index.js`

> 스탬프는 `STAMP_GOAL`(10개) 기준으로 채운 칸(☕)과 남은 칸(🌊)을 아이콘으로 나열한다.
> 아이콘은 장식이므로 `aria-hidden` 처리하고, 목록에 `role="img"` + `aria-label` 로 대체 텍스트를 준다.
> `getUser()` 의 `point`/`stamp` 는 저장값이 깨져 있어도(문자열·null·음수) `toCount()` 로 정규화한다.
> 포인트는 금액이 아니므로 `formatPrice()`("원") 대신 `P` 를 붙인다.
> 이름 저장은 `saveUser({ ...getUser(), name })` — 저장 직전에 최신 사용자를 다시 읽어
> 다른 탭에서 바뀐 포인트·스탬프를 덮어쓰지 않는다. 공백만 입력하면 저장하지 않는다.
> 입력창은 `value` **프로퍼티**로 채우므로 `escapeHtml()` 이 필요 없다 (innerHTML 이 아님).
>
> ⚠️ 헤더 내비에 **마이페이지 링크도 아직 없다.** `my/` 는 현재 직접 주소로만 진입한다.
> 헤더 내비 확장(주문 내역 + 마이페이지)은 **8단계에서 `.site-header` 공용화와 함께 처리**할 것.

### 8단계: 관리자 - 대시보드 & 주문 관리 ✅

- [x] `admin/index.html` — 대시보드 (요약 지표 · 상태별 주문 · 최근 주문 · 바로가기)
- [x] `admin/index.css`
- [x] `admin/index.js`
- [x] `admin/orders/list.html` — 주문 목록 (상태 필터 · 행에서 다음 상태로 전환)
- [x] `admin/orders/list.css`
- [x] `admin/orders/list.js`
- [x] `admin/orders/detail.html` — 주문 상세 (메뉴 표 · 상태 전이 컨트롤)
- [x] `admin/orders/detail.css`
- [x] `admin/orders/detail.js`

> **상태 전이는 페이지가 책임진다.** `updateOrderStatus()` 는 아무 문자열이나 받아 그대로 저장하므로
> (검증 로직이 없다) 허용 전이를 각 페이지의 상수로 명시한다:
> `pending → making|canceled`, `making → done|canceled`, `done`·`canceled` 는 종착 상태.
> 목록은 정방향(`pending→making→done`)만, 상세는 취소까지 제공한다.
> 클릭 시점에 `getOrderById()` 로 상태를 **다시 읽어** 판정하므로,
> 다른 탭에서 먼저 바뀐 주문을 잘못된 상태로 덮어쓰지 않는다.
> 취소는 되돌릴 수 없어 `confirm()` 후 실행한다.
>
> 대시보드의 총 매출은 `canceled` 를 뺀 주문의 `total` 합계다 (= 접수 대기 + 제조 중 + 완료).
> 상태별 건수는 `ORDER_STATUS` 의 키를 순회해 만들므로 상태가 늘어도 코드를 고칠 필요가 없다.
>
> 관리자 헤더 `.admin-top` 은 2단계 것을 그대로 복사했고, 내비만 3링크
> (대시보드 · 메뉴 관리 · 주문 관리)로 확장했다.
> ⚠️ **`admin/menus/*.html` 4개 파일의 내비는 아직 2링크(메뉴 관리 · 메뉴 추가)** 라
> 거기서는 대시보드·주문 관리로 갈 수 없다. 아래 후속 작업 참고.

---

## 🔭 후속 작업 (청사진 8단계 이후)

구현하며 쌓인 **의도된 부채**를 한곳에 모아 둔다. 모두 기능 결함이 아니라 일관성 문제다.

- [ ] **헤더 공용화** — `.site-header`(고객 7페이지)와 `.admin-top`(관리자 7페이지)이
      각 CSS 에 인라인 복붙되어 있다. 코로케이션 원칙과 충돌하므로 공용화 여부를 결정할 것.
      (아래 햄버거 메뉴로 헤더 CSS 가 73줄 더 늘어 7곳에 복제됐다 — 공용화 필요성이 커졌다)
- [x] **애니메이션 켜기/끄기 토글** — 메인 히어로에 버튼 하나로 사이트 전체 애니메이션을 끈다.
      상태는 `localStorage["cafe.motionOff"]` 에 저장되어 **모든 페이지·새로고침에서 유지**된다.
      - `css/variables.css` — 기존 `@media (prefers-reduced-motion: reduce)` 블록은 **그대로 두고**,
        같은 내용을 `html.reduce-motion` 클래스에도 적용하는 규칙만 추가.
        → 기기 설정은 계속 존중되고(설정이 켜진 사용자는 처음부터 꺼진 상태), 버튼은 그 위에 얹힌다.
      - `js/utils.js` — **새 함수만** 추가: `isMotionOff()` · `toggleMotion()` · `initMotion()`.
        `initMotion()` 은 utils.js 로드 즉시 실행되므로, **utils.js 를 쓰는 전 페이지에 자동 반영**된다
        (`<html>` 에 `.reduce-motion` 을 붙이는 방식이라 페이지별 CSS 수정이 전혀 필요 없다).
      - `index.html` / `index.js` — 히어로에 토글 버튼(`data-motion-toggle`, `aria-pressed`).
        기존 `.btn` / `.hero__ghost` 를 재사용해 **새 CSS 없음**.
      - ⚠️ **CSS 만으로는 부족했다.** `.reduce-motion` 은 animation/transition 의 *길이*만 0 으로 만든다.
        `setInterval` 로 도는 **배너 자동 넘김은 CSS 로 멈출 수 없어**, `index.js` 배너의 정지 판정을
        `기기 설정 || isMotionOff()` 로 확장했다 (토글 시 타이머도 즉시 멈추고/재개된다).
        같은 이유로 Web Animations API(`element.animate`)를 쓰는 코드도 CSS 로는 안 잡히니,
        나중에 `js/fly-to-cart.js` 를 다시 배선하면 거기서도 `isMotionOff()` 를 확인해야 한다.
- [x] **메뉴 상세 연관 메뉴 추천 (크로스셀)** — `menus/detail.{js,css}` 하단에
      "함께 즐기면 좋은 메뉴" 섹션 추가. 기존 상세 요소(이미지·담기·하트·수량)는 그대로.
      - **선별**(`relatedMenus`): `getMenusByCategory(menu.categoryId)` →
        **자기 자신 제외**(`m.id !== menu.id`) → **품절 제외**(`!m.soldOut`) → 최대 4개.
        모자라면 있는 만큼만 보여 준다.
      - **추천이 0개면 섹션을 아예 그리지 않는다** — `relatedHtml()` 이 빈 문자열을 반환하므로
        빈 껍데기 섹션이 생기지 않는다 (같은 카테고리에 판매중이 자기뿐인 경우).
      - 카드 클릭 → `menus/detail.html?id=...` 로 이동하면 `detail.js` 가 페이지 로드마다
        **그 메뉴의 categoryId 로 다시 계산**하므로 추천이 자연스럽게 갱신된다 (실제 확인).
      - 이미지는 기존과 같은 `safeImageUrl()`(http/https 만) 처리. 전역 `.card` 를 재사용하고
        추천 전용 규칙만 덧붙였다. 새 색상 hex 없음.
      - 반응형: 데스크톱은 그리드, **600px 이하에서는 가로 스크롤**(`scroll-snap`)로 넘긴다
        — 2칸으로 쪼개면 카드가 너무 좁아져 메뉴명이 뭉개지기 때문.
- [x] **관리자 대시보드 인기 메뉴 TOP 5** — 판매 수량 랭킹을 `admin/index.{html,css,js}` 에 추가.
      (요약 지표·상태별 주문·최근 주문·바로가기 등 기존 요소는 그대로)
      - **집계**(`rankMenus`): `getOrders()` → `order.items` 를 순회하며 `menuId` 별 `qty` 합산 →
        내림차순 정렬 → 상위 5개.
      - ⚠️ **취소된 주문(`status === "canceled"`)은 통째로 제외**한다. 실제로 팔린 게 아니므로
        판매 실적에 넣지 않는다 (같은 이유로 대시보드 총 매출도 취소분을 뺀다).
      - ⚠️ **`getMenuById` 로 재조회하지 않는다.** `order.items` 는 주문 시점의 스냅샷
        (`{menuId, name, price, qty}`)이라, 메뉴가 **삭제·개명돼도 판매 실적은 남아야** 한다.
        `menuId` 로 묶되 표시 이름은 items 의 `name` 을 쓰고, `getOrders()` 가 최신순이므로
        **처음 만난 이름 = 가장 최근 이름**이 된다.
      - 표시: 1~3위는 메달(🥇🥈🥉) + 물빛 테두리, 4~5위는 숫자. 판매량은 **1위 대비 비율 막대**로
        시각화(1~3위는 `--grad-ocean`, 나머지는 `--grad-wave`). 막대는 `aria-hidden`
        (수치는 옆 텍스트로 이미 읽히므로), 각 항목에 `sr-only` 로 "N위, 메뉴명, N잔 판매" 안내.
      - 판매 데이터가 없으면 `.empty-state` 로 "아직 판매 데이터가 없습니다" 안내.
- [x] **메인 추천 메뉴 배너 (캐러셀)** — 히어로(파도) 아래, 카테고리 위에 자동 슬라이드 배너를 넣었다.
      `index.html` · `index.css` · `index.js` 에만 추가했고 다른 페이지엔 영향이 없다.
      - **선별 기준** (`pickBannerMenus`): 품절 제외 → 추천 태그(`베스트`·`시그니처`) **4자리** +
        신메뉴 **2자리**, 중복 제거 후 최대 6장.
        ⚠️ 태그 메뉴만 10개라 **태그만 쓰면 신메뉴가 영영 배너에 못 오른다.** 그래서 자리를 나눴다.
      - **신메뉴 판정**: `data.js` 는 수정 금지라 "신메뉴" 플래그가 없다. `getMenus()` 가 `SEED_MENUS`
        순서를 유지하고 새 메뉴는 뒤에 붙으므로 **배열 뒤쪽을 최근 추가분**으로 본다 (id 하드코딩 회피).
      - 전환은 `transform: translateX` 만 (레이아웃 유발 없이 GPU 합성). 자동 4.5초, 무한 순환,
        좌우 화살표 · 하단 점 · **멈춤/재생 버튼**(WCAG — 자동 이동 콘텐츠는 멈출 수 있어야 함).
        hover · 키보드 포커스 · 탭 비활성 시 자동 넘김을 멈추고, `pagehide` 에서 타이머를 정리한다.
      - 접근성: 화살표·점에 `aria-label`, 슬라이드에 `role="group"` + `aria-roledescription="슬라이드"`,
        **화면 밖 슬라이드의 버튼·링크는 `tabindex="-1"`** 로 탭 순서에서 뺀다.
        `prefers-reduced-motion` 이면 자동 넘김을 켜지 않고 전환 애니메이션도 끈다(수동 조작은 유지).
      - 밝은 사진 위에서도 흰 글씨가 읽히도록 그라데이션을 **두 겹**(심해색 하단 + 옅은 유리 톤)으로 덮고,
        본문 좌우 여백을 화살표 폭만큼 확보해 제목과 화살표가 겹치지 않게 했다.
- [x] **주문 진행 바(스텝퍼)** — 고객 주문 상세(`orders/detail.js` + `orders/detail.css`)에
      `[접수 대기] ──── [제조 중] ──── [완료]` 3단계 진행 바를 추가했다.
      - **단계 판정은 인덱스 하나로만 한다.** `const FLOW = ["pending","making","done"]` 를 두고
        `const current = FLOW.indexOf(order.status)` 로 현재 위치를 구한 뒤,
        `i < current` = 지나온 단계(✓ 채움) / `i === current` = 지금 단계(채움 + 물빛 강조) /
        `i > current` = 남은 단계(빈 원). 연결선은 도달한 단계의 왼쪽만 색칠한다.
        → `ORDER_STATUS` 값이나 상태 흐름은 **전혀 건드리지 않고** 표시만 파생시킨다.
      - **`canceled` 는 스텝퍼에 끼우지 않는다.** 정상 흐름 밖이라 3단계 대신 "주문이 취소되었습니다"
        전용 안내로 대체한다. `FLOW` 에 없는 알 수 없는 값이면 진행 바를 아예 그리지 않는다
        (상태 칩은 그대로 뜨므로 정보가 사라지지 않는다).
      - 접근성: `<ol aria-label="주문 진행 상태">`, 현재 단계에 `aria-current="step"`,
        각 단계에 `sr-only` 로 "완료됨/진행 중/대기" 안내. **색만으로 구분하지 않는다** —
        지나온 단계는 `✓`, 나머지는 단계 번호가 찍혀 색맹에서도 구분된다.
      - 기존 상태 칩 · 메뉴 표 · 취소 버튼은 **그대로 두고** 개요 카드 아래에 얹기만 했다.
      - 관리자 주문 상세(`admin/orders/detail.js`)에는 아직 넣지 않았다 (이번 범위는 고객 화면).
- [x] **빈 상태(.empty-state) 바다 일러스트** — 이모지 하나뿐이던 빈 화면에 라인아트 SVG 를 넣었다.
      - `utils.js` 에 **새 함수만** 추가(기존 함수 무수정): `emptyStateHtml(iconType, title, message, actionHtml)`
        + 내부 `emptyArtHtml()` · `EMPTY_ART` 상수. **일러스트가 이 파일 한 곳에만 존재**한다.
      - 모티브 3종: `shell`(빈 조개 — 담긴 게 없음) · `bottle`(물결 위 유리병 — 아직 기록 없음) ·
        `net`(빈 그물 — 찾았지만 안 잡힘/못 찾음). 상황에 맞게 골라 쓴다.
      - **바깥 래퍼(`<div class="empty-state">`)는 각 페이지가 그대로 유지**한다
        (`card` / `grid-column` 등 클래스가 페이지마다 달라서). 헬퍼는 **안쪽 내용만** 만든다.
      - ⚠️ 스타일을 **인라인**으로 둔 이유: 클래스로 빼면 콜로케이션 규약상 9개 CSS 에 전부 복제된다.
        색은 `var(--sea-*)` 만 사용(새 hex 없음), SVG 는 장식이라 `aria-hidden="true"`.
      - ⚠️ `basket/list.js` · `orders/list.js` 에는 **같은 이름의 로컬 함수**가 있어 그대로 두면
        자기 자신을 호출(무한 재귀)한다 → `emptyBasketHtml` · `emptyOrdersHtml` 로 개명했다.
      - 적용: 고객 6곳(메인·메뉴목록·메뉴상세·장바구니·주문목록·주문상세) + 마이페이지 2곳 +
        관리자 6곳 = **14곳 전부**. 기존 문구·버튼·동작은 그대로 두고 아이콘만 일러스트로 교체.
- [x] **메뉴 즐겨찾기(찜)** — 손님이 메뉴에 하트를 눌러 찜하고 마이페이지에서 모아 본다.
      - `utils.js` 에 **새 함수만** 추가(기존 함수 무수정): `getFavorites` · `isFavorite` ·
        `toggleFavorite`(토글 후 상태 반환) · `getFavoriteMenus` · `favButtonHtml`(하트 마크업).
      - 저장은 `localStorage["cafe.favorites"]` 에 **menuId 배열**. `data.js` 의 `STORAGE_KEYS` 는
        수정 금지라, 키 리터럴을 `utils.js` 안 `FAVORITES_KEY` **한 곳**에만 둔다.
      - `getFavoriteMenus()` 는 사장님이 지운 메뉴(`getMenuById` → `null`)를 걸러낸다
        (`getCartDetail` 과 같은 방어 패턴). 저장값이 배열이 아니어도 빈 배열로 처리한다.
      - 하트는 `menus/list.js`(카드 우상단) · `menus/detail.js`(머리말) · `my/index.js`(찜 목록)에서
        **이벤트 위임 + `[data-fav]`** 로 처리한다. 목록/상세에서는 **누른 버튼만 갱신**해
        재렌더로 스크롤·수량이 튀지 않게 했다.
      - ⚠️ `menus/detail.js` 의 클릭 핸들러는 품절이면 조기 `return` 하므로,
        **하트 분기를 `soldOut` 가드보다 앞에** 뒀다 (품절 메뉴도 찜할 수 있어야 하므로).
      - 마이페이지에 `#favorites` 찜 섹션 추가(비면 `.empty-state`). 헤더 내비의 `❤️ 찜` 링크가
        `my/index.html#favorites` 로 연결된다 — `.site-header__links` 안에 넣어 **햄버거에도 자동 반영**.
- [x] **모바일 헤더 햄버거 메뉴** — 내비 링크가 6개로 늘며 좁은 화면에서 로고가 세로로 깨지고
      링크가 화면 밖으로 밀리던 문제를 해결했다.
      - **데스크톱(769px~)은 기존 그대로** — 링크 5개 가로 배치 + 🧺.
      - **모바일(~768px)** — 헤더에는 `[로고] [🧺] [☰]` 만 남기고, 링크 5개
        (홈·메뉴·마이페이지·주문내역·🔐관리자)는 `.site-header__links` 드롭다운 패널에 세로로 담는다.
        로고는 `white-space: nowrap` 으로 줄바꿈을 막았다.
      - 마크업: 링크를 `.site-header__links`(`data-nav-panel`)로 감싸고,
        `.site-header__toggle`(`data-nav-toggle`) 버튼을 추가 — 고객 7개 HTML 동일.
      - 토글 JS 는 **새 공용 파일 `js/header.js`** 하나로 두고 7개 페이지가 `defer` 로 참조한다
        (`utils.js` 는 수정 금지라 건드리지 않았고, 인라인 스크립트 7벌 복제도 피했다).
        햄버거 클릭 · 링크 선택 · 바깥 클릭 · `ESC` 로 닫히고, 데스크톱 폭이 되면 상태를 초기화한다.
      - 접근성: 버튼에 `aria-label`(열기/닫기 전환) · `aria-expanded` · `aria-controls`,
        패널은 `data-open` 으로 상태 표시. 실제 표시/숨김은 CSS 미디어쿼리가 담당한다.
      - 패널은 `z-index: var(--z-overlay)` 라 히어로 물결·본문 위로 확실히 뜬다. 새 색상 hex 는 없다.
- [x] **페이지 간 이동 + 간단 관리자 진입 제한** — 관리자↔손님 왕복 링크와 🔐 키 게이트 추가.
      - 관리자 7페이지 `.admin-top__nav` 에 구분선 + `btn--outline` "손님 페이지 보기"(→ 루트 `index.html`).
      - 고객 7페이지 `.site-header__nav` 장바구니 왼쪽에 `🔐 관리자` 버튼(`btn--ghost btn--sm`).
        `href` 대신 `onclick="CafeUtils.checkAdminAccess('…/admin/index.html')"` 로 키를 먼저 확인한다.
      - `utils.js` 에 **새 함수** `checkAdminAccess(destinationPath)` 추가(기존 함수는 무수정).
      - `admin/index.js` 초기화 최상단에서 비인가 직접 접근을 한 번 더 검사(대시보드 진입 시점에서만).
      - ⚠️ **진짜 보안이 아니다.** JS·키(`eastsea2026`)가 소스에 그대로 노출되므로 우회 가능.
        손님이 관리자 화면에 **실수로** 들어가는 것을 막는 UX 장치일 뿐이다. (코드 주석에도 명시)
- [x] **관리자 인증을 referrer 기반으로 전환 + 관리자 7페이지 전부 가드** —
      `utils.js` 의 `requireAdmin(homePath)` 는 **인증 상태를 어디에도 저장하지 않고**
      `document.referrer`(직전 페이지)만 보고 판단한다. `sessionStorage`/`localStorage` 미사용.
      - **직전 페이지가 같은 사이트의 관리자 페이지**(`origin` 일치 **AND** `pathname` 에 `/admin/` 포함)
        → 관리자 내부 이동으로 보고 **묻지 않고 통과**.
      - 그 외(손님 페이지 · 외부 · 빈 referrer) → `prompt` 로 키를 묻는다. `ADMIN_KEY` 와 맞으면 통과,
        취소·오답이면 `homePath`(손님 홈)로 돌려보내고 `false` 반환 (오답일 때만 토스트).
      - **origin 검사가 핵심.** 경로만 보면 `evil.com/admin/` 같은 외부 referrer 로 뚫리므로,
        `new URL(ref).origin === location.origin` 을 반드시 함께 확인한다 (파싱 실패 시 거부).
      - **관리자 7개 JS 전부**(`admin/index.js`, `menus/{list,detail,create,edit}.js`,
        `orders/{list,detail}.js`) 최상단에서 `if (!requireAdmin(홈경로)) return;` — 호출부는 그대로,
        내부 로직만 교체했다. 홈경로는 `../index.html`(대시보드) / `../../index.html`(하위 6개).
      - 결과: 손님→관리자 진입은 **매번** 인증, 관리자끼리 이동은 통과.
      - ⚠️ **주의(트레이드오프)**: referrer 는 새로고침 시 원래 값이 유지되므로,
        손님 페이지에서 들어온 관리자 페이지를 **새로고침하면 다시 묻는다.**
        또 브라우저·서버의 `Referrer-Policy` 로 referrer 가 잘리면 관리자 내부 이동에도 다시 물을 수 있다.
      - 키 리터럴은 `utils.js` 의 `ADMIN_KEY` **한 곳**에만 존재한다.
      - ⚠️ **진짜 보안이 아니다.** 키가 소스에 노출되고 referrer 도 위조 가능한 실수 방지용 UX 장치다.
- [x] **고객 헤더 내비 확장** — 고객 7페이지 모두 `홈 · 메뉴 · 마이페이지 · 주문내역 · 🧺` 로 통일.
      (`my/index.html` 포함 — 자기 자신에는 `aria-current="page"` 부여)
- [x] **관리자 메뉴 페이지 내비 확장** — `admin/menus/*.html` 4개를
      `대시보드 · 메뉴 관리 · 주문 관리` 3링크로 통일해 관리자 7페이지가 동일해졌다.
      이 과정에서 헤더의 `＋ 메뉴 추가` 버튼이 빠졌다 (메뉴 등록은 `admin/menus/list.html`
      의 `＋ 새 메뉴 띄우기` 버튼으로 계속 진입 가능).
- [x] **`getCartCount()` 불일치** — 배지를 채우는 `getCartCount()` 가 원본 카트를 세서
      삭제된 메뉴가 담겨 있으면 배지 숫자가 장바구니 목록보다 크게 나왔다.
      `getCartDetail().count`(이미 삭제 메뉴를 걸러낸 값)를 반환하도록 고쳐 두 경로를 일치시켰다.
- [x] **`checkout()` 주문 id 충돌** — id 를 `"o-" + Date.now().toString(36)` 로만 만들어
      같은 밀리초에 만든 두 주문이 같은 id 를 갖고, `getOrderById()` 가 첫 주문만 반환하는 문제가 있었다.
      IIFE 스코프의 순차 카운터 `orderSeq` 를 붙여
      `"o-" + Date.now().toString(36) + "-" + orderSeq++` 형태로 바꿔 세션 내 유일성을 보장했다.
