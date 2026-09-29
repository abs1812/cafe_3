import React, { useState, useId } from 'react';
import {
  MENU_ITEMS,
  SIZE_OPTIONS,
  EXTRA_OPTIONS,
  INITIAL_FORM_STATE,
} from '../data/cafeData';
import { OrderFormData, SizeOption, CafeOrder } from '../types/cafe';
import { AlertCircle, CheckCircle2, RotateCcw, Coffee, Loader2 } from 'lucide-react';

interface OrderFormProps {
  onOrderSuccess: (orderData: {
    customerName: string;
    phoneNumber?: string;
    menuName: string;
    size: SizeOption;
    selectedOptions: string[];
    quantity: number;
    totalPrice: number;
    requests?: string;
  }) => Promise<void> | void;
}

/**
 * 바이브 카페 주문서 폼 컴포넌트
 * - 최대 너비 520px, 가운데 정렬
 * - 따뜻한 베이지(#faf6f0) 및 브라운(#6b4226) 컬러 테마
 * - 모든 입력 요소에 label 연결
 * - 실시간 금액 계산 및 한국어 주석
 */
export const OrderForm: React.FC<OrderFormProps> = ({ onOrderSuccess }) => {
  // 고유 id 접두사 생성 (label - input 간 완벽한 접근성 연결)
  const baseId = useId();
  const nameInputId = `${baseId}-customer-name`;
  const phoneInputId = `${baseId}-customer-phone`;
  const menuSelectId = `${baseId}-menu-select`;
  const quantityInputId = `${baseId}-quantity`;
  const requestsInputId = `${baseId}-requests`;

  // 주문 폼 상태 관리
  const [formData, setFormData] = useState<OrderFormData>({ ...INITIAL_FORM_STATE });

  // 유효성 검사 에러 메시지 상태
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 주문 완료 확인 메시지 상태
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);

  // 주문 전송 중 상태
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // 선택된 음료 정보 찾기
  const selectedMenu = MENU_ITEMS.find((item) => item.id === formData.menuId);

  // 선택된 사이즈 정보 찾기
  const selectedSizeConfig = SIZE_OPTIONS.find((s) => s.id === formData.size) || SIZE_OPTIONS[1];

  /**
   * 실시간 예상 금액 계산
   * 공식: (음료 기본금액 + 사이즈 추가금 + 추가옵션 금액 합계) * 수량
   * 음료가 선택되지 않았으면 0원
   */
  const calculateTotal = (): number => {
    if (!selectedMenu) return 0;

    const basePrice = selectedMenu.price;
    const sizeExtra = selectedSizeConfig.extraPrice;

    // 선택된 추가 옵션들의 가격 합계
    const optionsExtra = formData.selectedOptions.reduce((acc, optId) => {
      const option = EXTRA_OPTIONS.find((o) => o.id === optId);
      return acc + (option ? option.price : 0);
    }, 0);

    const pricePerCup = basePrice + sizeExtra + optionsExtra;
    return pricePerCup * formData.quantity;
  };

  const totalPrice = calculateTotal();

  /**
   * 이름 입력 변경 핸들러
   */
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, customerName: e.target.value }));
    if (errorMessage && e.target.value.trim() !== '') {
      setErrorMessage(null);
    }
  };

  /**
   * 전화번호 입력 변경 핸들러
   */
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, phoneNumber: e.target.value }));
  };

  /**
   * 음료 선택 드롭다운 변경 핸들러
   */
  const handleMenuChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, menuId: e.target.value }));
    if (errorMessage && e.target.value) {
      setErrorMessage(null);
    }
  };

  /**
   * 사이즈 라디오 버튼 변경 핸들러
   */
  const handleSizeChange = (size: SizeOption) => {
    setFormData((prev) => ({ ...prev, size }));
  };

  /**
   * 추가 옵션 체크박스 토글 핸들러
   */
  const handleOptionToggle = (optionId: string) => {
    setFormData((prev) => {
      const exists = prev.selectedOptions.includes(optionId);
      const updated = exists
        ? prev.selectedOptions.filter((id) => id !== optionId)
        : [...prev.selectedOptions, optionId];
      return { ...prev, selectedOptions: updated };
    });
  };

  /**
   * 수량 변경 핸들러 (최소 1, 최대 10)
   */
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (isNaN(val)) {
      setFormData((prev) => ({ ...prev, quantity: 1 }));
    } else {
      // 1 ~ 10 사이 값 유지
      const clampedVal = Math.min(10, Math.max(1, val));
      setFormData((prev) => ({ ...prev, quantity: clampedVal }));
    }
  };

  /**
   * 요청사항 텍스트 변경 핸들러
   */
  const handleRequestsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, requests: e.target.value }));
  };

  /**
   * 주문하기 제출 핸들러
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. 이름 필수 유효성 검사
    if (!formData.customerName.trim()) {
      setErrorMessage('이름을 입력해주세요');
      setConfirmationMessage(null);
      const nameInput = document.getElementById(nameInputId);
      nameInput?.focus();
      return;
    }

    // 2. 음료 필수 선택 유효성 검사
    if (!formData.menuId || !selectedMenu) {
      setErrorMessage('음료를 선택해주세요');
      setConfirmationMessage(null);
      const menuSelect = document.getElementById(menuSelectId);
      menuSelect?.focus();
      return;
    }

    // 에러 해제
    setErrorMessage(null);

    // 추가 옵션 이름 텍스트 포맷 (예: "샷 추가", "샷 추가, 크림 추가")
    const optionNames = formData.selectedOptions
      .map((id) => EXTRA_OPTIONS.find((o) => o.id === id)?.name)
      .filter(Boolean) as string[];

    const optionsText = optionNames.length > 0 ? optionNames.join(', ') : '기본';

    try {
      setIsSubmitting(true);
      await onOrderSuccess({
        customerName: formData.customerName.trim(),
        phoneNumber: formData.phoneNumber.trim() || undefined,
        menuName: selectedMenu.name,
        size: formData.size,
        selectedOptions: optionNames,
        quantity: formData.quantity,
        totalPrice,
        requests: formData.requests.trim() || undefined,
      });

      // 최종 주문 확인 메시지 텍스트 조합
      const formattedPrice = totalPrice.toLocaleString();
      const finalConfirmation = `${formData.customerName.trim()}님, ${selectedMenu.name} ${formData.size}사이즈 (${optionsText}) ${formData.quantity}잔, 총 ${formattedPrice}원 주문이 접수되었습니다!`;
      setConfirmationMessage(finalConfirmation);
    } catch (err: any) {
      setErrorMessage(err?.message || '주문 처리 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * 다시 작성 버튼 클릭 핸들러 (모든 입력과 금액 초기화)
   */
  const handleReset = () => {
    setFormData({ ...INITIAL_FORM_STATE });
    setErrorMessage(null);
    setConfirmationMessage(null);
  };

  return (
    <div className="w-full max-w-[520px] mx-auto bg-white rounded-2xl shadow-lg border border-[#e8dfd6] p-6 sm:p-8 transition-all">
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        
        {/* 1. 이름 (필수, text) */}
        <div>
          <label
            htmlFor={nameInputId}
            className="block text-sm font-semibold text-[#54341c] mb-1.5"
          >
            주문자 이름 <span className="text-[#c2410c]">*</span>
          </label>
          <input
            id={nameInputId}
            name="customerName"
            type="text"
            required
            placeholder="이름을 입력해주세요 (예: 홍길동)"
            value={formData.customerName}
            onChange={handleNameChange}
            className="cafe-input text-sm"
          />
        </div>

        {/* 2. 전화번호 (tel) */}
        <div>
          <label
            htmlFor={phoneInputId}
            className="block text-sm font-semibold text-[#54341c] mb-1.5"
          >
            전화번호
          </label>
          <input
            id={phoneInputId}
            name="phoneNumber"
            type="tel"
            placeholder="010-0000-0000 (선택)"
            value={formData.phoneNumber}
            onChange={handlePhoneChange}
            className="cafe-input text-sm"
          />
        </div>

        {/* 3. 음료 선택 (드롭다운) */}
        <div>
          <label
            htmlFor={menuSelectId}
            className="block text-sm font-semibold text-[#54341c] mb-1.5"
          >
            음료 선택 <span className="text-[#c2410c]">*</span>
          </label>
          <select
            id={menuSelectId}
            name="menuId"
            value={formData.menuId}
            onChange={handleMenuChange}
            className="cafe-input text-sm cursor-pointer"
          >
            <option value="">음료를 선택해주세요</option>
            {MENU_ITEMS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} {item.price.toLocaleString()}원
              </option>
            ))}
          </select>
        </div>

        {/* 4. 사이즈 (라디오 버튼, 가로 배치) */}
        <div>
          <span className="block text-sm font-semibold text-[#54341c] mb-2">
            사이즈 선택
          </span>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 bg-[#faf6f0] p-3 rounded-xl border border-[#ede3d7]">
            {SIZE_OPTIONS.map((sizeConfig) => {
              const radioId = `${baseId}-size-${sizeConfig.id}`;
              const isChecked = formData.size === sizeConfig.id;
              return (
                <div key={sizeConfig.id} className="flex items-center gap-2">
                  <input
                    type="radio"
                    id={radioId}
                    name="sizeOption"
                    value={sizeConfig.id}
                    checked={isChecked}
                    onChange={() => handleSizeChange(sizeConfig.id)}
                    className="w-4 h-4 text-[#6b4226] focus:ring-[#6b4226] accent-[#6b4226] cursor-pointer"
                  />
                  <label
                    htmlFor={radioId}
                    className="text-sm font-medium text-[#3e2618] cursor-pointer select-none"
                  >
                    {sizeConfig.name}{' '}
                    <span className="text-xs text-[#8c6b51]">
                      +{sizeConfig.extraPrice.toLocaleString()}원
                    </span>
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. 추가 옵션 (체크박스, 가로 배치) */}
        <div>
          <span className="block text-sm font-semibold text-[#54341c] mb-2">
            추가 옵션
          </span>
          <div className="flex flex-wrap items-center gap-3 sm:gap-5 bg-[#faf6f0] p-3 rounded-xl border border-[#ede3d7]">
            {EXTRA_OPTIONS.map((option) => {
              const checkId = `${baseId}-option-${option.id}`;
              const isChecked = formData.selectedOptions.includes(option.id);
              return (
                <div key={option.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={checkId}
                    name="extraOption"
                    value={option.id}
                    checked={isChecked}
                    onChange={() => handleOptionToggle(option.id)}
                    className="w-4 h-4 rounded text-[#6b4226] focus:ring-[#6b4226] accent-[#6b4226] cursor-pointer"
                  />
                  <label
                    htmlFor={checkId}
                    className="text-sm font-medium text-[#3e2618] cursor-pointer select-none"
                  >
                    {option.name}{' '}
                    <span className="text-xs text-[#8c6b51]">
                      +{option.price.toLocaleString()}원
                    </span>
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        {/* 6. 수량 (number 타입, 최소 1, 최대 10, 기본값 1) */}
        <div>
          <label
            htmlFor={quantityInputId}
            className="block text-sm font-semibold text-[#54341c] mb-1.5"
          >
            수량 (1 ~ 10잔)
          </label>
          <div className="flex items-center gap-3">
            <input
              id={quantityInputId}
              name="quantity"
              type="number"
              min={1}
              max={10}
              value={formData.quantity}
              onChange={handleQuantityChange}
              className="cafe-input text-sm w-32 font-semibold"
            />
            <span className="text-sm text-[#735741]">잔</span>
            <div className="flex items-center gap-1.5 ml-auto">
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    quantity: Math.max(1, prev.quantity - 1),
                  }))
                }
                className="w-8 h-8 rounded-lg bg-[#efe8df] hover:bg-[#dfd3c5] text-[#4a2e19] font-bold text-sm flex items-center justify-center transition"
                title="1잔 줄이기"
              >
                -
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    quantity: Math.min(10, prev.quantity + 1),
                  }))
                }
                className="w-8 h-8 rounded-lg bg-[#efe8df] hover:bg-[#dfd3c5] text-[#4a2e19] font-bold text-sm flex items-center justify-center transition"
                title="1잔 늘리기"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* 7. 요청사항 (textarea) */}
        <div>
          <label
            htmlFor={requestsInputId}
            className="block text-sm font-semibold text-[#54341c] mb-1.5"
          >
            요청사항
          </label>
          <textarea
            id={requestsInputId}
            name="requests"
            rows={3}
            placeholder="바리스타에게 전달할 특별한 요청사항이 있으시면 적어주세요. (예: 덜 달게 해주세요, 얼음 적게)"
            value={formData.requests}
            onChange={handleRequestsChange}
            className="cafe-input text-sm resize-none"
          />
        </div>

        {/* 유효성 검사 알림 메시지 영역 (이름 또는 음료 미입력 시) */}
        {errorMessage && (
          <div
            role="alert"
            className="flex items-center gap-2 p-3 bg-[#fef2f2] border border-[#fecaca] text-[#b91c1c] text-sm rounded-lg animate-shake"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 실시간 예상 금액 표시 영역 (주문하기 버튼 바로 위 큰 글씨 24px, 갈색, 굵게, 가운데 정렬) */}
        <div className="pt-2 pb-1 text-center bg-[#fdf9f4] border border-[#f0e6dc] rounded-xl py-3.5">
          <div className="text-xs font-medium text-[#8c6b51] mb-0.5">
            실시간 결제 예정 금액
          </div>
          <div className="text-[24px] font-bold text-[#6b4226] tracking-tight">
            예상 금액: {totalPrice.toLocaleString()}원
          </div>
          {formData.menuId && (
            <div className="text-xs text-[#8c6b51] mt-1">
              ({selectedMenu?.name} {formData.size} / {formData.quantity}잔)
            </div>
          )}
        </div>

        {/* 8. 주문하기 버튼 & 9. 다시 작성 버튼 */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {/* 주문하기 버튼: 갈색 배경(#6b4226), 흰색 글씨, hover시 약간 밝게 */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`flex-1 bg-[#6b4226] hover:bg-[#7e4f30] active:scale-[0.99] text-white font-bold py-3.5 px-6 rounded-lg transition-all duration-200 shadow-md flex items-center justify-center gap-2 text-base ${
              isSubmitting ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>주문 접수 중...</span>
              </>
            ) : (
              <>
                <Coffee className="w-5 h-5" />
                <span>주문하기</span>
              </>
            )}
          </button>

          {/* 다시 작성 버튼: 모든 입력과 금액 초기화 */}
          <button
            type="button"
            onClick={handleReset}
            disabled={isSubmitting}
            className={`sm:w-32 bg-[#efe8df] hover:bg-[#dfd3c5] active:scale-[0.99] text-[#54341c] font-semibold py-3.5 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 text-sm border border-[#ded0c1] ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>다시 작성</span>
          </button>
        </div>

        {/* 주문 확인 메시지: 연두색 배경, 초록 글씨, 둥근 모서리 */}
        {confirmationMessage && (
          <div
            role="status"
            className="mt-4 p-4 bg-[#e8f5e9] border border-[#c8e6c9] text-[#1b5e20] rounded-xl text-sm font-medium shadow-sm transition-all duration-300"
          >
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-[#2e7d32] shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold text-[#1b5e20] block mb-0.5">
                  주문이 정상적으로 접수되었습니다!
                </span>
                {confirmationMessage}
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
