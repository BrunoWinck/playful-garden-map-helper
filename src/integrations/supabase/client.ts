// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://uumgewfrulrhiqnfeoas.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1bWdld2ZydWxyaGlxbmZlb2FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwMjk5MDksImV4cCI6MjA1NzYwNTkwOX0.sUqVzOAEsm8mgbmlP90ef5zMFHwA7k8aJ5bPh7hAoEU";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);