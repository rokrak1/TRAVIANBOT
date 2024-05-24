import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.JWT_SERVICE_ROLE || "";
export const supabase = createClient(supabaseUrl, supabaseKey);
