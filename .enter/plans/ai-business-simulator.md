# AI 사업 시뮬레이터 구현 계획

## Context

현재 프로젝트는 Vite + React 19 + TypeScript + Tailwind + shadcn/ui 기반의 **빈 템플릿**이다.
`src/pages/Index.tsx`는 i18n 문구만 렌더링하는 랜딩 페이지이고, 실제 기능·라우트·백엔드·데이터 모델이 전혀 없다.
따라서 "기존 기능 유지" 대상은 사실상 없으며, 이번 작업에서 아래를 새로 구축한다.

개인·기업 사용자가 **사업 실행 전** 초기 투자금, 매출, 수익성, 현금흐름, 손익분기점, 투자회수기간, 위험요소를
분석·비교하고 저장할 수 있는 AI 사업 의사결정 플랫폼. 단순 목업이 아니라 **실제로 저장·계산·재계산되는 앱**이어야 한다.

핵심 설계 원칙(사용자 요구 6항 반영):
1. **계산은 결정론적 엔진(순수 TS 함수)이 담당** — 항상 동작하고 재현 가능하다.
2. **AI는 판단·서술 영역만 담당** — 프로젝트 맞춤 추가 질문 생성, 위험요소/대응전략, 실행 가능성/개선안.
3. **AI 미연결·실패 시 절대 꾸며내지 않는다** — 명시적 "AI 분석 사용 불가" 상태 + 재시도 UI. 계산 결과는 그대로 표시.
4. 모든 수치에 `계산` / `AI 추정` / `가정` 출처 배지를 붙여 추정과 계산을 시각적으로 구분한다.
5. 사용자별 데이터는 RLS로 완전 격리한다.
6. 산업 확장 가능하도록 사업모델/분야를 **코드 상수 + 선택지 테이블 없는 자유 입력 배열**로 다룬다.

## 확정된 결정 사항 (사용자 확인 완료)

| 항목 | 결정 |
|---|---|
| UI 언어 | 한국어 + 영어 (i18n 확장 활성화, `ko` 추가) |
| 기존 zh-CN | 제거 (모든 로케일 파일은 동일 키 세트 유지 규칙 준수) |
| 인증 | 이메일 + 비밀번호 |
| PDF | 브라우저 인쇄 기반 인쇄 전용 리포트 라우트 |

## 작업 순서 (스킬 선행 로드 필수)

1. `supabase_enable` (백엔드) → 성공 후 `enter_cloud` 스킬 로드
2. `enable_ai_capability` → 성공 후 `enter_llm_integration` 스킬 **재로드**(모델 카탈로그 확보)
3. `i18n_enable` → `enter_i18n` 스킬 로드 후 로케일 작업 전담
4. 이후 아래 구현 단계 진행

> AI 모델 ID·프로토콜은 하드코딩하지 않는다. 활성화 후 스킬의 최신 카탈로그에서 플랜 포함 모델을 선택하고,
> 해당 `references/protocol_*.md`를 읽은 뒤 백엔드 함수를 작성한다.

---

## 1. 데이터 모델 (Enter Cloud / Postgres + RLS)

모든 테이블은 **생성 마이그레이션에서 RLS 활성화 + 소유자 전용 정책**을 함께 넣는다.

