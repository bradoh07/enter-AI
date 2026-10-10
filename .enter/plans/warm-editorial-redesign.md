# 웜 에디토리얼 리디자인 계획

## Context

현재 앱은 **차가운 네이비 + 쿨그레이** 디자인 시스템을 쓰고 있다(`src/index.css`의 `--primary: 218 62% 20%`, 아이보리/브라운 계열 없음).
이번 작업은 색상·타이포그래피·컴포넌트·분위기를 **딥 브라운 / 웜 베이지 / 테라코타 / 아이보리 / 스카이블루** 팔레트로 전면 교체하고,
로그인 화면을 "시네마틱 이미지 + 아이보리 인증 패널" 2단 구조로 재설계하는 것이다.

**중요한 발견 — 리스크가 낮다:** 앱의 모든 스타일이 시맨틱 토큰(`bg-background`, `text-foreground`, `border-border`,
`bg-primary`, `bg-accent`, `bg-sidebar`, `--chart-*`, `--scenario-*`)으로만 작성되어 있고,
컴포넌트에 하드코딩된 네이비/그레이 색상은 **0건**이다(확인 완료).
따라서 색 전환의 중심은 `src/index.css` + `tailwind.config.ts` 두 파일이며, 나머지는 화면별 다듬기다.

**유지 원칙:** 로그인, 회원가입, 온보딩, 프로젝트 등록, AI 시뮬레이션, 결과 저장, 프로젝트 관리, PDF 보고서 기능과
DB 스키마·데이터·연결 구조는 **손대지 않는다.** 디자인 계층만 교체한다.

## 사용자 확정 사항

| 항목 | 결정 |
|---|---|
| 배경 영상 | **영상 없이 이미지로 구성** (15초 mp4 슬롯은 코드 상수 한 줄로 문서화해 두고, 넣으면 자동 재생) |
| 히어로 이미지 모델 | `seedream-5` |
| 브랜드명 | **사용하지 않음.** 사이드바는 아이콘 + 설명형 표기, 로그인 좌측은 지정 문구 2줄 |
| 타이포그래피 | 세리프 제목 + 산세리프 본문·수치 |
| 첨부 시안 | 전달되지 않음 → 텍스트로 주신 5개 색상값과 레이아웃 설명을 기준으로 작업 |

---

## 1. 컬러 시스템 (단일 규칙)

### 1-1. 지정 색상 — 정확값으로 1회 정의

| 토큰 | HEX | HSL | 용도 |
|---|---|---|---|
| `--brand-brown` | #5E3013 | `23 66% 22%` | 주요 제목·본문 텍스트, 강조 |
| `--brand-beige` | #DDAC80 | `28 58% 68%` | 보조 버튼 표면, 장식 구분선 |
| `--brand-terracotta` | #A56733 | `27 53% 42%` | 선택 테두리·포커스·아이콘 강조 |
| `--brand-ivory` | #F8F4EC | `40 46% 95%` | 기본 배경 |
| `--brand-sky` | #7DDBF4 | `193 84% 72%` | 그래프 보조 시리즈, 제한적 포인트 |

### 1-2. 가독성을 위한 파생값 (같은 색상 계열, 명도만 조정)

지정값을 그대로 텍스트/버튼에 쓰면 WCAG AA를 못 넘는 지점이 있어, **같은 색상 계열에서 명도만 낮춘 파생 토큰**을 둔다.
색상마다 규칙을 바꾸지 않고 아래 한 가지 규칙만 적용한다: **"채움·장식은 지정값, 텍스트·컨트롤 경계는 한 단계 진한 값."**

