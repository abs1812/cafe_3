import { MenuItem, SizeConfig, ExtraOption } from '../types/cafe';

/**
 * 기본 음료 메뉴 목록
 */
export const MENU_ITEMS: MenuItem[] = [
  { id: 'americano', name: '아메리카노', price: 3500, category: 'coffee' },
  { id: 'caffe_latte', name: '카페라떼', price: 4000, category: 'coffee' },
  { id: 'caffe_mocha', name: '카페모카', price: 4500, category: 'coffee' },
  { id: 'vanilla_latte', name: '바닐라라떼', price: 4500, category: 'coffee' },
  { id: 'green_tea_latte', name: '녹차라떼', price: 4500, category: 'non-coffee' },
];

/**
 * 사이즈 옵션 설정 (기본값 M)
 */
export const SIZE_OPTIONS: SizeConfig[] = [
  { id: 'S', name: 'S', extraPrice: 0 },
  { id: 'M', name: 'M', extraPrice: 500 },
  { id: 'L', name: 'L', extraPrice: 1000 },
];

/**
 * 추가 옵션 설정
 */
export const EXTRA_OPTIONS: ExtraOption[] = [
  { id: 'extra_shot', name: '샷 추가', price: 500 },
  { id: 'extra_cream', name: '크림 추가', price: 500 },
  { id: 'extra_syrup', name: '시럽 추가', price: 300 },
  { id: 'decaf', name: '디카페인', price: 0 },
];

/**
 * 초기 폼 상태값
 */
export const INITIAL_FORM_STATE = {
  customerName: '',
  phoneNumber: '',
  menuId: '',
  size: 'M' as const,
  selectedOptions: [] as string[],
  quantity: 1,
  requests: '',
};

/**
 * Supabase SQL 쿼리문 모음
 * 사용자가 Supabase SQL Editor에 바로 복사/붙여넣기하여 실행할 수 있습니다.
 */