| 테이블 | 핵심 컬럼 | 비고 |
|---|---|---|
| `profiles` | `id`(=auth.users.id, PK), `user_type`('business'\|'individual'), `display_name`, `currency`, `onboarding_completed`, `business_models text[]`, `company_name`, `company_size`, `business_stage`, `interest_sectors text[]`, `founding_experience`, `planned_investment numeric` | 업종/분야는 enum이 아닌 자유 텍스트 배열 → 산업 확장성 |
| `projects` | `id`, `user_id`, `name`, `idea`, `sectors text[]`, `scale`, `stage`, `horizon_months`, `currency`, `status`('draft'\|'ready'\|'simulated'), `scenario_overrides jsonb` | 복제 시 행+입력 복사 |
| `project_questions` | `id`, `project_id`, `user_id`, `question_key`, `label`, `help`, `input_type`, `unit`, `options jsonb`, `required`, `sort_order`, `source`('ai'\|'baseline') | AI 생성 질문. AI 미연결 시 `baseline` |
| `project_inputs` | `project_id`(unique), `user_id`, `data jsonb`, `unknown_fields text[]`, `completed` | 계산 엔진의 단일 진실 공급원. zod로 검증 |
| `simulation_runs` | `id`, `project_id`, `user_id`, `run_number`, `label`, `engine_version`, `input_snapshot jsonb`, `results jsonb`, `assumptions jsonb`, `ai_insights jsonb`, `ai_status`('not_requested'\|'ok'\|'unavailable'\|'error'), `ai_error`, `ai_model`, `created_at` | = **분석 기록** 데이터 소스. 재계산마다 새 run 추가(이력 보존) |

정책: `profiles`는 `auth.uid() = id`, 나머지는 `auth.uid() = user_id` (select/insert/update/delete).
`project_questions`/`project_inputs`/`simulation_runs`는 `project_id` 소유권을 함께 검증한다.

`src/integrations/supabase/client.ts`와 `types.ts`는 자동 생성 파일이므로 **수정 금지**. 클라이언트는 생성된 export를 import한다.

## 2. 결정론적 계산 엔진 (`src/lib/simulation/`)

순수 함수만으로 구성하고, 동일 입력 → 동일 결과를 보장한다. AI 호출 없이도 100% 동작한다.

| 파일 | 책임 |
|---|---|
| `types.ts` | `SimulationInput`, `ScenarioAdjustment`, `ScenarioResult`, `MonthlySeries`, `KpiSet` |
| `defaults.ts` | 초기 투자/고정비/인건비 기본 입력 템플릿, `DEFAULT_SCENARIOS` |
| `engine.ts` | 월별 시계열 산출 → 시나리오별 지표 산출 |
| `metrics.ts` | 손익분기, 투자회수, 필요자금, NPV/IRR/ROI 계산 |
| `sensitivity.ts` | 매출·비용 ±10/±20% 민감도 표 (엔진 재실행) |
| `assumptions.ts` | 엔진 가정·불확실성 문구 자동 생성 (i18n 키 기반) |
| `format.ts` | 통화/퍼센트/개월 포맷터 (KRW·USD, `tabular-nums`) |
| `validate.ts` | zod 스키마 + 미정(unknown) 항목 판별 |

**입력 모델**: `revenueStreams[]{unitPrice, unitCost, monthlyUnits, monthlyGrowthPct, startMonth}`,
`fixedCosts[]{item, monthlyAmount}`, `payroll[]{role, monthlySalary, headcount, startMonth}`,
`marketingMonthly`, `overheadPct`, `taxRatePct`, `discountRatePct`, `initialInvestment[]`,
`funding[]{source, amount, rateAnnual, graceMonths}`, `horizonMonths`, `workingCapitalMonths`.

**월별 산출**: 매출(성장률·시작월 반영) → 변동비 → 매출총이익 → 고정비·인건비·마케팅·부가오버헤드 → 영업이익 →
세금 → 순이익 → CAPEX/운전자본 → 조달(지분·차입금 이자·상환) → 월별 순현금흐름 → 누적현금.

**시나리오**: `optimistic` / `base` / `pessimistic` 3종을 매출·원가·고정비·성장 램프 배수로 구분.
사용자가 배수를 직접 수정하면 `projects.scenario_overrides`에 저장하고 **즉시 재계산**한다.

**산출 지표**: 총 투자금, 연도별 매출/영업이익/순이익·이익률, 손익분기 도달 월, 투자회수 기간,
최대 자금 부족액(필요 자금), 런웨이, NPV, IRR, ROI, 누적 현금흐름 최저점.
→ 손익분기/회수기간은 `metrics.ts`에서 교차점 탐색으로 계산하며, 회수 실패 시 "기간 내 회수 불가"를 명시한다.

## 3. AI 연동 (`supabase/functions/` 백엔드 함수 2개)

