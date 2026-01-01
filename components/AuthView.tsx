"use client";
import React, { useState } from 'react';
import { Mail, Lock, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PigPayLogo } from './PigPayComponents';

export const AuthView = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inputUsername, setInputUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password, options: { data: { username: inputUsername } } });
      if (error) alert(error.message); else alert("登録完了！");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#fcf4f6] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-[3rem] p-10 shadow-xl">
        <PigPayLogo size="lg" className="mb-10" />
        <form onSubmit={handleAuth} className="space-y-5">
          {isSignUp && (
            <div className="relative">
              <User className="absolute left-4 top-4 text-[#eb618e]/50" size={20} />
              <input type="text" placeholder="ユーザー名" className="w-full p-4 pl-12 bg-gray-50 rounded-2xl outline-none" value={inputUsername} onChange={(e) => setInputUsername(e.target.value)} required />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-4 top-4 text-[#eb618e]/50" size={20} />
            <input type="email" placeholder="メールアドレス" className="w-full p-4 pl-12 bg-gray-50 rounded-2xl outline-none" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-4 text-[#eb618e]/50" size={20} />
            <input type="password" placeholder="パスワード" className="w-full p-4 pl-12 bg-gray-50 rounded-2xl outline-none" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button className="w-full bg-[#eb618e] text-white py-5 rounded-2xl font-black">{loading ? "処理中..." : (isSignUp ? "新規登録" : "ログイン")}</button>
        </form>
        <button onClick={() => setIsSignUp(!isSignUp)} className="w-full mt-8 text-xs text-[#eb618e] font-black uppercase">
          {isSignUp ? "ログインへ" : "アカウント作成へ"}
        </button>
      </div>
    </div>
  );
};