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

### 3단계: 고객 - 메뉴 조회 시스템

- [ ] `menus/list.html` — 메뉴 목록
- [ ] `menus/list.css`
- [ ] `menus/list.js`
- [ ] `menus/detail.html` — 메뉴 상세
- [ ] `menus/detail.css`
- [ ] `menus/detail.js`

### 4단계: 고객 - 장바구니 관리 시스템

- [ ] `basket/list.html` — 장바구니
- [ ] `basket/list.css`
- [ ] `basket/list.js`

### 5단계: 고객 - 주문 관리 시스템

- [ ] `orders/list.html` — 주문 내역 목록
- [ ] `orders/list.css`
- [ ] `orders/list.js`
- [ ] `orders/detail.html` — 주문 상세
- [ ] `orders/detail.css`
- [ ] `orders/detail.js`

### 6단계: 고객 - 메인 페이지

- [ ] `index.html`
- [ ] `index.css`
- [ ] `index.js`

### 7단계: 고객 - 마이페이지

- [ ] `my/index.html`
- [ ] `my/index.css`
- [ ] `my/index.js`

### 8단계: 관리자 - 대시보드 & 주문 관리

- [ ] `admin/index.html` — 대시보드
- [ ] `admin/index.css`
- [ ] `admin/index.js`
- [ ] `admin/orders/list.html` — 주문 목록
- [ ] `admin/orders/list.css`
- [ ] `admin/orders/list.js`
- [ ] `admin/orders/detail.html` — 주문 상세
- [ ] `admin/orders/detail.css`
- [ ] `admin/orders/detail.js`
