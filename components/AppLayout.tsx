/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React from 'react';
import { PigPayLogo } from './PigPayComponents';
import { LayoutDashboard, Send, Download, LogOut, QrCode } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export const AppLayout = ({ children, view, setView }: any) => {
  return (
    <div className="min-h-screen bg-white text-[#332f2f] flex flex-col md:flex-row font-bold">
      {/* デスクトップ用サイドバー */}
      <aside className="hidden md:flex flex-col w-72 bg-[#fcf4f6] border-r border-[#f8d7e3] p-8">
        <PigPayLogo className="mb-12 justify-start" />
        <nav className="flex-1 space-y-3 font-black">
          <button onClick={() => setView('home')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl ${view === 'home' ? 'bg-[#eb618e] text-white shadow-md' : 'text-[#eb618e]/60 hover:bg-[#f8d7e3]'}`}><LayoutDashboard /> ホーム</button>
          <button onClick={() => setView('send')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl ${view === 'send' ? 'bg-[#eb618e] text-white shadow-md' : 'text-[#eb618e]/60 hover:bg-[#f8d7e3]'}`}><Send /> 送る</button>
          <button onClick={() => setView('receive')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl ${view === 'receive' ? 'bg-[#eb618e] text-white shadow-md' : 'text-[#eb618e]/60 hover:bg-[#f8d7e3]'}`}><Download /> 受け取る</button>
        </nav>
        <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-4 px-6 py-4 text-gray-400 hover:text-red-500 font-black"><LogOut /> ログアウト</button>
      </aside>

      {/* メインコンテンツ表示エリア */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto pb-24 md:pb-0 p-6 md:p-12">
        {children}
      </main>

      {/* モバイル用ナビ */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 bg-[#332f2f]/90 backdrop-blur-xl px-8 py-4 flex justify-between items-center z-50 rounded-[2.5rem] shadow-2xl border border-white/10">
        <button onClick={() => setView('home')} className={`p-3 ${view === 'home' ? 'text-[#eb618e]' : 'text-white/40'}`}><LayoutDashboard size={28} /></button>
        <button onClick={() => setView('send')} className="p-5 rounded-3xl -mt-14 bg-[#eb618e] text-white border-4 border-white"><QrCode size={30} /></button>
        <button onClick={() => setView('receive')} className={`p-3 ${view === 'receive' ? 'text-[#eb618e]' : 'text-white/40'}`}><Download size={28} /></button>
      </nav>
    </div>
  );
};