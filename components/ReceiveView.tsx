"use client";
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X } from 'lucide-react';

type ReceiveViewProps = {
  username: string;
  onClose: () => void;
};

export const ReceiveView = ({ username, onClose }: ReceiveViewProps) => (
  <div className="max-w-md mx-auto animate-in fade-in duration-500">
    <div className="bg-white rounded-[4rem] p-12 text-center shadow-2xl border-b-[16px] border-[#fcf4f6]">
      <div className="flex justify-end mb-4">
        <button
          onClick={onClose}
          className="p-3 bg-gray-50 rounded-full text-gray-400"
        >
          <X size={20} />
        </button>
      </div>

      <h2 className="text-2xl font-black mb-10 tracking-tighter">
        受け取る
      </h2>

      <div className="bg-[#fcf4f6] p-10 rounded-[3rem] inline-block border-2 border-[#f8d7e3] mb-10 shadow-inner">
        <QRCodeSVG value={username} size={220} fgColor="#332f2f" />
      </div>

      <div className="bg-[#eb618e] py-4 px-8 rounded-2xl inline-block mb-8 shadow-lg shadow-[#eb618e]/20">
        <span className="text-white font-black text-xl">
          @{username}
        </span>
      </div>

      <p className="text-gray-400 text-sm font-bold">
        このQRを読み取ってもらうか、IDを伝えて送金を受け取れます。
      </p>
    </div>
  </div>
);