| 파생 토큰 | 값 | 이유 (대비 실측) |
|---|---|---|
| `--primary` | `27 58% 36%` (테라코타 한 단계 진하게) | 아이보리 위 아이보리 텍스트 기준. `#A56733`은 버튼 텍스트 대비 4.17:1로 AA 미달, 진한 값은 **5.7:1 통과** |
| `--muted-foreground` | `24 20% 38%` | 아이보리 위 보조 텍스트 **5.6:1 통과** |
| `--border` | `28 44% 64%` | `#DDAC80`(1.86:1)은 헤어라인이 흐려짐 → 한 단계 진하게 |
| `--input` | `28 42% 58%` | 입력 필드 경계는 3:1에 근접해야 식별 가능 |
| `--sky-ink` | `196 62% 30%` | 스카이블루는 아이보리 대비 1.5:1 → **선·텍스트에는 진한 값만** 사용 |
| `--secondary` | `28 58% 68%` (= 지정 베이지) | 보조 버튼 표면 + 딥브라운 텍스트 **5.4:1 통과** |

> 스카이블루는 **채움/영역/기준선**에만 쓰고, 선·텍스트가 필요한 곳은 `--sky-ink`를 쓴다.

### 1-3. 전체 토큰 (라이트)

```
--background: 40 46% 95%        /* 아이보리 (지정값) */
--foreground: 23 66% 22%        /* 딥 브라운 (지정값) */
--card: 42 44% 97.5%            /* 카드만 아주 살짝 밝은 웜 화이트 → 그레이 단계 없이 분리 */
--card-foreground: 23 66% 22%
--popover / --popover-foreground: 42 44% 98% / 23 66% 22%
--primary: 27 58% 36%           --primary-foreground: 40 50% 97%
--secondary: 28 58% 68%         --secondary-foreground: 23 66% 20%
--muted: 36 32% 91%             --muted-foreground: 24 20% 38%
--accent: 30 46% 92%            --accent-foreground: 27 58% 32%
--destructive: 8 58% 38%        --success: 148 26% 30%
--warning: 36 66% 34%           --info: 196 55% 30%
--border: 28 44% 64%            --input: 28 42% 58%   --ring: 27 58% 36%
--radius: 0.5rem
--sky: 193 84% 72%              --sky-ink: 196 62% 30%
--scenario-optimistic: 27 58% 46%   --scenario-base: 23 62% 28%   --scenario-pessimistic: 28 13% 52%
--chart-1: 23 62% 30%   /* 딥브라운 – 주 데이터 */
--chart-2: 27 53% 46%   /* 테라코타 – 보조 데이터 */
--chart-3: 193 84% 72%  /* 스카이 #7DDBF4 – 영역 채움/기준선 */
--chart-4: 28 40% 72%   /* 베이지 – 중립/기준 계열 */
--chart-5: 196 62% 30%  /* 진한 스카이 – 선·오버레이 */
--shadow-panel: 0 1px 2px hsl(23 40% 20% / .04), 0 2px 6px -4px hsl(23 40% 20% / .06)
--shadow-elegant: 0 1px 2px hsl(23 40% 20% / .05), 0 18px 40px -28px hsl(23 40% 20% / .25)
--transition-smooth: all .2s cubic-bezier(.4,0,.2,1)

/* 사이드바 — 아이보리 에디토리얼 레일 */
--sidebar-background: 40 46% 95%   --sidebar-foreground: 23 30% 32%
--sidebar-primary: 23 66% 22%      --sidebar-primary-foreground: 40 46% 95%
--sidebar-accent: 30 46% 91%       --sidebar-accent-foreground: 27 58% 34%
--sidebar-border: 28 44% 68%       --sidebar-ring: 27 58% 36%
```

- `.dark`는 토글을 만들지 않되, 네이비가 남지 않도록 **웜 다크**(딥브라운 배경 `23 30% 10%` + 아이보리 텍스트)로 재정의한다.
- `--gradient-navy` / `.bg-gradient-navy` / `.bg-gradient-subtle` / `--primary-glow`는 **사용처가 0건**이므로 제거한다("과도한 그라데이션 배제" 원칙).
- 그라데이션은 히어로 이미지 위 텍스트 가독용 스크림(딥브라운 반투명) **한 곳에만** 사용한다.

