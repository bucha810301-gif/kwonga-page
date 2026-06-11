import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://lkbceygubbxoldqvuezf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrYmNleWd1YmJ4b2xkcXZ1ZXpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMDk5NzMsImV4cCI6MjA5NjY4NTk3M30.ugjNX5gPqtFR15D0tezehnJUr1sUAIjFSx6RUzxyCx8'
);
