"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { usePigPay } from '@/hooks/usePigPay';

// 分割したコンポーネントをインポート
import { AuthView } from '@/components/AuthView';
import { HomeView } from '@/components/HomeView';
import { SendView } from '@/components/SendView';
import { ReceiveView } from '@/components/ReceiveView';
import { MarketView } from '@/components/MarketView';
import { PigPayLogo } from '@/components/PigPayComponents';
import { LayoutDashboard, ShoppingBag, QrCode, Download, LogOut } from 'lucide-react';

export default function PigPay() {
  const [session, setSession] = useState<any>(null);
  const [view, setView] = useState<'home' | 'send' | 'receive' | 'market'>('home');
  const [sendStep, setSendStep] = useState<'target' | 'amount'>('target');

  // 1. Supabaseのセッション管理
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  // 2. カスタムフックからロジックを抽出
  const { balance, username, transactions, loading, fetchData, transfer } = usePigPay(session);

  // ログインしていない場合は認証画面を表示
  if (!session) {
    return <AuthView />;
  }

  return (
    <div className="min-h-screen bg-[#fcf4f6] text-[#332f2f] flex flex-col font-bold">
      {/* ヘッダー */}
      <header className="p-6 flex justify-between items-center max-w-4xl mx-auto w-full">
        <PigPayLogo size="md" />
        <button onClick={() => supabase.auth.signOut()} className="p-3 bg-white rounded-2xl text-gray-400 hover:text-[#eb618e] transition-colors shadow-sm">
          <LogOut size={20} />
        </button>
      </header>

      <main className="flex-1 p-4 md:p-8 pb-32 max-w-4xl mx-auto w-full">
        {/* ビューの切り替え */}
        {view === 'home' && (
          <HomeView 
            balance={balance} 
            username={username} 
            transactions={transactions} 
            onRefresh={fetchData} 
            loading={loading} 
            setView={setView} 
            setSendStep={setSendStep} 
          />
        )}

        {view === 'send' && (
          <SendView 
            balance={balance} 
            onTransfer={(target: string, amount: number, msg: string) => transfer(target, amount, msg)} 
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

      {/* モバイルナビゲーション */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-[#332f2f]/90 backdrop-blur-xl px-8 py-4 flex justify-between items-center z-50 rounded-[2.5rem] shadow-2xl">
        <button onClick={() => setView('home')} className={view === 'home' ? 'text-[#eb618e]' : 'text-white/40'}>
          <LayoutDashboard size={28}/>
        </button>
        <button onClick={() => setView('market')} className={view === 'market' ? 'text-[#eb618e]' : 'text-white/40'}>
          <ShoppingBag size={28}/>
        </button>
        <button 
          onClick={() => { setView('send'); setSendStep('target'); }} 
          className="p-4 bg-[#eb618e] text-white rounded-3xl -mt-12 border-4 border-[#fcf4f6] shadow-xl hover:scale-110 transition-transform"
        >
          <QrCode size={28}/>
        </button>
        <button onClick={() => setView('receive')} className={view === 'receive' ? 'text-[#eb618e]' : 'text-white/40'}>
          <Download size={28}/>
        </button>
      </nav>
    </div>
  );
}