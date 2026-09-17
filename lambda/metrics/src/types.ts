export interface Metrics {
  total: number;
  pending: number;
  in_progress: number;
  done: number;
}

export interface HttpApiEvent {
  requestContext?: {
    http?: {
      method?: string;
      path?: string;
    };
  };
}

export interface HttpApiResponse {
  statusCode: number;
  headers: {
    "Content-Type": string;
  };
  body: string;
}
