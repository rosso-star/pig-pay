import React from 'react';
import { Tag, ShoppingBag, Plus } from 'lucide-react';

export const MarketPage = ({ items, onPurchase, onOpenModal, currentUsername, unit }: any) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-black tracking-tighter italic text-[#eb618e]">Pig Market</h1>
          <p className="text-gray-400 text-sm">ピゲン（豚円）で買えるフリマ</p>
        </div>
        <button onClick={onOpenModal} className="bg-[#332f2f] text-white p-4 rounded-2xl flex items-center gap-2 hover:scale-105 transition-all shadow-lg">
          <Plus size={20} /> 出品する
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item: any) => (
          <div key={item.id} className="bg-white rounded-[2.5rem] overflow-hidden border-2 border-[#fcf4f6] hover:border-[#eb618e] transition-all flex flex-col group">
            <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
              {item.image_url && <img src={item.image_url} className="w-full h-full object-cover" alt="" />}
              {item.is_official && (
                <div className="absolute top-4 left-4 bg-[#eb618e] text-white text-[10px] px-3 py-1 rounded-full font-black flex items-center gap-1">
                  <Tag size={10} /> OFFICIAL
                </div>
              )}
              <div className="absolute bottom-4 right-4 bg-white/90 px-4 py-1 rounded-xl font-mono font-black text-[#eb618e]">
                {item.price.toLocaleString()} <span className="text-[10px]">{unit}</span>
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <h3 className="font-black text-lg mb-1">{item.title}</h3>
              <p className="text-gray-400 text-xs line-clamp-2 mb-4 flex-1">{item.description}</p>
              <div className="flex items-center justify-between mt-auto">
                <span className="text-[10px] text-gray-300">@{item.seller_id}</span>
                <button 
                  onClick={() => onPurchase(item)}
                  disabled={currentUsername === item.seller_id}
                  className="bg-[#fcf4f6] text-[#eb618e] px-4 py-2 rounded-xl text-sm font-black hover:bg-[#eb618e] hover:text-white transition-all disabled:opacity-20"
                >
                  購入
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};