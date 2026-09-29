import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { CafeOrder, SizeOption } from '../types/cafe';

export interface DbCafeOrder {
  id: string;
  customer_name: string;
  phone_number: string | null;
  menu_name: string;
  size: string;
  options: string[] | null;
  quantity: number;
  total_price: number;
  requests: string | null;
  status: string;
  created_at: string;
}

/**
 * UUID 또는 문자열 ID로부터 3자리 주문 번호 추출/생성
 */
function extractOrderNumber(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return 100 + (Math.abs(hash) % 900);
}

/**
 * Supabase DB row를 프론트엔드 CafeOrder 타입으로 변환
 */
export function mapDbOrderToCafeOrder(row: DbCafeOrder): CafeOrder {
  const options = Array.isArray(row.options) ? row.options : [];
  const optionsText = options.length > 0 ? options.join(', ') : '기본';

  // 한국 시간 포맷팅
  let createdAtFormatted = row.created_at;
  try {
    const date = new Date(row.created_at);
    createdAtFormatted = date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    createdAtFormatted = row.created_at;
  }

  return {
    id: row.id,
    orderNumber: extractOrderNumber(row.id),
    customerName: row.customer_name,
    phoneNumber: row.phone_number || '연락처 미기재',
    menuName: row.menu_name,
    size: (row.size as SizeOption) || 'M',
    selectedOptions: options,
    optionsText,
    quantity: row.quantity,
    totalPrice: row.total_price,
    requests: row.requests || undefined,
    createdAt: createdAtFormatted,
    status: (row.status as CafeOrder['status']) || '접수완료',
  };
}

export const orderService = {
  /**
   * Supabase 설정 상태 확인
   */
  isConfigured(): boolean {
    return isSupabaseConfigured() && supabase !== null;
  },

  /**
   * 전체 주문 내역 조회 (최신순 정렬)
   */
  async fetchOrders(): Promise<CafeOrder[]> {
    if (!this.isConfigured() || !supabase) {
      throw new Error('Supabase 설정이 완료되지 않았습니다.');
    }

    const { data, error } = await supabase
      .from('cafe_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`주문 목록 조회 실패: ${error.message}`);
    }

    return (data as DbCafeOrder[]).map(mapDbOrderToCafeOrder);
  },

  /**
   * 새 주문 등록 (INSERT)
   */
  async createOrder(orderInput: {
    customerName: string;
    phoneNumber?: string;
    menuName: string;
    size: SizeOption;
    selectedOptions: string[];
    quantity: number;
    totalPrice: number;
    requests?: string;
  }): Promise<CafeOrder> {
    if (!this.isConfigured() || !supabase) {
      throw new Error('Supabase 설정이 완료되지 않았습니다.');
    }

    const { data, error } = await supabase
      .from('cafe_orders')
      .insert([
        {
          customer_name: orderInput.customerName.trim(),
          phone_number: orderInput.phoneNumber?.trim() || null,
          menu_name: orderInput.menuName,
          size: orderInput.size,
          options: orderInput.selectedOptions,
          quantity: orderInput.quantity,
          total_price: orderInput.totalPrice,
          requests: orderInput.requests?.trim() || null,
          status: '접수완료',
        },
      ])
      .select()
      .single();

    if (error) {
      throw new Error(`주문 등록 실패: ${error.message}`);
    }

    return mapDbOrderToCafeOrder(data as DbCafeOrder);
  },

  /**
   * 주문 상태 업데이트 (UPDATE)
   */
  async updateOrderStatus(
    orderId: string,
    nextStatus: CafeOrder['status']
  ): Promise<void> {
    if (!this.isConfigured() || !supabase) {
      throw new Error('Supabase 설정이 완료되지 않았습니다.');
    }

    const { error } = await supabase
      .from('cafe_orders')
      .update({ status: nextStatus })
      .eq('id', orderId);

    if (error) {
      throw new Error(`주문 상태 변경 실패: ${error.message}`);
    }
  },

  /**
   * 주문 단건 삭제 (DELETE)
   */
  async deleteOrder(orderId: string): Promise<void> {
    if (!this.isConfigured() || !supabase) {
      throw new Error('Supabase 설정이 완료되지 않았습니다.');
    }

    const { error } = await supabase
      .from('cafe_orders')
      .delete()
      .eq('id', orderId);

    if (error) {
      throw new Error(`주문 삭제 실패: ${error.message}`);
    }
  },

  /**
   * 주문 전체 삭제
   */
  async clearAllOrders(): Promise<void> {
    if (!this.isConfigured() || !supabase) {
      throw new Error('Supabase 설정이 완료되지 않았습니다.');
    }

    // 모든 행 삭제
    const { error } = await supabase
      .from('cafe_orders')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      throw new Error(`전체 주문 삭제 실패: ${error.message}`);
    }
  },

  /**
   * Supabase Realtime 구독 (주문 변경 실시간 반영)
   */
  subscribeToOrders(onChange: () => void): () => void {
    if (!this.isConfigured() || !supabase) {
      return () => {};
    }

    const channel = supabase
      .channel('cafe_orders_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cafe_orders' },
        () => {
          onChange();
        }
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  },
};
