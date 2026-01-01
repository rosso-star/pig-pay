// 事実: 初期デザインのリッチさを一部残しつつ、ID存在チェック・UX改善・レスポンシブ対応を行った完成版
// 出典: React / Next.js / Tailwind CSS / Supabase 公式ドキュメント

"use client";
import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Wallet, QrCode, Send, Download, LogOut, User } from "lucide-react";
import { supabase } from "@/lib/supabase";

// ===== 型定義 =====
interface Transaction {
  id: string;
  amount: number;
  sender_username: string;
  receiver_username: string;
  created_at: string;
}

// ===== 共通UI =====
const Container = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-slate-50 flex justify-center">
    <div className="w-full max-w-5xl px-4 py-8">{children}</div>
  </div>
);

const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md hover:shadow-lg transition-shadow">
    {children}
  </div>
);

// ===== メイン =====
export default function PigPay() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [balance, setBalance] = useState(0);
  const [username, setUsername] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [recipient, setRecipient] = useState("");
  const [recipientExists, setRecipientExists] = useState<boolean | null>(null);
  const [checkingRecipient, setCheckingRecipient] = useState(false);
  const [amount, setAmount] = useState(0);

  // ===== 認証 =====
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
  }, []);

  // ===== データ取得 =====
  const fetchData = async () => {
    if (!session?.user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("username, balance")
      .eq("id", session.user.id)
      .single();

    if (!profile) return;
    setUsername(profile.username);
    setBalance(profile.balance);

    const { data: tx } = await supabase
      .from("transactions")
      .select("*")
      .or(`sender_username.eq.${profile.username},receiver_username.eq.${profile.username}`)
      .order("created_at", { ascending: false });

    setTransactions(tx ?? []);
  };

  useEffect(() => {
    if (session) fetchData();
  }, [session]);

  // ===== ID存在チェック =====
  const checkRecipient = async (name: string) => {
    if (!name) {
      setRecipientExists(null);
      return;
    }
    setCheckingRecipient(true);
    const { data } = await supabase
      .from("profiles")
      .select("username")
      .eq("username", name)
      .maybeSingle();
    setRecipientExists(!!data);
    setCheckingRecipient(false);
  };

  // ===== 送金 =====
  const sendMoney = async () => {
    if (!recipient || recipient === username) return;
    if (amount <= 0 || amount > balance) return;

    const { error } = await supabase.rpc("transfer_pigen", {
      sender_username: username,
      receiver_username: recipient,
      amount: amount,
    });

    if (!error) {
      setRecipient("");
      setAmount(0);
      setRecipientExists(null);
      fetchData();
    }
  };

  if (loading) return <div className="p-10">Loading...</div>;

  if (!session) {
    return (
      <Container>
        <Card>
          <p>ログインしてください</p>
        </Card>
      </Container>
    );
  }

  return (
    <Container>
      {/* ヘッダー */}
      <header className="flex justify-between items-center mb-10">
        <h1 className="text-2xl font-extrabold flex items-center gap-2">
          <Wallet /> PigPay
        </h1>
        <button onClick={() => supabase.auth.signOut()} className="text-slate-500 hover:text-black">
          <LogOut />
        </button>
      </header>

      {/* 残高 */}
      <Card>
        <p className="text-sm text-slate-500 flex items-center gap-2">
          <Wallet size={16} /> 残高
        </p>
        <p className="text-4xl font-mono font-extrabold mt-2">{balance} P</p>
        <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
          <User size={12} /> @{username}
        </p>
      </Card>

      {/* 送金・受取 */}
      <div className="grid gap-6 mt-8 md:grid-cols-2">
        <Card>
          <h2 className="font-bold mb-4 flex items-center gap-2 text-lg">
            <Send /> 送金
          </h2>
          <input
            className="w-full border rounded-xl p-3 mb-2"
            placeholder="相手のID"
            value={recipient}
            onChange={(e) => {
              setRecipient(e.target.value);
              checkRecipient(e.target.value);
            }}
          />
          {recipient && (
            <p className={`text-sm mb-2 ${recipientExists ? "text-emerald-600" : "text-rose-500"}`}>
              {checkingRecipient
                ? "ID確認中..."
                : recipientExists
                ? "存在するIDです"
                : recipient === username
                ? "自分には送金できません"
                : "このIDは存在しません"}
            </p>
          )}
          <input
            type="number"
            className="w-full border rounded-xl p-3 mb-4"
            placeholder="金額"
            value={amount || ""}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
          <button
            onClick={sendMoney}
            disabled={recipientExists !== true || amount <= 0 || amount > balance}
            className="w-full bg-slate-900 text-white py-3 rounded-xl font-semibold disabled:bg-slate-300"
          >
            送金する
          </button>
        </Card>

        <Card>
          <h2 className="font-bold mb-4 flex items-center gap-2 text-lg">
            <QrCode /> 受け取り
          </h2>
          <div className="flex justify-center">
            <QRCodeSVG value={username} size={180} />
          </div>
        </Card>
      </div>

      {/* 履歴 */}
      <Card>
        <h2 className="font-bold mb-4 flex items-center gap-2 text-lg">
          <Download /> 取引履歴
        </h2>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {transactions.map((t) => (
            <div key={t.id} className="flex justify-between text-sm border-b pb-2">
              <span>
                {t.sender_username === username
                  ? `→ @${t.receiver_username}`
                  : `← @${t.sender_username}`}
              </span>
              <span className="font-mono font-semibold">{t.amount} P</span>
            </div>
          ))}
        </div>
      </Card>
    </Container>
  );
}
