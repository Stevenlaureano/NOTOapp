import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// Replace these with your actual Supabase project URL and anon key
const supabaseUrl = 'https://uhbywwydgeweysawbvao.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoYnl3d3lkZ2V3ZXlzYXdidmFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5OTY3MTksImV4cCI6MjA5MzU3MjcxOX0.68BttIw-9ijpCw32fk88-WciAtRfgT215iZiOFOxY8c';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
