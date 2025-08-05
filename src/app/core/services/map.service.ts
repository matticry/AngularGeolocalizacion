// src/app/core/services/map.service.ts
import { Injectable } from '@angular/core';
import * as L from 'leaflet';
import { BehaviorSubject, Observable } from 'rxjs';

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  description?: string;
  type: 'vendedor' | 'geocerca' | 'centro' | 'punto';
  data?: any;
}

export interface GeocercaData {
  id: string;
  name: string;
  center: [number, number];
  radius: number;
  color: string;
  active: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MapService {
  private map: L.Map | null = null;
  private markers: Map<string, L.Marker> = new Map();
  private geocercas: Map<string, L.Circle> = new Map();
  private markersSubject = new BehaviorSubject<MapMarker[]>([]);

  // Configuración por defecto (Lima, Perú)
  private defaultCenter: [number, number] = [-12.0464, -77.0428];
  private defaultZoom = 13;

  // Iconos personalizados
  private iconos = {
    vendedor: L.divIcon({
      className: 'custom-marker vendedor-marker',
      html: '<div class="marker-inner">👤</div>',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    }),
    geocerca: L.divIcon({
      className: 'custom-marker geocerca-marker',
      html: '<div class="marker-inner">📍</div>',
      iconSize: [25, 25],
      iconAnchor: [12, 12]
    }),
    centro: L.divIcon({
      className: 'custom-marker centro-marker',
      html: '<div class="marker-inner">🏢</div>',
      iconSize: [35, 35],
      iconAnchor: [17, 17]
    }),
    punto: L.divIcon({
      className: 'custom-marker punto-marker',
      html: '<div class="marker-inner">📌</div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    })
  };

  constructor() {
    // Configurar estilos CSS para los iconos
    this.setupCustomStyles();
  }

  // Inicializar mapa
  initMap(containerId: string, center?: [number, number], zoom?: number): L.Map {
    // Remover mapa existente si existe
    if (this.map) {
      this.map.remove();
    }

    // Crear nuevo mapa
    this.map = L.map(containerId, {
      center: center || this.defaultCenter,
      zoom: zoom || this.defaultZoom,
      zoomControl: true,
      attributionControl: false
    });

    // Agregar capa de tiles (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);

    // Agregar control de zoom personalizado
    L.control.zoom({
      position: 'topright'
    }).addTo(this.map);

    // Eventos del mapa
    this.map.on('click', (e) => {
      console.log('Click en mapa:', e.latlng);
    });

    return this.map;
  }

  // Agregar marcador
  addMarker(marker: MapMarker): L.Marker {
    if (!this.map) {
      throw new Error('Mapa no inicializado');
    }

    const leafletMarker = L.marker([marker.lat, marker.lng], {
      icon: this.iconos[marker.type]
    }).addTo(this.map);

    // Popup personalizado
    const popupContent = this.createPopupContent(marker);
    leafletMarker.bindPopup(popupContent);

    // Guardar referencia
    this.markers.set(marker.id, leafletMarker);

    // Eventos del marcador
    leafletMarker.on('click', () => {
      console.log('Click en marcador:', marker);
    });

    return leafletMarker;
  }

  // Agregar geocerca (círculo)
  addGeocerca(geocerca: GeocercaData): L.Circle {
    if (!this.map) {
      throw new Error('Mapa no inicializado');
    }

    const circle = L.circle(geocerca.center, {
      radius: geocerca.radius,
      color: geocerca.color,
      fillColor: geocerca.color,
      fillOpacity: 0.2,
      weight: 2,
      opacity: geocerca.active ? 1 : 0.5
    }).addTo(this.map);

    // Popup para la geocerca
    circle.bindPopup(`
      <div class="geocerca-popup">
        <h4>${geocerca.name}</h4>
        <p>Radio: ${geocerca.radius}m</p>
        <p>Estado: ${geocerca.active ? 'Activa' : 'Inactiva'}</p>
      </div>
    `);

    this.geocercas.set(geocerca.id, circle);
    return circle;
  }

  // Remover marcador
  removeMarker(markerId: string): void {
    const marker = this.markers.get(markerId);
    if (marker && this.map) {
      this.map.removeLayer(marker);
      this.markers.delete(markerId);
    }
  }

  // Remover geocerca
  removeGeocerca(geocercaId: string): void {
    const geocerca = this.geocercas.get(geocercaId);
    if (geocerca && this.map) {
      this.map.removeLayer(geocerca);
      this.geocercas.delete(geocercaId);
    }
  }

  // Centrar mapa en ubicación
  centerOn(lat: number, lng: number, zoom?: number): void {
    if (this.map) {
      this.map.setView([lat, lng], zoom || this.map.getZoom());
    }
  }

  // Ajustar vista para mostrar todos los marcadores
  fitBounds(): void {
    if (!this.map || this.markers.size === 0) return;

    const group = new L.FeatureGroup(Array.from(this.markers.values()));
    this.map.fitBounds(group.getBounds().pad(0.1));
  }

  // Obtener ubicación actual del usuario
  getCurrentLocation(): Promise<[number, number]> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalización no soportada'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [
            position.coords.latitude,
            position.coords.longitude
          ];
          resolve(coords);
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  }

  // Calcular distancia entre dos puntos
  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLng = this.deg2rad(lng2 - lng1);
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c * 1000; // Retorna en metros
  }

