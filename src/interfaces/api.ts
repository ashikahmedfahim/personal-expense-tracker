export interface IApiResponse<T> {
  message: string | null;
  data: T;
}

export interface IApiMessageResponse {
  message: string | null;
}
