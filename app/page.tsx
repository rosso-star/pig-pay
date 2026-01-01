"use client";
import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  LayoutDashboard, Send, Download, ShoppingBag, 
  BadgeCheck, // ← ここを修正しました
  Tag, Package, ArrowRight, X, RefreshCw,
  LogOut, User, Mail, Lock, ArrowUpRight, ArrowDownLeft, History, ChevronRight, Search, QrCode
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
// Scannerを使用する場合は npm install @yudiel/react-qr-scanner が必要です
// import { Scanner } from '@yudiel/react-qr-scanner'; 

// --- Types ---
interface MarketItem {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  stock: number;
  image_url: string;
  is_official: boolean;
}

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

// --- Cloudinary Helper ---
const getOptimizedImage = (url: string) => {
  if (!url || !url.includes('cloudinary.com')) return url || "https://via.placeholder.com/400?text=No+Image";
  return url.replace('/upload/', '/upload/c_fill,g_auto,w_600,h_600,f_auto,q_auto/');
};

export default function PigPayApp() {
  const [session, setSession] = useState<any>(null);
  const [view, setView] = useState<'home' | 'market' | 'send' | 'receive'>('home');
  const [loading, setLoading] = useState(false);
  
  // ユーザー情報
  const [balance, setBalance] = useState<number>(0);
  const [username, setUsername] = useState<string>("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // マーケット情報
  const [items, setItems] = useState<MarketItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null);

  // 送金用
  const [sendStep, setSendStep] = useState<'target' | 'amount'>('target');
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState(0);

  const UNIT = "ピゲン（豚円）";

  // データ取得
  const fetchData = async () => {
    if (!session?.user) return;
    setLoading(true);
    try {
      // プロフィール & 残高
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
      if (profile) {
        setBalance(profile.balance);
        setUsername(profile.username);
      }
      // 履歴
      const { data: txData } = await supabase.from('transactions').select('*')
        .or(`sender_username.eq.${profile?.username},receiver_username.eq.${profile?.username}`)
        .order('created_at', { ascending: false }).limit(5);
      if (txData) setTransactions(txData);
      
      // マーケット商品
      const { data: marketData } = await supabase.from('market_items').select('*').order('created_at', { ascending: false });
      if (marketData) setItems(marketData);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => { if (session) fetchData(); }, [session]);

  if (!session) return <div className="p-20 text-center font-bold">ログインが必要です（Auth画面は前回のコードを参照してください）</div>;

  return (
    <div className="min-h-screen bg-white text-[#332f2f] flex flex-col md:flex-row font-bold">
      
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-72 bg-[#fcf4f6] border-r border-[#f8d7e3] p-8">
        <PigPayLogo className="mb-12 justify-start" />
        <nav className="flex-1 space-y-3">
          {[
            { id: 'home', label: 'ホーム', icon: LayoutDashboard },
            { id: 'market', label: '豚円マーケット', icon: ShoppingBag },
            { id: 'send', label: '送る', icon: Send },
            { id: 'receive', label: '受け取る', icon: Download },
          ].map((item: any) => (
            <button
              key={item.id}
              onClick={() => {setView(item.id); setSendStep('target');}}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${view === item.id ? 'bg-[#eb618e] text-white shadow-lg' : 'text-[#eb618e]/60 hover:bg-[#f8d7e3]'}`}
            >
              <item.icon size={22} /> {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24 md:pb-0 p-6 md:p-12">
        
        {/* View: Home */}
        {view === 'home' && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-[#332f2f] rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
              <p className="text-[#eb618e] text-xs font-black tracking-widest mb-2 uppercase">現在の残高</p>
              <div className="text-5xl font-mono font-black mb-8">
                {balance.toLocaleString()} <span className="text-xl font-sans text-white/40">{UNIT}</span>
              </div>
              <div className="bg-white/10 px-5 py-2 rounded-2xl inline-block text-sm font-black">@{username}</div>
            </div>

            <div className="bg-white rounded-[3rem] p-8 border-2 border-[#fcf4f6]">
              <h2 className="text-xs font-black text-gray-300 uppercase tracking-widest mb-6 flex items-center gap-2">
                <History size={16} /> 最近の履歴
              </h2>
              <div className="space-y-4">
                {transactions.map(tx => (
                  <div key={tx.id} className="flex justify-between items-center p-4 hover:bg-[#fcf4f6] rounded-2xl transition-all">
                    <span className="text-sm">@{tx.sender_username === username ? tx.receiver_username : tx.sender_username}</span>
                    <span className={tx.sender_username === username ? "text-gray-400" : "text-[#eb618e]"}>
                      {tx.sender_username === username ? "-" : "+"}{tx.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* View: Market */}
        {view === 'market' && (
          <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
            <header className="mb-10">
              <h1 className="text-4xl font-black tracking-tighter mb-2">豚円マーケット</h1>
              <p className="text-gray-400">公式とユーザーの逸品が集まる場所</p>
            </header>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-8">
              {items.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => setSelectedItem(item)}
                  className="group bg-white rounded-[2.5rem] overflow-hidden border-2 border-[#fcf4f6] hover:border-[#eb618e] transition-all cursor-pointer shadow-sm hover:shadow-xl"
                >
                  <div className="aspect-square bg-gray-100 relative overflow-hidden">
                    <img src={getOptimizedImage(item.image_url)} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                    {item.is_official && (
                      <div className="absolute top-4 left-4 bg-[#eb618e] text-white text-[10px] px-3 py-1 rounded-full flex items-center gap-1">
                        <BadgeCheck size={12} /> OFFICIAL
                      </div>
                    )}
                    {item.stock === 1 && <div className="absolute top-4 right-4 bg-black/50 backdrop-blur text-white text-[10px] px-3 py-1 rounded-full">一点物</div>}
                  </div>
                  <div className="p-6">
                    <h3 className="font-black text-lg truncate">{item.title}</h3>
                    <p className="text-[#eb618e] font-mono font-black text-xl mt-2">{item.price.toLocaleString()} <span className="text-xs font-sans">豚円</span></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal: Item Detail */}
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#332f2f]/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row">
              <div className="flex-1 h-64 md:h-auto">
                <img src={getOptimizedImage(selectedItem.image_url)} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 p-8 flex flex-col">
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-2xl font-black leading-tight">{selectedItem.title}</h2>
                    <button onClick={() => setSelectedItem(null)} className="p-2 bg-gray-100 rounded-full"><X size={20}/></button>
                  </div>
                  <p className="text-gray-500 text-sm mb-6">{selectedItem.description}</p>
                </div>
                <button className="w-full bg-[#eb618e] text-white py-5 rounded-2xl font-black text-lg shadow-lg shadow-[#eb618e]/20 active:scale-95 transition-all">
                  {selectedItem.price.toLocaleString()} 豚円で購入
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 bg-[#332f2f]/90 backdrop-blur-xl px-8 py-4 flex justify-between items-center z-50 rounded-[2.5rem] border border-white/10 shadow-2xl">
        <button onClick={() => setView('home')} className={`p-2 ${view === 'home' ? 'text-[#eb618e]' : 'text-white/40'}`}><LayoutDashboard size={28} /></button>
        <button onClick={() => setView('market')} className={`p-2 ${view === 'market' ? 'text-[#eb618e]' : 'text-white/40'}`}><ShoppingBag size={28} /></button>
        <button onClick={() => setView('send')} className="w-14 h-14 bg-[#eb618e] rounded-2xl flex items-center justify-center text-white -mt-12 shadow-xl border-4 border-white"><QrCode size={28} /></button>
        <button onClick={() => setView('receive')} className={`p-2 ${view === 'receive' ? 'text-[#eb618e]' : 'text-white/40'}`}><Download size={28} /></button>
      </nav>
    </div>
  );
}