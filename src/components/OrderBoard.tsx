import React, { useState } from 'react';
import { CafeOrder } from '../types/cafe';
import {
  Clock,
  User,
  Coffee,
  Trash2,
  RefreshCw,
  Loader2,
  Database,
  CloudOff,
} from 'lucide-react';

interface OrderBoardProps {
  orders: CafeOrder[];
  isLoading?: boolean;
  isConfigured?: boolean;
  isSyncing?: boolean;
  onRefresh?: () => void;
  onUpdateStatus: (orderId: string, nextStatus: CafeOrder['status']) => Promise<void> | void;
  onDeleteOrder: (orderId: string) => Promise<void> | void;
  onClearAll: () => Promise<void> | void;
}

/**
 * 카페 주문 현황 게시판 컴포넌트
 * 주문서에서 접수된 주문들을 실시간으로 확인하고 상태를 변경할 수 있는 카페 전용 보드
 */
export const OrderBoard: React.FC<OrderBoardProps> = ({
  orders,
  isLoading = false,
  isConfigured = false,
  isSyncing = false,
  onRefresh,
  onUpdateStatus,
  onDeleteOrder,
  onClearAll,
}) => {
  // 개별 항목 처리 중 상태
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);

  // 상태별 색상 뱃지
  const getStatusBadge = (status: CafeOrder['status']) => {
    switch (status) {
      case '접수완료':
        return 'bg-[#fff3e0] text-[#b45309] border-[#fed7aa]';
      case '제조중':
        return 'bg-[#fef3c7] text-[#92400e] border-[#fde68a] animate-pulse';
      case '준비완료':
        return 'bg-[#dcfce7] text-[#15803d] border-[#bbf7d0]';
      case '수령완료':
        return 'bg-[#f3f4f6] text-[#4b5563] border-[#e5e7eb]';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const nextStatusMap: Record<CafeOrder['status'], CafeOrder['status']> = {
    접수완료: '제조중',
    제조중: '준비완료',
    준비완료: '수령완료',
    수령완료: '접수완료',
  };

  const handleStatusClick = async (orderId: string, nextStatus: CafeOrder['status']) => {
    try {
      setBusyOrderId(orderId);
      await onUpdateStatus(orderId, nextStatus);
    } finally {
      setBusyOrderId(null);
    }
  };

  const handleDeleteClick = async (orderId: string) => {
    if (!confirm('이 주문을 삭제하시겠습니까?')) return;
    try {
      setBusyOrderId(orderId);
      await onDeleteOrder(orderId);
    } finally {
      setBusyOrderId(null);
    }
  };

  return (
    <div className="w-full max-w-[520px] mx-auto bg-white rounded-2xl shadow-lg border border-[#e8dfd6] p-6 sm:p-7">
      {/* 상단 헤더 영역 */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#f0e6dc]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#6b4226]/10 flex items-center justify-center text-[#6b4226]">
            <Coffee className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-[#3e2618]">카페 주문 현황 게시판</h3>
              {isConfigured ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <Database className="w-3 h-3" />
                  DB 연동
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  <CloudOff className="w-3 h-3" />
                  로컬 메모리
                </span>
              )}
            </div>
            <p className="text-xs text-[#8c6b51]">총 {orders.length}건의 주문 내역</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading || isSyncing}
              className="p-1.5 text-[#8c6b51] hover:text-[#3e2618] hover:bg-[#faf6f0] rounded-lg border border-[#ded0c1] transition cursor-pointer"
              title="새로고침"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#6b4226]' : ''}`} />
            </button>
          )}

          {orders.length > 0 && (
            <button
              onClick={onClearAll}
              className="text-xs text-[#a85a44] hover:text-[#7f1d1d] hover:underline flex items-center gap-1 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>비우기</span>
            </button>
          )}
        </div>
      </div>

      {/* 로딩 표시 */}
      {isLoading ? (
        <div className="text-center py-14 px-4 space-y-3">
          <Loader2 className="w-7 h-7 text-[#6b4226] animate-spin mx-auto" />
          <p className="text-sm font-medium text-[#735741]">주문 내역을 불러오는 중입니다...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 px-4">
          <div className="text-4xl mb-3">☕</div>
          <p className="text-sm font-semibold text-[#54341c] mb-1">
            아직 접수된 주문이 없습니다.
          </p>
          <p className="text-xs text-[#8c6b51]">
            주문서 작성 탭에서 첫 주문을 등록해보세요!
          </p>
        </div>
      ) : (
        <div className="space-y-3.5 max-h-[580px] overflow-y-auto pr-1">
          {orders.map((order) => {
            const nextStatus = nextStatusMap[order.status];
            const isItemBusy = busyOrderId === order.id;

            return (
              <div
                key={order.id}
                className={`bg-[#faf6f0] border border-[#ede3d7] rounded-xl p-4 transition hover:border-[#d6c4b2] shadow-xs ${
                  isItemBusy ? 'opacity-60 pointer-events-none' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-[#6b4226] bg-[#6b4226]/10 px-2 py-0.5 rounded">
                      #{order.orderNumber}
                    </span>
                    <span className="font-bold text-sm text-[#3e2618] flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-[#8c6b51]" />
                      {order.customerName}
                    </span>
                    <span className="text-xs text-[#8c6b51]">({order.phoneNumber})</span>
                  </div>

                  {/* 상태 변경 뱃지 버튼 */}
                  <button
                    onClick={() => handleStatusClick(order.id, nextStatus)}
                    disabled={isItemBusy}
                    className={`text-xs px-2.5 py-1 rounded-full font-bold border flex items-center gap-1 cursor-pointer transition ${getStatusBadge(
                      order.status
                    )}`}
                    title={`클릭 시 [${nextStatus}] 상태로 변경`}
                  >
                    {isItemBusy ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <>
                        <span>{order.status}</span>
                        <span className="text-[10px] opacity-70">➔</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-white rounded-lg p-2.5 border border-[#ece3d9] mb-2">
                  <div className="flex items-center justify-between text-sm font-semibold text-[#3e2618]">
                    <span>
                      {order.menuName} ({order.size}사이즈) × {order.quantity}잔
                    </span>
                    <span className="text-[#6b4226] font-bold">
                      {order.totalPrice.toLocaleString()}원
                    </span>
                  </div>
                  <div className="text-xs text-[#735741] mt-1">
                    옵션: {order.optionsText}
                  </div>
                  {order.requests && (
                    <div className="text-xs text-[#9c5f3b] mt-1 pt-1 border-t border-dashed border-[#ece3d9] italic">
                      요청사항: "{order.requests}"
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-[#8c6b51]">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {order.createdAt}
                  </span>
                  <button
                    onClick={() => handleDeleteClick(order.id)}
                    disabled={isItemBusy}
                    className="text-[#a85a44] hover:text-[#7f1d1d] hover:underline cursor-pointer disabled:opacity-50"
                  >
                    삭제
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
