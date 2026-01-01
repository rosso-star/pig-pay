"use client";
import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Wallet, QrCode, RefreshCw, X, LogOut, User, Mail, Lock, ArrowUpRight, ArrowDownLeft, History, ChevronRight, Search, LayoutDashboard, Send, Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Scanner } from '@yudiel/react-qr-scanner';

// --- Types ---
interface Transaction {
  id: string;
  amount: number;
  sender_username: string;
  receiver_username: string;
  created_at: string;
}

// --- Logo Component ---
const PigPayLogo = ({ size = "md", className = "" }: { size?: "md" | "lg", className?: string }) => {
  const dimensions = size === "lg" ? "h-24 md:h-32" : "h-12 md:h-16";
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <img 
        src="/logo.png" 
        alt="PigPay Logo" 
        className={`${dimensions} w-auto object-contain transition-transform hover:scale-105 duration-300`}
      />
    </div>
  );
};

export default function PigPay() {
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inputUsername, setInputUsername] = useState('');

  const [view, setView] = useState<'home' | 'send' | 'receive'>('home');
  const [sendStep, setSendStep] = useState<'target' | 'amount'>('target');
  const [sendMethod, setSendMethod] = useState<'qr' | 'id'>('id');
  
  const [balance, setBalance] = useState<number>(0);
  const [username, setUsername] = useState<string>("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  const [recipient, setRecipient] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);
  const [isTransferring, setIsTransferring] = useState(false);

  // 通貨単位の定数
  const UNIT = "ピゲン（豚円）";

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

  const fetchData = async () => {
    if (!session?.user) return;
    setLoading(true);
    try {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
      if (profile) {
        setBalance(profile.balance);
        setUsername(profile.username);
        const { data: txData } = await supabase.from('transactions').select('*')
          .or(`sender_username.eq.${profile.username},receiver_username.eq.${profile.username}`)
          .order('created_at', { ascending: false }).limit(8);
        if (txData) setTransactions(txData);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (session) fetchData(); }, [session]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password, options: { data: { username: inputUsername } } });
      if (error) alert("エラー: " + error.message);
      else { alert("登録完了！ログインしてください。"); setIsSignUp(false); }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert("ログイン失敗: " + error.message);
    }
    setLoading(false);
  };

  const handleTransfer = async () => {
    if (!recipient || amount <= 0 || amount > balance) return;
    setIsTransferring(true);
    try {
      const { error } = await supabase.rpc('transfer_pigen', {
        sender_username: username,
        receiver_username: recipient.replace('@', ''),
        amount: amount
      });
      if (error) throw error;
      alert(`@${recipient} さんへ ${amount}${UNIT} 送金しました！`);
      resetSendState();
      fetchData();
    } catch (err: any) {
      alert("送金に失敗しました: " + err.message);
    } finally {
      setIsTransferring(false);
    }
  };

  const resetSendState = () => {
    setRecipient("");
    setAmount(0);
    setSendStep('target');
    setView('home');
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-white"><RefreshCw className="animate-spin text-[#eb618e]" /></div>;

  if (!session) {
    return (
      <div className="min-h-screen bg-[#fcf4f6] flex items-center justify-center p-4 text-[#332f2f]">
        <div className="w-full max-w-md bg-white rounded-[3rem] p-10 shadow-xl border-b-8 border-[#f8d7e3]">
          <PigPayLogo size="lg" className="mb-10" />
          <form onSubmit={handleAuth} className="space-y-5 font-bold">
            {isSignUp && (
              <div className="relative">
                <User className="absolute left-4 top-4 text-[#eb618e]/50" size={20} />
                <input type="text" placeholder="ユーザー名" className="w-full p-4 pl-12 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-[#eb618e] outline-none transition-all" value={inputUsername} onChange={(e) => setInputUsername(e.target.value)} required />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-4 top-4 text-[#eb618e]/50" size={20} />
              <input type="email" placeholder="メールアドレス" className="w-full p-4 pl-12 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-[#eb618e] outline-none transition-all" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-4 text-[#eb618e]/50" size={20} />
              <input type="password" placeholder="パスワード" className="w-full p-4 pl-12 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-[#eb618e] outline-none transition-all" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button className="w-full bg-[#eb618e] text-white py-5 rounded-2xl font-black text-lg hover:bg-[#d84d7a] transition-all shadow-lg active:scale-95">
              {loading ? "処理中..." : (isSignUp ? "新しくはじめる" : "ログイン")}
            </button>
          </form>
          <button onClick={() => setIsSignUp(!isSignUp)} className="w-full mt-8 text-xs text-[#eb618e] font-black uppercase tracking-widest">
            {isSignUp ? "すでにアカウントをお持ちの方" : "アカウントを新規作成"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#332f2f] flex flex-col md:flex-row font-bold">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-72 bg-[#fcf4f6] border-r border-[#f8d7e3] p-8">
        <PigPayLogo className="mb-12 justify-start" />
        <nav className="flex-1 space-y-3 font-black">
          {[
            { id: 'home', label: 'ホーム', icon: LayoutDashboard },
            { id: 'send', label: '送る', icon: Send },
            { id: 'receive', label: '受け取る', icon: Download },
          ].map((item: any) => (
            <button
              key={item.id}
              onClick={() => {setView(item.id); setSendStep('target');}}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${view === item.id ? 'bg-[#eb618e] text-white shadow-md' : 'text-[#eb618e]/60 hover:bg-[#f8d7e3]'}`}
            >
              <item.icon size={22} /> {item.label}
            </button>
          ))}
        </nav>
        <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-4 px-6 py-4 text-gray-400 hover:text-red-500 transition-all font-black">
          <LogOut size={22} /> ログアウト
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto pb-24 md:pb-0">
        <header className="md:hidden flex items-center justify-between p-6 bg-white border-b border-gray-100 sticky top-0 z-40">
          <PigPayLogo />
          <button onClick={() => supabase.auth.signOut()} className="p-2 text-gray-300"><LogOut size={22} /></button>
        </header>

        <div className="p-6 md:p-12 max-w-5xl mx-auto w-full">
          {view === 'home' && (
            <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Balance Card */}
                <div className="bg-[#332f2f] rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                  <div className="relative z-10">
                    <p className="text-[#eb618e] text-xs font-black uppercase tracking-[0.2em] mb-2">現在の残高</p>
                    <div className="text-5xl font-mono font-black tracking-tighter mb-10 flex items-baseline gap-2">
                      {balance.toLocaleString()} <span className="text-xl font-sans text-white/50">{UNIT}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="bg-white/10 px-5 py-2 rounded-2xl backdrop-blur-md text-sm border border-white/5 font-black">
                        @{username}
                      </div>
                      <button onClick={fetchData} className="p-3 bg-white/5 hover:bg-white/20 rounded-2xl transition-all">
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                      </button>
                    </div>
                  </div>
                  <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-[#eb618e]/20 rounded-full blur-[80px] group-hover:bg-[#eb618e]/40 transition-all duration-700"></div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <button onClick={() => {setView('send'); setSendStep('target');}} className="flex flex-col items-center justify-center gap-4 bg-[#fcf4f6] rounded-[3rem] border-2 border-transparent hover:border-[#eb618e] transition-all group shadow-sm">
                    <div className="bg-white p-5 rounded-3xl text-[#eb618e] shadow-sm group-hover:bg-[#eb618e] group-hover:text-white transition-all">
                      <Send size={28} />
                    </div>
                    <span className="font-black text-[#332f2f]">送る</span>
                  </button>
                  <button onClick={() => setView('receive')} className="flex flex-col items-center justify-center gap-4 bg-white rounded-[3rem] border-2 border-[#fcf4f6] hover:border-[#eb618e] transition-all group shadow-sm">
                    <div className="bg-[#fcf4f6] p-5 rounded-3xl text-[#eb618e] group-hover:bg-[#eb618e] group-hover:text-white transition-all">
                      <Download size={28} />
                    </div>
                    <span className="font-black text-[#332f2f]">受け取る</span>
                  </button>
                </div>
              </div>

              {/* History */}
              <div className="bg-white rounded-[3rem] p-8 border-2 border-[#fcf4f6]">
                <h2 className="text-xs font-black flex items-center gap-3 mb-8 text-[#332f2f]/30 uppercase tracking-[0.2em]">
                  <History size={18} /> 取引履歴
                </h2>
                <div className="space-y-4">
                  {transactions.length > 0 ? transactions.map((tx) => {
                    const isOut = tx.sender_username === username;
                    return (
                      <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-[#fcf4f6] rounded-[2rem] transition-all border border-transparent hover:border-[#f8d7e3]">
                        <div className="flex items-center gap-5">
                          <div className={`p-4 rounded-2xl ${isOut ? 'bg-gray-100 text-gray-400' : 'bg-[#fcf4f6] text-[#eb618e]'}`}>
                            {isOut ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                          </div>
                          <div>
                            <p className="text-sm font-black text-[#332f2f]">{isOut ? `@${tx.receiver_username} へ` : `@${tx.sender_username} から`}</p>
                            <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-tighter">{new Date(tx.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <span className={`font-mono font-black text-lg ${isOut ? 'text-gray-400' : 'text-[#eb618e]'}`}>
                          {isOut ? '-' : '+'}{tx.amount.toLocaleString()} <span className="text-[10px] font-sans">豚円</span>
                        </span>
                      </div>
                    );
                  }) : (
                    <div className="py-20 text-center">
                      <p className="text-gray-300 font-black">履歴がありません</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {view === 'send' && (
            <div className="max-w-md mx-auto animate-in zoom-in-95 duration-500">
              <div className="bg-white rounded-[3.5rem] p-10 shadow-2xl border-b-[12px] border-[#fcf4f6]">
                <div className="flex items-center justify-between mb-10">
                  <h2 className="text-2xl font-black tracking-tighter">送金する</h2>
                  <button onClick={resetSendState} className="p-3 bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-all"><X size={20}/></button>
                </div>

                {sendStep === 'target' ? (
                  <div className="space-y-8">
                    <div className="flex p-1.5 bg-gray-50 rounded-2xl font-black">
                      <button onClick={() => setSendMethod('id')} className={`flex-1 py-3 text-xs rounded-xl transition-all ${sendMethod === 'id' ? 'bg-white shadow-sm text-[#eb618e]' : 'text-gray-400'}`}>ID入力</button>
                      <button onClick={() => setSendMethod('qr')} className={`flex-1 py-3 text-xs rounded-xl transition-all ${sendMethod === 'qr' ? 'bg-white shadow-sm text-[#eb618e]' : 'text-gray-400'}`}>QRスキャン</button>
                    </div>

                    {sendMethod === 'id' ? (
                      <div className="space-y-6">
                        <div className="relative group">
                          <Search className="absolute left-5 top-5 text-gray-300 group-focus-within:text-[#eb618e] transition-colors" size={24} />
                          <input 
                            type="text" 
                            placeholder="ユーザー名を入力" 
                            className="w-full p-5 pl-14 bg-gray-50 border-2 border-transparent rounded-[2rem] outline-none focus:bg-white focus:border-[#eb618e] font-black transition-all"
                            value={recipient}
                            onChange={(e) => setRecipient(e.target.value)}
                          />
                        </div>
                        <button 
                          onClick={() => recipient && setSendStep('amount')}
                          disabled={!recipient}
                          className="w-full bg-[#332f2f] text-white py-6 rounded-[2rem] font-black text-xl shadow-xl disabled:bg-gray-100 disabled:text-gray-300 transition-all active:scale-95 flex items-center justify-center gap-3"
                        >
                          次へ <ChevronRight size={24} />
                        </button>
                      </div>
                    ) : (
                      <div className="bg-[#332f2f] aspect-square rounded-[3rem] overflow-hidden relative shadow-inner">
                        <Scanner onScan={(res) => { if(res?.[0]?.rawValue) { setRecipient(res[0].rawValue); setSendStep('amount'); } }} />
                        <div className="absolute inset-0 border-4 border-[#eb618e]/30 m-16 rounded-[2rem] pointer-events-none animate-pulse" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-10 animate-in slide-in-from-right duration-500">
                    <div className="bg-[#fcf4f6] p-8 rounded-[2.5rem] text-center border-b-4 border-[#f8d7e3]">
                      <p className="text-[10px] font-black text-[#eb618e]/60 uppercase tracking-[0.3em] mb-2">送り先</p>
                      <p className="text-3xl font-black text-[#eb618e]">@{recipient}</p>
                    </div>
                    <div className="relative text-center">
                      <input 
                        type="number" 
                        placeholder="0" 
                        className="w-full text-7xl font-mono font-black text-center bg-transparent outline-none text-[#332f2f] placeholder:text-gray-100"
                        value={amount || ''}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        autoFocus
                      />
                      <p className="mt-6 text-xs font-black text-gray-400 uppercase tracking-widest">
                        送金可能額: {balance.toLocaleString()} {UNIT}
                      </p>
                    </div>
                    <div className="flex gap-4">
                      <button onClick={() => setSendStep('target')} className="flex-1 bg-gray-50 text-gray-400 py-6 rounded-[2rem] font-black transition-all hover:bg-gray-100">戻る</button>
                      <button 
                        onClick={handleTransfer}
                        disabled={isTransferring || amount <= 0 || amount > balance}
                        className="flex-[2] bg-[#eb618e] text-white py-6 rounded-[2rem] font-black text-xl shadow-xl shadow-[#eb618e]/20 disabled:bg-gray-100 disabled:text-gray-300 transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        {isTransferring ? <RefreshCw className="animate-spin" /> : "送金を確定する"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {view === 'receive' && (
            <div className="max-w-md mx-auto animate-in fade-in duration-500">
              <div className="bg-white rounded-[4rem] p-12 text-center shadow-2xl border-b-[16px] border-[#fcf4f6]">
                <div className="flex justify-end mb-4">
                  <button onClick={() => setView('home')} className="p-3 bg-gray-50 rounded-full text-gray-400"><X size={20}/></button>
                </div>
                <h2 className="text-2xl font-black mb-10 tracking-tighter">受け取る</h2>
                <div className="bg-[#fcf4f6] p-10 rounded-[3rem] inline-block border-2 border-[#f8d7e3] mb-10 shadow-inner">
                  <QRCodeSVG value={username} size={220} fgColor="#332f2f" />
                </div>
                <div className="bg-[#eb618e] py-4 px-8 rounded-2xl inline-block mb-8 shadow-lg shadow-[#eb618e]/20">
                  <span className="text-white font-black text-xl">@{username}</span>
                </div>
                <p className="text-gray-400 text-sm font-bold leading-relaxed">
                  このQRを読み取ってもらうか、<br/>IDを伝えて送金を受け取れます。
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Nav for Mobile */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 bg-[#332f2f]/90 backdrop-blur-xl px-8 py-4 flex justify-between items-center z-50 rounded-[2.5rem] shadow-2xl border border-white/10">
        <button onClick={() => setView('home')} className={`p-3 transition-all ${view === 'home' ? 'text-[#eb618e] scale-110' : 'text-white/40'}`}>
          <LayoutDashboard size={28} />
        </button>
        <button onClick={() => {setView('send'); setSendStep('target');}} className={`p-5 rounded-3xl -mt-14 shadow-2xl transition-all border-4 border-white ${view === 'send' ? 'bg-[#eb618e] text-white rotate-12' : 'bg-[#eb618e] text-white hover:rotate-6'}`}>
          <QrCode size={30} />
        </button>
        <button onClick={() => setView('receive')} className={`p-3 transition-all ${view === 'receive' ? 'text-[#eb618e] scale-110' : 'text-white/40'}`}>
          <Download size={28} />
        </button>
      </nav>
    </div>
  );
}