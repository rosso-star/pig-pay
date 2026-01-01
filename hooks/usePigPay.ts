import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Transaction } from '@/types';
import { Session } from '@supabase/supabase-js';

export function usePigPay(session: Session | null) {
  const [balance, setBalance] = useState<number>(0);
  const [username, setUsername] = useState<string>("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) fetchData();
  }, [session]);

  const transfer = async (recipient: string, amount: number, message: string = '送金') => {
    const { error } = await supabase.rpc('transfer_pigen', {
      sender_username: username,
      receiver_username: recipient,
      amount_val: amount,
      description_val: message
    });
    if (error) throw error;
  };

  return { balance, username, transactions, loading, fetchData, transfer };
}