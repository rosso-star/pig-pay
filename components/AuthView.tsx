"use client";
import React, { useState } from 'react';
import { Mail, Lock, User, AlertCircle } from 'lucide-react'; // AlertCircleを追加
import { supabase } from '@/lib/supabase';
import { PigPayLogo } from './PigPayComponents';

export const AuthView = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inputUsername, setInputUsername] = useState('');
  const [loading, setLoading] = useState(false);
  // --- エラーメッセージ用の状態を追加 ---
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null); // 処理開始時にエラーをクリア

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ 
        email, 
        password, 
        options: { data: { username: inputUsername } } 
      });
      if (error) {
        setErrorMessage(error.message); // ポップアップではなく状態に入れる
      } else {
        setErrorMessage("確認メールを送信しました。チェックしてください！");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setErrorMessage("ログインに失敗しました。メールアドレスかパスワードが違います。");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#fcf4f6] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-[3rem] p-10 shadow-xl border-b-8 border-[#f8d7e3]">
        <PigPayLogo size="lg" className="mb-10" />
        
        <form onSubmit={handleAuth} className="space-y-5 font-bold">
          {/* --- エラー表示エリア --- */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-4 mb-4 text-sm text-red-600 bg-red-50 rounded-2xl border border-red-100 animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={18} />
              <span>{errorMessage}</span>
            </div>
          )}

          {isSignUp && (
            <div className="relative">
              <User className="absolute left-4 top-4 text-[#eb618e]/50" size={20} />
              <input 
                type="text" 
                placeholder="ユーザー名" 
                className="w-full p-4 pl-12 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-[#eb618e] outline-none transition-all" 
                value={inputUsername} 
                onChange={(e) => setInputUsername(e.target.value)} 
                required 
              />
            </div>
          )}
          
          <div className="relative">
            <Mail className="absolute left-4 top-4 text-[#eb618e]/50" size={20} />
            <input 
              type="email" 
              placeholder="メールアドレス" 
              className="w-full p-4 pl-12 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-[#eb618e] outline-none transition-all" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-4 text-[#eb618e]/50" size={20} />
            <input 
              type="password" 
              placeholder="パスワード" 
              className="w-full p-4 pl-12 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-[#eb618e] outline-none transition-all" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>

          <button 
            disabled={loading}
            className="w-full bg-[#eb618e] text-white py-5 rounded-2xl font-black text-lg hover:bg-[#d84d7a] transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            {loading ? "処理中..." : (isSignUp ? "新しくはじめる" : "ログイン")}
          </button>
        </form>

        <button 
          onClick={() => {
            setIsSignUp(!isSignUp);
            setErrorMessage(null); // モード切り替え時もエラーを消す
          }} 
          className="w-full mt-8 text-xs text-[#eb618e] font-black uppercase tracking-widest"
        >
          {isSignUp ? "すでにアカウントをお持ちの方" : "アカウントを新規作成"}
        </button>
      </div>
    </div>
  );
};