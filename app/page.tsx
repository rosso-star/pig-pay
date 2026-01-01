"use client";
import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Wallet, QrCode, RefreshCw, X, LogOut, User, Mail, Lock, 
  ArrowUpRight, ArrowDownLeft, History, ChevronRight, Search, 
  LayoutDashboard, Send, Download, ShoppingBag, Plus, Tag, Package, Image as ImageIcon
} from 'lucide-react';
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

interface MarketItem {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  stock: number;
  image_url: string;
  is_official: boolean;
  created_at: string;
}

// --- Constants ---
const UNIT = "ピゲン";
const OFFICIAL_ACCOUNT = "PigPay公式"; // 手数料受取用

const PigPayLogo = ({ size = "md", className = "" }: { size?: "md" | "lg", className?: string }) => {
  const dimensions = size === "lg" ? "h-24 md:h-32" : "h-12 md:h-16";
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <img src="/logo.png" alt="PigPay" className={`${dimensions} w-auto object-contain transition-transform hover:scale-105 duration-300`} />
    </div>
  );
};

export default function PigPay() {
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [view, setView] = useState<'home' | 'send' | 'receive' | 'market'>('home');
  
  // Profile state
  const [balance, setBalance] = useState<number>(0);
  const [username, setUsername] = useState<string>("");
  const [isOfficialUser, setIsOfficialUser] = useState(false); // 管理者判定

  // Market state
  const [marketItems, setMarketItems] = useState<MarketItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // New Item State
  const [newItem, setNewItem] = useState({ title: '', description: '', price: 0, stock: 1, image_url: '', is_official: false });

  // Auth/Fetch Logic (略: 既存のものを維持しつつ、fetchMarketItemsを追加)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });
  }, []);

  const fetchData = async () => {
    if (!session?.user) return;
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
    if (profile) {
      setBalance(profile.balance);
      setUsername(profile.username);
      setIsOfficialUser(profile.username === OFFICIAL_ACCOUNT);
    }
    fetchMarketItems();
  };

  const fetchMarketItems = async () => {
    const { data } = await supabase.from('market_items').select('*').gt('stock', 0).order('created_at', { ascending: false });
    if (data) setMarketItems(data);
  };

  useEffect(() => { if (session) fetchData(); }, [session]);

  // --- Cloudinary Upload ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'your_preset_name'); // Cloudinaryの設定に合わせて変更

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/your_cloud_name/image/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setNewItem({ ...newItem, image_url: data.secure_url });
    } catch (err) {
      alert("アップロード失敗");
    } finally {
      setUploading(false);
    }
  };

  // --- Purchase Logic ---
  const handlePurchase = async (item: MarketItem) => {
    if (balance < item.price) return alert("残高が足りません");
    if (!confirm(`${item.title} を ${item.price}${UNIT} で購入しますか？`)) return;

    try {
      const { error } = await supabase.rpc('purchase_item', {
        p_item_id: item.id,
        p_buyer_username: username,
        p_official_username: OFFICIAL_ACCOUNT
      });
      if (error) throw error;
      alert("購入完了しました！");
      fetchData();
    } catch (err: any) {
      alert("購入エラー: " + err.message);
    }
  };

  // --- Post Item ---
  const handlePostItem = async () => {
    const { error } = await supabase.from('market_items').insert([{
      ...newItem,
      seller_id: username,
      is_official: isOfficialUser && newItem.is_official // 公式ユーザーのみ公式タグを付けられる
    }]);
    if (error) alert(error.message);
    else {
      setIsModalOpen(false);
      fetchMarketItems();
    }
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><RefreshCw className="animate-spin text-[#eb618e]" /></div>;
  if (!session) return <AuthComponent />; // 既存のAuthComponentを想定

  return (
    <div className="min-h-screen bg-white text-[#332f2f] flex flex-col md:flex-row font-bold">
      {/* Sidebar - Added Market link */}
      <aside className="hidden md:flex flex-col w-72 bg-[#fcf4f6] border-r border-[#f8d7e3] p-8">
        <PigPayLogo className="mb-12 justify-start" />
        <nav className="flex-1 space-y-3 font-black">
          <NavBtn id="home" label="ホーム" icon={LayoutDashboard} active={view} set={setView} />
          <NavBtn id="market" label="マーケット" icon={ShoppingBag} active={view} set={setView} />
          <NavBtn id="send" label="送る" icon={Send} active={view} set={setView} />
          <NavBtn id="receive" label="受け取る" icon={Download} active={view} set={setView} />
        </nav>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-y-auto pb-24 md:pb-0">
        <div className="p-6 md:p-12 max-w-6xl mx-auto w-full">
          {view === 'market' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h1 className="text-4xl font-black tracking-tighter italic text-[#eb618e]">Pig Market</h1>
                  <p className="text-gray-400 text-sm">ピゲンで買えるフリマ掲示板</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="bg-[#332f2f] text-white p-4 rounded-2xl flex items-center gap-2 hover:bg-black transition-all shadow-lg">
                  <Plus size={20} /> 出品する
                </button>
              </div>

              {/* Market Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {marketItems.map(item => (
                  <div key={item.id} className="bg-white rounded-[2.5rem] overflow-hidden border-2 border-[#fcf4f6] hover:border-[#eb618e] transition-all group flex flex-col">
                    <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={48}/></div>
                      )}
                      {item.is_official && (
                        <div className="absolute top-4 left-4 bg-[#eb618e] text-white text-[10px] px-3 py-1 rounded-full font-black flex items-center gap-1 shadow-lg">
                          <Tag size={10} /> OFFICIAL
                        </div>
                      )}
                      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-4 py-1 rounded-xl font-mono font-black text-[#eb618e]">
                        {item.price.toLocaleString()} {UNIT}
                      </div>
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-black text-lg line-clamp-1">{item.title}</h3>
                        <span className="text-[10px] bg-gray-100 px-2 py-1 rounded text-gray-500">残:{item.stock}</span>
                      </div>
                      <p className="text-gray-400 text-xs line-clamp-2 mb-4 flex-1">{item.description}</p>
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                        <span className="text-[10px] text-gray-300">出品者: @{item.seller_id}</span>
                        <button 
                          onClick={() => handlePurchase(item)}
                          disabled={username === item.seller_id}
                          className="bg-[#fcf4f6] text-[#eb618e] px-4 py-2 rounded-xl text-sm hover:bg-[#eb618e] hover:text-white transition-all disabled:opacity-30"
                        >
                          購入する
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 他のView (home, send, receive) は既存コードを維持 */}
          {view === 'home' && ( /* ...既存のHome UI... */ null)}
        </div>
      </main>

      {/* 出品モーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#332f2f]/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[3rem] p-8 shadow-2xl space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black">アイテムを出品</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-gray-100 rounded-full"><X size={20}/></button>
            </div>

            <div className="space-y-4">
              <div className="relative group aspect-video bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden">
                {newItem.image_url ? (
                  <img src={newItem.image_url} className="w-full h-full object-cover" />
                ) : (
                  <>
                    <input type="file" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                    <ImageIcon className="text-gray-300 mb-2" />
                    <span className="text-xs text-gray-400">{uploading ? "アップロード中..." : "写真をタップして追加"}</span>
                  </>
                )}
              </div>

              <input type="text" placeholder="商品名" className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 ring-[#eb618e]" 
                onChange={e => setNewItem({...newItem, title: e.target.value})} />
              
              <textarea placeholder="商品の説明" className="w-full p-4 bg-gray-50 rounded-2xl outline-none h-24" 
                onChange={e => setNewItem({...newItem, description: e.target.value})} />

              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <span className="absolute right-4 top-4 text-xs text-gray-400">{UNIT}</span>
                  <input type="number" placeholder="価格" className="w-full p-4 bg-gray-50 rounded-2xl outline-none" 
                    onChange={e => setNewItem({...newItem, price: Number(e.target.value)})} />
                </div>
                <div className="relative">
                  <span className="absolute right-4 top-4 text-xs text-gray-400">個</span>
                  <input type="number" placeholder="在庫" className="w-full p-4 bg-gray-50 rounded-2xl outline-none" 
                    onChange={e => setNewItem({...newItem, stock: Number(e.target.value)})} />
                </div>
              </div>

              {isOfficialUser && (
                <label className="flex items-center gap-3 p-4 bg-[#fcf4f6] rounded-2xl cursor-pointer">
                  <input type="checkbox" checked={newItem.is_official} onChange={e => setNewItem({...newItem, is_official: e.target.checked})} className="accent-[#eb618e] w-5 h-5" />
                  <span className="text-sm font-black text-[#eb618e]">公式アイテムとして出品する</span>
                </label>
              )}

              <button 
                onClick={handlePostItem}
                disabled={!newItem.title || newItem.price <= 0 || uploading}
                className="w-full bg-[#eb618e] text-white py-5 rounded-2xl font-black text-xl shadow-lg disabled:bg-gray-200"
              >
                マーケットに並べる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Nav - Updated */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 bg-[#332f2f]/90 backdrop-blur-xl px-6 py-4 flex justify-between items-center z-50 rounded-[2.5rem] shadow-2xl border border-white/10">
        <MobileNavBtn id="home" icon={LayoutDashboard} active={view} set={setView} />
        <MobileNavBtn id="market" icon={ShoppingBag} active={view} set={setView} />
        <button onClick={() => {setView('send');}} className="p-5 rounded-3xl -mt-14 shadow-2xl bg-[#eb618e] text-white border-4 border-white"><QrCode size={30} /></button>
        <MobileNavBtn id="receive" icon={Download} active={view} set={setView} />
      </nav>
    </div>
  );
}

// --- Helper Components ---
const NavBtn = ({ id, label, icon: Icon, active, set }: any) => (
  <button onClick={() => set(id)} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${active === id ? 'bg-[#eb618e] text-white shadow-md' : 'text-[#eb618e]/60 hover:bg-[#f8d7e3]'}`}>
    <Icon size={22} /> {label}
  </button>
);

const MobileNavBtn = ({ id, icon: Icon, active, set }: any) => (
  <button onClick={() => set(id)} className={`p-3 transition-all ${active === id ? 'text-[#eb618e] scale-110' : 'text-white/40'}`}>
    <Icon size={28} />
  </button>
);

const AuthComponent = () => (
  <div className="flex h-screen items-center justify-center bg-[#fcf4f6]">
    <div className="text-center p-10 bg-white rounded-[3rem] shadow-xl">
      <PigPayLogo size="lg" className="mb-6" />
      <p className="font-black text-gray-400 italic">Please login to access PigPay</p>
    </div>
  </div>
);