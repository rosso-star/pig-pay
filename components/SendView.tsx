"use client";
import React, { useState } from 'react';
import { X, Search, ChevronRight, RefreshCw, AlertCircle } from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';

export const SendView = ({ balance, onTransfer, onClose }: any) => {
  const [step, setStep] = useState<'target' | 'amount'>('target');
  const [method, setMethod] = useState<'qr' | 'id'>('id');
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState(0);
  const [isTransferring, setIsTransferring] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // エラー用state

  const handleSend = async () => {
    setErrorMessage(null);
    setIsTransferring(true);
    try {
      await onTransfer(recipient, amount);

      const audio = new Audio('/sounds/success.mp3');
      audio.volume = 0.5; // 音量調節
      audio.play();
      
      onClose(); // 成功したら閉じる
    } catch (e: any) {
      setErrorMessage(e.message || "送金に失敗しました");
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div className="max-w-md mx-auto animate-in zoom-in-95 duration-500">
      <div className="bg-white rounded-[3.5rem] p-10 shadow-2xl border-b-[12px] border-[#fcf4f6]">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-2xl font-black tracking-tighter">送金する</h2>
          <button onClick={onClose} className="p-3 bg-gray-50 rounded-full text-gray-400 hover:text-gray-600 transition-all"><X size={20}/></button>
        </div>

        {/* エラー表示 */}
        {errorMessage && (
          <div className="flex items-center gap-2 p-4 mb-6 text-sm text-red-600 bg-red-50 rounded-2xl border border-red-100 animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        {step === 'target' ? (
          <div className="space-y-8">
            <div className="flex p-1.5 bg-gray-50 rounded-2xl font-black">
              <button onClick={() => setMethod('id')} className={`flex-1 py-3 text-xs rounded-xl transition-all ${method === 'id' ? 'bg-white shadow-sm text-[#eb618e]' : 'text-gray-400'}`}>ID入力</button>
              <button onClick={() => setMethod('qr')} className={`flex-1 py-3 text-xs rounded-xl transition-all ${method === 'qr' ? 'bg-white shadow-sm text-[#eb618e]' : 'text-gray-400'}`}>QRスキャン</button>
            </div>

            {method === 'id' ? (
              <div className="space-y-6">
                <div className="relative group">
                  <Search className="absolute left-5 top-5 text-gray-300 group-focus-within:text-[#eb618e] transition-colors" size={24} />
                  <input 
                    type="text" 
                    placeholder="ユーザー名を入力" 
                    className="w-full p-5 pl-14 bg-gray-50 border-2 border-transparent rounded-[2rem] outline-none focus:bg-white focus:border-[#eb618e] font-black transition-all"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                  />
                </div>
                <button 
                  onClick={() => recipient && setStep('amount')}
                  disabled={!recipient}
                  className="w-full bg-[#332f2f] text-white py-6 rounded-[2rem] font-black text-xl shadow-xl disabled:bg-gray-100 disabled:text-gray-300 transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  次へ <ChevronRight size={24} />
                </button>
              </div>
            ) : (
              <div className="bg-[#332f2f] aspect-square rounded-[3rem] overflow-hidden relative shadow-inner">
                <Scanner onScan={(res) => { if(res?.[0]?.rawValue) { setRecipient(res[0].rawValue); setStep('amount'); } }} />
                <div className="absolute inset-0 border-4 border-[#eb618e]/30 m-16 rounded-[2rem] pointer-events-none animate-pulse" />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-10 animate-in slide-in-from-right duration-500">
            <div className="bg-[#fcf4f6] p-8 rounded-[2.5rem] text-center border-b-4 border-[#f8d7e3]">
              <p className="text-[10px] font-black text-[#eb618e]/60 uppercase tracking-[0.3em] mb-2">送り先</p>
              <p className="text-3xl font-black text-[#eb618e]">@{recipient}</p>
            </div>
            <div className="relative text-center">
              <input 
                type="number" 
                placeholder="0" 
                className="w-full text-7xl font-mono font-black text-center bg-transparent outline-none text-[#332f2f] placeholder:text-gray-100"
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                autoFocus
              />
              <p className="mt-6 text-xs font-black text-gray-400 uppercase tracking-widest">
                残高: {balance.toLocaleString()} ピゲン
              </p>
            </div>
            <div className="flex gap-4">
              <button onClick={() => {setStep('target'); setErrorMessage(null);}} className="flex-1 bg-gray-50 text-gray-400 py-6 rounded-[2rem] font-black transition-all hover:bg-gray-100">戻る</button>
              <button 
                onClick={handleSend}
                disabled={isTransferring || amount <= 0 || amount > balance}
                className="flex-[2] bg-[#eb618e] text-white py-6 rounded-[2rem] font-black text-xl shadow-xl shadow-[#eb618e]/20 disabled:bg-gray-100 disabled:text-gray-300 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {isTransferring ? <RefreshCw className="animate-spin" /> : "確定する"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};