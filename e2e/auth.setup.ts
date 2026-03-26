import { test as setup } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const authFile = 'e2e/.auth/user.json';

setup('authenticate', async ({ page }) => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;

  if (!supabaseUrl || !serviceRoleKey || !email || !password) {
    throw new Error(
      'Missing required env vars: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, E2E_EMAIL, E2E_PASSWORD'
    );
  }

  // Sign in via Supabase JS client directly — bypasses bot detection on the login form
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    throw new Error(`Supabase auth failed: ${error?.message ?? 'No session returned'}`);
  }

  // Navigate to app and inject session into localStorage
  await page.goto('/');

  const storageKey = `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`;

  await page.evaluate(
    ({ key, session }) => {
      localStorage.setItem(key, JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        expires_in: session.expires_in,
        token_type: session.token_type,
        user: session.user,
      }));
    },
    { key: storageKey, session: data.session }
  );

  // Ensure the test account has onboarding_completed = true so ProtectedRoute
  // never redirects to /welcome during tests. Uses the admin client (service role)
  // to bypass RLS — the user's anon client can't reliably write this on first run.
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: data.session.user.id,
    onboarding_completed: true,
    niche: 'E-commerce',
    platform: 'Meta',
  });
  if (profileError) {
    console.warn('⚠️  Could not upsert test profile:', profileError.message);
  } else {
    console.log('✅ Test profile onboarding_completed = true');
  }

  // Navigate to app and verify session is recognized
  await page.goto('/app');
  await page.waitForURL(/\/app/, { timeout: 15000 });

  // Save storage state for all tests to reuse
  await page.context().storageState({ path: authFile });

  console.log('✅ Auth setup complete — session saved to', authFile);
});
