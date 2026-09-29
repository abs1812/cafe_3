/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { OrderForm } from './components/OrderForm';
import { OrderBoard } from './components/OrderBoard';
import { SqlModal } from './components/SqlModal';
import { CafeOrder, SizeOption } from './types/cafe';
import { orderService } from './services/orderService';
import {
  Database,
  ClipboardList,
  Coffee,
  Sparkles,
  AlertCircle,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';

export default function App() {
  // 현재 활성화된 탭 ('order': 주문서 작성, 'board': 카페 주문 게시판)
  const [activeTab, setActiveTab] = useState<'order' | 'board'>('order');

  // Supabase SQL 모달 표시 여부
  const [isSqlModalOpen, setIsSqlModalOpen] = useState<boolean>(false);

  // Supabase 설정 여부
  const isConfigured = orderService.isConfigured();

  // 주문 내역 로딩 상태
  const [isLoading, setIsLoading] = useState<boolean>(isConfigured);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 주문 내역 목록 (Supabase 미연결 시 로컬 샘플 주문 1건 표시)
  const [orders, setOrders] = useState<CafeOrder[]>([
    {
      id: 'sample-order-1',
      orderNumber: 101,
      customerName: '홍길동',
      phoneNumber: '010-1234-5678',
      menuName: '카페라떼',
      size: 'M',
      selectedOptions: ['샷 추가'],
      optionsText: '샷 추가',
      quantity: 1,
      totalPrice: 5000,
      requests: '얼음 적게 부탁드려요!',
      createdAt: '오후 02:30:15',
      status: '제조중',
    },
  ]);

  /**
   * Supabase에서 주문 목록 불러오기
   */
  const loadOrders = useCallback(async (isSilent = false) => {
    if (!isConfigured) {
      setIsLoading(false);
      return;
    }

    try {
      if (!isSilent) setIsLoading(true);
      else setIsSyncing(true);
      setErrorMessage(null);

      const data = await orderService.fetchOrders();
      setOrders(data);
    } catch (err: any) {
      console.error('주문 목록 로딩 오류:', err);
      setErrorMessage(
        err?.message || '주문 내역을 불러오지 못했습니다. 테이블이 생성되어 있는지 확인해주세요.'
      );
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  }, [isConfigured]);

  // 마운트 시 데이터 조회 및 Supabase Realtime 구독
  useEffect(() => {
    if (isConfigured) {
      loadOrders();

      // Supabase Realtime 구독 설정
      const unsubscribe = orderService.subscribeToOrders(() => {
        loadOrders(true);
      });

      return () => {
        unsubscribe();
      };
    }
  }, [isConfigured, loadOrders]);

  /**
   * 새 주문 등록 핸들러 (OrderForm에서 호출)
   */
  const handleOrderSuccess = async (orderInput: {
    customerName: string;
    phoneNumber?: string;
    menuName: string;
    size: SizeOption;
    selectedOptions: string[];
    quantity: number;
    totalPrice: number;
    requests?: string;
  }) => {
    if (isConfigured) {
      // Supabase DB에 등록
      const savedOrder = await orderService.createOrder(orderInput);
      setOrders((prev) => [savedOrder, ...prev.filter((o) => o.id !== savedOrder.id)]);
    } else {
      // 로컬 메모리 모드 등록
      const optionsText =
        orderInput.selectedOptions.length > 0
          ? orderInput.selectedOptions.join(', ')
          : '기본';

      const localOrder: CafeOrder = {
        id: `order-${Date.now()}`,
        orderNumber: Math.floor(100 + Math.random() * 900),
        customerName: orderInput.customerName,
        phoneNumber: orderInput.phoneNumber || '연락처 미기재',
        menuName: orderInput.menuName,
        size: orderInput.size,
        selectedOptions: orderInput.selectedOptions,
        optionsText,
        quantity: orderInput.quantity,
        totalPrice: orderInput.totalPrice,
        requests: orderInput.requests,
        createdAt: new Date().toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        status: '접수완료',
      };

      setOrders((prev) => [localOrder, ...prev]);
    }
  };

  /**
   * 주문 상태 변경 핸들러
   */
  const handleUpdateStatus = async (
    orderId: string,
    nextStatus: CafeOrder['status']
  ) => {
    // 낙관적 UI 업데이트
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, status: nextStatus } : order
      )
    );

    if (isConfigured) {
      try {
        await orderService.updateOrderStatus(orderId, nextStatus);
      } catch (err: any) {
        console.error('상태 변경 실패:', err);
        alert(`상태 변경 중 오류가 발생했습니다: ${err?.message}`);
        // 롤백 위해 다시 조회
        loadOrders(true);
      }
    }
  };

  /**
   * 주문 단건 삭제
   */
  const handleDeleteOrder = async (orderId: string) => {
    // 낙관적 UI 업데이트
    setOrders((prev) => prev.filter((o) => o.id !== orderId));

    if (isConfigured) {
      try {
        await orderService.deleteOrder(orderId);
      } catch (err: any) {
        console.error('주문 삭제 실패:', err);
        alert(`주문 삭제 중 오류가 발생했습니다: ${err?.message}`);
        loadOrders(true);
      }
    }
  };

  /**
   * 모든 주문 비우기
   */
  const handleClearAll = async () => {
    if (!confirm('주문 내역을 모두 비우시겠습니까?')) return;

    if (isConfigured) {
      try {
        await orderService.clearAllOrders();
        setOrders([]);
      } catch (err: any) {
        console.error('전체 삭제 실패:', err);
        alert(`전체 삭제 중 오류가 발생했습니다: ${err?.message}`);
        loadOrders(true);
      }
    } else {
      setOrders([]);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf6f0] text-[#3e2618] py-8 px-4 font-['Malgun_Gothic','맑은_고딕',sans-serif]">
      {/* 전체 너비 최대 520px 및 가운데 정렬 */}
      <div className="w-full max-w-[520px] mx-auto space-y-5">
        
        {/* 상단 도구 모음 */}
        <div className="flex items-center justify-between px-2 text-xs">
          <div className="flex items-center gap-1.5 text-[#8c6b51] font-medium">
            <Sparkles className="w-3.5 h-3.5 text-[#6b4226]" />
            <span>바이브 카페 온라인 오더 시스템</span>
          </div>

          <button
            onClick={() => setIsSqlModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#ded0c1] hover:border-[#6b4226] text-[#6b4226] rounded-full shadow-xs hover:shadow-sm font-semibold transition cursor-pointer"
            title="Supabase SQL Editor용 쿼리 확인"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Supabase SQL 복사</span>
          </button>
        </div>

        {/* Supabase 연결 상태 안내 배너 */}
        {isConfigured ? (
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-emerald-800">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Supabase 연동 완료:</strong> 실시간 클라우드 DB에 주문이 저장됩니다.
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50/90 border border-amber-200 rounded-xl px-4 py-2.5 flex items-start justify-between text-xs text-amber-900 gap-2">
            <div className="flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Supabase 연결 대기 중 (로컬 메모리 모드)</span>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  프로젝트 루트의 <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono">.env</code> 파일에 Supabase URL과 Key를 입력하시면 즉시 클라우드 연동이 활성화됩니다.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsSqlModalOpen(true)}
              className="text-[11px] font-bold text-[#6b4226] hover:underline whitespace-nowrap pt-0.5 cursor-pointer"
            >
              SQL 보기
            </button>
          </div>
        )}

        {/* 에러 발생 시 경고 배너 */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-red-800">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold mb-0.5">데이터베이스 연동 안내</div>
              <div>{errorMessage}</div>
              <p className="mt-1 text-[11px] text-red-600">
                Supabase SQL Editor에서 상단의 [Supabase SQL 복사] 쿼리를 실행하여 <code>cafe_orders</code> 테이블을 먼저 생성했는지 확인해주세요.
              </p>
            </div>
            <button
              onClick={() => loadOrders()}
              className="text-xs font-semibold text-red-700 underline shrink-0 cursor-pointer"
            >
              다시 시도
            </button>
          </div>
        )}

        {/* [페이지 상단] 카페 로고, 카페 이름, 부제 */}
        <header className="text-center pt-1 pb-1">
          <div className="inline-block text-6xl mb-2 drop-shadow-xs transform hover:scale-105 transition-transform duration-300 select-none">
            ☕
          </div>
          <h1 className="text-3xl font-extrabold text-[#6b4226] tracking-tight mb-1">
            바이브 카페
          </h1>
          <p className="text-sm font-medium text-[#8c6b51]">
            당신의 하루에 바이브를 더하다
          </p>
        </header>

        {/* 탭 네비게이션: [주문서 작성] vs [주문 현황 게시판] */}
        <nav className="flex bg-[#efe8df] p-1.5 rounded-xl border border-[#ded0c1]" aria-label="메뉴 선택">
          <button
            type="button"
            onClick={() => setActiveTab('order')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold text-sm transition-all cursor-pointer ${
              activeTab === 'order'
                ? 'bg-white text-[#6b4226] shadow-sm'
                : 'text-[#8c6b51] hover:text-[#54341c]'
            }`}
          >
            <Coffee className="w-4 h-4" />
            <span>주문서 작성</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('board')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold text-sm transition-all cursor-pointer relative ${
              activeTab === 'board'
                ? 'bg-white text-[#6b4226] shadow-sm'
                : 'text-[#8c6b51] hover:text-[#54341c]'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>주문 게시판</span>
            {orders.length > 0 && (
              <span className="bg-[#6b4226] text-white text-xs font-bold px-2 py-0.2 rounded-full ml-1">
                {orders.length}
              </span>
            )}
          </button>
        </nav>

        {/* 본문 콘텐츠: 탭에 따라 주문서 폼 또는 게시판 표시 */}
        <main>
          {activeTab === 'order' ? (
            <OrderForm onOrderSuccess={handleOrderSuccess} />
          ) : (
            <OrderBoard
              orders={orders}
              isLoading={isLoading}
              isConfigured={isConfigured}
              isSyncing={isSyncing}
              onRefresh={() => loadOrders(true)}
              onUpdateStatus={handleUpdateStatus}
              onDeleteOrder={handleDeleteOrder}
              onClearAll={handleClearAll}
            />
          )}
        </main>

        {/* 하단 푸터 */}
        <footer className="text-center pt-3 pb-8 border-t border-[#ebdcd0] text-xs text-[#9a7b63] space-y-1">
          <p className="font-medium">바이브 카페 (Vibe Cafe) • 영업시간 08:00 - 22:00</p>
          <p className="text-[11px] text-[#b09681]">
            신선한 원두와 정성으로 내리는 핸드메이드 음료
          </p>
        </footer>
      </div>

      {/* Supabase SQL 쿼리 모달 */}
      <SqlModal isOpen={isSqlModalOpen} onClose={() => setIsSqlModalOpen(false)} />
    </div>
  );
}
