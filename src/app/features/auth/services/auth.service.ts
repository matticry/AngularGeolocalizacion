// src/app/features/auth/services/auth.service.ts

import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { LoginRequest, LoginResponse, AuthUser, Empresa } from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'https://localhost:7014/api';
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  // Signals para el estado de autenticación
  private _isAuthenticated = signal<boolean>(false);
  private _currentUser = signal<AuthUser | null>(null);
  private _loading = signal<boolean>(false);

  // Observables para compatibilidad
  private currentUserSubject = new BehaviorSubject<AuthUser | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.checkAuthStatus();
  }

  // Getters para signals
  get isAuthenticated() {
    return this._isAuthenticated();
  }

  get currentUser() {
    return this._currentUser();
  }

  get loading() {
    return this._loading();
  }

  /**
   * Login del usuario
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    this._loading.set(true);

    return this.http.post<LoginResponse>(`${this.API_URL}/login/listaempresas`, credentials)
      .pipe(
        tap({
          next: (response) => {
            this.setToken(response.token);
            const user: AuthUser = {
              username: credentials.nombreUsuario,
              token: response.token
            };
            this.setUser(user);
            this._isAuthenticated.set(true);
            this._currentUser.set(user);
            this.currentUserSubject.next(user);
            this._loading.set(false);
          },
          error: () => {
            this._loading.set(false);
          }
        })
      );
  }

  /**
   * Seleccionar empresa después del login
   */
  selectEmpresa(empresa: Empresa): void {
    const currentUser = this._currentUser();
    if (currentUser) {
      const updatedUser: AuthUser = {
        ...currentUser,
        empresaSeleccionada: empresa
      };
      this.setUser(updatedUser);
      this._currentUser.set(updatedUser);
      this.currentUserSubject.next(updatedUser);
    }
  }

  /**
   * Logout del usuario
   */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._isAuthenticated.set(false);
    this._currentUser.set(null);
    this.currentUserSubject.next(null);
  }

  /**
   * Obtener token para requests
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Verificar si el usuario está autenticado al cargar la app
   */
  private checkAuthStatus(): void {
    const token = this.getToken();
    const userStr = localStorage.getItem(this.USER_KEY);

    if (token && userStr) {
      try {
        const user: AuthUser = JSON.parse(userStr);
        if (this.isTokenValid(token)) {
          this._isAuthenticated.set(true);
          this._currentUser.set(user);
          this.currentUserSubject.next(user);
        } else {
          this.logout();
        }
      } catch (error) {
        this.logout();
      }
    }
  }

  /**
   * Validar si el token es válido (no expirado)
   */
  private isTokenValid(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch (error) {
      return false;
    }
  }

  /**
   * Guardar token en localStorage
   */
  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Guardar usuario en localStorage
   */
  private setUser(user: AuthUser): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }
}
