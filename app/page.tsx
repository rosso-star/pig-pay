"use client";
import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Wallet, QrCode, RefreshCw, X, LogOut, User, Mail, Lock, ArrowUpRight, ArrowDownLeft, Clock, History, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Scanner } from '@yudiel/react-qr-scanner';

// --- 1. 型定義 (TypeScriptのエラーを回避) ---
interface Transaction {
  id: string;
  amount: number;
  sender_username: string;
  receiver_username: string;
  created_at: string;
}

// --- 2. 独自ロゴコンポーネント (1536*1024 / 3:2比率対応) ---
const PigPayLogo = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  // 3:2の比率を維持したサイズ設定
  const containerSizes = {
    sm: "h-8 w-[48px]",    // 高さ32px * 1.5 = 幅48px
    md: "h-12 w-[72px]",   // 高さ48px * 1.5 = 幅72px
    lg: "h-24 w-[144px]"   // 高さ96px * 1.5 = 幅144px
  };

  return (
    <div className={`${containerSizes[size]} flex items-center justify-center overflow-hidden group`}>
      <img 
        src="/logo.jpg" // publicフォルダ内のファイル名に合わせて .png 等に変更してください
        alt="PigPay Logo"
        className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
      />
    </div>
  );
};

export default function PigPay() {
  // --- 状態管理 (State) ---
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inputUsername, setInputUsername] = useState('');

  const [view, setView] = useState<'home' | 'scan' | 'receive'>('home');
  const [balance, setBalance] = useState<number>(0);
  const [username, setUsername] = useState<string>("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  const [recipient, setRecipient] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [isTransferring, setIsTransferring] = useState(false);

  // --- 認証監視 ---
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

  // --- データ取得 ---
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
          .limit(10);
        if (txData) setTransactions(txData);
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

  // --- 認証処理 ---
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username: inputUsername } }
      });
      if (error) alert(error.message);
      else setIsSignUp(false);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
    }
    setLoading(false);
  };

  // --- 送金処理 ---
  const handleTransfer = async () => {
    if (!recipient || amount <= 0 || amount > balance) return;
    setIsTransferring(true);
    try {
      const { error } = await supabase.rpc('transfer_pigen', {
        sender_username: username,
        receiver_username: recipient,
        amount: amount
      });
      if (error) throw error;
      setRecipient(null); 
      setAmount(0); 
      setView('home');
      fetchData();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsTransferring(false);
    }
  };

  // --- ロード画面 ---
  if (authLoading) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      <div className="animate-bounce mb-4"><PigPayLogo size="lg" /></div>
      <p className="text-slate-400 font-black tracking-widest animate-pulse text-[10px] uppercase">Loading PigPay</p>
    </div>
  );

  // --- 未ログイン画面 ---
  if (!session) {
    return (
      <div className="min-h-screen bg-pink-50 flex items-center justify-center p-6">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-sm border-b-[12px] border-pink-200 animate-in fade-in zoom-in-95 duration-500">
          <div className="flex justify-center mb-10">
            <PigPayLogo size="lg" />
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
              <div className="relative">
                <User className="absolute left-4 top-4 text-pink-300" size={20} />
                <input type="text" placeholder="Username" className="w-full p-4 pl-12 bg-gray-50 rounded-2xl outline-none focus:ring-2 ring-pink-400 font-bold transition-all text-slate-800" value={inputUsername} onChange={(e) => setInputUsername(e.target.value)} required />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-4 top-4 text-pink-300" size={20} />
              <input type="email" placeholder="Email" className="w-full p-4 pl-12 bg-gray-50 rounded-2xl outline-none focus:ring-2 ring-pink-400 font-bold transition-all text-slate-800" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-4 text-pink-300" size={20} />
              <input type="password" placeholder="Password" className="w-full p-4 pl-12 bg-gray-50 rounded-2xl outline-none focus:ring-2 ring-pink-400 font-bold transition-all text-slate-800" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button className="w-full bg-pink-500 text-white py-5 rounded-2xl font-black shadow-lg hover:bg-pink-600 active:scale-95 transition-all text-lg mt-4">
              {loading ? "Processing..." : (isSignUp ? "Create Account" : "Sign In")}
            </button>
          </form>
          <button onClick={() => setIsSignUp(!isSignUp)} className="w-full mt-8 text-xs text-pink-400 font-black uppercase tracking-[0.2em] hover:text-pink-600 transition-colors">
            {isSignUp ? "Already have an account?" : "Join the Club"}
          </button>
        </div>
      </div>
    );
  }

  // --- メイン画面 ---
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center pb-32">
      <header className="w-full max-w-md px-6 py-6 flex justify-between items-center bg-white/50 backdrop-blur-md sticky top-0 z-30">
        <PigPayLogo size="md" />
        <button onClick={() => supabase.auth.signOut()} className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-slate-300 hover:text-pink-500 shadow-sm border border-gray-100 transition-all">
          <LogOut size={18} />
        </button>
      </header>

      <main className="w-full max-w-md px-4 pt-4">
        {view === 'home' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Balance Card */}
            <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-pink-500 rounded-full blur-[80px] opacity-40 group-hover:opacity-60 transition-opacity" />
              <div className="relative z-10 text-white">
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Total Balance</p>
                    <div className="text-5xl font-black font-mono tracking-tighter">
                      {balance.toLocaleString()} <span className="text-pink-500 text-2xl font-sans">P</span>
                    </div>
                  </div>
                  <button onClick={fetchData} className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white hover:bg-white/20 transition-all">
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                  </button>
                </div>
                <div className="bg-white/10 inline-block px-4 py-2 rounded-full backdrop-blur-md">
                  <p className="font-bold text-sm italic">@{username}</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setView('scan')} className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-4 hover:border-pink-200 transition-all group">
                <div className="w-12 h-12 bg-pink-50 rounded-2xl flex items-center justify-center text-pink-500 group-hover:bg-pink-500 group-hover:text-white transition-all">
                  <ArrowUpRight size={24} />
                </div>
                <span className="font-black text-slate-700">Send</span>
              </button>
              <button onClick={() => setView('receive')} className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-4 hover:border-pink-200 transition-all group">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all">
                  <ArrowDownLeft size={24} />
                </div>
                <span className="font-black text-slate-700">Receive</span>
              </button>
            </div>

            {/* Transaction History */}
            <div>
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2 px-2">
                <History size={14} /> Transactions
              </h2>
              <div className="space-y-3">
                {transactions.length > 0 ? transactions.map((tx) => {
                  const isOut = tx.sender_username === username;
                  return (
                    <div key={tx.id} className="bg-white p-4 rounded-[2rem] shadow-sm border border-gray-50 flex justify-between items-center transition-transform hover:scale-[1.02]">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isOut ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                          {isOut ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                        </div>
                        <div>
                          <p className="font-black text-slate-800 text-sm">{isOut ? `@${tx.receiver_username}` : `@${tx.sender_username}`}</p>
                          <p className="text-[10px] text-slate-400 font-bold">{new Date(tx.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className={`font-mono font-black text-lg ${isOut ? 'text-slate-400' : 'text-emerald-500'}`}>
                        {isOut ? '-' : '+'}{tx.amount}
                      </span>
                    </div>
                  );
                }) : (
                  <div className="py-12 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100">
                    <p className="text-slate-300 font-bold italic">No activity yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {view === 'receive' && (
          <div className="animate-in zoom-in-95 text-center bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100">
            <button onClick={() => setView('home')} className="mb-6 w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 ml-auto hover:bg-gray-100">
              <X size={20} />
            </button>
            <div className="flex justify-center mb-10">
              <PigPayLogo size="lg" />
            </div>
            <div className="p-8 bg-slate-50 rounded-[2.5rem] inline-block border-2 border-slate-100 mb-6">
              <QRCodeSVG value={username} size={180} />
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-1">@{username}</h3>
            <p className="text-slate-400 text-sm font-bold">Show this QR to receive payments</p>
          </div>
        )}

        {view === 'scan' && (
          <div className="animate-in slide-in-from-bottom-8">
            {!recipient ? (
              <div className="bg-slate-900 p-6 rounded-[3rem] aspect-[4/5] relative overflow-hidden shadow-2xl">
                <div className="flex justify-between items-center mb-6 relative z-10">
                  <span className="text-white/30 text-[10px] font-black uppercase tracking-widest">QR Scanner</span>
                  <button onClick={() => setView('home')} className="text-white/50 hover:text-white"><X size={24} /></button>
                </div>
                <div className="rounded-[2.5rem] overflow-hidden bg-black h-[80%] relative border border-white/10 shadow-inner">
                  <Scanner onScan={(res) => res?.[0]?.rawValue && setRecipient(res[0].rawValue)} />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 border-2 border-pink-500 rounded-[2.5rem] animate-pulse shadow-[0_0_20px_rgba(236,72,153,0.3)]" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white p-8 rounded-[3rem] shadow-2xl border-b-[12px] border-pink-100 animate-in slide-in-from-right duration-300">
                <div className="flex justify-between items-center mb-10">
                  <h2 className="text-xl font-black text-slate-800">Send Payment</h2>
                  <button onClick={() => setRecipient(null)} className="text-slate-300 hover:text-slate-500"><X size={24} /></button>
                </div>
                <div className="bg-slate-50 p-6 rounded-3xl mb-8 flex items-center gap-4 border border-slate-100">
                  <div className="w-12 h-12 bg-pink-500 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-pink-100">@</div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-black uppercase">Recipient</p>
                    <p className="text-xl font-black text-slate-800">@{recipient}</p>
                  </div>
                </div>
                <div className="mb-10 text-center">
                  <input type="number" value={amount || ''} onChange={(e) => setAmount(Number(e.target.value))} placeholder="0" className="w-full text-7xl font-mono font-black text-center outline-none bg-transparent text-pink-500 placeholder:text-pink-100" autoFocus />
                  <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Available Balance: {balance.toLocaleString()} P</p>
                </div>
                <button onClick={handleTransfer} disabled={isTransferring || amount <= 0 || amount > balance} className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black shadow-xl active:scale-95 disabled:bg-slate-100 disabled:text-slate-300 transition-all text-xl flex items-center justify-center gap-3">
                  {isTransferring ? "Processing..." : "Confirm & Pay"} <ChevronRight size={24} />
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-8 w-[calc(100%-48px)] max-w-sm bg-white/90 backdrop-blur-xl flex justify-around items-center py-4 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] z-20 border border-white/50">
        <button onClick={() => setView('home')} className={`flex flex-col items-center gap-1 transition-all ${view === 'home' ? 'text-pink-500 scale-110' : 'text-slate-300'}`}>
          <Wallet size={24} strokeWidth={view === 'home' ? 3 : 2} />
          <span className="text-[9px] font-black uppercase tracking-tighter">Home</span>
        </button>
        <button onClick={() => { setView('scan'); setRecipient(null); }} className="bg-slate-900 text-white w-16 h-16 -mt-12 rounded-[1.8rem] shadow-2xl flex items-center justify-center active:scale-90 transition-all border-4 border-white hover:bg-pink-500 hover:rotate-6">
          <QrCode size={28} />
        </button>
        <button onClick={() => setView('receive')} className={`flex flex-col items-center gap-1 transition-all ${view === 'receive' ? 'text-pink-500 scale-110' : 'text-slate-300'}`}>
          <ArrowDownLeft size={24} strokeWidth={view === 'receive' ? 3 : 2} />
          <span className="text-[9px] font-black uppercase tracking-tighter">Receive</span>
        </button>
      </nav>
    </div>
  );
}