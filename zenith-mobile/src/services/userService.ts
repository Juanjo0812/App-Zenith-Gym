import apiClient from '../shared/api/apiClient';
import { supabase } from '../lib/supabase';
import {
  disableDemoMode,
  getDemoDashboard,
  getDemoProfile,
  getDemoStats,
  isDemoModeEnabled,
  updateDemoProfile,
} from '../lib/demoMode';

export interface UserProfile {
  id: string;
  name: string;
  username: string | null;
  avatar_url: string | null;
  phone: string | null;
  phone_number?: string | null;
  profile_image_url?: string | null;
  address?: string | null;
  email: string;
  level: number;
  total_xp: number;
  roles: string[];
  created_at: string;
  updated_at?: string | null;
}

export interface UserDashboard {
  lastWorkout: {
    name: string;
    date: string;
    duration: string;
  } | null;
  weeklyCount: number;
  todayCalories: {
    consumed: number;
    target: number;
  };
}

export interface UserStats {
  totalWorkouts: number;
  streak: number;
  prs: number;
  memberSince: string;
}

interface ApiUserProfile {
  id: string;
  name: string | null;
  username: string | null;
  email: string | null;
  level: number;
  total_xp: number;
  created_at: string | null;
  updated_at: string | null;
  address: string | null;
  profile_image_url: string | null;
  avatar_url: string | null;
  roles: string[];
  phone_number: string | null;
  phone: string | null;
}

interface ApiUserDashboard {
  last_workout: {
    name: string;
    date: string;
    duration: string;
  } | null;
  weekly_count: number;
  today_calories: {
    consumed: number;
    target: number;
  };
}

interface ApiUserStats {
  total_workouts: number;
  streak: number;
  prs: number;
  member_since: string;
}

type AuthUser = Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user'];
type SignedInUser = NonNullable<AuthUser>;

const XP_PER_LEVEL = 500;

const getAuthUser = async (): Promise<AuthUser | null> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
};

const resolveMetadataValue = (user: SignedInUser, ...keys: string[]): string | null => {
  const metadata = user.user_metadata ?? {};
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
};

const formatMemberSince = (value?: string | null): string => {
  if (!value) {
    return '';
  }

  return new Date(value).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
  });
};

const buildFallbackProfile = (user: SignedInUser): UserProfile => {
  const name = resolveMetadataValue(user, 'full_name', 'name', 'display_name') ?? 'Atleta';
  const username = resolveMetadataValue(user, 'username');
  const phone = resolveMetadataValue(user, 'phone');

  return {
    id: user.id,
    name,
    username,
    avatar_url: null,
    profile_image_url: null,
    phone,
    phone_number: phone,
    address: null,
    email: user.email ?? '',
    level: 1,
    total_xp: 0,
    roles: [],
    created_at: user.created_at ?? new Date().toISOString(),
    updated_at: null,
  };
};

const mapProfile = (profile: ApiUserProfile, user: SignedInUser): UserProfile => {
  const fallback = buildFallbackProfile(user);

  return {
    id: profile.id,
    name: profile.name ?? fallback.name,
    username: resolveMetadataValue(user, 'username') ?? profile.username ?? null,
    avatar_url: profile.avatar_url ?? profile.profile_image_url ?? fallback.avatar_url,
    profile_image_url: profile.profile_image_url ?? profile.avatar_url ?? fallback.profile_image_url,
    phone: profile.phone ?? profile.phone_number ?? resolveMetadataValue(user, 'phone') ?? null,
    phone_number: profile.phone_number ?? profile.phone ?? resolveMetadataValue(user, 'phone') ?? null,
    address: profile.address ?? null,
    email: user.email ?? profile.email ?? '',
    level: profile.level ?? fallback.level,
    total_xp: profile.total_xp ?? fallback.total_xp,
    roles: profile.roles ?? fallback.roles,
    created_at: profile.created_at ?? fallback.created_at,
    updated_at: profile.updated_at ?? null,
  };
};

const normalizeText = (value?: string | null): string | undefined => {
  if (value === undefined) {
    return undefined;
  }

  const trimmed = value?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : undefined;
};

export const getXpForNextLevel = (level: number): number => level * XP_PER_LEVEL;

export const getXpProgress = (totalXp: number, level: number): number => {
  const currentLevelStart = (level - 1) * XP_PER_LEVEL;
  const nextLevelXp = level * XP_PER_LEVEL;
  const progress = totalXp - currentLevelStart;
  const needed = nextLevelXp - currentLevelStart;
  return needed > 0 ? (progress / needed) * 100 : 0;
};

