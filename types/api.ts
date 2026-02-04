export interface User {
  id: number;
  uuid?: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar?: string;
  banned?: boolean | string;
  two_fa_enabled?: boolean | string;
  created_at?: string;
  updated_at?: string;
  external_id?: string | null;
  remember_token?: string;
  discord_oauth2_id?: string | null;
  discord_oauth2_access_token?: string | null;
  discord_oauth2_linked?: string | boolean;
  discord_oauth2_username?: string | null;
  discord_oauth2_name?: string | null;
  ticket_signature?: string | null;
  mail_verify?: string | null;
  first_ip?: string;
  last_ip?: string;
  two_fa_key?: string | null;
  two_fa_blocked?: string | boolean;
  deleted?: string | boolean;
  locked?: string | boolean;
  last_seen?: string;
  first_seen?: string;
  role_id?: number;
  role?: {
    name: string;
    display_name: string;
    color: string;
  };
  permissions?: string[];
}

export interface Server {
  id: number;
  uuid: string;
  uuidShort: string;
  name: string;
  description?: string | null;
  status: string;
  suspended?: number;
  memory: number;
  swap?: number;
  disk: number;
  io?: number;
  cpu: number;
  threads?: string | null;
  node?: {
    name?: string;
    maintenance_mode?: number;
    fqdn?: string;
    behind_proxy?: number;
  };
  location?: {
    id: number;
    name: string;
    description?: string | null;
    flag_code: string;
  };
  realm?: {
    name?: string;
    description?: string;
    logo?: string | null;
  };
  spell?: {
    name?: string;
    description?: string;
    banner?: string;
  };
  allocation?: {
    ip?: string;
    port?: number;
    ip_alias?: string;
  };
  owner_id?: number;
  skip_zerotrust?: number;
  oom_disabled?: number;
  allocation_limit?: number;
  database_limit?: number;
  backup_limit?: number;
  is_subuser?: boolean;
  subuser_permissions?: string[];
  subuser_id?: number | null;
}

export interface ApiErrorItem {
  code: string;
  detail: string;
  status: number;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T | null;
  error: boolean;
  error_message: string | null;
  error_code: string | null;
  errors?: ApiErrorItem[];
}

export interface LoginRequest {
  username_or_email: string;
  password: string;
  turnstile_token?: string;
}

export interface LoginData {
  user: User & {
    remember_token: string;
  };
  preferences: any[];
}

export type LoginResponse = ApiEnvelope<LoginData>;

export interface SessionData {
  user_info: User & {
    remember_token: string;
    role_id: number;
    role?: {
      name: string;
      display_name: string;
      color: string;
    };
  };
  permissions: string[];
  preferences: any[];
}

export type SessionResponse = ApiEnvelope<SessionData>;

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface ApiError {
  error?: string;
  message?: string;
  error_message?: string;
  error_code?: string;
  errors?: ApiErrorItem[];
}

export interface ServersPayload {
  servers: Server[];
  pagination: {
    current_page: number;
    per_page: number;
    total_records: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
    from: number;
    to: number;
  };
  search: {
    query: string;
    has_results: boolean;
  };
}

export type ServersEnvelope = ApiEnvelope<ServersPayload>;