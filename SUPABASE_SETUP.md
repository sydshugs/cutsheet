# Supabase Setup for Cutsheet

This guide will help you set up Supabase for public shareable links.

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Choose your organization
5. Fill in:
   - Project name: `cutsheet` (or your preferred name)
   - Database password: (generate a strong password and save it)
   - Region: (choose closest to your users)
6. Click "Create new project"

## 2. Create the Database Table

1. In your Supabase project dashboard, click "SQL Editor" in the left sidebar
2. Click "New Query"
3. Paste the following SQL:

```sql
-- Create analyses table
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  file_name TEXT NOT NULL,
  scores JSONB NOT NULL,
  markdown TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on slug for faster lookups
CREATE INDEX analyses_slug_idx ON analyses(slug);

-- Enable Row Level Security (RLS)
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read (for public share links)
CREATE POLICY "Allow public read access"
  ON analyses
  FOR SELECT
  USING (true);

-- Allow anyone to insert (for creating share links)
-- Note: In production, you may want to add rate limiting or authentication
CREATE POLICY "Allow public insert"
  ON analyses
  FOR INSERT
  WITH CHECK (true);
```

4. Click "Run" to execute the SQL

## 3. Get Your API Keys

1. In your Supabase project dashboard, click "Project Settings" (gear icon) in the left sidebar
2. Click "API" in the settings menu
3. You'll see two important values:
   - **Project URL**: Copy this (looks like `https://xxxxx.supabase.co`)
   - **anon public key**: Copy this (a long JWT token)

## 4. Configure Environment Variables

1. In your Cutsheet project, copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Supabase credentials:
   ```
   VITE_SUPABASE_URL="https://xxxxx.supabase.co"
   VITE_SUPABASE_ANON_KEY="your-anon-key-here"
   ```

3. Make sure `.env` is in your `.gitignore` (it should be by default)

## 5. Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Upload and analyze a video
3. Click "Share Link" in the navigation
4. You should see "Link copied to clipboard" toast
5. Open the link in a new tab - you should see the public share page

## Security Notes

### Current Setup (Development/Demo)
- **Public read access**: Anyone with a link can view an analysis
- **Public insert access**: Anyone can create share links
- **Client-side rate limiting**: 10 shares per hour per browser (localStorage)
- This is fine for demo/personal use with low traffic

### Rate Limiting

#### Client-Side (Current Implementation)
The app currently uses localStorage to track share limits:
- **Limit**: 10 shares per hour per browser
- **Tracking**: Browser localStorage (can be cleared by user)
- **Reset**: Automatic after 1 hour
- **Implementation**: See `src/utils/rateLimiter.ts`

**Pros:**
- No backend required
- Immediate feedback
- No API calls for rate limit checks

**Cons:**
- Can be bypassed by clearing localStorage or using different browsers
- Not IP-based
- No cross-device tracking

#### Server-Side (Production Recommendation)

For production, implement IP-based rate limiting using Supabase Edge Functions:

1. **Update schema to track IP addresses**:
   ```sql
   -- Run supabase/analyses_table_with_ip.sql
   ALTER TABLE analyses ADD COLUMN created_by_ip TEXT;
   CREATE INDEX analyses_ip_created_idx ON analyses(created_by_ip, created_at);
   ```

2. **Create a Supabase Edge Function** (`functions/create-share/index.ts`):
   ```typescript
   import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
   import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

   serve(async (req) => {
     const clientIP = req.headers.get("x-forwarded-for") || 
                      req.headers.get("x-real-ip") || 
                      "unknown";

     const supabase = createClient(
       Deno.env.get('SUPABASE_URL') ?? '',
       Deno.env.get('SUPABASE_ANON_KEY') ?? ''
     );

     // Check rate limit
     const { count } = await supabase
       .from('analyses')
       .select('*', { count: 'exact', head: true })
       .eq('created_by_ip', clientIP)
       .gt('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

     if (count && count >= 10) {
       return new Response(
         JSON.stringify({ error: 'Rate limit exceeded' }),
         { status: 429, headers: { "Content-Type": "application/json" } }
       );
     }

     // Create share with IP tracking
     const { slug, file_name, scores, markdown } = await req.json();
     const { data, error } = await supabase
       .from('analyses')
       .insert({ slug, file_name, scores, markdown, created_by_ip: clientIP })
       .select()
       .single();

     if (error) {
       return new Response(
         JSON.stringify({ error: error.message }),
         { status: 400, headers: { "Content-Type": "application/json" } }
       );
     }

     return new Response(
       JSON.stringify({ slug: data.slug }),
       { status: 200, headers: { "Content-Type": "application/json" } }
     );
   });
   ```

3. **Deploy the Edge Function**:
   ```bash
   supabase functions deploy create-share
   ```

4. **Update client code** to call the Edge Function instead of direct insert.

### Production Recommendations

1. **✅ Rate Limiting**: Implemented client-side, upgrade to Edge Function for production
2. **Authentication**: Require users to be authenticated to create shares
3. **Expiration**: Add a `expires_at` column and automatically delete old shares
4. **Usage Limits**: Track shares per user and enforce limits
5. **IP Allowlisting**: Block known VPNs/proxies if abuse occurs

Example production policy with authentication:

```sql
-- Replace the public insert policy with:
DROP POLICY "Allow public insert" ON analyses;

CREATE POLICY "Authenticated users can insert"
  ON analyses
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
```

## Database Schema

```typescript
interface Analysis {
  id: string;              // UUID, auto-generated
  slug: string;            // 8-char alphanumeric, unique
  file_name: string;       // Original video filename
  scores: {                // JSONB
    hook: number;
    clarity: number;
    cta: number;
    production: number;
    overall: number;
  };
  markdown: string;        // Full analysis text
  created_at: string;      // ISO timestamp
}
```

## Troubleshooting

### "Supabase not configured" error
- Check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in `.env`
- Restart your dev server after updating `.env`
- Make sure the env variable names start with `VITE_`

### "Failed to create share link" error
- Check the browser console for detailed error messages
- Verify your Supabase project is active (not paused)
- Check that the `analyses` table exists
- Verify RLS policies are set correctly

### Share links not loading
- Check the slug in the URL is correct (8 characters)
- Verify the RLS read policy allows public access
- Check browser console for errors

## Optional Enhancements

### Add expiration dates
```sql
ALTER TABLE analyses ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;

-- Create a function to auto-delete expired shares
CREATE OR REPLACE FUNCTION delete_expired_analyses()
RETURNS void AS $$
BEGIN
  DELETE FROM analyses WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Schedule it to run daily (requires pg_cron extension)
SELECT cron.schedule('delete-expired-analyses', '0 0 * * *', 'SELECT delete_expired_analyses()');
```

### Add view counter
```sql
ALTER TABLE analyses ADD COLUMN views INTEGER DEFAULT 0;

CREATE POLICY "Allow view count updates"
  ON analyses
  FOR UPDATE
  USING (true)
  WITH CHECK (true);
```

Then update the view count in your SharePage component when loading.