export const SUPABASE_SQL = {
  // 1. cafe_menu 테이블 생성 쿼리 (메뉴 마스터 데이터용)
  createMenuTable: `-- 1. cafe_menu 테이블 생성 (음료 메뉴 마스터 정보)
CREATE TABLE IF NOT EXISTS public.cafe_menu (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_id VARCHAR(50) UNIQUE NOT NULL,      -- 예: 'americano', 'caffe_latte'
    name VARCHAR(100) NOT NULL,               -- 음료명 (예: '아메리카노')
    base_price INTEGER NOT NULL DEFAULT 0,    -- 기본 가격 (예: 3500)
    category VARCHAR(50) DEFAULT 'coffee',     -- 카테고리 (coffee, non-coffee)
    is_available BOOLEAN DEFAULT true,        -- 판매 가능 여부
    created_at TIMESTAMPTZ DEFAULT now()      -- 생성일시
);

-- RLS (Row Level Security) 설정 및 조회 권한 허용
ALTER TABLE public.cafe_menu ENABLE ROW LEVEL SECURITY;
CREATE POLICY "누구나 메뉴 목록을 조회할 수 있습니다." 
    ON public.cafe_menu FOR SELECT USING (true);
`,

  // 2. 주문서 항목을 반영한 테이블 생성 (cafe_orders 또는 통합 cafe_menu_orders)
  createOrderTable: `-- 2. cafe_orders 테이블 생성 (주문서 항목을 모두 포함하는 주문 테이블)
CREATE TABLE IF NOT EXISTS public.cafe_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name VARCHAR(100) NOT NULL,             -- 1. 이름 (필수, text)
    phone_number VARCHAR(30),                         -- 2. 전화번호 (tel)
    menu_name VARCHAR(100) NOT NULL,                 -- 3. 음료명 (드롭다운 선택값)
    size VARCHAR(10) NOT NULL DEFAULT 'M',           -- 4. 사이즈 (S, M, L)
    options TEXT[] DEFAULT '{}',                     -- 5. 추가 옵션 (샷 추가, 크림 추가 등)
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1 AND quantity <= 10), -- 6. 수량 (1~10)
    total_price INTEGER NOT NULL DEFAULT 0,          -- 실시간 계산된 총 주문 금액
    requests TEXT,                                   -- 7. 요청사항 (textarea)
    status VARCHAR(20) DEFAULT '접수완료',            -- 주문 상태 (접수완료, 제조중, 준비완료 등)
    created_at TIMESTAMPTZ DEFAULT now()             -- 주문 접수 일시
);

-- RLS 활성화 및 권한 정책
ALTER TABLE public.cafe_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "누구나 주문을 등록하고 조회할 수 있습니다." 
    ON public.cafe_orders FOR ALL USING (true) WITH CHECK (true);
`,

  // 3. 테스트용 1건 가짜 데이터 밀어넣는 INSERT 쿼리문
  insertSampleData: `-- 3-1. cafe_menu 기본 메뉴 5건 등록
INSERT INTO public.cafe_menu (menu_id, name, base_price, category)
VALUES 
    ('americano', '아메리카노', 3500, 'coffee'),
    ('caffe_latte', '카페라떼', 4000, 'coffee'),
    ('caffe_mocha', '카페모카', 4500, 'coffee'),
    ('vanilla_latte', '바닐라라떼', 4500, 'coffee'),
    ('green_tea_latte', '녹차라떼', 4500, 'non-coffee')
ON CONFLICT (menu_id) DO NOTHING;

-- 3-2. cafe_orders 테스트용 1건 주문 데이터 INSERT (주문 확인 메시지 예시 항목)
-- "홍길동님, 카페라떼 M사이즈 (샷 추가) 1잔, 총 5,000원 주문"
INSERT INTO public.cafe_orders (
    customer_name,
    phone_number,
    menu_name,
    size,
    options,
    quantity,
    total_price,
    requests,
    status
) VALUES (
    '홍길동',
    '010-1234-5678',
    '카페라떼',
    'M',
    ARRAY['샷 추가'],
    1,
    5000,
    '얼음 적게 부탁드려요!',
    '접수완료'
);
`,

  // 통합 전체 실행 스크립트 (한 번에 실행 가능)
  fullScript: `-- ==========================================================
-- [바이브 카페] Supabase SQL Editor 원클릭 전체 실행 스크립트
-- ==========================================================

-- 1. cafe_menu 테이블 생성
CREATE TABLE IF NOT EXISTS public.cafe_menu (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    base_price INTEGER NOT NULL DEFAULT 0,
    category VARCHAR(50) DEFAULT 'coffee',
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. cafe_orders 테이블 생성 (주문서 항목 컬럼 전체 포함)
CREATE TABLE IF NOT EXISTS public.cafe_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name VARCHAR(100) NOT NULL,             -- 이름 (필수)
    phone_number VARCHAR(30),                         -- 전화번호
    menu_name VARCHAR(100) NOT NULL,                 -- 음료 선택
    size VARCHAR(10) NOT NULL DEFAULT 'M',           -- 사이즈 (S, M, L)
    options TEXT[] DEFAULT '{}',                     -- 추가 옵션 목록
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1 AND quantity <= 10), -- 수량 (1~10)
    total_price INTEGER NOT NULL DEFAULT 0,          -- 예상/최종 금액
    requests TEXT,                                   -- 요청사항
    status VARCHAR(20) DEFAULT '접수완료',            -- 주문 상태
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 활성화
ALTER TABLE public.cafe_menu ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cafe_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cafe_menu_select_policy" ON public.cafe_menu;
CREATE POLICY "cafe_menu_select_policy" ON public.cafe_menu FOR SELECT USING (true);

DROP POLICY IF EXISTS "cafe_orders_all_policy" ON public.cafe_orders;
CREATE POLICY "cafe_orders_all_policy" ON public.cafe_orders FOR ALL USING (true) WITH CHECK (true);

-- 3. cafe_menu 기본 메뉴 5건 시딩
INSERT INTO public.cafe_menu (menu_id, name, base_price, category)
VALUES 
    ('americano', '아메리카노', 3500, 'coffee'),
    ('caffe_latte', '카페라떼', 4000, 'coffee'),
    ('caffe_mocha', '카페모카', 4500, 'coffee'),
    ('vanilla_latte', '바닐라라떼', 4500, 'coffee'),
    ('green_tea_latte', '녹차라떼', 4500, 'non-coffee')
ON CONFLICT (menu_id) DO NOTHING;

-- 4. 테스트용 1건 가짜 주문 데이터 INSERT
INSERT INTO public.cafe_orders (
    customer_name,
    phone_number,
    menu_name,
    size,
    options,
    quantity,
    total_price,
    requests,
    status
) VALUES (
    '홍길동',
    '010-1234-5678',
    '카페라떼',
    'M',
    ARRAY['샷 추가'],
    1,
    5000,
    '얼음 적게 부탁드려요!',
    '접수완료'
);
`
};
