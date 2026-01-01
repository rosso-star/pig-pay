"use client";
import React, { useEffect, useState } from 'react';
import { ShoppingBag, Plus, X, Camera, Loader2, MessageCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export const MarketView = ({ balance, username, onRefresh }: any) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSellForm, setShowSellForm] = useState(false);
  const [buyingId, setBuyingId] = useState<string | null>(null);

  // 出品フォーム用の状態
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState(""); // 入力時は文字列で管理
  const [stock, setStock] = useState("1");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    setLoading(true);
    const { data } = await supabase.from('market_posts').select('*').order('created_at', { ascending: false });
    if (data) setItems(data);
    setLoading(false);
  };

  const resizeImage = (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const scale = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => resolve(blob!), 'image/webp', 0.8);
        };
      };
    });
  };

  const handleSell = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // 1. ユーザー情報の取得（UUIDが必要）
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("ログインし直してください");

      let image_url = "";

      // 2. 画像のアップロード
      if (imageFile) {
        const resizedBlob = await resizeImage(imageFile);
        const fileName = `${user.id}/${Date.now()}.webp`;
        const { error: storageError } = await supabase.storage
          .from('market-images')
          .upload(fileName, resizedBlob);
        
        if (storageError) throw storageError;
        const { data: urlData } = supabase.storage.from('market-images').getPublicUrl(fileName);
        image_url = urlData.publicUrl;
      }

      // 3. DBへの挿入（ここが400エラーの主原因）
      const { error: dbError } = await supabase.from('market_posts').insert([{
        seller_id: user.id, // 文字列ではなくauth.usersのUUID
        seller_username: username,
        title: title,
        price: parseInt(price), // 確実に数値に変換
        stock: parseInt(stock), // 確実に数値に変換
        description: description,
        image_url: image_url,
        is_official: false
      }]);

      if (dbError) throw dbError;
      
      // 成功
      setShowSellForm(false);
      setTitle(""); setPrice(""); setStock("1"); setDescription(""); setImageFile(null);
      fetchItems();
      alert("出品しました！");

    } catch (err: any) {
      console.error("【出品エラー詳細】:", err);
      alert(`出品に失敗しました: ${err.message || "入力内容を確認してください"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async (item: any) => {
    if (balance < item.price) return alert("ピゲンが足りません！");
    if (!confirm(`${item.title} を ${item.price}ピゲンで購入しますか？`)) return;

    setBuyingId(item.id);
    try {
      const { error } = await supabase.rpc('buy_item', { 
        post_id: item.id, 
        buyer_username: username 
      });
      
      if (error) throw error;

      const audio = new Audio('/sounds/success.mp3');
      audio.play().catch(() => {});
      onRefresh();
      fetchItems();
      alert("購入が完了しました！");
    } catch (err: any) {
      alert(err.message || "購入に失敗しました");
    } finally {
      setBuyingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-700">
      <div className="flex items-center justify-between mb-8 px-2">
        <div className="flex items-center gap-3">
          <div className="bg-[#fcf4f6] p-3 rounded-2xl">
            <ShoppingBag className="text-[#eb618e]" size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-[#332f2f] tracking-tight">Pig Market</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">お買い物と出品</p>
          </div>
        </div>
        <button 
          onClick={() => setShowSellForm(true)}
          className="bg-[#eb618e] text-white flex items-center gap-2 px-5 py-3 rounded-2xl font-black shadow-lg shadow-[#eb618e]/20 active:scale-95 transition-all text-sm"
        >
          <Plus size={18} /> 出品する
        </button>
      </div>

      {loading && items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-[#eb618e]" size={40} />
          <p className="text-xs font-bold text-gray-300">商品を並べています...</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-[2.5rem] p-4 shadow-sm border-2 border-transparent hover:border-[#f8d7e3] transition-all flex flex-col border-b-8 border-[#fcf4f6]">
              <div className="aspect-square bg-[#fcf4f6] rounded-[2rem] mb-3 overflow-hidden border border-[#f8d7e3]/30">
                {item.image_url ? (
                  <img src={item.image_url} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl opacity-40">🐷</div>
                )}
              </div>
              
              <div className="px-1">
                <div className="flex items-center gap-1 mb-1">
                  {item.is_official && <span className="text-[8px] bg-[#eb618e] text-white px-1.5 py-0.5 rounded-md font-black">OFFICIAL</span>}
                  <h3 className="font-black text-sm truncate text-[#332f2f]">{item.title}</h3>
                </div>
                <p className="text-[10px] text-gray-400 mb-4 line-clamp-1 font-bold">@{item.seller_username}</p>
                
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-gray-300 uppercase leading-none">Price</span>
                    <span className="font-mono font-black text-[#eb618e] text-lg leading-none">{item.price.toLocaleString()}<span className="text-[10px] ml-0.5 font-sans">P</span></span>
                  </div>
                  <button 
                    onClick={() => handleBuy(item)}
                    disabled={buyingId === item.id || item.stock <= 0}
                    className="bg-[#332f2f] text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg disabled:bg-gray-100 disabled:text-gray-300 transition-all active:scale-90"
                  >
                    {item.stock <= 0 ? <span className="text-[8px]">売切</span> : buyingId === item.id ? <Loader2 size={16} className="animate-spin" /> : <ShoppingBag size={18} />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 出品フォームモーダル */}
      {showSellForm && (
        <div className="fixed inset-0 z-[100] bg-[#332f2f]/60 backdrop-blur-md flex items-end md:items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={handleSell} className="bg-white w-full max-w-md rounded-[3rem] p-8 space-y-5 animate-in slide-in-from-bottom duration-300 my-auto shadow-2xl">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h3 className="text-2xl font-black text-[#332f2f]">お店をひらく</h3>
                <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">アイテムを出品しましょう</p>
              </div>
              <button type="button" onClick={() => setShowSellForm(false)} className="p-3 bg-gray-50 rounded-full text-gray-400"><X size={20}/></button>
            </div>

            <div className="space-y-4">
              <input required placeholder="商品名" className="w-full p-5 bg-gray-50 rounded-2xl outline-none font-bold border-2 border-transparent focus:border-[#f8d7e3] focus:bg-white transition-all" value={title} onChange={e => setTitle(e.target.value)} />
              
              <div className="flex gap-4">
                <div className="flex-1 space-y-1">
                  <span className="text-[10px] font-black text-gray-300 ml-2 uppercase">価格 (P)</span>
                  <input required type="number" placeholder="100" className="w-full p-5 bg-gray-50 rounded-2xl outline-none font-black text-xl text-[#eb618e] border-2 border-transparent focus:border-[#f8d7e3] focus:bg-white transition-all" value={price} onChange={e => setPrice(e.target.value)} />
                </div>
                <div className="flex-1 space-y-1">
                  <span className="text-[10px] font-black text-gray-300 ml-2 uppercase">在庫数</span>
                  <input required type="number" placeholder="1" className="w-full p-5 bg-gray-50 rounded-2xl outline-none font-black text-xl border-2 border-transparent focus:border-[#f8d7e3] focus:bg-white transition-all" value={stock} onChange={e => setStock(e.target.value)} />
                </div>
              </div>

              <textarea placeholder="商品の説明や、受け渡し方法など" className="w-full p-5 bg-gray-50 rounded-2xl outline-none font-bold h-28 border-2 border-transparent focus:border-[#f8d7e3] focus:bg-white transition-all resize-none" value={description} onChange={e => setDescription(e.target.value)} />
              
              <label className="flex items-center justify-center gap-3 p-8 bg-[#fcf4f6] rounded-[2rem] cursor-pointer text-[#eb618e] font-black border-4 border-dashed border-[#f8d7e3] hover:bg-[#f8d7e3]/20 transition-all">
                <Camera size={28} />
                <div className="text-left">
                  <p className="text-sm">{imageFile ? "画像を選択しました" : "写真をアップロード"}</p>
                  <p className="text-[10px] text-[#eb618e]/60 font-bold">タップして選択</p>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={e => setImageFile(e.target.files?.[0] || null)} />
              </label>
            </div>

            <button className="w-full bg-[#eb618e] text-white py-6 rounded-[2rem] font-black text-xl shadow-xl shadow-[#eb618e]/20 disabled:bg-gray-100 disabled:text-gray-300 transition-all active:scale-95 flex items-center justify-center gap-3" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : "この内容で出品する"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};