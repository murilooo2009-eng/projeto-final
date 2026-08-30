import { apiRequest } from '../lib/api';
import type { Dashboard } from '../types';

export function obterDashboard() {
  return apiRequest<Dashboard>('/dashboard');
}
