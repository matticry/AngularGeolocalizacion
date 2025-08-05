// src/app/features/reportes/geolocalizacion/geolocalizacion-reporte.component.ts
import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';

interface Vendedor {
  id: string;
  nombre: string;
  apellidos?: string;
  telefono?: string;
  direccion?: string;
  distrito?: string;
  lat: number;
  lng: number;
  codigo?: string;
  estado?: 'activo' | 'inactivo' | 'ocupado';
  avatar?: string;
  ventasHoy?: number;
  clientesVisitados?: number;
}

@Component({
  selector: 'app-geolocalizacion-reporte',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './geolocalizacion-reporte.component.html',
  styleUrls: ['./geolocalizacion-reporte.component.css']
})
export class GeolocalizacionReporteComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: false }) mapContainerRef!: ElementRef<HTMLDivElement>;

  map: L.Map | null = null;
  mapLoading = true;
  mapStatus = 'Inicializando mapa...';

  vendedores: Vendedor[] = [];
  vendedoresFiltrados: Vendedor[] = [];
  markers: Map<string, L.Marker> = new Map();
  selectedVendedorId: string | null = null;

  searchTerm = '';
  filtroEstado = 'todos';

  // Coordenadas de Quito, Ecuador
  initialCenter: [number, number] = [-0.186879, -78.503194];
  initialZoom = 12;

  // Colores por estado
  private estadoColors = {
    activo: { color: '#10b981', icon: '✓', bg: '#ecfdf5' },
    inactivo: { color: '#ef4444', icon: '⏸', bg: '#fef2f2' },
    ocupado: { color: '#f59e0b', icon: '🔥', bg: '#fffbeb' },
    default: { color: '#6b7280', icon: '👤', bg: '#f9fafb' }
  };

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // Datos de ejemplo con más información
    this.vendedores = [
      {
        id: 'v-001',
        nombre: 'Juan Carlos',
        apellidos: 'Ortega Medina',
        telefono: '0991234567',
        direccion: 'Av. 10 de Agosto N24-253',
        distrito: 'Centro Histórico',
        lat: -0.1868,
        lng: -78.5107,
        codigo: 'V001',
        estado: 'activo',
        ventasHoy: 8,
        clientesVisitados: 12
      },
      {
        id: 'v-002',
        nombre: 'María Fernanda',
        apellidos: 'Pérez González',
        telefono: '0997654321',
        direccion: 'Av. Eloy Alfaro N39-123',
        distrito: 'La Carolina',
        lat: -0.1732,
        lng: -78.4891,
        codigo: 'V002',
        estado: 'ocupado',
        ventasHoy: 5,
        clientesVisitados: 8
      },
      {
        id: 'v-003',
        nombre: 'Carlos Alberto',
        apellidos: 'López Gómez',
        telefono: '099888777',
        direccion: 'Av. Maldonado S1-123',
        distrito: 'Quitumbe',
        lat: -0.2867,
        lng: -78.5488,
        codigo: 'V003',
        estado: 'inactivo',
        ventasHoy: 0,
        clientesVisitados: 0
      },
      {
        id: 'v-004',
        nombre: 'Ana Sofía',
        apellidos: 'Morales Rivera',
        telefono: '0987654321',
        direccion: 'Av. 6 de Diciembre N33-456',
        distrito: 'La Floresta',
        lat: -0.1595,
        lng: -78.4892,
        codigo: 'V004',
        estado: 'activo',
        ventasHoy: 12,
        clientesVisitados: 15
      },
      {
        id: 'v-005',
        nombre: 'Roberto',
        apellidos: 'Sánchez Vega',
        telefono: '0976543210',
        direccion: 'Av. Prensa N58-123',
        distrito: 'Cotocollao',
        lat: -0.1123,
        lng: -78.4995,
        codigo: 'V005',
        estado: 'ocupado',
        ventasHoy: 6,
        clientesVisitados: 9
      }
    ];

    this.vendedoresFiltrados = [...this.vendedores];
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initializeMap(), 200);
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.markers.clear();
  }

  /* --------------------------
     MAPA MEJORADO
     -------------------------- */
  private initializeMap(): void {
    try {
      this.mapStatus = 'Creando mapa...';
      this.mapLoading = true;
      this.cdr.detectChanges();

      const containerId = 'geoloc-map';
      const el = document.getElementById(containerId);
      if (el) el.innerHTML = '';

      this.map = L.map(containerId, {
        center: this.initialCenter,
        zoom: this.initialZoom,
        attributionControl: false,
        zoomControl: false
      });

      // Tile layer mejorado
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors, © CARTO',
        maxZoom: 19
      }).addTo(this.map);

      // Controles personalizados
      L.control.zoom({ position: 'bottomright' }).addTo(this.map);
      L.control.scale({ position: 'bottomleft', imperial: false }).addTo(this.map);

      this.renderVendedoresEnMapa();

      this.mapStatus = 'Mapa listo';
      this.mapLoading = false;
      this.cdr.detectChanges();

    } catch (err) {
      console.error('Error inicializando mapa', err);
      this.mapStatus = `Error: ${err}`;
      this.mapLoading = false;
      this.cdr.detectChanges();
    }
  }

  private createAdvancedMarkerIcon(vendedor: Vendedor, isSelected = false): L.DivIcon {
    const estado = this.estadoColors[vendedor.estado || 'default'];
    const initial = vendedor.nombre.charAt(0).toUpperCase();
    const scale = isSelected ? 1.2 : 1;
    const shadow = isSelected ? '0 8px 25px rgba(0,0,0,0.3)' : '0 4px 15px rgba(0,0,0,0.15)';

    return L.divIcon({
      className: 'advanced-marker-icon',
      html: `
        <div class="marker-container" style="transform: scale(${scale})">
          <div class="marker-pin" style="background: ${estado.color}; box-shadow: ${shadow}">
            <div class="marker-content">
              <span class="marker-initial">${initial}</span>
            </div>
            <div class="marker-status" style="background: ${estado.bg}">
              <span class="status-icon">${estado.icon}</span>
            </div>
          </div>
          <div class="marker-pulse" style="background: ${estado.color}"></div>
        </div>
      `,
      iconSize: [50, 50],
      iconAnchor: [25, 45],
      popupAnchor: [0, -35]
    });
  }

  private createLocationMarkerIcon(): L.DivIcon {
    return L.divIcon({
      className: 'location-marker-icon',
      html: `
        <div class="location-container">
          <div class="location-pin">
            <div class="location-dot"></div>
          </div>
          <div class="location-pulse"></div>
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15]
    });
  }

  private renderVendedoresEnMapa(): void {
    if (!this.map) return;

    // Limpiar marcadores previos
    this.markers.forEach(m => {
      if (this.map) this.map.removeLayer(m);
    });
    this.markers.clear();

    this.vendedoresFiltrados.forEach(v => {
      const isSelected = this.selectedVendedorId === v.id;
      const icon = this.createAdvancedMarkerIcon(v, isSelected);
      const marker = L.marker([v.lat, v.lng], { icon }).addTo(this.map!);

      const estado = this.estadoColors[v.estado || 'default'];
      const popupHtml = `
        <div class="advanced-popup">
          <div class="popup-header" style="border-color: ${estado.color}">
            <div class="popup-avatar" style="background: ${estado.color}">
              ${v.nombre.charAt(0).toUpperCase()}
            </div>
            <div class="popup-info">
              <h4>${v.nombre} ${v.apellidos || ''}</h4>
              <span class="popup-status" style="background: ${estado.bg}; color: ${estado.color}">
                ${estado.icon} ${(v.estado || 'default').toUpperCase()}
              </span>
            </div>
          </div>
          <div class="popup-body">
            <div class="popup-row">
              <span class="popup-icon">📍</span>
              <span>${v.direccion || 'Sin dirección'}</span>
            </div>
            <div class="popup-row">
              <span class="popup-icon">🏢</span>
              <span>${v.distrito || 'Sin distrito'}</span>
            </div>
            ${v.telefono ? `
              <div class="popup-row">
                <span class="popup-icon">📞</span>
                <span>${v.telefono}</span>
              </div>
            ` : ''}
            <div class="popup-stats">
              <div class="stat">
                <span class="stat-value">${v.ventasHoy || 0}</span>
                <span class="stat-label">Ventas hoy</span>
              </div>
              <div class="stat">
                <span class="stat-value">${v.clientesVisitados || 0}</span>
                <span class="stat-label">Clientes</span>
              </div>
            </div>
          </div>
          <div class="popup-footer">
            <small style="color: #6b7280">${v.codigo || ''}</small>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        maxWidth: 300,
        className: 'custom-popup'
      });

      marker.on('click', () => {
        this.seleccionarYCentraVendedor(v.id);
      });

      this.markers.set(v.id, marker);
    });
  }

  private seleccionarYCentraVendedor(id: string): void {
    const vendedor = this.vendedores.find(v => v.id === id);
    if (!vendedor || !this.map) return;

    // Actualizar selección
    const prevSelected = this.selectedVendedorId;
    this.selectedVendedorId = id;

    // Re-renderizar marcadores para mostrar el estado seleccionado
    if (prevSelected) {
      const prevVendedor = this.vendedores.find(v => v.id === prevSelected);
      if (prevVendedor) {
        const prevMarker = this.markers.get(prevSelected);
        if (prevMarker) {
          prevMarker.setIcon(this.createAdvancedMarkerIcon(prevVendedor, false));
        }
      }
    }

    const currentMarker = this.markers.get(id);
    if (currentMarker) {
      currentMarker.setIcon(this.createAdvancedMarkerIcon(vendedor, true));
    }

    this.map.setView([vendedor.lat, vendedor.lng], 16, { animate: true });
    const marker = this.markers.get(id);
    if (marker) marker.openPopup();
  }

  /* --------------------------
     FILTRADO MEJORADO
     -------------------------- */
  filtrarVendedores(): void {
    const term = (this.searchTerm || '').toLowerCase().trim();

    let filtrados = [...this.vendedores];

    // Filtro por término de búsqueda
    if (term) {
      filtrados = filtrados.filter(v => {
        const searchText = [
          v.nombre,
          v.apellidos,
          v.telefono,
          v.direccion,
          v.distrito,
          v.codigo
        ].filter(Boolean).join(' ').toLowerCase();
        return searchText.includes(term);
      });
    }

    // Filtro por estado
    if (this.filtroEstado !== 'todos') {
      filtrados = filtrados.filter(v => v.estado === this.filtroEstado);
    }

    this.vendedoresFiltrados = filtrados;
    this.renderVendedoresEnMapa();
  }

  centrarEnVendedorClick(v: Vendedor): void {
    this.seleccionarYCentraVendedor(v.id);
  }

  mostrarTodas(): void {
    if (!this.map || this.markers.size === 0) return;
    this.selectedVendedorId = null;
    const group = new L.FeatureGroup(Array.from(this.markers.values()));
    this.map.fitBounds(group.getBounds().pad(0.1));
    this.renderVendedoresEnMapa();
  }

  obtenerMiUbicacion(): void {
    if (!this.map || !navigator.geolocation) {
      alert('Geolocalización no disponible');
      return;
    }

    this.mapStatus = 'Obteniendo ubicación...';

    navigator.geolocation.getCurrentPosition(position => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      this.map!.setView([lat, lng], 15, { animate: true });

      const locationIcon = this.createLocationMarkerIcon();
      const marker = L.marker([lat, lng], { icon: locationIcon }).addTo(this.map!);

      marker.bindPopup(`
        <div class="location-popup">
          <div class="location-header">
            <span class="location-icon">📍</span>
            <strong>Tu Ubicación</strong>
          </div>
          <p>Precisión: ±${Math.round(position.coords.accuracy)}m</p>
        </div>
      `).openPopup();

      this.mapStatus = 'Ubicación encontrada';

      // Remover marcador después de 15 segundos
      setTimeout(() => {
        if (this.map) {
          this.map.removeLayer(marker);
          this.mapStatus = 'Mapa listo';
        }
      }, 15000);
    }, err => {
      this.mapStatus = 'Error de ubicación';
      alert('Error obteniendo ubicación: ' + err.message);
      setTimeout(() => {
        this.mapStatus = 'Mapa listo';
      }, 3000);
    });
  }

  // Métodos auxiliares para estadísticas
  getVendedoresPorEstado(estado: string): number {
    return this.vendedores.filter(v => v.estado === estado).length;
  }

  getTotalVentasHoy(): number {
    return this.vendedores.reduce((sum, v) => sum + (v.ventasHoy || 0), 0);
  }

  // Método para tracking en ngFor
  trackByVendedorId(index: number, vendedor: Vendedor): string {
    return vendedor.id;
  }

  // Método para obtener icono de estado
  getEstadoIcon(estado: string): string {
    const icons = {
      activo: '✓',
      inactivo: '⏸',
      ocupado: '🔥',
      default: '👤'
    };
    return icons[estado as keyof typeof icons] || icons.default;
  }
}
