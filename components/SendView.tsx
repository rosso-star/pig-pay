"use client";
import React, { useState } from 'react';
import { X, Search, ChevronRight, RefreshCw } from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';

export const SendView = ({ balance, onTransfer, onClose }: any) => {
  const [step, setStep] = useState<'target' | 'amount'>('target');
  const [method, setMethod] = useState<'qr' | 'id'>('id');
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState(0);
  const [isTransferring, setIsTransferring] = useState(false);

  const handleSend = async () => {
    setIsTransferring(true);
    try {
      await onTransfer(recipient, amount);
      alert("送金完了！");
      onClose();
    } catch (e: any) {
      alert("失敗: " + e.message);
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div className="max-w-md mx-auto animate-in zoom-in-95 duration-500">
      <div className="bg-white rounded-[3.5rem] p-10 shadow-2xl border-b-[12px] border-[#fcf4f6]">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-2xl font-black tracking-tighter">送金する</h2>
          <button onClick={onClose} className="p-3 bg-gray-100 rounded-full text-gray-400"><X size={20}/></button>
        </div>

        {step === 'target' ? (
          <div className="space-y-8">
            <div className="flex p-1.5 bg-gray-50 rounded-2xl font-black">
              <button onClick={() => setMethod('id')} className={`flex-1 py-3 text-xs rounded-xl ${method === 'id' ? 'bg-white shadow-sm text-[#eb618e]' : 'text-gray-400'}`}>ID入力</button>
              <button onClick={() => setMethod('qr')} className={`flex-1 py-3 text-xs rounded-xl ${method === 'qr' ? 'bg-white shadow-sm text-[#eb618e]' : 'text-gray-400'}`}>QRスキャン</button>
            </div>
            {method === 'id' ? (
              <div className="space-y-6">
                <div className="relative">
                  <Search className="absolute left-5 top-5 text-gray-300" size={24} />
                  <input type="text" placeholder="ユーザー名" className="w-full p-5 pl-14 bg-gray-50 border-2 border-transparent rounded-[2rem] outline-none focus:border-[#eb618e] font-black" value={recipient} onChange={(e) => setRecipient(e.target.value)} />
                </div>
                <button onClick={() => recipient && setStep('amount')} disabled={!recipient} className="w-full bg-[#332f2f] text-white py-6 rounded-[2rem] font-black text-xl flex items-center justify-center gap-3">次へ <ChevronRight size={24} /></button>
              </div>
            ) : (
              <div className="bg-[#332f2f] aspect-square rounded-[3rem] overflow-hidden relative">
                <Scanner onScan={(res) => { if(res?.[0]?.rawValue) { setRecipient(res[0].rawValue); setStep('amount'); } }} />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-10">
            <div className="bg-[#fcf4f6] p-8 rounded-[2.5rem] text-center">
              <p className="text-[10px] font-black text-[#eb618e]/60 uppercase tracking-[0.3em] mb-2">送り先</p>
              <p className="text-3xl font-black text-[#eb618e]">@{recipient}</p>
            </div>
            <input type="number" placeholder="0" className="w-full text-7xl font-mono font-black text-center bg-transparent outline-none" value={amount || ''} onChange={(e) => setAmount(Number(e.target.value))} autoFocus />
            <div className="flex gap-4">
              <button onClick={() => setStep('target')} className="flex-1 bg-gray-50 text-gray-400 py-6 rounded-[2rem] font-black">戻る</button>
              <button onClick={handleSend} disabled={isTransferring || amount <= 0 || amount > balance} className="flex-[2] bg-[#eb618e] text-white py-6 rounded-[2rem] font-black text-xl flex items-center justify-center gap-2">
                {isTransferring ? <RefreshCw className="animate-spin" /> : "確定する"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};