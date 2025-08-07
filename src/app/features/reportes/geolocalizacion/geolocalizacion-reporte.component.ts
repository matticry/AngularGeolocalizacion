// src/app/features/reportes/geolocalizacion/geolocalizacion-reporte.component.ts

import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import * as L from 'leaflet';

import { VendedorService } from '../services';
import { Vendedor, PaginacionInfo } from '../models';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-geolocalizacion-reporte',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './geolocalizacion-reporte.component.html',
  styleUrls: ['./geolocalizacion-reporte.component.css']
})
export class GeolocalizacionReporteComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: false }) mapContainerRef!: ElementRef<HTMLDivElement>;

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  // Signals para estado reactivo
  loading = signal(false);
  error = signal<string | null>(null);

  // Mapa
  map: L.Map | null = null;
  mapLoading = true;
  mapStatus = 'Inicializando mapa...';

  // Buscador de ubicaciones mejorado
  locationSearchInput: HTMLInputElement | null = null;
  locationSuggestions: any[] = [];
  isSearchingLocation = false;
  selectedSuggestionIndex = -1;
  searchTimeout: any = null;

  // 🆕 NUEVAS PROPIEDADES para búsqueda de ubicaciones en header
  locationSearchTerm = '';
  showLocationSuggestions = false;
  currentLocationName = '';
  userLocation: { lat: number, lng: number } | null = null;
  private searchLocationMarker: L.Marker | null = null;

  // Búsquedas rápidas predefinidas
  quickSearches = [
    { name: 'Quito Centro', icon: '🏛️', query: 'Centro Histórico Quito' },
    { name: 'La Mariscal', icon: '🍺', query: 'La Mariscal Quito' },
    { name: 'Cumbayá', icon: '🏘️', query: 'Cumbayá Ecuador' },
    { name: 'El Valle', icon: '🏙️', query: 'Valle de los Chillos' },
    { name: 'Calderón', icon: '🏘️', query: 'Calderón Quito' },
    { name: 'Guayaquil', icon: '🌊', query: 'Guayaquil Ecuador' }
  ];

  // Vendedores
  vendedores: Vendedor[] = [];
  vendedoresFiltrados: Vendedor[] = [];
  markers: Map<string, L.Marker> = new Map();
  selectedVendedorId: string | null = null;

  // Filtros
  searchTerm = '';
  filtroEstado = 'todos';

  // Paginación
  paginacion: PaginacionInfo | null = null;
  tamanioPagina = 5;

  // Coordenadas iniciales (Quito, Ecuador)
  initialCenter: [number, number] = [-0.186879, -78.503194];
  initialZoom = 12;

  estadisticas = {
    total: 0,
    activos: 0,
    inactivos: 0
  };

  // Colores por estado
  private estadoColors = {
    activo: { color: '#10b981', icon: '✓', bg: '#ecfdf5' },
    inactivo: { color: '#ef4444', icon: '⏸', bg: '#fef2f2' },
    default: { color: '#6b7280', icon: '👤', bg: '#f9fafb' }
  };

  constructor(
    private cdr: ChangeDetectorRef,
    private vendedorService: VendedorService,
    public authService: AuthService
  ) {
    this.setupSearchDebounce();
  }

  // Getters para el template
  get empresaSeleccionada() {
    return this.authService.currentUser?.empresaSeleccionada;
  }

  get empresaNombre() {
    return this.authService.currentUser?.empresaSeleccionada?.nomempresa || 'Sin empresa';
  }

  get Math() {
    return Math;
  }

  // Métodos de paginación seguros
  getPaginaInicio(): number {
    if (!this.paginacion) return 0;
    return (this.paginacion.paginaActual - 1) * this.paginacion.tamanioPagina + 1;
  }

  getPaginaFin(): number {
    if (!this.paginacion) return 0;
    return this.Math.min(
      this.paginacion.paginaActual * this.paginacion.tamanioPagina,
      this.paginacion.totalRegistros
    );
  }

  ngOnInit(): void {
    this.subscribeToVendedorService();
    this.loadVendedores();

    (window as any).updateVendedorLocation = (vendedorId: string) => {
      this.updateVendedorLocation(vendedorId);
    };
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initializeMap(), 200);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.markers.clear();

    // Limpiar timeout de búsqueda
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    // Limpiar función global
    delete (window as any).updateVendedorLocation;
  }

  /* --------------------------
     CARGA DE DATOS
     -------------------------- */

  private subscribeToVendedorService(): void {
    // Suscribirse a vendedores
    this.vendedorService.vendedores$
      .pipe(takeUntil(this.destroy$))
      .subscribe(vendedores => {
        this.vendedores = vendedores;
        this.vendedoresFiltrados = [...vendedores];
        this.updateEstadisticas();
        this.renderVendedoresEnMapa();
        this.cdr.detectChanges();
      });

    // Suscribirse a paginación
    this.vendedorService.paginacion$
      .pipe(takeUntil(this.destroy$))
      .subscribe(paginacion => {
        this.paginacion = paginacion;
        this.cdr.detectChanges();
      });

    // Suscribirse a estado de loading
    this.loading.set(this.vendedorService.loading);

    // Suscribirse a errores
    if (this.vendedorService.error) {
      this.error.set(this.vendedorService.error);
    }
  }

  private loadVendedores(pagina = 1, termino?: string, estado?: number): void {
    const user = this.authService.currentUser;
    if (!user?.empresaSeleccionada?.id) {
      this.error.set('No hay empresa seleccionada');
      return;
    }

    console.log('Cargando vendedores para empresa:', user.empresaSeleccionada.nomempresa);

    this.vendedorService.getVendedoresByEmpresa(pagina, this.tamanioPagina, termino, estado)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Vendedores cargados:', response);
        },
        error: (error) => {
          console.error('Error cargando vendedores:', error);
          this.error.set(error.customMessage || 'Error cargando vendedores');
          this.loading.set(false);
        }
      });
  }

  // Estadísticas simplificadas (sin clientes)
  private updateEstadisticas(): void {
    this.estadisticas = {
      total: this.vendedores.length,
      activos: this.vendedores.filter(v => v.estado === 'activo').length,
      inactivos: this.vendedores.filter(v => v.estado === 'inactivo').length
    };
  }

  /* --------------------------
     🆕 BÚSQUEDA DE UBICACIONES EN HEADER
     -------------------------- */

  onLocationSearchInput(event: any): void {
    const value = event.target.value;
    this.locationSearchTerm = value;
    this.handleLocationSearchInput(value);
  }

  onLocationSearchFocus(): void {
    if (this.locationSearchTerm.length > 2) {
      this.showLocationSuggestions = true;
    }
  }

  onLocationSearchBlur(event: FocusEvent): void {
    // Delay para permitir clicks en sugerencias
    setTimeout(() => {
      const relatedTarget = event.relatedTarget as HTMLElement;
      if (!relatedTarget || !relatedTarget.closest('.location-suggestions-dropdown')) {
        this.showLocationSuggestions = false;
        this.selectedSuggestionIndex = -1;
      }
    }, 150);
  }

  onLocationSearchKeydown(event: KeyboardEvent): void {
    if (!this.showLocationSuggestions) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedSuggestionIndex = Math.min(
          this.selectedSuggestionIndex + 1,
          this.locationSuggestions.length - 1
        );
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.selectedSuggestionIndex = Math.max(this.selectedSuggestionIndex - 1, -1);
        break;

      case 'Enter':
        event.preventDefault();
        if (this.selectedSuggestionIndex >= 0 && this.selectedSuggestionIndex < this.locationSuggestions.length) {
          this.selectLocationSuggestion(this.locationSuggestions[this.selectedSuggestionIndex], this.selectedSuggestionIndex);
        } else if (this.locationSearchTerm.trim()) {
          this.performLocationSearchFromInput();
        }
        break;

      case 'Escape':
        this.showLocationSuggestions = false;
        this.selectedSuggestionIndex = -1;
        (event.target as HTMLInputElement).blur();
        break;
    }
  }

  clearLocationSearch(): void {
    this.locationSearchTerm = '';
    this.showLocationSuggestions = false;
    this.selectedSuggestionIndex = -1;
    this.locationSuggestions = [];
  }

  performLocationSearchFromInput(): void {
    if (!this.locationSearchTerm.trim()) return;

    if (this.locationSuggestions.length > 0) {
      this.selectLocationSuggestion(this.locationSuggestions[0], 0);
    } else {
      this.searchAndNavigateToLocation(this.locationSearchTerm.trim());
    }
  }

  performQuickSearch(quickSearch: any): void {
    this.locationSearchTerm = quickSearch.name;
    this.searchAndNavigateToLocation(quickSearch.query);
  }

  clearCurrentLocation(): void {
    this.currentLocationName = '';
    this.userLocation = null;

    // Limpiar marcador de búsqueda
    if (this.searchLocationMarker && this.map) {
      this.map.removeLayer(this.searchLocationMarker);
      this.searchLocationMarker = null;
    }

    // Volver a vista general del mapa
    if (this.map && this.vendedoresFiltrados.length > 0) {
      const group = new L.FeatureGroup(Array.from(this.markers.values()));
      this.map.fitBounds(group.getBounds().pad(0.1));
    } else if (this.map) {
      this.map.setView(this.initialCenter, this.initialZoom);
    }
  }

  // Método para calcular distancia (si el usuario tiene ubicación)
  calculateDistance(suggestion: any): string {
    if (!this.userLocation) return '';

    const lat1 = this.userLocation.lat;
    const lng1 = this.userLocation.lng;
    const lat2 = parseFloat(suggestion.lat);
    const lng2 = parseFloat(suggestion.lon);

    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    } else {
      return `${distance.toFixed(1)}km`;
    }
  }

  // Nuevo método para búsqueda directa
  private searchAndNavigateToLocation(query: string): void {
    this.isSearchingLocation = true;
    this.cdr.detectChanges();

    const searchQuery = query.includes('Ecuador') ? query : `${query}, Ecuador`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&countrycodes=ec&addressdetails=1`;

    fetch(url)
      .then(response => response.json())
      .then(data => {
        if (data && data.length > 0) {
          const result = data[0];
          const lat = parseFloat(result.lat);
          const lng = parseFloat(result.lon);
          const name = this.extractLocationName(result);

          this.currentLocationName = name;
          this.userLocation = { lat, lng };
          this.navigateToLocationWithMarker(lat, lng, name, result.display_name);
        } else {
          alert(`No se encontraron resultados para: ${query}`);
        }
      })
      .catch(error => {
        console.error('Error en búsqueda:', error);
        alert('Error al buscar la ubicación');
      })
      .finally(() => {
        this.isSearchingLocation = false;
        this.cdr.detectChanges();
      });
  }

  // Crear icono para marcador de búsqueda
  private createSearchLocationMarkerIcon(): L.DivIcon {
    return L.divIcon({
      className: 'search-location-marker-icon',
      html: `
        <div class="search-location-container">
          <div class="search-location-pin">
            <div class="search-location-dot">🔍</div>
          </div>
          <div class="search-location-pulse"></div>
        </div>
      `,
      iconSize: [35, 35],
      iconAnchor: [17, 35],
      popupAnchor: [0, -35]
    });
  }

  // Actualizar el método navigateToLocation para incluir marcador persistente
  private navigateToLocationWithMarker(lat: number, lng: number, name: string, fullAddress: string): void {
    if (!this.map) return;

    // Centrar mapa
    this.map.setView([lat, lng], 15, { animate: true });

    // Remover marcador de búsqueda anterior si existe
    if (this.searchLocationMarker) {
      this.map.removeLayer(this.searchLocationMarker);
    }

    // Crear marcador persistente para la ubicación buscada
    this.searchLocationMarker = L.marker([lat, lng], {
      icon: this.createSearchLocationMarkerIcon()
    }).addTo(this.map);

    this.searchLocationMarker.bindPopup(`
      <div style="text-align: center; max-width: 200px;">
        <div style="font-weight: bold; color: #1976d2; margin-bottom: 4px;">
          🔍 ${name}
        </div>
        <div style="color: #6b7280; font-size: 12px; line-height: 1.4;">
          ${fullAddress}
        </div>
        <div style="margin-top: 8px;">
          <button onclick="this.closest('.leaflet-popup').parentElement.style.display='none'"
                  style="background: #f3f4f6; border: 1px solid #d1d5db; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;">
            Cerrar
          </button>
        </div>
      </div>
    `).openPopup();

    this.mapStatus = `Ubicación: ${name}`;

    setTimeout(() => {
      this.mapStatus = 'Mapa listo';
    }, 3000);
  }

  /* --------------------------
     BÚSQUEDA Y FILTRADO DE VENDEDORES
     -------------------------- */

  private setupSearchDebounce(): void {
    this.searchSubject.pipe(
      debounceTime(300), // Reducido de 500ms para más responsividad
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(termino => {
      this.performSearch(termino);
    });
  }

  filtrarVendedores(): void {
    const term = this.searchTerm.trim();
    this.searchSubject.next(term);
  }

  private performSearch(termino: string): void {
    if (termino) {
      // Filtrar en el lado del cliente para mayor velocidad
      this.vendedoresFiltrados = this.vendedores.filter(v => {
        const searchText = [
          v.nombre,
          v.apellidos,
          v.telefono,
          v.direccion,
          v.distrito,
          v.codigo,
          v.ruc,
          v.ciudad,
          v.zona
        ].filter(Boolean).join(' ').toLowerCase();
        return searchText.includes(termino.toLowerCase());
      });
    } else {
      this.vendedoresFiltrados = [...this.vendedores];
    }

    this.aplicarFiltroEstado();
    this.renderVendedoresEnMapa();
  }

  onFiltroEstadoChange(estado: string): void {
    this.filtroEstado = estado;
    this.aplicarFiltroEstado();
    this.renderVendedoresEnMapa();
  }

  private aplicarFiltroEstado(): void {
    if (this.filtroEstado !== 'todos') {
      this.vendedoresFiltrados = this.vendedoresFiltrados.filter(v =>
        v.estado === this.filtroEstado
      );
    }
  }

  /* --------------------------
     MÉTODOS DE PAGINACIÓN
     -------------------------- */

  onPaginaAnterior(): void {
    if (this.paginacion?.tienePaginaAnterior) {
      this.loadVendedores(this.paginacion.paginaActual - 1);
    }
  }

  onPaginaSiguiente(): void {
    if (this.paginacion?.tienePaginaSiguiente) {
      this.loadVendedores(this.paginacion.paginaActual + 1);
    }
  }

  onPaginaEspecifica(pagina: number): void {
    if (this.paginacion && pagina >= 1 && pagina <= this.paginacion.totalPaginas) {
      this.loadVendedores(pagina);
    }
  }

  /* --------------------------
     MÉTODOS DEL MAPA
     -------------------------- */

  private async initializeMap(): Promise<void> {
    try {
      this.mapLoading = true;
      this.mapStatus = 'Creando mapa...';
      this.cdr.detectChanges();

      const containerId = 'geoloc-map';
      const el = document.getElementById(containerId);
      if (el) el.innerHTML = '';

      this.map = L.map(containerId, {
        center: [-0.186879, -78.503194],
        zoom: 13,
        zoomControl: true,
        attributionControl: false
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
        minZoom: 10,
        tileSize: 512,
        zoomOffset: -1,
      }).addTo(this.map);

      // Controles
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

  // Actualizar el método handleLocationSearchInput para header
  private handleLocationSearchInput(value: string): void {
    // Limpiar timeout anterior
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    const query = value.trim();

    if (query.length < 2) {
      this.showLocationSuggestions = false;
      this.locationSuggestions = [];
      return;
    }

    this.showLocationSuggestions = true;

    // Debounce de 300ms
    this.searchTimeout = setTimeout(() => {
      this.searchLocationSuggestions(query);
    }, 300);
  }

  // Manejar navegación con teclado en sugerencias
  private handleLocationSearchKeydown(e: KeyboardEvent, suggestionsContainer: HTMLDivElement): void {
    const suggestions = suggestionsContainer.querySelectorAll('.location-suggestion');

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.selectedSuggestionIndex = Math.min(this.selectedSuggestionIndex + 1, suggestions.length - 1);
        this.updateSuggestionSelection(suggestions);
        break;

      case 'ArrowUp':
        e.preventDefault();
        this.selectedSuggestionIndex = Math.max(this.selectedSuggestionIndex - 1, -1);
        this.updateSuggestionSelection(suggestions);
        break;

      case 'Enter':
        e.preventDefault();
        if (this.selectedSuggestionIndex >= 0 && this.selectedSuggestionIndex < this.locationSuggestions.length) {
          this.selectLocationSuggestion(this.locationSuggestions[this.selectedSuggestionIndex]);
        } else if (this.locationSearchInput?.value.trim()) {
          this.performLocationSearch(this.locationSearchInput.value.trim());
        }
        suggestionsContainer.style.display = 'none';
        break;

      case 'Escape':
        suggestionsContainer.style.display = 'none';
        this.selectedSuggestionIndex = -1;
        this.locationSearchInput?.blur();
        break;
    }
  }

  // Buscar sugerencias de ubicaciones
  private async searchLocationSuggestions(query: string): Promise<void> {
    if (!query || query.length < 2) return;

    this.isSearchingLocation = true;

    try {
      // Agregar "Ecuador" si no está incluido para mejor precisión
      const searchQuery = query.toLowerCase().includes('ecuador') ? query : `${query}, Ecuador`;
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=8&countrycodes=ec&addressdetails=1`;

      const response = await fetch(url);
      const data = await response.json();

      if (data && Array.isArray(data)) {
        this.locationSuggestions = data.filter(item => item.display_name && item.lat && item.lon);
      } else {
        this.locationSuggestions = [];
      }
    } catch (error) {
      console.error('Error buscando sugerencias:', error);
      this.locationSuggestions = [];
    } finally {
      this.isSearchingLocation = false;
      this.cdr.detectChanges(); // 🆕 AGREGAR DETECCIÓN DE CAMBIOS
    }
  }

  // Mostrar estado de búsqueda
  private showSearchingState(): void {
    const suggestionsContainer = document.querySelector('#location-suggestions') as HTMLDivElement;
    if (!suggestionsContainer) return;

    suggestionsContainer.innerHTML = `
      <div class="location-search-loading">
        <div class="spinner"></div>
        <span>Buscando ubicaciones...</span>
      </div>
    `;
    suggestionsContainer.style.display = 'block';
  }


  // Mostrar mensaje de no resultados
  private showNoResultsMessage(): void {
    const suggestionsContainer = document.querySelector('#location-suggestions') as HTMLDivElement;
    if (!suggestionsContainer) return;

    suggestionsContainer.innerHTML = `
      <div class="location-search-empty">
        <span class="empty-icon">🔍</span>
        <div>No se encontraron ubicaciones</div>
      </div>
    `;
    suggestionsContainer.style.display = 'block';
  }

  // Ocultar sugerencias
  private hideSuggestions(): void {
    const suggestionsContainer = document.querySelector('#location-suggestions') as HTMLDivElement;
    if (suggestionsContainer) {
      suggestionsContainer.style.display = 'none';
    }
    this.selectedSuggestionIndex = -1;
  }

  // Actualizar selección visual de sugerencias
  private updateSuggestionSelection(suggestions: NodeListOf<Element>): void {
    suggestions.forEach((suggestion, index) => {
      suggestion.classList.toggle('active', index === this.selectedSuggestionIndex);
    });
  }

  // Seleccionar una sugerencia (versión mejorada)
  selectLocationSuggestion(suggestion: any, index?: number): void {
    if (!suggestion) return;

    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon);
    const name = this.extractLocationName(suggestion);

    // Actualizar estado
    this.locationSearchTerm = name;
    this.currentLocationName = name;
    this.userLocation = { lat, lng };
    this.showLocationSuggestions = false;
    this.selectedSuggestionIndex = -1;

    // Navegar al lugar
    this.navigateToLocationWithMarker(lat, lng, name, suggestion.display_name);

    this.cdr.detectChanges();
  }

  // Realizar búsqueda directa (cuando se presiona botón o Enter)
  private performLocationSearch(query: string): void {
    if (this.locationSuggestions.length > 0) {
      // Si hay sugerencias, usar la primera
      this.selectLocationSuggestion(this.locationSuggestions[0]);
    } else {
      // Buscar directamente
      this.searchLocation(query);
    }
  }

  // Navegar a una ubicación específica
  private navigateToLocation(lat: number, lng: number, name: string, fullAddress: string): void {
    if (!this.map) return;

    // Centrar mapa
    this.map.setView([lat, lng], 16, { animate: true });

    // Crear marcador temporal
    const searchMarker = L.marker([lat, lng]).addTo(this.map)
      .bindPopup(`
        <div style="text-align: center; max-width: 200px;">
          <strong>📍 ${name}</strong><br>
          <small style="color: #6b7280; line-height: 1.4;">${fullAddress}</small>
        </div>
      `)
      .openPopup();

    // Remover marcador después de 15 segundos
    setTimeout(() => {
      if (this.map && searchMarker) {
        this.map.removeLayer(searchMarker);
      }
    }, 15000);
  }

  // Extraer nombre de la ubicación
  extractLocationName(suggestion: any): string {
    if (suggestion.address) {
      return suggestion.address.city ||
        suggestion.address.town ||
        suggestion.address.village ||
        suggestion.address.hamlet ||
        suggestion.address.suburb ||
        suggestion.address.neighbourhood ||
        suggestion.name ||
        'Ubicación';
    }
    return suggestion.name || suggestion.display_name?.split(',')[0] || 'Ubicación';
  }

  // Extraer dirección de la ubicación
  extractLocationAddress(suggestion: any): string {
    if (suggestion.address) {
      const parts = [];
      if (suggestion.address.road) parts.push(suggestion.address.road);
      if (suggestion.address.suburb && suggestion.address.suburb !== suggestion.address.city) {
        parts.push(suggestion.address.suburb);
      }
      if (suggestion.address.city) parts.push(suggestion.address.city);
      if (suggestion.address.state) parts.push(suggestion.address.state);
      return parts.join(', ') || suggestion.display_name;
    }
    return suggestion.display_name || 'Sin dirección disponible';
  }

  // Obtener icono según tipo de ubicación
  getLocationIcon(suggestion: any): string {
    const type = suggestion.type || suggestion.category || '';
    const place = suggestion.place_type || '';

    if (type.includes('city') || place.includes('city')) return '🏙️';
    if (type.includes('town') || place.includes('town')) return '🏘️';
    if (type.includes('village') || place.includes('village')) return '🏡';
    if (type.includes('road') || type.includes('street')) return '🛣️';
    if (type.includes('amenity')) return '🏢';
    if (type.includes('shop') || type.includes('commercial')) return '🏪';
    if (type.includes('school') || type.includes('university')) return '🏫';
    if (type.includes('hospital') || type.includes('clinic')) return '🏥';
    if (type.includes('park') || type.includes('garden')) return '🏞️';

    return '📍';
  }

  // Búsqueda simple de ubicación (compatibilidad)
  private searchLocation(query: string): void {
    if (!this.map) return;

    const searchQuery = query.includes('Ecuador') ? query : `${query}, Ecuador`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&countrycodes=ec`;

    fetch(url)
      .then(response => response.json())
      .then(data => {
        if (data && data.length > 0) {
          const result = data[0];
          const lat = parseFloat(result.lat);
          const lng = parseFloat(result.lon);
          const name = this.extractLocationName(result);

          this.navigateToLocation(lat, lng, name, result.display_name);
        } else {
          alert(`No se encontraron resultados para: ${query}`);
        }
      })
      .catch(error => {
        console.error('Error en búsqueda:', error);
        alert('Error al buscar la ubicación');
      });
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
      // Popup simplificado (sin estadísticas de clientes)
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
              <span class="popup-icon">💼</span>
              <span>Código: ${v.codigo}</span>
            </div>
            ${v.ruc ? `
              <div class="popup-row">
                <span class="popup-icon">🏢</span>
                <span>RUC: ${v.ruc}</span>
              </div>
            ` : ''}
            <div class="popup-row">
              <span class="popup-icon">📍</span>
              <span>${v.direccion || 'Sin dirección'}</span>
            </div>
            ${v.ciudad ? `
              <div class="popup-row">
                <span class="popup-icon">🏢</span>
                <span>${v.ciudad}</span>
              </div>
            ` : ''}
            ${v.telefono ? `
              <div class="popup-row">
                <span class="popup-icon">📞</span>
                <span>${v.telefono}</span>
              </div>
            ` : ''}
            ${v.zona ? `
              <div class="popup-row">
                <span class="popup-icon">📊</span>
                <span>Zona: ${v.zona}</span>
              </div>
            ` : ''}
            <div class="popup-actions" style="margin-top: 10px; text-align: center;">
              <button onclick="window.updateVendedorLocation('${v.id}')"
                      style="background: #1976d2; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; font-size: 12px;">
                📍 Actualizar Ubicación
              </button>
            </div>
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

    const prevSelected = this.selectedVendedorId;
    this.selectedVendedorId = id;

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
     MÉTODOS PÚBLICOS
     -------------------------- */

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

  // Métodos auxiliares para el template
  trackByVendedorId(index: number, vendedor: Vendedor): string {
    return vendedor.id;
  }

  getEstadoIcon(estado: string): string {
    const icons = {
      activo: '✓',
      inactivo: '⏸',
      default: '👤'
    };
    return icons[estado as keyof typeof icons] || icons.default;
  }

  refresh(): void {
    this.vendedorService.refresh();
  }

  // Actualizar ubicación del vendedor
  updateVendedorLocation(vendedorId: string): void {
    const vendedor = this.vendedores.find(v => v.id === vendedorId);
    if (!vendedor) {
      alert('Vendedor no encontrado');
      return;
    }

    if (!navigator.geolocation) {
      alert('Geolocalización no disponible en tu dispositivo');
      return;
    }

    const confirmed = confirm(`¿Actualizar la ubicación de ${vendedor.nombre}?`);
    if (!confirmed) return;

    this.mapStatus = 'Obteniendo ubicación actual...';

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nuevaLat = position.coords.latitude;
        const nuevaLng = position.coords.longitude;

        console.log('🎯 Nueva ubicación obtenida:', {
          vendedorId: vendedor.id,
          vendedorNombre: vendedor.nombre,
          coordenadas: {
            lat: nuevaLat,
            lng: nuevaLng,
            precision: position.coords.accuracy
          }
        });

        // TODO: Llamada al API para actualizar en backend
        this.sendLocationUpdate(vendedor.id, nuevaLat, nuevaLng, position.coords.accuracy);

        // Actualizar localmente
        vendedor.lat = nuevaLat;
        vendedor.lng = nuevaLng;

        // Re-renderizar mapa
        this.renderVendedoresEnMapa();

        // Centrar en nueva ubicación
        this.map?.setView([nuevaLat, nuevaLng], 17, { animate: true });

        this.mapStatus = 'Ubicación actualizada exitosamente';

        setTimeout(() => {
          this.mapStatus = 'Mapa listo';
        }, 3000);
      },
      (error) => {
        console.error('Error obteniendo ubicación:', error);
        this.mapStatus = 'Error obteniendo ubicación';
        alert(`Error: ${error.message}`);

        setTimeout(() => {
          this.mapStatus = 'Mapa listo';
        }, 3000);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }

  // Enviar actualización al backend
  private sendLocationUpdate(vendedorId: string, lat: number, lng: number, precision: number): void {
    // TODO: Implementar llamada al API
    const updateData = {
      vendedorId: vendedorId,
      coordenadas: {
        latitud: lat,
        longitud: lng,
        precision: precision,
        fechaActualizacion: new Date().toISOString()
      }
    };

    console.log('📤 Datos para enviar al API:', updateData);
  }
}
