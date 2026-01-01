"use client";
import React, { useEffect, useState } from 'react';
import { ShoppingBag, Plus, X, Camera, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { MarketItem } from '@/types';

interface MarketViewProps {
  balance: number;
  username: string;
  onRefresh: () => void;
}

export const MarketView = ({ balance, username, onRefresh }: MarketViewProps) => {
  const [items, setItems] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSellForm, setShowSellForm] = useState(false);
  const [buyingId, setBuyingId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("1");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    setLoading(true);
    const { data } = await supabase.from('market_posts').select('*').order('created_at', { ascending: false });
    if (data) setItems(data as MarketItem[]);
    setLoading(false);
  };

  const handleBuy = async (item: MarketItem) => {
    if (balance < item.price) {
      alert("残高が足りません");
      return;
    }
    setBuyingId(item.id);
    try {
      const { error } = await supabase.rpc('buy_market_item', {
        item_id: item.id,
        buyer_username: username
      });
      if (error) throw error;
      alert("購入しました！");
      onRefresh();
      fetchItems();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "購入に失敗しました";
      alert(msg);
    } finally {
      setBuyingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black tracking-tighter flex items-center gap-3">
          <ShoppingBag className="text-[#eb618e]" size={32} />
          マーケット
        </h2>
        <button 
          onClick={() => setShowSellForm(true)}
          className="bg-[#eb618e] text-white p-4 rounded-2xl shadow-lg hover:rotate-90 transition-all"
        >
          <Plus size={24} />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-20"><Loader2 className="animate-spin text-[#eb618e]" size={40} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-[#f8d7e3]">
              <div className="aspect-square bg-gray-100 relative">
                {item.image_url && <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />}
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-black text-xl">{item.title}</h3>
                  <span className="bg-[#fcf4f6] text-[#eb618e] px-3 py-1 rounded-full text-sm font-black">{item.price} 豚円</span>
                </div>
                <p className="text-gray-400 text-sm mb-6 line-clamp-2">{item.description}</p>
                <button 
                  disabled={buyingId === item.id || item.stock <= 0}
                  onClick={() => handleBuy(item)}
                  className="w-full bg-[#332f2f] text-white py-4 rounded-2xl font-black disabled:bg-gray-200 transition-all"
                >
                  {buyingId === item.id ? "処理中..." : item.stock <= 0 ? "売り切れ" : "購入する"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};