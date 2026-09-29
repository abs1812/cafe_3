/**
 * 카페 주문 및 메뉴 관련 타입 정의
 */

// 음료 메뉴 아이템 타입
export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  category?: 'coffee' | 'non-coffee';
}

// 사이즈 옵션 타입
export type SizeOption = 'S' | 'M' | 'L';

export interface SizeConfig {
  id: SizeOption;
  name: string;
  extraPrice: number;
}

// 추가 옵션 타입
export interface ExtraOption {
  id: string;
  name: string;
  price: number;
}

// 주문서 입력 데이터 상태 타입
export interface OrderFormData {
  customerName: string; // 이름 (필수)
  phoneNumber: string;  // 전화번호
  menuId: string;       // 선택된 음료 ID
  size: SizeOption;     // 사이즈 (기본값 'M')
  selectedOptions: string[]; // 선택된 추가 옵션 ID 목록
  quantity: number;     // 수량 (1 ~ 10, 기본값 1)
  requests: string;     // 요청사항
}

// 완료된 주문(게시판 표시용) 타입
export interface CafeOrder {
  id: string;
  orderNumber: number;
  customerName: string;
  phoneNumber: string;
  menuName: string;
  size: SizeOption;
  selectedOptions: string[];
  optionsText: string;
  quantity: number;
  totalPrice: number;
  requests?: string;
  createdAt: string;
  status: '접수완료' | '제조중' | '준비완료' | '수령완료';
}
