/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { usePigPay } from '@/hooks/usePigPay';
import { Session } from '@supabase/supabase-js';

import { AuthView } from '@/components/AuthView';
import { HomeView } from '@/components/HomeView';
import { SendView } from '@/components/SendView';
import { ReceiveView } from '@/components/ReceiveView';
import { MarketView } from '@/components/MarketView';
import { LayoutDashboard, ShoppingBag, QrCode } from 'lucide-react'; // QrCodeを追加

export default function PigPay() {
  const [session, setSession] = useState<Session | null>(null);
  const [view, setView] = useState<'home' | 'send' | 'receive' | 'market'>('home');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  const { balance, username, transactions, loading, fetchData, transfer } = usePigPay(session);

  if (!session) return <AuthView />;

  return (
    <div className="min-h-screen bg-[#fcf4f6] text-[#332f2f] font-bold">
      <main className="max-w-4xl mx-auto p-6 pb-32">
        {view === 'home' && (
          <HomeView 
            balance={balance} 
            username={username} 
            transactions={transactions} 
            onRefresh={fetchData} 
            loading={loading}
            setView={setView}
          />
        )}

        {view === 'send' && (
          <SendView 
            balance={balance} 
            onTransfer={async (target, amount, msg) => {
              await transfer(target, amount, msg);
              fetchData();
            }} 
            onClose={() => setView('home')} 
          />
        )}

        {view === 'receive' && (
          <ReceiveView 
            username={username} 
            onClose={() => setView('home')} 
          />
        )}

        {view === 'market' && (
          <MarketView 
            balance={balance} 
            username={username} 
            onRefresh={fetchData} 
          />
        )}
      </main>

      {/* モバイルナビゲーションバー */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-[#332f2f]/90 backdrop-blur-xl px-8 py-4 flex justify-around items-center z-50 rounded-[2.5rem] shadow-2xl border border-white/10">
        {/* ホーム */}
        <button 
          onClick={() => setView('home')} 
          className={`p-2 transition-colors ${view === 'home' ? 'text-[#eb618e]' : 'text-white/40'}`}
        >
          <LayoutDashboard size={28}/>
        </button>

        {/* 送る（真ん中の大きなQRボタン） */}
        <button 
          onClick={() => setView('send')} 
          className="p-5 bg-[#eb618e] text-white rounded-[2rem] -mt-14 border-[6px] border-[#fcf4f6] shadow-xl hover:scale-105 active:scale-95 transition-all"
        >
          <QrCode size={32} strokeWidth={3} />
        </button>

        {/* マーケット */}
        <button 
          onClick={() => setView('market')} 
          className={`p-2 transition-colors ${view === 'market' ? 'text-[#eb618e]' : 'text-white/40'}`}
        >
          <ShoppingBag size={28}/>
        </button>
      </nav>
    </div>
  );
}