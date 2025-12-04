# Supabase Expert

> **ID:** `supabase-expert`
> **Tier:** 3
> **Token Cost:** 7000
> **MCP Connections:** supabase

## 🎯 What This Skill Does

You are an expert in Supabase - the open source Firebase alternative. You understand PostgreSQL, Row Level Security, Realtime subscriptions, Edge Functions, Storage, and Auth patterns.

## 📚 When to Use

This skill is automatically loaded when:

- **Keywords:** supabase, rls, realtime, edge function, storage, postgres
- **File Types:** `.sql`, `supabase/`
- **Directories:** `supabase/`, `migrations/`

## 🚀 Core Capabilities

### 1. Project Configuration & Setup

**Initial Setup:**

```typescript
// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  db: {
    schema: 'public',
  },
})

// Server-side client with service role
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)
```

**Type Generation:**

```bash
# Generate TypeScript types from database schema
npx supabase gen types typescript --project-id "$PROJECT_REF" --schema public > lib/supabase/database.types.ts
```

**Environment Variables:**

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Best Practices:**
- Always use TypeScript types generated from your schema
- Separate client-side (anon key) from server-side (service role) clients
- Never expose service role key to the client
- Use environment variables for all secrets
- Enable automatic token refresh for better UX

**Gotchas:**
- Service role bypasses RLS - use with caution
- Anon key is safe to expose in client code
- Database types need regeneration after schema changes
- Browser storage required for session persistence

### 2. Row Level Security (RLS) Policies

**Enable RLS:**

```sql
-- Always enable RLS on tables with sensitive data
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
```

**Authentication-Based Policies:**

```sql
-- Users can only read their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert their own profile (on signup)
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);
```

**Role-Based Policies:**

```sql
-- Admin role with full access
CREATE POLICY "Admins have full access"
  ON posts FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Public posts visible to everyone
CREATE POLICY "Public posts are viewable by everyone"
  ON posts FOR SELECT
  USING (is_public = true);

-- Users can only edit their own posts
CREATE POLICY "Users can edit own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

**Complex Multi-Table Policies:**

```sql
-- Comments visible if post is public OR user is author OR user is post owner
CREATE POLICY "Comments follow post visibility"
  ON comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = comments.post_id
      AND (
        posts.is_public = true
        OR posts.user_id = auth.uid()
        OR comments.user_id = auth.uid()
      )
    )
  );

-- Organization members can view organization data
CREATE POLICY "Org members can view org data"
  ON projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.org_id = projects.org_id
      AND organization_members.user_id = auth.uid()
    )
  );
```

**Performance Optimization:**

```sql
-- Create indexes on RLS columns
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_is_public ON posts(is_public);
CREATE INDEX idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX idx_org_members_org_id ON organization_members(org_id);

-- Use functions for complex logic (computed once)
CREATE OR REPLACE FUNCTION is_org_admin(org_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
    AND role = 'admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE POLICY "Org admins can manage projects"
  ON projects FOR ALL
  USING (is_org_admin(org_id));
```

**Best Practices:**
- Enable RLS on ALL tables by default
- Test policies with different user roles
- Use EXISTS for foreign key checks (more efficient)
- Create indexes on columns used in RLS policies
- Use SECURITY DEFINER functions for complex shared logic
- Separate SELECT, INSERT, UPDATE, DELETE policies for clarity

**Gotchas:**
- Policies are AND-ed together by default (all must pass)
- Service role bypasses ALL RLS policies
- auth.uid() returns NULL for unauthenticated requests
- Missing policies = no access (fail-secure)
- Complex policies can impact query performance

### 3. Real-time Subscriptions

**Database Setup:**

```sql
-- Enable realtime for specific tables
ALTER PUBLICATION supabase_realtime ADD TABLE posts;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;

-- Enable replica identity for updates/deletes
ALTER TABLE posts REPLICA IDENTITY FULL;
ALTER TABLE comments REPLICA IDENTITY FULL;
```

**Client Subscriptions:**

```typescript
// Listen to all changes on a table
const subscription = supabase
  .channel('posts-changes')
  .on(
    'postgres_changes',
    {
      event: '*', // 'INSERT' | 'UPDATE' | 'DELETE'
      schema: 'public',
      table: 'posts',
    },
    (payload) => {
      console.log('Change received!', payload)
      // payload.eventType: 'INSERT' | 'UPDATE' | 'DELETE'
      // payload.new: new row data (INSERT/UPDATE)
      // payload.old: old row data (DELETE/UPDATE)
    }
  )
  .subscribe()

// Cleanup
return () => {
  subscription.unsubscribe()
}
```

**Filtered Subscriptions:**

```typescript
// Listen to specific user's posts
const subscription = supabase
  .channel('user-posts')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'posts',
      filter: `user_id=eq.${userId}`,
    },
    (payload) => {
      console.log('User post changed:', payload)
    }
  )
  .subscribe()

