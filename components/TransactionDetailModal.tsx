"use client";
import React from 'react';
import { X, Calendar, User, Hash, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export const TransactionDetailModal = ({ tx, username, onClose }: any) => {
  const isOut = tx.sender_username === username;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#332f2f]/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-sm rounded-[3.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="flex justify-between items-center mb-8">
          <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">取引詳細</span>
          <button onClick={onClose} className="p-2 bg-gray-50 rounded-full text-gray-400"><X size={20}/></button>
        </div>

        <div className="text-center mb-10">
          <div className={`inline-flex p-6 rounded-[2.5rem] mb-6 ${isOut ? 'bg-gray-100 text-gray-400' : 'bg-[#fcf4f6] text-[#eb618e]'}`}>
            {isOut ? <ArrowUpRight size={40} /> : <ArrowDownLeft size={40} />}
          </div>
          <h3 className="text-4xl font-mono font-black text-[#332f2f]">
            {isOut ? '-' : '+'}{tx.amount.toLocaleString()} <span className="text-lg font-sans">ピゲン</span>
          </h3>
          <p className="text-sm font-bold text-gray-400 mt-2">
            {isOut ? `@${tx.receiver_username} へ送金` : `@${tx.sender_username} から受取`}
          </p>
        </div>

        <div className="bg-[#fcf4f6] p-6 rounded-3xl mb-8 border-2 border-dashed border-[#f8d7e3]">
        <p className="text-[10px] text-[#eb618e] font-black uppercase tracking-widest mb-2">取引メッセージ</p>
        <p className="text-lg font-black text-[#332f2f]">
            {tx.description || "（メッセージなし）"}
        </p>
        </div>

        <div className="space-y-6 border-t border-gray-50 pt-8">
          <div className="flex items-center gap-4 text-sm">
            <Calendar size={18} className="text-[#eb618e]/40" />
            <div>
              <p className="text-[10px] text-gray-300 font-black uppercase tracking-tighter">日時</p>
              <p className="font-bold">{new Date(tx.created_at).toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Hash size={18} className="text-[#eb618e]/40" />
            <div>
              <p className="text-[10px] text-gray-300 font-black uppercase tracking-tighter">取引ID</p>
              <p className="font-mono text-[10px] text-gray-400 break-all">{tx.id}</p>
            </div>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="w-full mt-10 py-5 bg-[#332f2f] text-white rounded-[2rem] font-black hover:bg-[#444] transition-all"
        >
          閉じる
        </button>
      </div>
    </div>
  );
};