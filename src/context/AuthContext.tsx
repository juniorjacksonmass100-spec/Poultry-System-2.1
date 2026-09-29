import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from '../services/supabase';
import { UserProfile, UserRole } from '../types';

export const ADMIN_EMAIL = 'junior.jacksonmass100@gmail.com';
export const ADMIN_NAME = 'Junior Jackson';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  role: UserRole;
  isAdmin: boolean;
  loading: boolean;
  isConfigured: boolean;
  allProfiles: UserProfile[];
  refreshProfiles: () => Promise<void>;
  signUp: (email: string, password: string, fullName: string, role?: UserRole) => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  enterAsOfflineAdmin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GUEST_STORAGE_KEY = 'kgp_guest_user';
const ALL_PROFILES_CACHE = 'kgp_all_profiles_cache';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRoleState] = useState<UserRole>('user');
  const [loading, setLoading] = useState<boolean>(true);
  const [allProfiles, setAllProfiles] = useState<UserProfile[]>(() => {
    try {
      const cached = localStorage.getItem(ALL_PROFILES_CACHE);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const isConfigured = isSupabaseConfigured();

  const fetchAllProfiles = useCallback(async () => {
    if (!isConfigured) return;
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setAllProfiles(data as UserProfile[]);
        try {
          localStorage.setItem(ALL_PROFILES_CACHE, JSON.stringify(data));
        } catch {
          // ignore
        }
      }
    } catch (err) {
      console.warn('Error fetching system user profiles:', err);
    }
  }, [isConfigured]);

  const loadProfile = useCallback(async (userId: string, email: string) => {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client.from('profiles').select('*').eq('id', userId).single();
      const isJuniorAdmin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

      const nowIso = new Date().toISOString();

      if (!error && data) {
        let effectiveRole: UserRole = isJuniorAdmin ? 'admin' : (data.role || 'user');
        
        // Update user status & last active timestamp in Supabase
        await client.from('profiles').update({
          role: effectiveRole,
          last_sign_in_at: nowIso,
          is_online: true,
          updated_at: nowIso,
        }).eq('id', userId);

        const updatedProfile: UserProfile = {
          ...data,
          role: effectiveRole,
          last_sign_in_at: nowIso,
          is_online: true,
        };

        setProfile(updatedProfile);
        setRoleState(effectiveRole);
      } else {
        // Create/upsert profile if missing
        const newProfile: UserProfile = {
          id: userId,
          email,
          role: isJuniorAdmin ? 'admin' : 'user',
          full_name: isJuniorAdmin ? ADMIN_NAME : (email.split('@')[0] || 'Staff Member'),
          created_at: nowIso,
          updated_at: nowIso,
          last_sign_in_at: nowIso,
          is_online: true,
        };
        try {
          await client.from('profiles').upsert([newProfile]);
        } catch {
          // ignore
        }
        setProfile(newProfile);
        setRoleState(isJuniorAdmin ? 'admin' : 'user');
      }

      await fetchAllProfiles();
    } catch (err) {
      console.warn('Error loading user profile:', err);
    }
  }, [fetchAllProfiles]);

  useEffect(() => {
    // 1. Check if saved session exists in storage
    const savedGuest = localStorage.getItem(GUEST_STORAGE_KEY);
    if (savedGuest) {
      try {
        const guestData = JSON.parse(savedGuest);
        setUser(guestData.user);
        setProfile(guestData.profile);
        const isJuniorAdmin = guestData.user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
        setRoleState(isJuniorAdmin ? 'admin' : (guestData.profile?.role || 'user'));
        setLoading(false);
      } catch {
        localStorage.removeItem(GUEST_STORAGE_KEY);
      }
    }

    // 2. Check Supabase Auth session if configured
    if (isConfigured) {
      const client = getSupabaseClient();
      client.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setSession(session);
          setUser(session.user);
          loadProfile(session.user.id, session.user.email || '');
          localStorage.removeItem(GUEST_STORAGE_KEY);
        }
        setLoading(false);
      }).catch(() => {
        setLoading(false);
      });

      const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user || null);
        if (session?.user) {
          loadProfile(session.user.id, session.user.email || '');
          localStorage.removeItem(GUEST_STORAGE_KEY);
        } else if (!localStorage.getItem(GUEST_STORAGE_KEY)) {
          setProfile(null);
          setRoleState('user');
        }
        setLoading(false);
      });

      fetchAllProfiles();

      return () => {
        subscription.unsubscribe();
      };
    } else {
      if (!savedGuest) {
        setUser(null);
        setProfile(null);
        setRoleState('user');
      }
      setLoading(false);
    }
  }, [isConfigured, loadProfile, fetchAllProfiles]);

  const enterAsOfflineAdmin = () => {
    const nowIso = new Date().toISOString();
    const guestUser = {
      id: 'junior-jackson-admin',
      email: ADMIN_EMAIL,
      user_metadata: { full_name: ADMIN_NAME, role: 'admin' },
    } as unknown as User;
    const guestProfile: UserProfile = {
      id: 'junior-jackson-admin',
      email: ADMIN_EMAIL,
      full_name: ADMIN_NAME,
      role: 'admin',
      created_at: nowIso,
      last_sign_in_at: nowIso,
      is_online: true,
    };
    setUser(guestUser);
    setProfile(guestProfile);
    setRoleState('admin');
    setAllProfiles(prev => [guestProfile, ...prev.filter(p => p.id !== guestProfile.id)]);
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify({ user: guestUser, profile: guestProfile }));
  };

  const signUp = async (email: string, password: string, fullName: string, _initialRole: UserRole = 'user') => {
    const cleanEmail = email.trim().toLowerCase();
    const isJuniorAdmin = cleanEmail === ADMIN_EMAIL.toLowerCase();
    const effectiveRole: UserRole = isJuniorAdmin ? 'admin' : 'user';
    const effectiveName = isJuniorAdmin ? ADMIN_NAME : fullName;
    const nowIso = new Date().toISOString();

    if (!isConfigured) {
      const mockId = isJuniorAdmin ? 'junior-jackson-admin' : 'user-' + Date.now();
      const guestProfile: UserProfile = {
        id: mockId,
        email: cleanEmail,
        full_name: effectiveName,
        role: effectiveRole,
        created_at: nowIso,
        last_sign_in_at: nowIso,
        is_online: true,
      };
      const mockUser = {
        id: mockId,
        email: cleanEmail,
        user_metadata: { full_name: effectiveName, role: effectiveRole },
      } as unknown as User;
      setUser(mockUser);
      setProfile(guestProfile);
      setRoleState(effectiveRole);
      setAllProfiles(prev => [guestProfile, ...prev.filter(p => p.id !== mockId)]);
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify({ user: mockUser, profile: guestProfile }));
      return { success: true };
    }

    try {
      const client = getSupabaseClient();
      const { data, error } = await client.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: effectiveName,
            role: effectiveRole,
          },
        },
      });

      if (error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          if (isJuniorAdmin) {
            enterAsOfflineAdmin();
            return { success: true };
          }
        }
        return { success: false, error: error.message };
      }

      if (data.user) {
        setUser(data.user);
        const newProfile: UserProfile = {
          id: data.user.id,
          email: data.user.email || cleanEmail,
          full_name: effectiveName,
          role: effectiveRole,
          created_at: nowIso,
          updated_at: nowIso,
          last_sign_in_at: nowIso,
          is_online: true,
        };
        try {
          await client.from('profiles').upsert([newProfile]);
        } catch {
          // ignore
        }
        setProfile(newProfile);
        setRoleState(effectiveRole);
        await fetchAllProfiles();
      }

      return { success: true };
    } catch (err: unknown) {
      if (isJuniorAdmin) {
        enterAsOfflineAdmin();
        return { success: true };
      }
      return { success: false, error: err instanceof Error ? err.message : 'Sign up failed' };
    }
  };

  const signIn = async (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const isJuniorAdmin = cleanEmail === ADMIN_EMAIL.toLowerCase();
    const nowIso = new Date().toISOString();

    if (!isConfigured) {
      if (isJuniorAdmin) {
        enterAsOfflineAdmin();
        return { success: true };
      } else {
        const guestUser = {
          id: 'staff-' + Date.now(),
          email: cleanEmail,
          user_metadata: { full_name: cleanEmail.split('@')[0], role: 'user' },
        } as unknown as User;
        const guestProfile: UserProfile = {
          id: guestUser.id,
          email: cleanEmail,
          full_name: cleanEmail.split('@')[0],
          role: 'user',
          created_at: nowIso,
          last_sign_in_at: nowIso,
          is_online: true,
        };
        setUser(guestUser);
        setProfile(guestProfile);
        setRoleState('user');
        setAllProfiles(prev => [guestProfile, ...prev.filter(p => p.id !== guestProfile.id)]);
        localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify({ user: guestUser, profile: guestProfile }));
        return { success: true };
      }
    }

    try {
      const client = getSupabaseClient();
      const { data, error } = await client.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        // If network issue or uninitialized Supabase URL triggers "Failed to fetch"
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          if (isJuniorAdmin) {
            enterAsOfflineAdmin();
            return {
              success: true,
              error: 'Database reached a network timeout. You are signed in locally as CEO Admin so you can view the SQL schema and configure Supabase.'
            };
          }
          return {
            success: false,
            error: 'Failed to fetch: Cannot connect to Supabase. Check your Project URL and network, or open SQL Setup below.'
          };
        }

        // If credentials invalid because this account hasn't been created yet in Supabase Auth,
        // automatically create/sign up the account with the provided password!
        if (isJuniorAdmin) {
          const signUpRes = await client.auth.signUp({
            email: ADMIN_EMAIL,
            password: password,
            options: {
              data: {
                full_name: ADMIN_NAME,
                role: 'admin',
              },
            },
          });

          if (!signUpRes.error && signUpRes.data.user) {
            setUser(signUpRes.data.user);
            await loadProfile(signUpRes.data.user.id, ADMIN_EMAIL);
            localStorage.removeItem(GUEST_STORAGE_KEY);
            return { success: true };
          }
        }

        return { success: false, error: error.message };
      }

      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        await loadProfile(data.session.user.id, data.session.user.email || '');
        localStorage.removeItem(GUEST_STORAGE_KEY);
      }

      return { success: true };
    } catch (err: unknown) {
      if (isJuniorAdmin) {
        enterAsOfflineAdmin();
        return { success: true };
      }
      return { success: false, error: err instanceof Error ? err.message : 'Sign in failed' };
    }
  };

  const signOut = async () => {
    if (isConfigured && user) {
      try {
        const client = getSupabaseClient();
        await client.from('profiles').update({
          is_online: false,
          updated_at: new Date().toISOString(),
        }).eq('id', user.id);
        await client.auth.signOut();
      } catch (err) {
        console.warn('Sign out error:', err);
      }
    }
    localStorage.removeItem(GUEST_STORAGE_KEY);
    setUser(null);
    setProfile(null);
    setSession(null);
    setRoleState('user');
  };

  const resetPassword = async (email: string) => {
    if (!isConfigured) {
      return { success: true };
    }
    try {
      const client = getSupabaseClient();
      const { error } = await client.auth.resetPasswordForEmail(email);
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Password reset failed' };
    }
  };

  const isAdmin = role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        role,
        isAdmin,
        loading,
        isConfigured,
        allProfiles,
        refreshProfiles: fetchAllProfiles,
        signUp,
        signIn,
        signOut,
        resetPassword,
        enterAsOfflineAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
