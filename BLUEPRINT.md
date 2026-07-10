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

- [ ] **헤더 공용화** — `.site-header`(고객 6페이지)와 `.admin-top`(관리자 7페이지)이
      각 CSS 에 인라인 복붙되어 있다. 코로케이션 원칙과 충돌하므로 공용화 여부를 결정할 것.
- [ ] **고객 헤더 내비 확장** — 주문 내역(`orders/list.html`)·마이페이지(`my/index.html`)
      링크가 없다. `my/` 는 현재 주소를 직접 쳐야만 진입한다.
- [ ] **관리자 메뉴 페이지 내비 확장** — `admin/menus/*.html` 4개에 대시보드·주문 관리 링크 추가.
- [ ] **`getCartCount()` 불일치** — 배지를 채우는 `getCartCount()` 는 원본 카트를 세지만
      `getCartDetail()` 은 삭제된 메뉴를 걸러낸다. 담긴 메뉴가 삭제되면
      **배지 숫자가 장바구니 목록보다 크게** 표시된다. (`utils.js` 수정이 필요해 미착수)
- [ ] **`checkout()` 주문 id 충돌** — id 를 `"o-" + Date.now().toString(36)` 로만 만들어
      **같은 밀리초에 만든 두 주문이 같은 id 를 갖는다.** 그러면 `getOrderById()` 가 항상
      첫 주문만 반환해 주문 상세가 엉뚱한 주문을 보여 준다.
      사람이 1ms 안에 두 번 결제할 수는 없어 실사용 위험은 낮지만, 자동화·테스트·이중 클릭에서 재현된다.
      해결: 카운터나 난수를 덧붙여 `"o-" + Date.now().toString(36) + "-" + (seq++)` 형태로.
      (`utils.js` 수정이 필요해 미착수)
