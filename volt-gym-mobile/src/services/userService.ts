import { supabase } from '../lib/supabase';
import { decode } from 'base64-arraybuffer';

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar_url: string | null;
  level: number;
  total_xp: number;
  phone?: string;
  address?: string;
}

export interface UserDashboard {
  weeklyCount: number;
  todayCalories: {
    consumed: number;
    target: number;
  };
  lastWorkout: {
    name: string;
    date: string;
  } | null;
}

export interface UserStats {
  totalSessions: number;
  totalReps: number;
  topWeight: number;
  activeStreak: number;
}

export const userService = {
  async getProfile(): Promise<UserProfile> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No session');

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error || !data) {
      // Fallback or create profile if not exists (though trigger handles it)
      return {
        id: user.id,
        name: user.user_metadata?.full_name || 'Desconocido',
        username: user.user_metadata?.username || user.email?.split('@')[0] || 'usuario',
        email: user.email || '',
        avatar_url: null,
        level: 1,
        total_xp: 0,
      };
    }

    return {
      ...data,
      email: user.email,
    };
  },

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No session');

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getDashboard(): Promise<UserDashboard> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No session');

    // In a real app, these would be complex aggregation queries
    // For MVP, we mock the dashboard counts based on existing sessions
    const { count: weeklyCount } = await supabase
      .from('workout_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('completed_at', 'not.null');

    const { data: lastSession } = await supabase
      .from('workout_sessions')
      .select('completed_at')
      .eq('user_id', user.id)
      .is('completed_at', 'not.null')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    return {
      weeklyCount: weeklyCount || 0,
      todayCalories: {
        consumed: 1850, // Mocked for now
        target: 2400,
      },
      lastWorkout: lastSession ? {
        name: 'Entrenamiento',
        date: new Date(lastSession.completed_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
      } : null,
    };
  },

  async getStats(): Promise<UserStats> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No session');

    // Aggregate stats from exercise_logs etc.
    // Mocked for MVP UI consistency
    return {
      totalSessions: 12,
      totalReps: 1450,
      topWeight: 85,
      activeStreak: 4,
    };
  },

  async uploadAvatar(uri: string): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No session');

    const fileName = `${user.id}/${Date.now()}.jpg`;
    
    // Resolve URI and convert to base64
    const response = await fetch(uri);
    const blob = await response.blob();
    const reader = new FileReader();

    const base64Content = await new Promise<string>((resolve) => {
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.readAsDataURL(blob);
    });

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, decode(base64Content), {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    // Update profile with new URL
    await this.updateProfile({ avatar_url: publicUrl });
    
    return publicUrl;
  },

  async signOut() {
    await supabase.auth.signOut();
  }
};

// XP Calculation Helpers
export const getXpForNextLevel = (level: number) => level * 1000;
export const getXpProgress = (currentXp: number, level: number) => {
  const nextLevelXp = getXpForNextLevel(level);
  return (currentXp / nextLevelXp) * 100;
};
