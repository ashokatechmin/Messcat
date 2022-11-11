export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export interface Database {
  public: {
    Tables: {
      MessMenuItems: {
        Row: {
          id: number;
          created_at: string | null;
          last_seen: string | null;
          name: string | null;
          count: number | null;
        };
        Insert: {
          id?: number;
          created_at?: string | null;
          last_seen?: string | null;
          name?: string | null;
          count?: number | null;
        };
        Update: {
          id?: number;
          created_at?: string | null;
          last_seen?: string | null;
          name?: string | null;
          count?: number | null;
        };
      };
    };
    Functions: {};
  };
}