| 함수 | 입력 → 출력 |
|---|---|
| `project-scoping` | 프로젝트 아이디어 + 사용자 유형/사업모델/규모/단계 → **사업 유형·규모에 맞는 추가 질문 목록**(key, label, help, inputType, unit, options, required, `mapsTo` 매핑 힌트) JSON |
| `simulation-insights` | 프로젝트 개요 + 검증된 입력 + **엔진 계산 결과 요약** + 가정 목록 → 위험요소(발생가능성/영향도/대응전략), 실행 가능성 평가, 개선 방안, 가정·불확실성 JSON |

- 두 함수 모두 AI 토큰을 `Deno.env.get()`으로만 읽고 서버사이드에서 호출한다. 토큰은 클라이언트에 절대 노출하지 않는다.
- AI 응답은 서버에서 zod로 검증해 형태를 강제한 뒤 반환한다.
- 실패/미연결 시 `ai_status = 'unavailable' | 'error'` + `ai_error`를 저장하고, 화면에는 **"AI 분석을 사용할 수 없습니다"** 패널과 재시도 버튼을 노출한다. 이때 질문은 `baseline` 기본 세트로, 리스크 영역은 빈 상태로 표시한다.
- AI가 제시한 가정·개선안은 **입력값을 자동으로 덮어쓰지 않는다**. 사용자가 "적용" 버튼을 눌러야 반영되고, 적용 사실이 가정 목록에 기록된다.

## 4. 화면 · 라우트

`src/pages/` 하위에 라우트별 디렉터리를 두고 `index.tsx`를 엔트리로 사용한다(코드 가이드라인 준수).

| 라우트 | 화면 |
|---|---|
| `/` | 비로그인 시 `/login`으로 리다이렉트, 로그인 시 `/dashboard` |
| `/login`, `/signup` | 이메일·비밀번호. **회원가입 시 '기업 고객 / 개인 고객' 유형 선택** |
| `/onboarding` | 유형별 프로필 입력 (기업: 기업명·사업모델(복수+직접입력)·규모·단계 / 개인: 관심분야·창업경험·예상투자금) |
| `/dashboard` | 포트폴리오 KPI 카드, 최근 프로젝트, 시나리오 비교 그래프, AI 상태 표시 |
| `/projects` | 목록·검색·필터, **복제·삭제·복수 선택 비교** |
| `/projects/:id` | 탭: 개요 / 시나리오 비교 / 손익·현금흐름 / 민감도 / 위험·개선안 / 가정·불확실성. 입력 수정·재계산·실행 이력 비교·PDF |
| `/projects/compare` | 선택한 2~4개 프로젝트의 KPI·시나리오 결과 나란히 비교 |
| `/simulations/new` | 4단계 위저드: 아이디어 입력 → AI 추가 질문 응답(모르면 '미정') → 조건 조정 → 결과 |
| `/history` | `simulation_runs` 기반 분석 기록 목록·상세 이동 |
| `/settings` | 프로필 수정, 기본 통화, 할인율·세율·시나리오 배수 기본값, 로그아웃 |
| `/report/:runId` | 인쇄 전용 리포트(`window.print()`), `@media print` 스타일 |

**주요 내비게이션**: 대시보드 · 프로젝트 · 새 시뮬레이션 · 분석 기록 · 설정 (`ui/sidebar.tsx` 기반 `AppSidebar`).

### 신규 주요 파일
- `src/components/layout/{AppLayout,AppSidebar,AppTopbar,ProtectedRoute}.tsx`
- `src/providers/auth-provider.tsx`, `src/hooks/{use-auth,use-projects,use-project-inputs,use-simulation-runs,use-run-simulation}.ts`
- `src/lib/api/{projects,profiles,questions,runs,ai}.ts` (테이블 접근 + 백엔드 함수 호출)
- `src/components/simulation/{KpiGrid,ScenarioComparisonChart,ProfitChart,CashFlowChart,BreakEvenChart,SensitivityTable,RiskList,ImprovementList,AiStatusPanel,AssumptionsPanel,ScenarioControls}.tsx`
- `src/components/common/{DataSourceBadge,MetricCard,PageHeader,EmptyState,CurrencyInput}.tsx`
- `src/components/projects/{ProjectCard,ProjectForm,ProjectCompareTable}.tsx`
- `src/lib/simulation/*.ts` (위 2절)
- `src/lib/print.ts`

