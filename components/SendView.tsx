"use client";
import React, { useState } from 'react';
import { X, Search, QrCode, AlertCircle, MessageSquare, Loader2 } from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';

interface SendViewProps {
  balance: number;
  onTransfer: (recipient: string, amount: number, message: string) => Promise<void>;
  onClose: () => void;
}

export const SendView = ({ balance, onTransfer, onClose }: SendViewProps) => {
  const [step, setStep] = useState<'target' | 'amount'>('target');
  const [method, setMethod] = useState<'qr' | 'id'>('id');
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [message, setMessage] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSend = async () => {
    setErrorMessage(null);
    setIsTransferring(true);
    try {
      await onTransfer(recipient, amount, message || "送金");
      onClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "送金に失敗しました";
      setErrorMessage(msg);
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-[3.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-black">送金する</h2>
        <button onClick={onClose} className="p-2 bg-gray-50 rounded-full text-gray-400 hover:bg-gray-100 transition-colors">
          <X size={20}/>
        </button>
      </div>

      {step === 'target' ? (
        <div className="space-y-6">
          <div className="flex bg-gray-50 p-1.5 rounded-2xl">
            <button 
              onClick={() => setMethod('id')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black transition-all ${method === 'id' ? 'bg-white shadow-sm text-[#eb618e]' : 'text-gray-400'}`}
            >
              <Search size={18} /> ID入力
            </button>
            <button 
              onClick={() => setMethod('qr')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black transition-all ${method === 'qr' ? 'bg-white shadow-sm text-[#eb618e]' : 'text-gray-400'}`}
            >
              <QrCode size={18} /> QRスキャン
            </button>
          </div>

          {method === 'id' ? (
            <div className="space-y-4">
              <div className="relative">
                <input 
                  type="text"
                  placeholder="相手のユーザーID"
                  className="w-full p-6 bg-gray-50 border-2 border-transparent rounded-[2rem] outline-none focus:bg-white focus:border-[#eb618e] font-bold transition-all"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                />
              </div>
              <button 
                disabled={!recipient}
                onClick={() => setStep('amount')}
                className="w-full bg-[#332f2f] text-white py-6 rounded-[2rem] font-black text-lg shadow-xl disabled:opacity-20 transition-all active:scale-95"
              >
                次へ進む
              </button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[2.5rem] bg-black aspect-square relative border-4 border-[#fcf4f6]">
              <Scanner
                onScan={(result) => {
                  if (result && result[0]?.rawValue) {
                    setRecipient(result[0].rawValue);
                    setStep('amount');
                  }
                }}
                onError={(error) => console.error(error)}
              />
              <div className="absolute inset-0 border-[40px] border-black/20 pointer-events-none"></div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
          <div className="bg-[#fcf4f6] p-6 rounded-[2rem] border-2 border-[#f8d7e3]">
            <p className="text-[10px] text-[#eb618e] font-black uppercase tracking-widest mb-1">送金先</p>
            <p className="text-xl font-black text-[#332f2f]">@{recipient}</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-gray-300 font-black uppercase ml-4 mb-2 block tracking-widest">金額</label>
              <input 
                type="number"
                placeholder="0"
                className="w-full p-8 bg-gray-50 border-2 border-transparent rounded-[2.5rem] outline-none focus:bg-white focus:border-[#eb618e] font-mono text-4xl font-black text-center transition-all"
                onChange={(e) => setAmount(Number(e.target.value))}
                autoFocus
              />
            </div>

            <div className="relative">
              <MessageSquare className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
              <input 
                type="text"
                placeholder="メッセージ（省略可）"
                className="w-full p-5 pl-14 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-[#eb618e] font-bold text-sm transition-all"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
          </div>

          {errorMessage && (
            <div className="p-4 bg-red-50 text-red-500 rounded-2xl text-xs flex items-center gap-2 font-bold animate-shake">
              <AlertCircle size={14} /> {errorMessage}
            </div>
          )}

          <div className="flex gap-4">
            <button 
              onClick={() => { setStep('target'); setErrorMessage(null); }}
              className="flex-1 bg-gray-100 text-gray-400 py-6 rounded-[2rem] font-black hover:bg-gray-200 transition-all"
            >
              戻る
            </button>
            <button 
              onClick={handleSend}
              disabled={isTransferring || amount <= 0 || amount > balance}
              className="flex-[2] bg-[#eb618e] text-white py-6 rounded-[2rem] font-black text-xl shadow-xl shadow-[#eb618e]/20 disabled:bg-gray-100 disabled:text-gray-300 transition-all flex items-center justify-center"
            >
              {isTransferring ? <Loader2 className="animate-spin" /> : "送金確定"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};