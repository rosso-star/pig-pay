// types.ts
export interface Transaction {
  id: string;
  amount: number;
  sender_username: string;
  receiver_username: string;
  description: string;
  created_at: string;
}

export interface Profile {
  username: string;
  balance: number;
}

export interface MarketItem {
  id: string;
  title: string;
  price: number;
  stock: number;
  description: string;
  image_url: string;
  seller_username: string;
  created_at: string;
}