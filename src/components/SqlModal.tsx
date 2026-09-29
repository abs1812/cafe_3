import React, { useState } from 'react';
import { SUPABASE_SQL } from '../data/cafeData';
import { Copy, Check, Database, X, Code, ExternalLink } from 'lucide-react';

interface SqlModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SqlModal: React.FC<SqlModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'full' | 'menu' | 'orders' | 'insert'>('full');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const getActiveCode = () => {
    switch (activeTab) {
      case 'menu':
        return SUPABASE_SQL.createMenuTable;
      case 'orders':
        return SUPABASE_SQL.createOrderTable;
      case 'insert':
        return SUPABASE_SQL.insertSampleData;
      case 'full':
      default:
        return SUPABASE_SQL.fullScript;
    }
  };

  const handleCopy = async () => {
    const textToCopy = getActiveCode();
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 클립보드 API 실패 시 fallback
      const textArea = document.createElement('textarea');
      textArea.value = textToCopy;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-[#ded0c1] overflow-hidden flex flex-col max-h-[90vh]">
        {/* 모달 헤더 */}
        <div className="bg-[#faf6f0] px-6 py-4 border-b border-[#ebdcd0] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#6b4226] text-white flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#3e2618]">
                Supabase SQL Editor 실행 쿼리문
              </h3>
              <p className="text-xs text-[#8c6b51]">
                Supabase SQL Editor에 복사하여 붙여넣고 Run을 누르시면 됩니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#8c6b51] hover:text-[#3e2618] p-1.5 rounded-lg hover:bg-[#ede3d7] transition"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex border-b border-[#ece3d9] bg-[#fbf9f6] px-4 pt-2 gap-1 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('full')}
            className={`py-2 px-3 rounded-t-lg transition border-b-2 ${
              activeTab === 'full'
                ? 'border-[#6b4226] text-[#6b4226] bg-white font-bold'
                : 'border-transparent text-[#7a5d45] hover:text-[#3e2618]'
            }`}
          >
            🌟 전체 통합 쿼리 (권장)
          </button>
          <button
            onClick={() => setActiveTab('menu')}
            className={`py-2 px-3 rounded-t-lg transition border-b-2 ${
              activeTab === 'menu'
                ? 'border-[#6b4226] text-[#6b4226] bg-white font-bold'
                : 'border-transparent text-[#7a5d45] hover:text-[#3e2618]'
            }`}
          >
            1. cafe_menu 생성
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-2 px-3 rounded-t-lg transition border-b-2 ${
              activeTab === 'orders'
                ? 'border-[#6b4226] text-[#6b4226] bg-white font-bold'
                : 'border-transparent text-[#7a5d45] hover:text-[#3e2618]'
            }`}
          >
            2. cafe_orders (주문서 항목)
          </button>
          <button
            onClick={() => setActiveTab('insert')}
            className={`py-2 px-3 rounded-t-lg transition border-b-2 ${
              activeTab === 'insert'
                ? 'border-[#6b4226] text-[#6b4226] bg-white font-bold'
                : 'border-transparent text-[#7a5d45] hover:text-[#3e2618]'
            }`}
          >
            3. 테스트 INSERT
          </button>
        </div>

        {/* 쿼리 코드 영역 */}
        <div className="p-4 flex-1 overflow-hidden flex flex-col bg-[#1e1e1e]">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-700 text-xs text-gray-400">
            <span className="flex items-center gap-1.5 font-mono text-gray-300">
              <Code className="w-3.5 h-3.5 text-amber-400" />
              SQL Editor
            </span>
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition ${
                copied
                  ? 'bg-green-600 text-white'
                  : 'bg-[#6b4226] hover:bg-[#83512e] text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>복사 완료!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>SQL 쿼리 복사</span>
                </>
              )}
            </button>
          </div>

          <pre className="flex-1 overflow-y-auto font-mono text-xs text-gray-100 p-2 leading-relaxed selection:bg-[#6b4226] selection:text-white">
            <code>{getActiveCode()}</code>
          </pre>
        </div>

        {/* 컬럼 안내 및 팁 푸터 */}
        <div className="bg-[#faf6f0] px-6 py-3 border-t border-[#ebdcd0] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#735741]">
          <div>
            💡 <strong className="text-[#54341c]">주문서 매핑:</strong> customer_name(이름), phone_number(전화번호), menu_name(음료), size(사이즈), options(추가옵션), quantity(수량), requests(요청사항)
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-1.5 bg-[#6b4226] text-white rounded-lg text-xs font-semibold hover:bg-[#7e4f30] transition"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
