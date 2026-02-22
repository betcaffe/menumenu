import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gctgqshdjedqqrnnwprp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjdGdxc2hkamVkcXFybm53cHJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3OTAwNjIsImV4cCI6MjA4NzM2NjA2Mn0.OIYXlSn8SN8bPkVuyKobcxfxJ6vUUBC35SDxZb7V4Hk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