## 2. 타이포그래피

- `font-sans`(본문·수치): `Inter, Noto Sans KR, Apple SD Gothic Neo, Malgun Gothic, system-ui, sans-serif`
- `font-display`(제목): `Fraunces, Noto Serif KR, Georgia, serif` — 라틴은 Fraunces, 한글은 Noto Serif KR로 세리프 유지
- 세리프 적용 범위: **페이지 h1, SectionCard 제목, 로그인 좌측 문구 2줄, 보고서 제목, 다이얼로그 제목**
- 나머지(라벨·본문·표 헤더·버튼)는 산세리프. **모든 수치는 산세리프 + `tabular-nums` 유지**(`.tabular` 재사용)
- `index.html`에 Google Fonts 1회 요청 + 기존 `preconnect` 활용. **폰트 로드 실패 시 시스템 세리프/산세리프로 자연 폴백**되도록 스택을 구성(프리뷰 차단 환경에서도 레이아웃 유지)

## 3. 로그인 화면 재설계

구조: `lg:grid-cols-[minmax(0,62fr)_minmax(0,38fr)]` (좌 62% / 우 38%)

**좌측 — 시네마틱 히어로 (`src/pages/auth/CinematicHero.tsx`, 신규)**
- `<picture>`: 데스크톱 가로 이미지 / 모바일 세로 이미지(`min-width:1024px` 기준 소스 전환)
- 위에 딥브라운 반투명 스크림(아래→위)으로 텍스트 가독 확보 — 장식이 아니라 기능
- 브랜드명 없이 지정 문구 2줄:
  - `auth.tagline.primary` = "Before you build, understand."
  - `auth.tagline.secondary` = "사업을 시작하기 전에, 가능성을 분석하다."
  - 두 문구는 언어와 무관하게 **항상 함께** 표시하므로 ko/en 로케일 파일에 **동일 문자열**로 저장
- 하단에 얇은 베이지 구분선 + 기존 `auth.brand.footnote` 한 줄 유지

**우측 — 아이보리 인증 패널**
- 상단: 언어 전환(기존 `LanguageSwitcher` 재사용)
- 모드 전환 탭(`AuthModeTabs.tsx`, 신규): **로그인 | 회원가입** — 선택 상태는 테라코타
- `LoginForm.tsx`(신규): 이메일·비밀번호, 주요 버튼은 테라코타, 하단에 **"비밀번호 찾기"** / "회원가입"
- `ResetPasswordForm.tsx`(신규): 이메일 입력 → 재설정 링크 발송, 발송 후 안내 + 로그인 복귀
- `SignupForm.tsx`(신규): **1단계에서 기업 고객 / 개인 고객을 두 개의 큰 카드로 명확히 구분**(아이콘 + 설명), 선택 후 해당 필드만 렌더링.
  `?type=business|individual` 딥링크로 특정 경로 바로 진입 가능, 선택 후 "고객 유형 변경" 제공

**라우트 (기존 경로 유지 + 1개 추가)**
| 경로 | 내용 |
|---|---|
| `/login` | 로그인 패널 기본. `?mode=signup`이면 회원가입 탭 활성 |
| `/signup` | 회원가입 탭 기본. `?type=business\|individual` 지원 (기존 링크 호환) |
| `/reset-password` | 신규. 재설정 메일 링크 착지 + 새 비밀번호 설정 (`supabase.auth.updateUser`) |

`src/providers/auth-provider.tsx`에 `requestPasswordReset(email)` / `setPassword(newPassword)`를 추가해
인증 로직을 한 곳에 유지한다. 메일 발송 실패는 백엔드 메시지를 그대로 노출하고, 성공 시에도
"메일을 보냈습니다"까지만 안내한다(수신 여부를 알 수 없으므로 단정하지 않음).

