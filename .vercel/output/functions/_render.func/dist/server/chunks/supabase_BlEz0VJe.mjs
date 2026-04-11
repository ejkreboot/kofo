import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://jxewfukwdmakubggytsw.supabase.co";
const supabaseAnonKey = "sb_publishable_pn-gsroQMKIwmOh58VACVw_AqXfAInw";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export { supabase as s };
