// Shared helpers for Edge Functions (Deno runtime).
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/** Admin client: bypasses RLS. Never expose the service role key to apps. */
export function adminClient(): SupabaseClient {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });
}

/** Resolves the calling user from the Authorization header, or null. */
export async function getCaller(req: Request): Promise<{ id: string } | null> {
  const auth = req.headers.get('Authorization');
  if (!auth) return null;
  const client = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false },
  });
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return null;
  return { id: data.user.id };
}

/** Constant-time string comparison for secrets. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export const paymentMode = (): 'sandbox' | 'onepay' =>
  Deno.env.get('PAYMENT_MODE') === 'onepay' ? 'onepay' : 'sandbox';
