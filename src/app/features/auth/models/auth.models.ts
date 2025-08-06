// src/app/features/auth/models/auth.models.ts

export interface LoginRequest {
  nombreUsuario: string;
  contrasena: string;
}

export interface Empresa {
  id: number;
  nomempresa: string;
  flag: boolean;
}

export interface LoginResponse {
  token: string;
  listado: Empresa[];
}

export interface AuthUser {
  username: string;
  token: string;
  empresaSeleccionada?: Empresa;
}

// src/app/features/auth/models/index.ts
export * from './auth.models';