기존 자산 재사용: `ui/{button,card,input,select,checkbox,radio-group,tabs,table,badge,dialog,alert-dialog,progress,slider,separator,sheet,sidebar,skeleton,textarea,tooltip,dropdown-menu,label,form,chart}.tsx`,
`use-toast`, `sonner`, `recharts`, `react-hook-form` + `zod`(`@hookform/resolvers`), `@tanstack/react-query`, `lucide-react`.

## 5. 디자인 시스템 (index.css + tailwind.config.ts)

- **컬러**: 딥 네이비 `--primary: 218 62% 20%`, 화이트/쿨그레이 배경(`--background: 210 40% 98.5%`, `--muted: 214 30% 96%`), 쿨그레이 보더.
- **시맨틱 토큰 추가**: `--success`, `--warning`, `--info`, `--scenario-optimistic`(스틸블루) / `--scenario-base`(네이비) / `--scenario-pessimistic`(쿨그레이), `--chart-1..5`.
- **그라디언트·그림자**: `--gradient-navy`, `--shadow-elegant`, `--shadow-panel` (네이비 저채도 그림자로 컨설팅 리포트 느낌).
- **타이포**: 산세리프 스택 + 한글 대체 폰트, 금액/수치는 `tabular-nums`. 웹폰트 로드 실패에도 레이아웃 유지되도록 시스템 스택 폴백.
- **레이아웃**: 넉넉한 여백(데스크톱 컨텐츠 최대폭 + 넓은 패딩), 정돈된 카드 그리드, 명확한 정보 위계. 장식적 애니메이션 배제, hover/focus 등 최소한의 상태 전환만 사용.
- **shadcn 커스터마이징**: `button`(navy/outline/ghost/`danger` 변형), `card`(보더 + subtle shadow), `badge`(출처·시나리오·상태 변형), `table`(수치 우측 정렬), `tabs`, `chart` 토큰을 디자인 시스템에 맞게 조정.
- **반응형**: 모바일에서는 사이드바가 `Sheet`/`Sidebar` 오프캔버스로 접히고, KPI·차트는 세로 스택. 표는 가로 스크롤 또는 카드 전환.
- 다크 모드는 요구사항이 아니므로 토글을 만들지 않고, `.dark` 토큰만 네이비 계열로 정합성 있게 정리한다.

## 6. i18n

- `enter_i18n` 스킬 소유. `i18n.config.json`에 `ko` 추가, `zh-CN` 제거, `public/locales/ko.json`·`en.json` 동일 키 세트 유지.
- 모든 UI 문자열은 `const { t } = useTranslation()` + **평면 점 표기 리터럴 키**(예: `t("dashboard.kpi.totalInvestment")`)로 처리한다. 동적 키 생성 금지.
- 언어 전환은 기존 `src/components/language-switcher.tsx`를 앱 상단바·설정 화면에 배치해 재사용한다.
- 엔진 가정·불확실성 문구, 시나리오 라벨, 백엔드 AI 프롬프트의 출력 언어(사용자 로케일)도 번역 키/파라미터로 관리한다.
- 종료 전 `check-i18n.mjs` → `scan-i18n.mjs` 순서로 실행해 검증한다.

## 7. 문서 갱신

`CodeGuideline.md`가 "새 모듈 추가 시 즉시 갱신"을 요구하므로, 신규 페이지·컴포넌트·훅·백엔드 함수 구조를 반영한다.
(README 등 요청되지 않은 문서는 생성하지 않는다.)

---

## Implementation checklist

