// src/app/features/reportes/services/vendedor.service.ts

import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError, throwError, map } from 'rxjs';

import { AuthService } from '../../auth/services/auth.service';
import {
  VendedorAPI,
  VendedoresResponse,
  VendedorRequest,
  Vendedor,
  ESTADO_MAPPING,
  COORDENADAS_CIUDADES
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class VendedorService {
  private readonly API_URL = 'https://localhost:7014/api';

  // Signals para estado
  private _loading = signal(false);
  private _error = signal<string | null>(null);

  // BehaviorSubjects para datos
  private vendedoresSubject = new BehaviorSubject<Vendedor[]>([]);
  private paginacionSubject = new BehaviorSubject<any>(null);

  // Observables públicos
  public vendedores$ = this.vendedoresSubject.asObservable();
  public paginacion$ = this.paginacionSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // Getters para signals
  get loading() {
    return this._loading();
  }

  get error() {
    return this._error();
  }

  /**
   * Obtener vendedores de la API
   */
  getVendedores(request: VendedorRequest): Observable<VendedoresResponse> {
    this._loading.set(true);
    this._error.set(null);

    // Construir parámetros de query
    let params = new HttpParams()
      .set('idEmpresa', request.idEmpresa.toString())
      .set('pagina', request.pagina.toString())
      .set('tamanioPagina', request.tamanioPagina.toString());

    if (request.termino) {
      params = params.set('termino', request.termino);
    }

    if (request.estado !== undefined) {
      params = params.set('estado', request.estado.toString());
    }

    // Headers con token de autenticación
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    });

    return this.http.get<VendedoresResponse>(`${this.API_URL}/Vendedor/todos`, {
      params,
      headers
    }).pipe(
      tap(response => {
        console.log('Vendedores obtenidos:', response);

        // Convertir datos de API a formato del componente
        const vendedoresAdaptados = this.adaptarVendedoresDesdeAPI(response.vendedores);

        this.vendedoresSubject.next(vendedoresAdaptados);
        this.paginacionSubject.next(response.paginacion);
        this._loading.set(false);
      }),
      catchError(error => {
        console.error('Error obteniendo vendedores:', error);

        let errorMessage = 'Error al obtener vendedores';
        if (error.status === 401) {
          errorMessage = 'No autorizado. Inicia sesión nuevamente.';
        } else if (error.status === 403) {
          errorMessage = 'No tienes permisos para ver esta información.';
        } else if (error.status === 0) {
          errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }

        this._error.set(errorMessage);
        this._loading.set(false);

        return throwError(() => ({ ...error, customMessage: errorMessage }));
      })
    );
  }

  /**
   * Obtener vendedores de la empresa del usuario logueado
   */
  getVendedoresByEmpresa(pagina = 1, tamanioPagina = 20, termino?: string, estado?: number): Observable<VendedoresResponse> {
    const user = this.authService.currentUser;
    const empresaId = user?.empresaSeleccionada?.id;

    if (!empresaId) {
      const error = new Error('No hay empresa seleccionada');
      this._error.set('No hay empresa seleccionada');
      return throwError(() => error);
    }

    const request: VendedorRequest = {
      idEmpresa: empresaId,
      pagina,
      tamanioPagina,
      termino,
      estado
    };

    return this.getVendedores(request);
  }

  /**
   * Convertir datos de API al formato del componente
   */
  private adaptarVendedoresDesdeAPI(vendedoresAPI: VendedorAPI[]): Vendedor[] {
    return vendedoresAPI.map((vendedorAPI, index) => {
      // Separar nombre completo en nombre y apellidos
      const nombreCompleto = vendedorAPI.nombre.trim();
      const partesNombre = nombreCompleto.split(' ');
      const nombre = partesNombre[0] || '';
      const apellidos = partesNombre.length > 1 ? partesNombre.slice(1).join(' ') : '';

      // Obtener coordenadas basadas en ciudad o usar coordenadas por defecto
      const ciudad = (vendedorAPI.ciudad || '').toUpperCase();
      const coordenadas = COORDENADAS_CIUDADES[ciudad] || COORDENADAS_CIUDADES['DEFAULT'];

      // Agregar pequeña variación aleatoria para evitar superposición en el mapa
      const latOffset = (Math.random() - 0.5) * 0.01; // ±0.005 grados
      const lngOffset = (Math.random() - 0.5) * 0.01;

      return {
        id: vendedorAPI.codigo,
        codigo: vendedorAPI.codigo,
        nombre: nombre,
        apellidos: apellidos || undefined,
        telefono: vendedorAPI.telefono1 || undefined,
        telefono2: vendedorAPI.telefono2 || undefined,
        direccion: vendedorAPI.direccion || undefined,
        distrito: vendedorAPI.ciudad || vendedorAPI.zona || undefined,
        ruc: vendedorAPI.ruc,
        zona: vendedorAPI.zona,
        ciudad: vendedorAPI.ciudad,
        representante: vendedorAPI.representante || undefined,
        lat: coordenadas.lat + latOffset,
        lng: coordenadas.lng + lngOffset,
        estado: ESTADO_MAPPING[vendedorAPI.estado as keyof typeof ESTADO_MAPPING] || 'inactivo',
        comision: vendedorAPI.comision,
        fechaRegistro: new Date(vendedorAPI.fechaRegistro),
        // Datos simulados para el componente existente
        ventasHoy: Math.floor(Math.random() * 15),
        clientesVisitados: Math.floor(Math.random() * 20)
      };
    });
  }

  /**
   * Buscar vendedores con término de búsqueda
   */
  buscarVendedores(termino: string, pagina = 1, tamanioPagina = 20): Observable<VendedoresResponse> {
    return this.getVendedoresByEmpresa(pagina, tamanioPagina, termino);
  }

  /**
   * Filtrar vendedores por estado
   */
  filtrarPorEstado(estado: number, pagina = 1, tamanioPagina = 20): Observable<VendedoresResponse> {
    return this.getVendedoresByEmpresa(pagina, tamanioPagina, undefined, estado);
  }

  /**
   * Obtener estadísticas de vendedores
   */
  getEstadisticasVendedores(): Observable<any> {
    // Por ahora calculamos desde los datos cargados
    const vendedores = this.vendedoresSubject.value;

    const estadisticas = {
      total: vendedores.length,
      activos: vendedores.filter(v => v.estado === 'activo').length,
      inactivos: vendedores.filter(v => v.estado === 'inactivo').length,
      ocupados: vendedores.filter(v => v.estado === 'ocupado').length,
      totalVentasHoy: vendedores.reduce((sum, v) => sum + (v.ventasHoy || 0), 0),
      totalClientes: vendedores.reduce((sum, v) => sum + (v.clientesVisitados || 0), 0)
    };

    return new Observable(observer => {
      observer.next(estadisticas);
      observer.complete();
    });
  }

  /**
   * Limpiar datos
   */
  clearData(): void {
    this.vendedoresSubject.next([]);
    this.paginacionSubject.next(null);
    this._error.set(null);
    this._loading.set(false);
  }

  /**
   * Recargar datos
   */
  refresh(): void {
    const paginacionActual = this.paginacionSubject.value;
    if (paginacionActual) {
      this.getVendedoresByEmpresa(
        paginacionActual.paginaActual,
        paginacionActual.tamanioPagina
      ).subscribe();
    } else {
      this.getVendedoresByEmpresa().subscribe();
    }
  }
}
