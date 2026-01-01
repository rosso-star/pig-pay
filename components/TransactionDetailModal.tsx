/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React from 'react';
import { X, Calendar, User, Hash, ArrowUpRight, ArrowDownLeft, CheckCircle2, FileText } from 'lucide-react';

export const TransactionDetailModal = ({ tx, username, onClose }: any) => {
  const isOut = tx.sender_username === username;
  // マーケット取引かどうか（descriptionに商品名が入っている、もしくはmetadata等で判別）
  const isMarket = tx.description && tx.description !== "送金";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#332f2f]/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-sm rounded-[3.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
        
        {/* 受取（売上）時の装飾背景 */}
        {!isOut && (
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#eb618e] via-[#f8d7e3] to-[#eb618e]" />
        )}

        <div className="flex justify-between items-center mb-6">
          <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">
            {isOut ? (isMarket ? '購入詳細' : '支払い詳細') : (isMarket ? '売上詳細' : '受取詳細')}
          </span>
          <button onClick={onClose} className="p-2 bg-gray-50 rounded-full text-gray-400 hover:bg-gray-100 transition-colors">
            <X size={20}/>
          </button>
        </div>

        {/* メイン：商品名・メッセージ */}
        <div className="text-center mb-6">
          <div className={`inline-block px-4 py-1 rounded-full text-[10px] font-black mb-3 ${
            isOut ? 'bg-gray-100 text-gray-500' : 'bg-[#eb618e] text-white shadow-sm'
          }`}>
            {isOut ? 'SENT' : 'RECEIVED'}
          </div>
          <h2 className="text-2xl font-black text-[#332f2f] leading-tight break-words">
            {tx.description || (isOut ? "送金" : "商品代金")}
          </h2>
          
          {/* ★追加：商品の説明（item_descriptionなどがあれば表示） */}
          {tx.item_description && (
            <div className="mt-4 p-4 bg-gray-50 rounded-2xl text-left border border-gray-100">
              <div className="flex items-center gap-2 mb-1">
                <FileText size={12} className="text-gray-400" />
                <span className="text-[9px] font-black text-gray-400 uppercase">商品の説明</span>
              </div>
              <p className="text-xs text-gray-600 font-medium leading-relaxed whitespace-pre-wrap">
                {tx.item_description}
              </p>
            </div>
          )}
        </div>

        {/* 金額エリア */}
        <div className={`rounded-[2.5rem] p-8 text-center mb-8 ${
          isOut ? 'bg-gray-50' : 'bg-[#fff9fa] border-2 border-[#f8d7e3]'
        }`}>
          <div className="flex flex-col items-center">
             <div className={`mb-3 ${isOut ? 'text-gray-300' : 'text-[#eb618e]'}`}>
                {isOut ? <ArrowUpRight size={32} /> : <CheckCircle2 size={32} className="animate-bounce-subtle" />}
             </div>
             <p className={`text-4xl font-mono font-black ${isOut ? 'text-[#332f2f]' : 'text-[#eb618e]'}`}>
                {isOut ? '-' : '+'}{tx.amount.toLocaleString()} <span className="text-lg font-sans">P</span>
             </p>
             <p className="text-xs font-bold text-gray-400 mt-2 flex items-center gap-1">
                <User size={12} />
                {isOut ? `@${tx.receiver_username} へ` : `@${tx.sender_username} から`}
             </p>
          </div>
        </div>

        {/* サブ情報 */}
        <div className="space-y-5 border-t border-gray-50 pt-6">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-3">
              <Calendar size={16} className="text-gray-300" />
              <span className="text-[10px] text-gray-400 font-black uppercase">完了日時</span>
            </div>
            <p className="font-bold text-[#332f2f] text-xs">
              {new Date(tx.created_at).toLocaleString('ja-JP')}
            </p>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-3">
              <Hash size={16} className="text-gray-300" />
              <span className="text-[10px] text-gray-400 font-black uppercase">取引ID</span>
            </div>
            <p className="font-mono text-[9px] text-gray-300">
              {tx.id.substring(0, 18)}...
            </p>
          </div>
        </div>

        <button 
          onClick={onClose}
          className={`w-full mt-8 py-5 text-white rounded-[2rem] font-black transition-all shadow-lg active:scale-95 ${
            isOut ? 'bg-[#332f2f] hover:bg-[#444]' : 'bg-[#eb618e] hover:bg-[#d44d7a]'
          }`}
        >
          {isOut ? '確認しました' : '売上を確認しました'}
        </button>
      </div>
    </div>
  );
};