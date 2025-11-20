export interface PaginationParams {
  limit?: number;
  offset?: number;
  page?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  page: number;
  totalPages: number;
}

export function validatePaginationParams(params: PaginationParams) {
  const page = Math.max(params.page || 1, 1);
  const limit = Math.min(Math.max(params.limit || 20, 1), 100);
  const offset = params.offset !== undefined ? Math.max(params.offset, 0) : (page - 1) * limit;
  
  return { limit, offset, page };
}

export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResponse<T> {
  const { limit, offset, page } = validatePaginationParams(params);
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    total,
    limit,
    offset,
    page,
    totalPages,
  };
}
