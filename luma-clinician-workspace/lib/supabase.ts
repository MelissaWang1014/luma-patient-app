import { createClient } from '@supabase/supabase-js';

// These are public browser-client values. Supabase RLS remains the security boundary.
const url =
  import.meta.env.VITE_SUPABASE_URL?.trim() ||
  'https://fnxaayakmgfjymoogcsf.supabase.co';
const key =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZueGFheWFrbWdmanltb29nY3NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwMTkyMTgsImV4cCI6MjEwMzU5NTIxOH0.rJMqobLS2bZG9JSuZ8M1XndoqiiB85n6KEJ_urgN6m8';

export const isSupabaseConfigured = Boolean(url && key);
export const supabase = isSupabaseConfigured
  ? createClient(url!, key!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export async function getClinicianSession() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!data.session) return null;
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role,full_name')
    .eq('id', data.session.user.id)
    .single();
  if (profileError || !['clinician', 'admin'].includes(profile?.role)) {
    await supabase.auth.signOut();
    return null;
  }
  return { session: data.session, profile };
}

export async function signInClinician(email: string, password: string) {
  if (!supabase)
    throw new Error('Supabase is not configured for this workspace.');
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role,full_name')
    .eq('id', data.user.id)
    .single();
  if (profileError || !['clinician', 'admin'].includes(profile?.role)) {
    await supabase.auth.signOut();
    throw new Error('This account does not have clinician access.');
  }
  return { session: data.session, profile };
}

export async function signOutClinician() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
