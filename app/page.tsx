"use client";
import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Wallet, QrCode, RefreshCw, X, LogOut, User, Mail, Lock, ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Scanner } from '@yudiel/react-qr-scanner';

// --- 型定義：取引データの形を定義 ---
interface Transaction {
  id: string;
  amount: number;
  sender_username: string;
  receiver_username: string;
  created_at: string;
}

export default function PigPay() {
  // --- 状態管理 (State) ---
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inputUsername, setInputUsername] = useState('');

  const [view, setView] = useState<'home' | 'scan'>('home');
  const [balance, setBalance] = useState<number>(0);
  const [username, setUsername] = useState<string>("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  const [recipient, setRecipient] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [isTransferring, setIsTransferring] = useState(false);

  // --- 1. 認証監視：ログインしているかどうかをチェック ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // --- 2. データ取得：残高と取引履歴をSupabaseから持ってくる ---
  const fetchData = async () => {
    if (!session?.user) return;
    setLoading(true);
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profile) {
        setBalance(profile.balance);
        setUsername(profile.username);

        const { data: txData } = await supabase
          .from('transactions')
          .select('*')
          .or(`sender_username.eq.${profile.username},receiver_username.eq.${profile.username}`)
          .order('created_at', { ascending: false })
          .limit(5);
        if (txData) setTransactions(txData);
      } else {
        // プロフィール作成が間に合わない場合は1秒待って再試行
        setTimeout(fetchData, 1000);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) fetchData();
  }, [session]);

  // --- 3. 認証処理：サインアップとログイン ---
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isSignUp) {
      // ユーザー名・メアドの重複チェック
      const { data: existing } = await supabase
          .from('profiles')
          .select('username, email')
          .or(`username.eq.${inputUsername},email.eq.${email}`)
          .maybeSingle();

      if (existing) {
          alert("このユーザー名またはメールアドレスは既に使用されています。");
          setLoading(false);
          return;
      }

      // 新規登録
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username: inputUsername } }
      });
      
      if (error) {
        alert("エラー: " + error.message);
      } else {
        alert("登録完了！ログインしてください。");
        setIsSignUp(false);
      }
    } else {
      // ログイン
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert("ログイン失敗: " + error.message);
    }
    setLoading(false);
  };

  // --- 4. 送金処理：DBの関数(RPC)を呼び出して残高を移動 ---
  const handleTransfer = async () => {
    if (!recipient || amount <= 0 || !username) return;
    if (amount > balance) { alert("残高が足りません"); return; }
    
    setIsTransferring(true);
    try {
      const { error } = await supabase.rpc('transfer_pigen', {
        sender_username: username,
        receiver_username: recipient,
        amount: amount
      });
      if (error) throw error;
      alert(`@${recipient} への送金に成功しました！`);
      setRecipient(null); 
      setAmount(0); 
      setView('home');
      fetchData(); // 最新の残高に更新
    } catch (err: any) {
      alert("送金エラー: " + err.message);
    } finally {
      setIsTransferring(false);
    }
  };

  // --- 画面表示 (Render) ---

  // ロード中
  if (authLoading) return <div className="min-h-screen bg-pink-50 flex items-center justify-center text-pink-500 font-bold italic animate-pulse">PigPay Loading...</div>;

  // 未ログイン時：ログイン・登録画面
  if (!session) {
    return (
      <div className="min-h-screen bg-pink-50 flex flex-col items-center justify-center p-6 text-slate-800">
        <div className="bg-white p-8 rounded-[40px] shadow-2xl w-full max-w-sm border-4 border-white">
          <h1 className="text-4xl font-black text-pink-500 mb-8 text-center italic tracking-tighter">PigPay</h1>
          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
              <div className="relative">
                <User className="absolute left-3 top-3 text-pink-200" size={20} />
                <input type="text" placeholder="ユーザー名" className="w-full p-3 pl-10 border-2 border-pink-50 rounded-2xl outline-none focus:border-pink-400 transition-all font-bold" value={inputUsername} onChange={(e) => setInputUsername(e.target.value)} required />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-pink-200" size={20} />
              <input type="email" placeholder="メール" className="w-full p-3 pl-10 border-2 border-pink-50 rounded-2xl outline-none focus:border-pink-400 transition-all font-bold" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-pink-200" size={20} />
              <input type="password" placeholder="パスワード" className="w-full p-3 pl-10 border-2 border-pink-50 rounded-2xl outline-none focus:border-pink-400 transition-all font-bold" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button className="w-full bg-pink-500 text-white py-4 rounded-2xl font-black shadow-lg shadow-pink-100 hover:bg-pink-600 active:scale-95 transition-all">
              {loading ? "Please wait..." : (isSignUp ? "Create Account" : "Log In")}
            </button>
          </form>
          <button onClick={() => setIsSignUp(!isSignUp)} className="w-full mt-6 text-xs text-pink-400 font-black uppercase tracking-widest hover:underline">
            {isSignUp ? "Back to Login" : "Join PigPay"}
          </button>
        </div>
      </div>
    );
  }

  // ログイン後：メイン画面
  return (
    <div className="min-h-screen bg-pink-50 flex flex-col items-center pb-32 text-slate-800">
      {/* ヘッダー */}
      <header className="w-full bg-white/80 backdrop-blur-md py-4 shadow-sm text-center sticky top-0 z-20 flex justify-between px-6 items-center border-b border-pink-100">
        <h1 className="text-2xl font-black text-pink-500 italic tracking-tighter">PigPay</h1>
        <button onClick={() => supabase.auth.signOut()} className="text-gray-300 hover:text-pink-500 transition-colors"><LogOut size={22} /></button>
      </header>

      <main className="w-full max-w-md px-4 pt-6">
        {view === 'home' ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* 残高表示カード */}
            <div className="bg-gradient-to-br from-pink-400 to-rose-400 rounded-[35px] p-8 shadow-xl text-white relative">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2 opacity-80">
                    <Wallet size={16} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Balance</span>
                  </div>
                  <div className="text-5xl font-black font-mono tracking-tighter">
                    {balance.toLocaleString()} <span className="text-xl font-sans">P</span>
                  </div>
                </div>
                <button onClick={fetchData} className="p-3 bg-white/20 rounded-2xl hover:bg-white/30 transition-colors">
                  <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
              </div>
              <div className="mt-8 pt-4 border-t border-white/20 text-right">
                <p className="font-bold text-lg italic tracking-tight">@{username || '---'}</p>
              </div>
            </div>

            {/* 取引履歴セクション */}
            <div className="mt-10">
              <h2 className="px-1 mb-4 flex items-center gap-2 font-black text-[10px] text-gray-400 uppercase tracking-[0.2em]">
                <Clock size={14} className="text-pink-400" /> Recent Activity
              </h2>
              <div className="space-y-3">
                {transactions.length > 0 ? transactions.map((tx) => {
                  const isOut = tx.sender_username === username;
                  return (
                    <div key={tx.id} className="bg-white p-4 rounded-3xl shadow-sm border border-pink-50 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isOut ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                          {isOut ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                        </div>
                        <div>
                          <p className="font-black text-sm">{isOut ? `To: @${tx.receiver_username}` : `From: @${tx.sender_username}`}</p>
                          <p className="text-[10px] text-gray-300 font-bold">{new Date(tx.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className={`font-mono font-black ${isOut ? 'text-slate-400' : 'text-emerald-500'}`}>{isOut ? '-' : '+'}{tx.amount}</span>
                    </div>
                  );
                }) : (
                  <div className="text-center py-12 bg-white/40 rounded-[35px] border-2 border-dashed border-pink-100">
                    <p className="text-gray-300 text-xs font-bold italic">No data</p>
                  </div>
                )}
              </div>
            </div>

            {/* 受取用QRコード表示 */}
            <div className="mt-10 bg-white p-8 rounded-[40px] shadow-sm border border-pink-50 text-center">
              <p className="text-[10px] font-black text-pink-200 uppercase tracking-[0.4em] mb-6">Scan to Pay Me</p>
              <div className="p-4 bg-pink-50/30 rounded-3xl inline-block border border-pink-50">
                <QRCodeSVG value={username} size={150} />
              </div>
            </div>
          </div>
        ) : (
          /* 送金（カメラ）画面 */
          <div className="mt-2 animate-in zoom-in-95 duration-300">
            {!recipient ? (
              <div className="bg-white p-6 rounded-[40px] shadow-2xl border-4 border-white overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                  <span className="font-black text-pink-500 uppercase text-xs tracking-[0.2em]">QR Scanner</span>
                  <button onClick={() => setView('home')} className="p-2 bg-pink-50 rounded-full text-pink-400"><X size={24} /></button>
                </div>
                <div className="aspect-square rounded-[30px] overflow-hidden bg-black relative border-4 border-pink-50">
                  <Scanner
                    onScan={(result) => {
                      if (result?.[0]?.rawValue) {
                        setRecipient(result[0].rawValue);
                      }
                    }}
                    allowMultiple={false}
                    constraints={{
                      facingMode: "environment"
                    } as MediaTrackConstraints}
                    styles={{
                      container: { width: "100%", height: "100%" }
                    }}
                  />
                  <div className="absolute inset-0 border-[40px] border-black/20 pointer-events-none"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-pink-500/50 rounded-3xl animate-pulse"></div>
                </div>
              </div>
            ) : (
              /* 金額入力セクション */
              <div className="bg-white p-8 rounded-[40px] shadow-2xl border-4 border-white">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-xl font-black text-pink-500 italic">PAYMENT</h2>
                  <button onClick={() => setRecipient(null)} className="p-2 bg-pink-50 rounded-full text-pink-400"><X size={24} /></button>
                </div>
                <div className="mb-8 bg-pink-50 p-6 rounded-3xl border border-pink-100">
                  <label className="text-[10px] text-pink-300 block mb-1 font-black uppercase">Recipient</label>
                  <p className="text-2xl font-black text-pink-600">@{recipient}</p>
                </div>
                <div className="mb-10">
                  <label className="text-[10px] text-gray-400 block mb-2 font-black uppercase">Amount (P)</label>
                  <input type="number" value={amount || ''} onChange={(e) => setAmount(Number(e.target.value))} className="w-full text-6xl font-mono font-black border-b-8 border-pink-50 outline-none pb-4 focus:border-pink-500 bg-transparent" autoFocus />
                  <p className="mt-4 text-xs font-bold text-gray-300 italic">Balance: {balance.toLocaleString()} P</p>
                </div>
                <button onClick={handleTransfer} disabled={isTransferring || amount <= 0 || amount > balance} className="w-full bg-pink-500 text-white py-5 rounded-[25px] font-black shadow-xl active:scale-95 disabled:bg-gray-200 transition-all text-lg">
                  {isTransferring ? "Processing..." : "Send Pigen"}
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ナビゲーションバー */}
      <nav className="fixed bottom-6 w-[calc(100%-48px)] max-w-md bg-white/90 backdrop-blur-xl flex justify-around py-4 rounded-[30px] shadow-2xl z-20 border border-white/50">
        <button onClick={() => setView('home')} className={`flex flex-col items-center gap-1 ${view === 'home' ? 'text-pink-500 scale-110' : 'text-gray-300'}`}>
          <Wallet size={24} strokeWidth={2.5} /><span className="text-[9px] font-black uppercase">Wallet</span>
        </button>
        <button onClick={() => { setView('scan'); setRecipient(null); }} className="bg-pink-500 text-white p-5 -mt-12 rounded-[22px] shadow-xl active:scale-90 border-4 border-white">
          <QrCode size={28} strokeWidth={2.5} />
        </button>
        <div className="flex flex-col items-center gap-1 text-gray-200 opacity-30">
          <Clock size={24} strokeWidth={2.5} /><span className="text-[9px] font-black uppercase tracking-tighter">Soon</span>
        </div>
      </nav>
    </div>
  );
}