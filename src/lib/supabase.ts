import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

import { env } from './env';
import type { Database } from '@/types/database';

/**
 * Single shared Supabase client. Sessions persist in AsyncStorage and refresh
 * automatically while the app is foregrounded (see `AppState` wiring in
 * `AuthProvider`).
 */
export const supabase = createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // React Native has no URL bar, so there is no OAuth redirect to detect.
    detectSessionInUrl: false,
  },
});