  // Limpiar mapa
  clearMap(): void {
    if (!this.map) return;

    // Remover todos los marcadores
    this.markers.forEach(marker => {
      this.map!.removeLayer(marker);
    });
    this.markers.clear();

    // Remover todas las geocercas
    this.geocercas.forEach(geocerca => {
      this.map!.removeLayer(geocerca);
    });
    this.geocercas.clear();
  }

  // Destruir mapa
  destroyMap(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.markers.clear();
    this.geocercas.clear();
  }

  // Observables
  getMarkers(): Observable<MapMarker[]> {
    return this.markersSubject.asObservable();
  }

  // Métodos privados
  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private createPopupContent(marker: MapMarker): string {
    return `
      <div class="custom-popup">
        <h4 class="popup-title">${marker.title}</h4>
        ${marker.description ? `<p class="popup-description">${marker.description}</p>` : ''}
        <div class="popup-coords">
          <small>📍 ${marker.lat.toFixed(6)}, ${marker.lng.toFixed(6)}</small>
        </div>
        <div class="popup-type">
          <span class="type-badge type-${marker.type}">${this.getTypeLabel(marker.type)}</span>
        </div>
      </div>
    `;
  }

  private getTypeLabel(type: string): string {
    const labels = {
      'vendedor': 'Vendedor',
      'geocerca': 'Geocerca',
      'centro': 'Centro',
      'punto': 'Punto'
    };
    return labels[type as keyof typeof labels] || type;
  }

  private setupCustomStyles(): void {
    // Agregar estilos CSS dinámicamente
    const style = document.createElement('style');
    style.textContent = `
      .custom-marker {
        background: none;
        border: none;
      }

      .marker-inner {
        background: white;
        border-radius: 50%;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        font-size: 14px;
        border: 2px solid #fff;
        transition: transform 0.2s ease;
      }

      .vendedor-marker .marker-inner {
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        color: white;
      }

      .geocerca-marker .marker-inner {
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
      }

      .centro-marker .marker-inner {
        background: linear-gradient(135deg, #f59e0b, #d97706);
        color: white;
      }

      .punto-marker .marker-inner {
        background: linear-gradient(135deg, #ef4444, #dc2626);
        color: white;
      }

      .custom-marker:hover .marker-inner {
        transform: scale(1.1);
      }

      .custom-popup {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .popup-title {
        margin: 0 0 0.5rem 0;
        color: #1f2937;
        font-size: 1rem;
      }

      .popup-description {
        margin: 0 0 0.5rem 0;
        color: #6b7280;
        font-size: 0.9rem;
      }

      .popup-coords {
        margin: 0.5rem 0;
        color: #9ca3af;
      }

      .type-badge {
        display: inline-block;
        padding: 0.25rem 0.5rem;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 500;
        color: white;
      }

      .type-vendedor { background: #3b82f6; }
      .type-geocerca { background: #10b981; }
      .type-centro { background: #f59e0b; }
      .type-punto { background: #ef4444; }

      .geocerca-popup h4 {
        margin: 0 0 0.5rem 0;
        color: #1f2937;
      }

      .geocerca-popup p {
        margin: 0.25rem 0;
        color: #6b7280;
        font-size: 0.9rem;
      }
    `;
    document.head.appendChild(style);
  }
}