// Listen to multiple filters
const subscription = supabase
  .channel('complex-filter')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'posts',
      filter: 'status=eq.published',
    },
    handlePublished
  )
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'posts',
      filter: 'is_featured=eq.true',
    },
    handleFeatured
  )
  .subscribe()
```

**React Integration:**

```typescript
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

type Post = Database['public']['Tables']['posts']['Row']

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initial fetch
    async function fetchPosts() {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })

      if (data) setPosts(data)
      setLoading(false)
    }

    fetchPosts()

    // Subscribe to changes
    const subscription = supabase
      .channel('posts-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
        },
        (payload) => {
          setPosts((prev) => [payload.new as Post, ...prev])
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'posts',
        },
        (payload) => {
          setPosts((prev) =>
            prev.map((post) =>
              post.id === payload.new.id ? (payload.new as Post) : post
            )
          )
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'posts',
        },
        (payload) => {
          setPosts((prev) => prev.filter((post) => post.id !== payload.old.id))
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return { posts, loading }
}
```

**Presence (Collaborative Features):**

```typescript
// Track online users
const channel = supabase.channel('online-users', {
  config: {
    presence: {
      key: userId,
    },
  },
})

// Join presence
await channel
  .on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState()
    console.log('Online users:', Object.keys(state).length)
  })
  .on('presence', { event: 'join' }, ({ key, newPresences }) => {
    console.log('User joined:', key)
  })
  .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
    console.log('User left:', key)
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({
        user_id: userId,
        online_at: new Date().toISOString(),
      })
    }
  })

// Cleanup
return () => {
  channel.untrack()
  channel.unsubscribe()
}
```

**Best Practices:**
- Always unsubscribe in cleanup functions
- Use REPLICA IDENTITY FULL for complete update/delete data
- Filter subscriptions at database level when possible
- Batch updates to avoid UI thrashing
- Use presence for collaborative features
- Handle connection status changes gracefully

**Gotchas:**
- RLS policies apply to realtime subscriptions
- Payload size limited to 1MB
- Subscription requires table to be added to publication
- Unauthenticated users need RLS policy allowing SELECT
- Channel names must be unique per connection

### 4. Edge Functions

**Create Edge Function:**

```bash
# Initialize Supabase project
supabase init

# Create new edge function
supabase functions new send-email

# Serve locally
supabase functions serve

# Deploy
supabase functions deploy send-email
```

**Function Structure:**

```typescript
// supabase/functions/send-email/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface EmailRequest {
  to: string
  subject: string
  body: string
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request
    const { to, subject, body }: EmailRequest = await req.json()

    // Validate
    if (!to || !subject || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Initialize Supabase client with user's JWT
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Verify user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Send email (example with Resend)
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'noreply@yourapp.com',
        to,
        subject,
        html: body,
      }),
    })

    const data = await res.json()

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}
```

**Invoke from Client:**

```typescript
// Call edge function
const { data, error } = await supabase.functions.invoke('send-email', {
  body: {
    to: 'user@example.com',
    subject: 'Welcome!',
    body: '<h1>Welcome to our app</h1>',
  },
})

if (error) {
  console.error('Error calling function:', error)
} else {
  console.log('Success:', data)
}
```

**Database Triggers:**

```typescript
// supabase/functions/on-user-created/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { record } = await req.json()

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Create user profile
  await supabaseAdmin.from('profiles').insert({
    id: record.id,
    email: record.email,
    created_at: new Date().toISOString(),
  })

  // Send welcome email
  // ... email logic

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

**Configure Webhook:**