**모바일**: 좌측 히어로가 상단 밴드(`h-[46vh] min-h-[300px]`)로 축소되고 문구는 그 안에 배치, 인증 패널이 아래로 스택.

**히어로 미디어 (`src/lib/media/hero-media.ts`, 신규)**
- `public/media/hero-lemon-landscape.jpg`, `public/media/hero-lemon-portrait.jpg` (seedream-5로 생성 후 로컬 저장)
- `HERO_VIDEO_SRC = ""` 상수 + 주석: 빈 값이면 이미지만 사용(불필요한 404·콘솔 오류 없음),
  `public/media/lemon-tree.mp4`(15초·무음 루프)를 넣고 이 값을 `"/media/lemon-tree.mp4"`로 바꾸면 자동 재생.
- 값이 설정된 경우 `autoPlay muted loop playsInline` + `onError` 시 이미지로 폴백, `prefers-reduced-motion`이면 이미지 고정

## 4. 로그인 이후 화면 (동일 시스템 적용)

- **앱 셸**: 사이드바를 네이비 레일 → **아이보리 레일**(브라운 텍스트, 테라코타 활성 상태, 베이지 우측 경계선)로 교체.
  브랜드명 대신 아이콘 + 설명형 표기(`common.appName`)만 사용. 상단바는 웜 반투명(`bg-background/80 backdrop-blur`).
  데스크톱 레일 + 메인 콘텐츠, 모바일 오프캔버스 시트 구조는 **그대로 유지**
- **대시보드**: 아이보리 배경, 브라운 텍스트, 정돈된 프로젝트 카드, KPI 타일(수치 산세리프 + tabular)
- **프로젝트 등록/새 시뮬레이션**: 밝은 입력 영역, 단계 표시(현재 = 테라코타, 완료 = 브라운/베이지)
- **시뮬레이션 결과**: 웜 배경 위 전문적인 그래프. 아래 시리즈 규칙 적용
- **프로젝트 관리/분석 기록/설정**: 동일 카드·표·버튼·상태 배지 규칙
- **보고서(PDF)**: 세리프 제목 + 얇은 테라코타 룰, `print-color-adjust: exact`로 인쇄 시에도 계열 색 유지

**차트 시리즈 규칙 (데이터 가독성 우선)**
| 차트 | 시리즈 배정 |
|---|---|
| 시나리오별 연간 매출(막대) | 낙관 `chart-2` 테라코타 · 기준 `chart-1` 브라운 · 비관 `chart-4` 베이지 |
| 누적 현금흐름(선) | `--scenario-*` 3색 |
| 매출·비용·영업이익 | 매출 막대 `chart-2`, 비용 막대 `chart-4`, 영업이익 `Area`(`--sky` 채움 + `--sky-ink` 선) |
| 손익분기(선) | 매출 `chart-2`, 총비용 `chart-5`, 손익분기 기준선 `--sky` 점선 |
| 민감도 표 | 적자 `--destructive`, 흑자 `--success`, 기준 셀 `--accent` |

그리드·축·툴팁은 이미 토큰 기반이므로 자동으로 웜 톤으로 전환된다.

## 5. 주요 수정 파일

**디자인 시스템 (중심)**
- `src/index.css` — 토큰 전면 교체, 그라데이션/글로우 제거, 웜 그림자, `print-color-adjust`
- `tailwind.config.ts` — `display` 폰트, `beige`/`sky`/`skyInk`/`brown` 색상 추가, `primary.glow` 제거
- `index.html` — Google Fonts, 중립 제목/설명, OG 이미지를 로컬 히어로로 교체

**인증 (재설계)**
- `src/pages/auth/AuthShell.tsx` (전면 재작성), `CinematicHero.tsx`·`AuthModeTabs.tsx`·`LoginForm.tsx`·`SignupForm.tsx`·`ResetPasswordForm.tsx` (신규)
- `src/pages/login/index.tsx`·`src/pages/signup/index.tsx` (얇은 래퍼로 축소), `src/pages/reset-password/index.tsx` (신규)
- `src/providers/auth-provider.tsx`, `src/router.tsx`, `src/lib/media/hero-media.ts` (신규)