export const userService = {
  getProfile: async (): Promise<UserProfile | null> => {
    if (await isDemoModeEnabled().catch(() => false)) {
      return getDemoProfile();
    }

    const user = await getAuthUser();
    if (!user) {
      return null;
    }

    try {
      const { data } = await apiClient.get<ApiUserProfile>('/users/me');
      return mapProfile(data, user);
    } catch (error) {
      console.error('Error cargando perfil desde la API:', error);
      return buildFallbackProfile(user);
    }
  },

  getDashboard: async (): Promise<UserDashboard> => {
    if (await isDemoModeEnabled().catch(() => false)) {
      return getDemoDashboard();
    }

    const user = await getAuthUser();
    if (!user) {
      return { lastWorkout: null, weeklyCount: 0, todayCalories: { consumed: 0, target: 0 } };
    }

    try {
      const { data } = await apiClient.get<ApiUserDashboard>('/users/me/dashboard');
      return {
        lastWorkout: data.last_workout,
        weeklyCount: data.weekly_count,
        todayCalories: data.today_calories,
      };
    } catch (error) {
      console.error('Error cargando dashboard desde la API:', error);
      return { lastWorkout: null, weeklyCount: 0, todayCalories: { consumed: 0, target: 0 } };
    }
  },

  getStats: async (): Promise<UserStats> => {
    if (await isDemoModeEnabled().catch(() => false)) {
      return getDemoStats();
    }

    const user = await getAuthUser();
    if (!user) {
      return { totalWorkouts: 0, streak: 0, prs: 0, memberSince: '' };
    }

    try {
      const { data } = await apiClient.get<ApiUserStats>('/users/me/stats');
      return {
        totalWorkouts: data.total_workouts,
        streak: data.streak,
        prs: data.prs,
        memberSince: formatMemberSince(data.member_since || user.created_at),
      };
    } catch (error) {
      console.error('Error cargando estadísticas desde la API:', error);
      return {
        totalWorkouts: 0,
        streak: 0,
        prs: 0,
        memberSince: formatMemberSince(user.created_at),
      };
    }
  },

  updateProfile: async (updates: {
    name?: string;
    username?: string;
    phone?: string;
    avatar_url?: string;
    address?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    if (await isDemoModeEnabled().catch(() => false)) {
      await updateDemoProfile(updates);
      return { success: true };
    }

    const user = await getAuthUser();
    if (!user) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    const normalizedName = normalizeText(updates.name);
    const normalizedUsername = normalizeText(updates.username);
    const normalizedPhone = normalizeText(updates.phone);
    const normalizedAvatar = normalizeText(updates.avatar_url);
    const normalizedAddress = normalizeText(updates.address);

    const authMetadata: Record<string, string | null> = {};
    if (updates.name !== undefined) {
      authMetadata.full_name = normalizedName ?? null;
    }
    if (updates.username !== undefined) {
      authMetadata.username = normalizedUsername ?? null;
    }
    if (updates.phone !== undefined) {
      authMetadata.phone = normalizedPhone ?? null;
    }

    try {
      if (Object.keys(authMetadata).length > 0) {
        const { error: authError } = await supabase.auth.updateUser({
          data: authMetadata,
        });

        if (authError) {
          return { success: false, error: authError.message };
        }
      }

      await apiClient.patch<ApiUserProfile>('/users/me', {
        name: normalizedName,
        username: normalizedUsername,
        phone: normalizedPhone,
        avatar_url: normalizedAvatar,
        address: normalizedAddress,
      });

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error?.response?.data?.detail ?? error?.message ?? 'No se pudo actualizar el perfil.',
      };
    }
  },

  uploadAvatar: async (uri: string): Promise<{ url: string | null; error?: string }> => {
    if (await isDemoModeEnabled().catch(() => false)) {
      const demoAvatar = 'https://i.pravatar.cc/150?u=juanjo-zenith';
      await updateDemoProfile({ avatar_url: demoAvatar });
      return { url: demoAvatar };
    }

    const user = await getAuthUser();
    if (!user) {
      return { url: null, error: 'Usuario no autenticado' };
    }

    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();

      const fileExt = uri.split('.').pop()?.split('?')[0] || 'jpg';
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, arrayBuffer, {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (uploadError) {
        return { url: null, error: uploadError.message };
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath);

      const urlWithCache = `${publicUrl}?t=${Date.now()}`;
      const updateResult = await userService.updateProfile({ avatar_url: urlWithCache });
      if (!updateResult.success) {
        return { url: null, error: updateResult.error };
      }

      return { url: urlWithCache };
    } catch (error: any) {
      return { url: null, error: error?.message || 'Error al subir la imagen' };
    }
  },

  signOut: async (): Promise<void> => {
    if (await isDemoModeEnabled().catch(() => false)) {
      await disableDemoMode();
      return;
    }

    await supabase.auth.signOut();
  },
};
