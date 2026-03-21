import apiClient from '../../../shared/api/apiClient';

export interface ClassType {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
}

export interface ScheduledClass {
  id: string;
  class_type: ClassType;
  instructor_name: string | null;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  max_capacity: number;
  enrolled_count: number;
  location: string;
  notes: string | null;
  is_cancelled: boolean;
  is_enrolled: boolean;
}

export interface EnrollmentUser {
  user_id: string;
  user_name: string | null;
  enrolled_at: string;
  status: string;
}

export interface EnrollResponse {
  status: string;
  message: string;
}

export const classesApi = {
  getClassTypes: async (): Promise<ClassType[]> => {
    const { data } = await apiClient.get<ClassType[]>('/classes/types');
    return data ?? [];
  },

  getSchedule: async (fromDate?: string, toDate?: string): Promise<ScheduledClass[]> => {
    const { data } = await apiClient.get<ScheduledClass[]>('/classes/schedule', {
      params: {
        from_date: fromDate,
        to_date: toDate,
      },
    });
    return data ?? [];
  },

  enrollInClass: async (classId: string): Promise<EnrollResponse> => {
    const { data } = await apiClient.post<EnrollResponse>(`/classes/${classId}/enroll`);
    return data;
  },

  unenrollFromClass: async (classId: string): Promise<EnrollResponse> => {
    const { data } = await apiClient.delete<EnrollResponse>(`/classes/${classId}/enroll`);
    return data;
  },

  getEnrollments: async (classId: string): Promise<EnrollmentUser[]> => {
    const { data } = await apiClient.get<EnrollmentUser[]>(`/classes/${classId}/enrollments`);
    return data ?? [];
  },
};