```sql
-- Create webhook for auth.users table
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  PERFORM
    net.http_post(
      url := 'https://your-project.supabase.co/functions/v1/on-user-created',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object('record', to_jsonb(NEW))
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

**Best Practices:**
- Use Deno's built-in modules (no node_modules)
- Validate all inputs
- Handle CORS properly
- Use service role key only when necessary
- Keep functions focused (single responsibility)
- Use environment variables for secrets
- Log errors for debugging

**Gotchas:**
- Functions are Deno-based (not Node.js)
- Cold starts can take 1-2 seconds
- 10 second timeout limit
- Request size limited to 2MB
- Use esm.sh for npm packages
- Authorization header must be forwarded manually

### 5. Storage Management

**Setup Buckets:**

```typescript
// Create bucket (one-time setup)
const { data: bucket, error } = await supabase.storage.createBucket('avatars', {
  public: false,
  allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif'],
  fileSizeLimit: 2097152, // 2MB
})

// Make bucket public (if needed)
const { data, error } = await supabase.storage.updateBucket('avatars', {
  public: true,
})
```

**Upload Files:**

```typescript
// Upload file
async function uploadAvatar(file: File, userId: string) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}-${Date.now()}.${fileExt}`
  const filePath = `avatars/${fileName}`

  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) throw error

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from('avatars').getPublicUrl(filePath)

  return publicUrl
}

// Upload with progress
async function uploadWithProgress(file: File, userId: string) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}-${Date.now()}.${fileExt}`
  const filePath = `uploads/${fileName}`

  const { data, error } = await supabase.storage
    .from('files')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      onUploadProgress: (progress) => {
        const percent = (progress.loaded / progress.total) * 100
        console.log(`Upload progress: ${percent.toFixed(2)}%`)
      },
    })

  return data
}
```

**Download Files:**

```typescript
// Download file
async function downloadFile(path: string) {
  const { data, error } = await supabase.storage.from('files').download(path)

  if (error) throw error

  // Create blob URL
  const url = URL.createObjectURL(data)
  return url
}

// Get signed URL (temporary access)
async function getSignedUrl(path: string, expiresIn = 3600) {
  const { data, error } = await supabase.storage
    .from('private-files')
    .createSignedUrl(path, expiresIn)

  if (error) throw error
  return data.signedUrl
}
```

**RLS Policies for Storage:**

```sql
-- Allow users to upload their own avatars
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to update their own avatars
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Public read access
CREATE POLICY "Public can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
```

**Image Transformations:**

```typescript
// Get resized image
const { data } = supabase.storage
  .from('avatars')
  .getPublicUrl('user-123.jpg', {
    transform: {
      width: 200,
      height: 200,
      resize: 'cover',
      quality: 80,
    },
  })

console.log(data.publicUrl) // Auto-resized image URL
```

**React Upload Component:**

```typescript
import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export function AvatarUpload({ userId }: { userId: string }) {
  const [uploading, setUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.')
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/${Date.now()}.${fileExt}`

      // Upload file
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(fileName)

      setAvatarUrl(publicUrl)

      // Update user profile
      await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId)
    } catch (error) {
      alert(error.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      {avatarUrl && (
        <img
          src={avatarUrl}
          alt="Avatar"
          className="h-32 w-32 rounded-full object-cover"
        />
      )}
      <label htmlFor="avatar-upload" className="cursor-pointer">
        <span className="btn">{uploading ? 'Uploading...' : 'Upload'}</span>
        <input
          id="avatar-upload"
          type="file"
          accept="image/*"
          onChange={handleUpload}
          disabled={uploading}
          className="hidden"
        />
      </label>
    </div>
  )
}
```

**Best Practices:**
- Use user ID in file paths for RLS
- Set appropriate MIME types and file size limits
- Use signed URLs for private files
- Implement proper error handling
- Clean up old files to save storage
- Use image transformations for responsive images
- Cache public URLs appropriately

**Gotchas:**
- Default storage limit is 1GB (can be increased)
- File names must be unique (use timestamps/UUIDs)
- RLS applies to storage.objects table
- Public buckets bypass RLS for reads
- Image transformations only work on public buckets
- Storage paths are case-sensitive

### 6. Auth Integration

**Email/Password Auth:**

```typescript
// Sign up
async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${location.origin}/auth/callback`,
      data: {
        // Custom user metadata
        full_name: 'John Doe',
        age: 25,
      },
    },
  })

  return { data, error }
}

// Sign in
async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  return { data, error }
}

// Sign out
async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

// Reset password
async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${location.origin}/auth/reset-password`,
  })

  return { error }
}

// Update password (after reset)
async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  return { error }
}
```

**OAuth Providers:**

