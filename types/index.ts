export interface Transaction {
  id: string;
  amount: number;
  sender_username: string;
  receiver_username: string;
  fee: number;
  description: string;
  created_at: string;
}

export interface Profile {
  username: string;
  balance: number;
}