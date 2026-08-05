import type { User } from '@supabase/supabase-js';

export type AuthenticatedUser = {
  id: string;
  email: string | null;
  role: string | null;
  aud: string | null;
  appMetadata: User['app_metadata'];
  userMetadata: User['user_metadata'];
  accessToken?: string;
};