**셸·컴포넌트**
- `src/components/layout/{AppLayout,AppSidebar,AppTopbar}.tsx`
- `src/components/common/{MetricCard,PageHeader,EmptyState,DataSourceBadge}.tsx`
- `src/components/ui/{button,badge,card,tabs,table,input,textarea,select,progress,alert,separator,sheet,dialog,alert-dialog,dropdown-menu,tooltip,popover,sonner}.tsx` — 토큰 정합 + 오버레이 `bg-black/80` → `bg-foreground/40`
- `src/components/simulation/*` — 차트 시리즈 배정표 반영(영업이익 `Area` 전환 포함)

**문서/i18n**
- `public/locales/ko.json` + `en.json` — 신규 인증 키 추가(양쪽 키 세트 동일 유지)
- `CodeGuideline.md` — 팔레트 사용 규칙과 신규 인증 컴포넌트 구조 기록

> `auth.brand.headline`·`description`·`feature1~3`은 새 히어로에서 쓰지 않게 된다. i18n 규칙상 키를 임의로 삭제하지 않으므로
> 남겨 두고, 미사용 경고만 리포트에 남긴다.

---

## Implementation checklist

- [x] `src/index.css`의 `:root`를 §1-3 토큰으로 전면 교체하고 네이비/쿨그레이 값이 0건이 됨
- [x] `.dark`를 웜 다크로 재정의하고 네이비 잔존 값 제거
- [x] `--gradient-navy`·`.bg-gradient-navy`·`.bg-gradient-subtle`·`--primary-glow` 제거 (사용처 0건 확인됨)
- [x] `@media print`에 `print-color-adjust: exact`와 인쇄용 텍스트/배경색 적용
- [x] `tailwind.config.ts`에 `fontFamily.display` 추가, `beige`·`sky`·`skyInk`·`brown` 색상 추가, `primary.glow` 제거
- [x] `index.html`에 Fraunces·Inter·Noto Sans KR·Noto Serif KR 로드 및 중립 title/description, OG 이미지를 로컬 히어로로 교체
- [x] seedream-5로 가로/세로 히어로 이미지 생성 후 `public/media/hero-lemon-landscape.jpg`·`hero-lemon-portrait.jpg`로 저장
- [x] `src/lib/media/hero-media.ts`에 이미지 경로 + `HERO_VIDEO_SRC`(빈 값) + 드롭인 안내 주석 정의
- [x] `CinematicHero.tsx`가 `<picture>`로 뷰포트별 소스를 전환하고 문구 2줄·구분선·footnote를 렌더링
- [x] `HERO_VIDEO_SRC`가 빈 값일 때 영상 요청이 발생하지 않고 콘솔 오류가 없음
- [ ] `HERO_VIDEO_SRC`가 값이 있는 상태에서 로딩 실패 시 `onError`로 이미지 폴백이 동작 (`prefers-reduced-motion`이면 이미지 고정)
- [x] `AuthShell.tsx`가 데스크톱 `62/38` 2단, 모바일 상단 밴드+스택으로 렌더링
- [x] `AuthModeTabs.tsx`로 로그인/회원가입 전환이 되고 선택 상태가 테라코타로 표시됨
- [x] `LoginForm.tsx`가 기존 `signIn` 흐름을 그대로 사용해 로그인 성공 시 `/dashboard`로 이동
- [x] `ResetPasswordForm.tsx`가 `resetPasswordForEmail`을 호출하고 성공/실패 메시지를 구분해 표시
- [x] `/reset-password`에서 세션이 있으면 `updateUser({ password })`로 새 비밀번호가 저장되고 `/dashboard`로 이동
- [x] `/reset-password`에서 세션이 없으면 로그인 화면으로 안내(깨진 링크 화면 없음)
- [x] `SignupForm.tsx` 1단계에서 기업/개인 카드를 구분 선택하고, 선택 유형에 따라 온보딩 필드가 달라짐
- [x] `/signup?type=business`·`?type=individual` 딥링크가 해당 유형으로 진입
- [x] 신규 가입 후 `user_type`이 `profiles`에 저장되고 기존 온보딩 흐름으로 이어짐
- [x] `AppSidebar`가 아이보리 레일 + 아이콘/설명형 표기로 렌더링되고 브랜드명이 없음
- [x] 사이드바 활성 메뉴가 베이지 표면 + 테라코타 텍스트로 표시됨
- [x] `AppTopbar`·`AppLayout`이 웜 배경/경계로 전환되고 데스크톱 레일·모바일 시트 구조가 유지됨
- [x] `button`·`badge`·`card`·`tabs`·`table`·`input`·`select`·`progress`·`alert`가 시맨틱 토큰만 사용(hex 직접 사용 0건)
- [x] 다이얼로그·시트·드롭다운 오버레이가 `bg-foreground/40` 계열로 바뀌고 검은 오버레이가 남지 않음
- [x] `DataSourceBadge`의 계산/AI/가정 배지가 브라운·스카이·앰버 계열로 구분됨
- [x] `MetricCard` 수치가 산세리프 + `tabular-nums`로 유지되고 제목만 세리프 적용됨
- [x] `PageHeader`·`SectionCard` 제목에 `font-display`가 적용됨
- [x] 시뮬레이션 차트 4종이 §4 시리즈 배정표대로 렌더링되고 영업이익 계열이 `Area`로 표시됨
- [x] 민감도 표의 흑자/적자/기준 셀이 토큰 색으로 구분됨
- [x] 보고서 페이지가 세리프 제목 + 테라코타 룰로 렌더링되고 인쇄 시 계열 색이 유지됨
- [x] ko/en 로케일에 신규 인증 키가 동일 키 세트로 추가됨
- [x] `CodeGuideline.md`에 팔레트 규칙(지정값 vs 파생값)과 신규 인증 컴포넌트 구조 기록