- [ ] `supabase_enable` 성공 후 `enter_cloud` 스킬 로드, `src/integrations/supabase/client.ts` export 확인
- [ ] `profiles`, `projects`, `project_questions`, `project_inputs`, `simulation_runs` 생성 마이그레이션 적용 (각 테이블 RLS 활성화 + 소유자 전용 정책 포함)
- [ ] 마이그레이션 적용 후 `supabase_read_query`로 RLS 활성 상태를 확인하고, 다른 사용자 컨텍스트에서 타 사용자 행이 보이지 않음을 검증
- [ ] `enable_ai_capability` 성공 후 `enter_llm_integration` 재로드 → 모델 선택 → 해당 `references/protocol_*.md` 읽기
- [ ] `i18n_enable` 성공 후 `enter_i18n` 로드 → `i18n.config.json`에 `ko` 추가·`zh-CN` 제거, `public/locales/{en,ko}.json` 동일 키 세트 작성
- [ ] `src/lib/simulation/types.ts`·`validate.ts`에 `SimulationInput` 타입과 zod 스키마 정의 (미정 항목 허용)
- [ ] `src/lib/simulation/engine.ts`가 매출 스트림 성장·시작월, 변동비, 고정비·인건비·오버헤드, 세금을 반영한 월별 시계열을 산출
- [ ] `src/lib/simulation/metrics.ts`가 손익분기 월, 투자회수 개월, 최대 자금 부족액, NPV·IRR·ROI를 계산 (회수 실패 시 명시적 실패 값 반환)
- [ ] `DEFAULT_SCENARIOS`의 낙관/기준/비관 배수로 3개 시나리오 결과가 서로 다르게 산출됨
- [ ] `scenario_overrides` 수정 시 엔진이 재실행되어 지표·차트가 갱신됨
- [ ] `sensitivity.ts`가 매출 ±10/±20%, 비용 ±10/±20% 조합 표를 엔진 재실행으로 산출
- [ ] `assumptions.ts`가 엔진 가정·불확실성 문구를 i18n 키 기반으로 생성
- [ ] `supabase/functions/project-scoping` 배포: 아이디어·사용자 유형·규모를 받아 추가 질문 JSON을 반환하고 zod로 형태 검증
- [ ] `supabase/functions/simulation-insights` 배포: 엔진 결과를 받아 위험·대응전략·실행가능성·개선안·가정 JSON을 반환하고 zod로 검증
- [ ] 백엔드 함수가 AI 토큰을 `Deno.env.get()`으로만 읽고 클라이언트로 노출하지 않음
- [ ] `auth-provider.tsx` + `ProtectedRoute`로 미로그인 접근을 `/login`으로, 미완료 온보딩을 `/onboarding`으로 유도
- [ ] 회원가입 폼에서 '기업 고객'/'개인 고객'을 선택하고 `profiles.user_type`에 저장됨
- [ ] 온보딩에서 기업(기업명·사업모델 복수+직접입력·규모·단계)/개인(관심분야·창업경험·예상투자금) 항목이 유형에 따라 분기 렌더링되고 저장됨
- [ ] `/simulations/new` 위저드에서 아이디어 입력 → AI 질문 표시 → '미정' 허용 응답 → 결과까지 완료
- [ ] AI 미연결/실패 시 `ai_status`가 `unavailable`/`error`로 저장되고 화면에 기본 질문 세트·"AI 분석 사용 불가"·재시도 UI가 표시됨(가짜 분석 결과 미표시)
- [ ] `DataSourceBadge`로 계산/AI 추정/가정 출처가 모든 수치 영역에 표시됨
- [ ] AI 제안 가정이 자동 적용되지 않고, 사용자가 '적용'을 눌러야 `scenario_overrides`·입력에 반영됨
- [ ] `/projects/:id`에서 저장·수정·재계산이 되고 `simulation_runs`에 이력이 1건씩 추가됨
- [ ] 프로젝트 복제가 프로젝트·질문·입력 행을 모두 복사하고 원본과 독립적으로 수정 가능
- [ ] `/projects/compare`가 선택한 프로젝트들의 KPI·시나리오를 나란히 비교
- [ ] `/dashboard`가 KPI 카드·최근 프로젝트·시나리오 비교 차트·AI 상태를 렌더링
- [ ] `/history`가 `simulation_runs` 목록과 상세 이동을 제공
- [ ] `/settings`가 프로필·기본 통화·할인율·세율·시나리오 배수 기본값을 저장
- [ ] `/report/:runId` 인쇄 전용 페이지에서 `window.print()`로 PDF 저장 가능, 인쇄 시 내비게이션·버튼이 숨겨짐
- [ ] `index.css`·`tailwind.config.ts`에 네이비/쿨그레이 시맨틱 토큰·시나리오 토큰·차트 토큰·그림자·폰트 스택 정의
- [ ] shadcn `button`·`card`·`badge`·`table`·`tabs`·`chart`가 디자인 시스템 토큰과 시맨틱 변형을 사용하고 hex/`text-white` 직접 사용이 없음
- [ ] 모든 신규 화면 문구가 `t()` 리터럴 키를 사용하고 ko/en 키 세트가 일치
- [ ] `CodeGuideline.md`에 신규 페이지·컴포넌트·훅·백엔드 함수 구조 반영
- [ ] `pnpm lint`·`pnpm exec tsc --noEmit`·`pnpm run build` 통과
- [ ] `node /workspace/.agents/skills/enter_i18n@1/assets/scripts/check-i18n.mjs` → `scan-i18n.mjs` 실행 및 통과

