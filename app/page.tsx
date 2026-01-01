"use client";
import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { QrCode } from "lucide-react";
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
  <div className="min-h-screen bg-gray-50 flex justify-center">
    <div className="w-full max-w-4xl px-4 py-6">{children}</div>
  </div>
);

const Card = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`bg-white rounded-xl border border-gray-200 p-6 shadow-sm ${className}`}>
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
      .or(
        `sender_username.eq.${profile.username},receiver_username.eq.${profile.username}`
      )
      .order("created_at", { ascending: false });

    setTransactions(tx ?? []);
  };

  useEffect(() => {
    if (session) fetchData();
  }, [session]);

  // ===== ID存在チェック =====
  const checkRecipient = async (name: string) => {
    setRecipient(name);
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
    if (!recipient || amount <= 0 || amount > balance || !recipientExists) return;

    const { error } = await supabase.rpc("transfer_pigen", {
      sender_username: username,
      receiver_username: recipient,
      amount,
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
      <header className="mb-6">
        <h1 className="text-xl font-bold">PigPay</h1>
      </header>

      <div className="grid md:grid-cols-2 gap-6">
        {/* 送金 */}
        <Card>
          <h2 className="font-bold mb-4">送金</h2>

          <input
            className="w-full border rounded-lg p-2 mb-2"
            placeholder="相手のID"
            value={recipient}
            onChange={(e) => checkRecipient(e.target.value)}
          />

          {recipient && (
            <p className="text-sm mb-2">
              {checkingRecipient
                ? "ID確認中..."
                : recipientExists
                ? "存在するIDです"
                : "このIDは存在しません"}
            </p>
          )}

          <input
            type="number"
            className="w-full border rounded-lg p-2 mb-4"
            placeholder="金額"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />

          <button
            onClick={sendMoney}
            disabled={amount <= 0 || amount > balance || !recipientExists}
            className="w-full bg-black text-white py-2 rounded-lg disabled:bg-gray-300"
          >
            送金する
          </button>
        </Card>

        {/* 受け取り */}
        <Card>
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <QrCode size={16} />
            受け取り
          </h2>
          <div className="flex justify-center">
            <QRCodeSVG value={username} size={160} />
          </div>
        </Card>
      </div>

      {/* 履歴 */}
      <Card className="mt-6">
        <h2 className="font-bold mb-4">取引履歴</h2>
        <div className="space-y-2">
          {transactions.map((t) => (
            <div key={t.id} className="flex justify-between text-sm border-b pb-1">
              <span>
                {t.sender_username === username
                  ? `→ @${t.receiver_username}`
                  : `← @${t.sender_username}`}
              </span>
              <span>{t.amount} P</span>
            </div>
          ))}
        </div>
      </Card>
    </Container>
  );
}
