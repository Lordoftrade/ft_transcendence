export interface IncomingRequest {
  requester: {
    id: number;
    username: string;
    avatarUrl: string | null;
  };
}