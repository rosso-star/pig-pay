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
const PigPayLogo = ({ className = "" }: { className?: string }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-xl shadow-lg">
      <Wallet className="text-white" size={24} />
    </div>
    <span className="text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
      PigPay.
    </span>
  </div>
);

export default function PigPay() {
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inputUsername, setInputUsername] = useState('');

  const [view, setView] = useState<'home' | 'send' | 'receive'>('home');
  const [sendMethod, setSendMethod] = useState<'qr' | 'id'>('id');
  const [balance, setBalance] = useState<number>(0);
  const [username, setUsername] = useState<string>("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  const [recipient, setRecipient] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);
  const [isTransferring, setIsTransferring] = useState(false);

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
      if (error) alert(error.message);
      else { alert("Success! Please log in."); setIsSignUp(false); }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
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
      alert(`Sent ${amount}P to ${recipient}!`);
      setRecipient(""); setAmount(0); setView('home');
      fetchData();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsTransferring(false);
    }
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><RefreshCw className="animate-spin text-indigo-500" /></div>;

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-[2rem] p-8 shadow-2xl border border-slate-100">
          <PigPayLogo className="mb-8 justify-center" />
          <h2 className="text-2xl font-bold mb-6 text-center text-slate-800">{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
              <div className="relative">
                <User className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <input type="text" placeholder="Username" className="w-full p-3 pl-12 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 ring-indigo-500 outline-none" value={inputUsername} onChange={(e) => setInputUsername(e.target.value)} required />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input type="email" placeholder="Email" className="w-full p-3 pl-12 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 ring-indigo-500 outline-none" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input type="password" placeholder="Password" className="w-full p-3 pl-12 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 ring-indigo-500 outline-none" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg">
              {loading ? "Loading..." : (isSignUp ? "Sign Up" : "Log In")}
            </button>
          </form>
          <button onClick={() => setIsSignUp(!isSignUp)} className="w-full mt-6 text-sm text-slate-500 font-medium">
            {isSignUp ? "Already have an account? Log in" : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col md:flex-row">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 p-6">
        <PigPayLogo className="mb-10" />
        <nav className="flex-1 space-y-2">
          {[
            { id: 'home', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'send', label: 'Send Money', icon: Send },
            { id: 'receive', label: 'Receive', icon: Download },
          ].map((item: any) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === item.id ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <item.icon size={20} /> {item.label}
            </button>
          ))}
        </nav>
        <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-500 transition-all">
          <LogOut size={20} /> Sign Out
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto pb-24 md:pb-0">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200">
          <PigPayLogo />
          <button onClick={() => supabase.auth.signOut()} className="p-2 text-slate-400"><LogOut size={20} /></button>
        </header>

        <div className="p-4 md:p-8 max-w-4xl mx-auto w-full">
          {view === 'home' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
              {/* Wallet Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-slate-900 to-indigo-900 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden">
                  <div className="relative z-10">
                    <p className="text-indigo-200/70 text-sm font-medium mb-1">Available Balance</p>
                    <div className="text-4xl font-mono font-bold tracking-tight mb-8">
                      {balance.toLocaleString()} <span className="text-lg text-indigo-300 font-sans">P</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="bg-white/10 px-3 py-1 rounded-lg backdrop-blur-md text-sm border border-white/10">
                        @{username}
                      </div>
                      <button onClick={fetchData} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                      </button>
                    </div>
                  </div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setView('send')} className="flex flex-col items-center justify-center gap-3 bg-white border border-slate-200 rounded-[2rem] hover:border-indigo-500 transition-all group">
                    <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <ArrowUpRight size={24} />
                    </div>
                    <span className="font-bold text-slate-700">Send</span>
                  </button>
                  <button onClick={() => setView('receive')} className="flex flex-col items-center justify-center gap-3 bg-white border border-slate-200 rounded-[2rem] hover:border-emerald-500 transition-all group">
                    <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                      <ArrowDownLeft size={24} />
                    </div>
                    <span className="font-bold text-slate-700">Receive</span>
                  </button>
                </div>
              </div>

              {/* Transactions */}
              <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <History size={20} className="text-slate-400" /> Recent Transactions
                  </h2>
                </div>
                <div className="space-y-4">
                  {transactions.length > 0 ? transactions.map((tx) => {
                    const isOut = tx.sender_username === username;
                    return (
                      <div key={tx.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-2xl transition-all">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${isOut ? 'bg-slate-100 text-slate-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            {isOut ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-slate-800">{isOut ? `@${tx.receiver_username}` : `@${tx.sender_username}`}</p>
                            <p className="text-xs text-slate-400">{new Date(tx.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <span className={`font-mono font-bold ${isOut ? 'text-slate-600' : 'text-emerald-600'}`}>
                          {isOut ? '-' : '+'}{tx.amount} P
                        </span>
                      </div>
                    );
                  }) : (
                    <p className="text-center py-10 text-slate-400 font-medium">No history yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {view === 'send' && (
            <div className="max-w-md mx-auto animate-in zoom-in-95 duration-300">
              <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-200">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold">Send Money</h2>
                  <button onClick={() => {setView('home'); setRecipient("")}} className="p-2 bg-slate-100 rounded-full"><X size={18}/></button>
                </div>

                <div className="flex p-1 bg-slate-100 rounded-xl mb-8">
                  <button onClick={() => setSendMethod('id')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${sendMethod === 'id' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>ID Input</button>
                  <button onClick={() => setSendMethod('qr')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${sendMethod === 'qr' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>QR Scan</button>
                </div>

                {sendMethod === 'id' ? (
                  <div className="space-y-6">
                    <div className="relative">
                      <Search className="absolute left-4 top-4 text-slate-400" size={20} />
                      <input 
                        type="text" 
                        placeholder="Recipient Username" 
                        className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 ring-indigo-500 font-bold"
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="bg-black aspect-square rounded-[2rem] overflow-hidden mb-6 relative">
                    <Scanner onScan={(res) => { if(res?.[0]?.rawValue) { setRecipient(res[0].rawValue); setSendMethod('id'); } }} />
                    <div className="absolute inset-0 border-2 border-indigo-500/50 m-12 rounded-3xl pointer-events-none animate-pulse" />
                  </div>
                )}

                {recipient && (
                  <div className="mt-8 space-y-6 animate-in slide-in-from-top-4">
                    <div className="text-center">
                      <p className="text-xs font-bold text-slate-400 uppercase mb-2">Sending to</p>
                      <p className="text-xl font-black text-indigo-600">@{recipient}</p>
                    </div>
                    <div className="relative">
                      <input 
                        type="number" 
                        placeholder="0" 
                        className="w-full text-5xl font-mono font-bold text-center bg-transparent outline-none text-slate-800"
                        value={amount || ''}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        autoFocus
                      />
                      <p className="text-center text-sm font-medium text-slate-400 mt-2">Balance: {balance}P</p>
                    </div>
                    <button 
                      onClick={handleTransfer}
                      disabled={isTransferring || amount <= 0 || amount > balance}
                      className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-bold shadow-lg shadow-indigo-100 disabled:bg-slate-200 transition-all flex items-center justify-center gap-2"
                    >
                      {isTransferring ? <RefreshCw className="animate-spin" size={20}/> : "Confirm Transfer"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {view === 'receive' && (
            <div className="max-w-md mx-auto animate-in fade-in duration-300">
              <div className="bg-white rounded-[2.5rem] p-10 text-center shadow-xl border border-slate-200">
                <div className="flex justify-end mb-4">
                  <button onClick={() => setView('home')} className="p-2 bg-slate-100 rounded-full"><X size={18}/></button>
                </div>
                <h2 className="text-xl font-bold mb-8">Your QR Code</h2>
                <div className="bg-slate-50 p-8 rounded-[2rem] inline-block border border-slate-100 mb-6">
                  <QRCodeSVG value={username} size={200} />
                </div>
                <div className="bg-indigo-50 py-3 px-6 rounded-xl inline-block mb-4">
                  <span className="text-indigo-600 font-bold">@{username}</span>
                </div>
                <p className="text-slate-400 text-sm font-medium px-4">Share this code with others to receive PigPoints instantly.</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Nav for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center z-50">
        <button onClick={() => setView('home')} className={`p-3 rounded-2xl transition-all ${view === 'home' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}>
          <LayoutDashboard size={24} />
        </button>
        <button onClick={() => {setView('send'); setRecipient("")}} className={`p-4 rounded-full -mt-10 shadow-xl transition-all ${view === 'send' ? 'bg-indigo-600 text-white scale-110' : 'bg-slate-900 text-white'}`}>
          <QrCode size={24} />
        </button>
        <button onClick={() => setView('receive')} className={`p-3 rounded-2xl transition-all ${view === 'receive' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}>
          <Download size={24} />
        </button>
      </nav>
    </div>
  );
}