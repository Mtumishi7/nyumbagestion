import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zhlulojdeypvvprhyulo.supabase.co';
const supabaseAnonKey = 'sb_publishable_6Qt0wX8xWmrFC149YpKQnw_YYdlzIHG';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