## Verification checklist

**긍정 경로**
- [x] `/login` 1280px에서 좌 62% 시네마틱 히어로 + 우 38% 아이보리 패널이 보이고, 좌측에 지정 문구 2줄이 정확히 표시됨
- [x] 로그인/회원가입 탭 전환이 되고, 회원가입에서 기업/개인 카드 선택이 가능
- [ ] 기존 계정으로 로그인해 대시보드·프로젝트·새 시뮬레이션·분석 기록·설정·보고서가 모두 정상 동작 (기존 기능 회귀 없음)
- [ ] 재설정 링크 → `/reset-password`에서 새 비밀번호 설정 후 로그인 가능

**부정/기본 경로**
- [x] `public/media/lemon-tree.mp4`가 없는 상태에서 콘솔 오류 없이 히어로 이미지가 표시됨
- [x] 세션 없이 `/reset-password` 직접 접근 시 로그인 화면으로 안내됨
- [ ] 잘못된 이메일로 비밀번호 재설정 시 백엔드 메시지가 표시되고 "발송됨"으로 단정하지 않음
- [ ] `/signup?type=individual`에서 기업 전용 필드가 노출되지 않음

**경계/시스템**
- [x] 네이비·쿨그레이 잔존: `grep -rn "218 62%\|210 40%\|bg-black/80\|gradient-navy" src` 결과 0건
- [x] 하드코딩 색상: 컴포넌트에 6자리 hex 직접 사용 0건
- [x] `color-scheme`/다크 클래스 미사용 상태에서 `.dark` 토큰이 웜 다크로만 정의됨
- [x] `pnpm lint` 0 errors, `pnpm exec tsc -p tsconfig.app.json --noEmit` 통과, `pnpm run build` 성공
- [x] `node .../check-i18n.mjs` → `scan-i18n.mjs` 순서로 실행해 통과(모든 로케일 키 세트 동일)

