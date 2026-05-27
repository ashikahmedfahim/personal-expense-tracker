export interface IApiResponse<T> {
  message: string | null;
  data: T;
}

/** Standard error body used by the global handler, rate limiters, and AppError responses. */
export interface IApiErrorResponse {
  message: string;
}
