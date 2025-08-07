// src/app/features/reportes/models/vendedor.models.ts

export interface VendedorAPI {
  codigo: string;
  nombre: string;
  ruc: string;
  direccion: string;
  telefono1: string;
  telefono2: string;
  ciudad: string;
  zona: string;
  representante: string;
  estado: number; // 1 = activo, 0 = inactivo
  comision: number;
  fechaRegistro: string;
}

export interface PaginacionInfo {
  paginaActual: number;
  tamanioPagina: number;
  totalRegistros: number;
  totalPaginas: number;
  tienePaginaAnterior: boolean;
  tienePaginaSiguiente: boolean;
}

export interface VendedoresResponse {
  vendedores: VendedorAPI[];
  paginacion: PaginacionInfo;
  fechaConsulta: string;
  idEmpresa: number;
}

export interface VendedorRequest {
  idEmpresa: number;
  pagina: number;
  tamanioPagina: number;
  termino?: string; // Para búsqueda
  estado?: number; // Para filtrar por estado
}

// Interface para el componente (adaptada desde la API)
export interface Vendedor {
  id: string;
  codigo: string;
  nombre: string;
  apellidos?: string; // Extraído del nombre si viene completo
  telefono?: string;
  telefono2?: string;
  direccion?: string;
  distrito?: string; // Mapeado desde ciudad/zona
  lat: number; // Coordenadas (necesarias para el mapa)
  lng: number;
  ruc?: string;
  zona?: string;
  ciudad?: string;
  representante?: string;
  estado?: 'activo' | 'inactivo' | 'ocupado';
  avatar?: string;
  ventasHoy?: number; // Datos adicionales que se pueden agregar
  clientesVisitados?: number;
  comision?: number;
  fechaRegistro?: Date;
}

// Estados de mapeo
export const ESTADO_MAPPING = {
  1: 'activo' as const,
  0: 'inactivo' as const
};

// Coordenadas por defecto para diferentes ciudades de Ecuador
export const COORDENADAS_CIUDADES: { [key: string]: { lat: number, lng: number } } = {
  'QUITO': { lat: -0.1807, lng: -78.4678 },
  'GUAYAQUIL': { lat: -2.1894, lng: -79.8890 },
  'CUENCA': { lat: -2.9005, lng: -79.0059 },
  'AMBATO': { lat: -1.2543, lng: -78.6267 },
  'MACHALA': { lat: -3.2581, lng: -79.9553 },
  'MANTA': { lat: -0.9677, lng: -80.7088 },
  'DEFAULT': { lat: -0.1807, lng: -78.4678 } // Quito por defecto
};
