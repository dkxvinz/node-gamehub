
export interface User {
 
  user_id?: number;
  username: string;
  email: string;
  password?: string;
  profile_image?: string | null;
  wallet_balance?: number;
  role?: '1' | '0' | number; 
}