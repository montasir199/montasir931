
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from './types';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://eshnggnbrzbmhlcfqfyg.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzaG5nZ25icnpibWhsY2ZxZnlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyNDMzMDIsImV4cCI6MjA2NDgxOTMwMn0._hOrUlMiCoPTOhxrILzCLNMTWwrRB0d8esOz-1FOdGY';

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