```typescript
// Sign in with Google
async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  return { data, error }
}

// Sign in with GitHub
async function signInWithGitHub() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${location.origin}/auth/callback`,
      scopes: 'read:user user:email',
    },
  })

  return { data, error }
}
```

**Auth State Management:**

```typescript
// React hook for auth state
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading }
}
```

**Server-Side Auth (Next.js):**

```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Protect routes
  if (!session && req.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return res
}

export const config = {
  matcher: '/dashboard/:path*',
}
```

**Row Level Security with Auth:**

```sql
-- Automatic profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at)
  VALUES (new.id, new.email, new.created_at);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Profile access policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

**Best Practices:**
- Always validate email confirmation status
- Use onAuthStateChange for real-time auth updates
- Store minimal data in user metadata
- Implement proper error handling
- Use server-side rendering for protected pages
- Set up automatic profile creation
- Use secure password requirements

**Gotchas:**
- Email confirmation required by default
- Session expires after 1 hour (refreshes automatically)
- OAuth requires provider configuration in dashboard
- User metadata limited to 1KB
- Password reset links expire after 1 hour
- Auth state changes trigger component re-renders

## 💡 Real-World Examples

### Example 1: Full-Stack Todo App with RLS

```sql
-- Schema
CREATE TABLE todos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  title text NOT NULL,
  completed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc', now())
);

-- RLS
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own todos"
  ON todos FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE todos;
```

```typescript
// React component
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export function TodoList() {
  const [todos, setTodos] = useState([])
  const [newTodo, setNewTodo] = useState('')

  useEffect(() => {
    // Fetch todos
    async function fetchTodos() {
      const { data } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false })

      setTodos(data || [])
    }

    fetchTodos()

    // Subscribe to changes
    const subscription = supabase
      .channel('todos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'todos' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTodos((prev) => [payload.new, ...prev])
        } else if (payload.eventType === 'UPDATE') {
          setTodos((prev) => prev.map((t) => (t.id === payload.new.id ? payload.new : t)))
        } else if (payload.eventType === 'DELETE') {
          setTodos((prev) => prev.filter((t) => t.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => subscription.unsubscribe()
  }, [])

  async function addTodo() {
    await supabase.from('todos').insert({ title: newTodo })
    setNewTodo('')
  }

  async function toggleTodo(id: string, completed: boolean) {
    await supabase.from('todos').update({ completed: !completed }).eq('id', id)
  }

  async function deleteTodo(id: string) {
    await supabase.from('todos').delete().eq('id', id)
  }

  return (
    <div>
      <input value={newTodo} onChange={(e) => setNewTodo(e.target.value)} />
      <button onClick={addTodo}>Add</button>
      {todos.map((todo) => (
        <div key={todo.id}>
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => toggleTodo(todo.id, todo.completed)}
          />
          <span>{todo.title}</span>
          <button onClick={() => deleteTodo(todo.id)}>Delete</button>
        </div>
      ))}
    </div>
  )
}
```

### Example 2: Multi-Tenant SaaS with Organization RLS

```sql
-- Schema
CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc', now())
);

CREATE TABLE organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organizations ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  role text CHECK (role IN ('owner', 'admin', 'member')),
  created_at timestamp with time zone DEFAULT timezone('utc', now()),
  UNIQUE(org_id, user_id)
);

CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organizations ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc', now())
);

-- Indexes
CREATE INDEX idx_org_members_user ON organization_members(user_id);
CREATE INDEX idx_org_members_org ON organization_members(org_id);
CREATE INDEX idx_projects_org ON projects(org_id);

-- RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Helper function
CREATE OR REPLACE FUNCTION is_org_member(org_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Policies
CREATE POLICY "Members can view their orgs"
  ON organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.org_id = organizations.id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can view org projects"
  ON projects FOR SELECT
  USING (is_org_member(org_id));

CREATE POLICY "Admins can manage projects"
  ON projects FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.org_id = projects.org_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );
```

## 🔗 Related Skills

- `auth-security` - Authentication patterns and security
- `prisma-drizzle-orm` - ORM integration with Supabase
- `sql-database` - Advanced SQL queries and optimization
- `nextjs-14-expert` - Next.js integration with Supabase
- `realtime-multiplayer` - Advanced realtime features

## 📖 Further Reading

- [Supabase Official Docs](https://supabase.com/docs)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Realtime Quickstart](https://supabase.com/docs/guides/realtime/quickstart)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [Storage Guide](https://supabase.com/docs/guides/storage)

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
