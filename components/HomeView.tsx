/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState } from 'react'; // useStateを追加
import { History, ArrowUpRight, ArrowDownLeft, Send, Download } from 'lucide-react';
import { BalanceCard } from './PigPayComponents';
import { Transaction } from '@/types';
import { TransactionDetailModal } from './TransactionDetailModal'; // 詳細モーダルをインポート

export const HomeView = ({ balance, username, transactions, onRefresh, loading, setView, setSendStep }: any) => {
  // ★ 選択された取引を管理するステートを追加
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <BalanceCard balance={balance} username={username} onRefresh={onRefresh} loading={loading} unit="ピゲン" />
        <div className="grid grid-cols-2 gap-6">
          <button onClick={() => {setView('send'); setSendStep('target');}} className="flex flex-col items-center justify-center gap-4 bg-[#fcf4f6] rounded-[3rem] border-2 border-transparent hover:border-[#eb618e] transition-all group shadow-sm">
            <div className="bg-white p-5 rounded-3xl text-[#eb618e] shadow-sm group-hover:bg-[#eb618e] group-hover:text-white transition-all"><Send size={28} /></div>
            <span className="font-black text-[#332f2f]">送る</span>
          </button>
          <button onClick={() => setView('receive')} className="flex flex-col items-center justify-center gap-4 bg-white rounded-[3rem] border-2 border-[#fcf4f6] hover:border-[#eb618e] transition-all group shadow-sm">
            <div className="bg-[#fcf4f6] p-5 rounded-3xl text-[#eb618e] group-hover:bg-[#eb618e] group-hover:text-white transition-all"><Download size={28} /></div>
            <span className="font-black text-[#332f2f]">受け取る</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] p-8 border-2 border-[#fcf4f6]">
        <h2 className="text-xs font-black flex items-center gap-3 mb-8 text-[#332f2f]/30 uppercase tracking-[0.2em]"><History size={18} /> 取引履歴</h2>
        <div className="space-y-4">
          {transactions.map((tx: Transaction) => {
            const isOut = tx.sender_username === username;
            return (
              <div 
                key={tx.id} 
                // ★ クリック時に詳細データをセットする処理を追加
                onClick={() => setSelectedTx(tx)} 
                className="flex items-center justify-between p-4 hover:bg-[#fcf4f6] rounded-[2rem] transition-all border border-transparent hover:border-[#f8d7e3] cursor-pointer"
              >
                <div className="flex items-center gap-5">
                  <div className={`p-4 rounded-2xl ${isOut ? 'bg-gray-100 text-gray-400' : 'bg-[#fcf4f6] text-[#eb618e]'}`}>
                    {isOut ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                  </div>
                    <div>
                    <p className="text-sm font-black text-[#332f2f]">
                        {isOut ? `@${tx.receiver_username} へ` : `@${tx.sender_username} から`}
                    </p>
                    {/* メッセージがあれば表示、なければ日付を表示 */}
                    <p className="text-[10px] text-[#eb618e] font-bold mt-0.5 truncate max-w-[120px]">
                        {tx.description || "送金"} 
                    </p>
                    <p className="text-[8px] text-gray-300 font-bold uppercase tracking-tighter">
                        {new Date(tx.created_at).toLocaleDateString()}
                    </p>
                    </div>
                </div>
                <span className={`font-mono font-black text-lg ${isOut ? 'text-gray-400' : 'text-[#eb618e]'}`}>
                  {isOut ? '-' : '+'}{tx.amount.toLocaleString()} <span className="text-[10px] font-sans">豚円</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ★ 詳細モーダルの表示条件を追加 */}
      {selectedTx && (
        <TransactionDetailModal 
          tx={selectedTx} 
          username={username} 
          onClose={() => setSelectedTx(null)} 
        />
      )}
    </div>
  );
};