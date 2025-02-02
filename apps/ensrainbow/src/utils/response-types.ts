export interface BaseResponse {
  status: 'success' | 'error';
}

export interface SuccessResponse extends BaseResponse {
  status: 'success';
  label: string;
}

export interface ErrorResponse extends BaseResponse {
  status: 'error';
  error: string;
}

export type HealResponse = SuccessResponse | ErrorResponse; 
