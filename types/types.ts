// src/types/index.ts
export interface Transaction {
  id: string;
  amount: number;
  sender_username: string;
  receiver_username: string;
  created_at: string;
}

export interface Profile {
  username: string;
  balance: number;
}