## Verification checklist

**긍정 경로**
- [ ] 신규 가입(기업 고객) → 온보딩 저장 → `/simulations/new`에서 프로젝트 생성 → AI 질문 응답 → 시뮬레이션 실행 → `/projects`와 `/history`에 결과가 나타남
- [ ] 개인 고객 계정으로 가입해 동일 흐름이 개인용 프로필 필드와 함께 동작
- [ ] 프로젝트 상세에서 매출·비용·사업 기간을 변경하면 KPI·차트·표가 재계산되고 새 이력이 추가됨
- [ ] 낙관/기준/비관 시나리오 배수를 바꿨을 때 3개 시나리오 지표가 서로 다르게 갱신됨
- [ ] `/projects/compare`에서 2개 이상 프로젝트 비교 표·차트가 표시됨
- [ ] `/report/:runId`에서 인쇄 미리보기에 보고서 본문만 보이고 버튼·사이드바가 보이지 않음

**부정/기본 경로**
- [ ] AI capability를 끈 상태(또는 백엔드 함수 실패 유도)에서 기본 질문 세트와 "AI 분석 사용 불가"·재시도 UI만 표시되고, 위험·개선안이 생성된 것처럼 보이지 않음
- [ ] 로그아웃 상태로 `/dashboard`, `/projects`, `/settings`에 직접 접근하면 `/login`으로 리다이렉트
- [ ] 온보딩 미완료 계정으로 보호 라우트 접근 시 `/onboarding`으로 유도
- [ ] 프로젝트·이력이 없는 계정에서 빈 상태 UI가 표시되고 잘못된 수치가 나오지 않음

**경계/보안**
- [ ] 모르는 항목을 '미정'으로 두고 실행해도 계산이 중단되지 않고, 미정 가정이 가정 목록에 명시됨
- [ ] 미정/0 입력(매출 0, 투자금 0, 기간 1개월)에서 NaN·Infinity 없이 0 또는 "계산 불가" 문구가 표시됨
- [ ] 투자회수 실패 케이스(비관 시나리오)에서 "기간 내 회수 불가"가 표시되고 0으로 오인되지 않음
- [ ] 두 번째 계정으로 로그인해 첫 계정의 프로젝트·이력·프로필이 조회·수정되지 않음 (RLS 확인)
- [ ] 브라우저 콘솔에 오류가 없음
- [ ] `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm run build` 통과
- [ ] `check-i18n.mjs` 통과 및 `scan-i18n.mjs` 리포트 생성

**반응형**
- [ ] 데스크톱 1280px에서 사이드바·KPI 그리드·차트 레이아웃 정상
- [ ] 모바일 390px에서 사이드바가 접히고 KPI·표·차트가 잘림 없이 스택/스크롤됨
