"use client";
import React from 'react';
import { RefreshCw } from 'lucide-react';

export const PigPayLogo = ({ size = "md", className = "" }: { size?: "md" | "lg", className?: string }) => {
  const dimensions = size === "lg" ? "h-24 md:h-32" : "h-12 md:h-16";
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <img src="/logo.png" alt="PigPay Logo" className={`${dimensions} w-auto object-contain transition-transform hover:scale-105 duration-300`} />
    </div>
  );
};

export const BalanceCard = ({ balance, username, onRefresh, loading, unit }: any) => (
  <div className="bg-[#332f2f] rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
    <div className="relative z-10">
      <p className="text-[#eb618e] text-xs font-black uppercase tracking-[0.2em] mb-2">現在の残高</p>
      <div className="text-5xl font-mono font-black tracking-tighter mb-10 flex items-baseline gap-2">
        {balance.toLocaleString()} <span className="text-xl font-sans text-white/50">{unit}</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="bg-white/10 px-5 py-2 rounded-2xl backdrop-blur-md text-sm border border-white/5 font-black">@{username}</div>
        <button onClick={onRefresh} className="p-3 bg-white/5 hover:bg-white/20 rounded-2xl transition-all">
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
    </div>
    <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-[#eb618e]/20 rounded-full blur-[80px]"></div>
  </div>
);