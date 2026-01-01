import React, { useState } from 'react';
import { X, Image as ImageIcon } from 'lucide-react';

export const PostItemModal = ({ isOpen, onClose, onPost, isOfficialUser, uploading, onUpload }: any) => {
  const [item, setItem] = useState({ title: '', description: '', price: 0, stock: 1, image_url: '', is_official: false });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#332f2f]/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-[3rem] p-8 shadow-2xl space-y-5 animate-in zoom-in-95">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-black">アイテムを出品</h2>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full"><X size={20}/></button>
        </div>

        {/* Image Upload Area */}
        <div className="relative aspect-video bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden">
          {item.image_url ? (
            <img src={item.image_url} className="w-full h-full object-cover" alt="preview" />
          ) : (
            <>
              <input type="file" onChange={(e) => onUpload(e, (url: string) => setItem({...item, image_url: url}))} className="absolute inset-0 opacity-0 cursor-pointer" />
              <ImageIcon className="text-gray-300 mb-1" />
              <span className="text-xs text-gray-400">{uploading ? "アップロード中..." : "写真をタップ"}</span>
            </>
          )}
        </div>

        <input type="text" placeholder="商品名" className="w-full p-4 bg-gray-50 rounded-2xl outline-none" 
          onChange={e => setItem({...item, title: e.target.value})} />
        
        <div className="grid grid-cols-2 gap-4">
          <input type="number" placeholder="価格" className="p-4 bg-gray-50 rounded-2xl outline-none" 
            onChange={e => setItem({...item, price: Number(e.target.value)})} />
          <input type="number" placeholder="在庫数" className="p-4 bg-gray-50 rounded-2xl outline-none" 
            onChange={e => setItem({...item, stock: Number(e.target.value)})} />
        </div>

        {isOfficialUser && (
          <label className="flex items-center gap-3 p-4 bg-[#fcf4f6] rounded-2xl cursor-pointer">
            <input type="checkbox" onChange={e => setItem({...item, is_official: e.target.checked})} className="accent-[#eb618e] w-5 h-5" />
            <span className="text-sm font-black text-[#eb618e]">公式タグを付ける</span>
          </label>
        )}

        <button 
          onClick={() => onPost(item)}
          disabled={!item.title || item.price <= 0 || uploading}
          className="w-full bg-[#eb618e] text-white py-5 rounded-2xl font-black text-xl shadow-lg active:scale-95 disabled:bg-gray-200"
        >
          出品を確定する
        </button>
      </div>
    </div>
  );
};