// scripts/test-auth.js
// Usage: node scripts/test-auth.js
// This script will attempt to sign up a random test user and then sign in.

import("dotenv")
  .then(({ default: dotenv }) => {
    // Prefer .env.local which Next.js uses, fallback to .env
    dotenv.config({ path: ".env.local" });
    dotenv.config();
    return Promise.resolve();
  })
  .then(run)
  .catch(console.error);

import { createClient } from "@supabase/supabase-js";

async function run() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in env",
    );
    process.exit(1);
  }

  const supabase = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const id = Math.random().toString(36).slice(2, 8);
  const email = `test+${id}@example.com`;
  const password = "password123";

  console.log("Signing up", email);
  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
    email,
    password,
  });
  if (signUpErr) console.error("signUp error:", signUpErr.message);
  else console.log("signUp data:", signUpData);

  console.log("Attempting signInWithPassword");
  const { data: signInData, error: signInErr } =
    await supabase.auth.signInWithPassword({ email, password });
  if (signInErr) console.error("signIn error:", signInErr.message);
  else console.log("signIn success:", signInData.user?.id);

  if (signInErr && service) {
    console.log("Attempting admin createUser using service key");
    const admin = createClient(url, service, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: adminData, error: adminErr } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { test: true },
      });
    if (adminErr) console.error("admin createUser error:", adminErr.message);
    else console.log("admin createUser succeeded:", adminData.id);

    console.log("Re-attempting signInWithPassword");
    const { data: signIn2, error: signIn2Err } =
      await supabase.auth.signInWithPassword({ email, password });
    if (signIn2Err)
      console.error("post-admin signIn error:", signIn2Err.message);
    else console.log("post-admin signIn success:", signIn2.user?.id);
  }

  console.log("Done");
}
