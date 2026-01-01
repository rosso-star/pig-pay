"use client";
import React, { useState, useMemo } from 'react';
import { History, ArrowUpRight, ArrowDownLeft, Send, Download, Sparkles, FileText } from 'lucide-react';
import { BalanceCard } from './PigPayComponents';
import { Transaction } from '@/types';
import { TransactionDetailModal } from './TransactionDetailModal';

export const HomeView = ({ balance, username, transactions, onRefresh, loading, setView, setSendStep }: any) => {
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const latestIncome = useMemo(() => {
    const latest = transactions[0];
    if (latest && latest.receiver_username === username) {
      return latest;
    }
    return null;
  }, [transactions, username]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 space-y-8">
      
      {latestIncome && (
        <div className="bg-gradient-to-r from-[#eb618e] to-[#f8d7e3] p-[2px] rounded-[2.5rem] shadow-lg animate-bounce-subtle">
          <div className="bg-white rounded-[2.4rem] px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-[#fcf4f6] p-2 rounded-full text-[#eb618e]">
                <Sparkles size={24} className="animate-pulse" />
              </div>
              <div>
                <p className="text-[10px] font-black text-[#eb618e] uppercase tracking-widest">New Sale!</p>
                <p className="text-sm font-black text-[#332f2f]">
                  @{latestIncome.sender_username}様から購入されました
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-mono font-black text-[#eb618e]">
                +{latestIncome.amount.toLocaleString()} <span className="text-xs">豚円</span>
              </p>
            </div>
          </div>
        </div>
      )}

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
          {transactions.map((tx: any) => { // anyとして一時的に拡張
            const isOut = tx.sender_username === username;
            return (
              <div 
                key={tx.id} 
                onClick={() => setSelectedTx(tx)} 
                className={`flex items-center justify-between p-4 rounded-[2rem] transition-all border cursor-pointer
                  ${!isOut ? 'bg-[#fff9fa] border-[#f8d7e3] shadow-sm hover:scale-[1.02]' : 'hover:bg-[#fcf4f6] border-transparent hover:border-[#f8d7e3]'}
                `}
              >
                <div className="flex items-center gap-5 flex-1 min-w-0">
                  <div className={`p-4 rounded-2xl flex-shrink-0 ${isOut ? 'bg-gray-100 text-gray-400' : 'bg-[#eb618e] text-white shadow-md'}`}>
                    {isOut ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    {/* 取引タイトル（商品名など） */}
                    <p className={`text-sm font-black truncate ${isOut ? 'text-[#332f2f]' : 'text-[#eb618e]'}`}>
                      {tx.description || (isOut ? "送金" : "商品代金")}
                    </p>
                    
                    <p className="text-[10px] text-gray-400 font-bold">
                      {isOut ? `@${tx.receiver_username} へ` : `@${tx.sender_username} から購入`}
                    </p>
                    
                    <p className="text-[8px] text-gray-300 font-bold uppercase tracking-tighter mt-1">
                      {new Date(tx.created_at).toLocaleString('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <span className={`font-mono font-black text-lg ${isOut ? 'text-gray-400' : 'text-[#eb618e] text-xl'}`}>
                    {isOut ? '-' : '+'}{tx.amount.toLocaleString()} <span className="text-[10px] font-sans">豚円</span>
                  </span>
                  {!isOut && <div className="text-[8px] font-black text-[#eb618e] bg-white border border-[#eb618e] rounded-full px-2 mt-1 inline-block">SUCCESS</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

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