**반응형 (프리뷰 실측)**
- [x] `/login` 390px: 히어로 밴드 + 문구 + 아이보리 패널이 세로 스택되고 가로 스크롤/잘림 없음
- [x] `/login` 1280px: 2단 레이아웃 비율과 문구 가독성(스크림) 확인
- [ ] 인증 후 화면 중 프로젝트 상세·설정·분석 기록·시뮬레이션 위저드의 **모바일(390px)** 레이아웃은 캡처하지 못했다 (대시보드는 390px로 확인함)

---

## 실행 결과 (검증 기록)

### 시각 검증 완료 — 실제 계정·실제 엔진 결과·실제 AI 응답으로 확인

검증용 계정을 만들고, `src/lib/simulation/engine.ts`로 **실제 계산한 결과**와 배포된 `simulation-insights` 함수의
**실제 AI 응답**을 저장한 뒤 각 화면을 캡처했다. (검증 후 계정과 그 데이터는 삭제했고, 기존 실사용자 계정과 데이터는 보존)

| 화면 | 뷰포트 | 확인 내용 |
|---|---|---|
| `/login` | 1280 | 좌 62% 시네마틱 히어로 + 지정 문구 2줄, 우 38% 아이보리 패널, 테라코타 탭·버튼 |
| `/login` | 390 | 히어로 밴드 + 문구, 패널 세로 스택, 가로 스크롤·잘림 없음 |
| `/login?mode=signup` | 1280 | 기업/개인 가입 경로 2개 카드 분리, 선택 상태 테라코타 |
| `/dashboard` | 1280 | 아이보리 배경·브라운 텍스트, KPI 타일 값 정렬, 시나리오 차트 웜 팔레트 |
| `/dashboard` | 390 | 사이드바 → 햄버거, 카드 세로 스택, 차트 가독성 유지 |
| `/projects/:id` | 1280 | 2단 탭, KPI 8종, 누적 현금흐름 차트 3색, 시나리오 표 색상 구분 |
| `/report/:runId` | 1280 | 5개 섹션 전부 — 시나리오 표, 차트 4종(스카이 영역·기준선 포함), 가정 목록, AI 분석(실제 응답), 모델 설정 |
| 보호 라우트 | - | 세션 없이 `/settings` 접근 시 `/login`으로 리다이렉트(기존 가드 유지) |

추가로 lint 0 problems, `tsc -p tsconfig.app.json` 통과, `pnpm run build` 성공, `check-i18n.mjs` 통과,
네이비/쿨그레이 잔존 0건, 컴포넌트 내 6자리 hex 0건을 확인했다.

### 시각 검증하지 못한 항목 (미검증으로 남김)

- **영상 재생 경로**: `HERO_VIDEO_SRC`가 빈 값이라 영상 파일 로딩 실패 시의 `onError` 폴백은 실행되지 않았다.
  코드 경로는 존재하지만 런타임 검증은 하지 않았다.
- **비밀번호 재설정 전체 흐름**: `resetPasswordForEmail` 호출과 `/reset-password` 화면은 구현했으나,
  실제 메일 수신·링크 클릭 왕복은 이 환경에서 확인할 수 없다.
- **개인 고객 가입 2단계**: 1단계 유형 선택 화면은 확인했으나, 개인 유형으로 진행한 뒤의 필드 구성은 캡처하지 않았다.
- **로그인 폼 실제 제출**: 세션을 주입해 인증 후 화면은 확인했으나, 폼에 직접 입력해 제출하는 흐름은 자동화할 수 없었다.
- **일반 AI 챗봇 스타일 배제 / 모션**: `prefers-reduced-motion` 대응은 코드로만 존재하며 별도 확인하지 않았다.
