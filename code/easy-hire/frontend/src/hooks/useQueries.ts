import { useQuery } from '@tanstack/react-query';
import api, { queueApi, StatsResponse, Candidate, InterviewQueue, Job } from '../api/client';

export function useStats() {
  return useQuery<StatsResponse>({
    queryKey: ['stats'],
    queryFn: () => api.stats(),
  });
}

export function useCandidates(params?: { status?: string; source?: string; q?: string }) {
  return useQuery<Candidate[]>({
    queryKey: ['candidates', params],
    queryFn: () => api.candidates.list(params),
  });
}

export function useCandidate(id: string) {
  return useQuery<Candidate>({
    queryKey: ['candidate', id],
    queryFn: () => api.candidates.get(id),
    enabled: !!id,
  });
}

export function useJobs(params?: { status?: string; q?: string }) {
  return useQuery<Job[]>({
    queryKey: ['jobs', params],
    queryFn: () => api.jobs.list(params),
  });
}

export function useQueue(params?: { job_id?: string; status?: string }) {
  return useQuery<InterviewQueue[]>({
    queryKey: ['queue', params],
    queryFn: async () => {
      const res = await queueApi.list(params);
      return res.data;
    },
    refetchInterval: 10_000,
  });
}
