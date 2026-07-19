import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://qweoaxazrdqhtrkahkkt.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3ZW9heGF6cmRxaHRya2Foa2t0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0NDAzMzgsImV4cCI6MjEwMDAxNjMzOH0.0_L-WFBv-8Rib7lzpxJDdXQocXBAz9zmmRPpdvniKbM";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export type ItemStock = {
  id: string;
  name: string;
  category: string;
  stock_remaining: number;
};
