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
```

## 👥 역할별 기능

| 역할            | 경로                                           | 주요 기능                                        |
| --------------- | ---------------------------------------------- | ------------------------------------------------ |
| **고객**        | `/`, `/menus/`, `/my/`, `/basket/`, `/orders/` | 메인, 메뉴 조회, 마이페이지, 장바구니, 주문 내역 |
| **관리자/사장** | `/admin/`, `/admin/menus/`, `/admin/orders/`   | 대시보드, 메뉴 CRUD, 주문 관리                   |

## 🎨 디자인

- **테마**: 라이트 + 따뜻한 브라운/크림 톤
- **분위기**: 미니멀 + 모던
- **카드 스타일**: Glass morphism
- **레이아웃**: 반응형 (모바일/데스크톱)

## 📐 코로케이션 원칙

- **HTML과 동일한 디렉토리에 css, js 파일을 평탄하게 배치** (별도 하위 폴더 없음)
- **파일명은 HTML 파일명과 동일하게 매칭** (`index.html` → `index.css`, `index.js`)
- 전역 공통 자원만 `/css/`, `/js/` 폴더에 분리
- 역할별 독립 폴더로 관심사를 분리

---

## ✅ 구현 TODO

### 1단계: 공유 자원

- [ ] `css/variables.css` — 전역 CSS 변수, 리셋
- [ ] `js/data.js` — 메뉴/카테고리 데이터
- [ ] `js/utils.js` — 공통 유틸리티 (카트, 포맷 등)

### 2단계: 관리자 - 메뉴 관리 시스템

- [ ] `admin/menus/list.html` — 메뉴 목록
- [ ] `admin/menus/list.css`
- [ ] `admin/menus/list.js`
- [ ] `admin/menus/detail.html` — 메뉴 상세
- [ ] `admin/menus/detail.css`
- [ ] `admin/menus/detail.js`
- [ ] `admin/menus/create.html` — 메뉴 추가
- [ ] `admin/menus/create.css`
- [ ] `admin/menus/create.js`
- [ ] `admin/menus/edit.html` — 메뉴 수정
- [ ] `admin/menus/edit.css`
- [ ] `admin/menus/edit.js`

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
