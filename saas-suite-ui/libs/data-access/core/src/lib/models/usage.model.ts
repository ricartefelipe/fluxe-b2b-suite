/** Uso atual vs limites do plano (para exibição no admin). */
export interface UsageSummary {
  usersUsed: number;
  usersLimit: number;
  planSlug: string;
  planDisplayName: string;
}
