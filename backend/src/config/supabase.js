import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('❌ SUPABASE_URL and SUPABASE_KEY must be set in .env file');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

console.log('✅ Supabase client initialized');
