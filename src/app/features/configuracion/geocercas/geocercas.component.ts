// src/app/features/configuracion/geocercas/geocercas.component.ts
import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';

interface Vendedor {
  id: number;
  nombre: string;
  apellidos: string;
  direccion: string;
  distrito: string;
  telefono: string;
  codigo: string;
  lat: number;
  lng: number;
}

interface Geocerca {
  id: number;
  nombre: string;
  direccion: string;
  centro: string;
  distrito: string;
  latitud: number;
  longitud: number;
  radio: number;
  activa: boolean;
  color: string;
}

@Component({
  selector: 'app-geocercas-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './geocercas.component.html',
  styleUrls: ['./geocercas.component.css']
})
export class GeocercasConfigComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('mapContainer', { static: false }) mapContainerRef!: ElementRef;

  searchTerm = '';
  modoEdicion = false;
  mapLoading = true;
  mapStatus = 'Inicializando...';

  // Referencias del mapa
  private map: L.Map | null = null;
  private markers: Map<string, L.Marker> = new Map();
  private geocercasMap: Map<string, L.Circle> = new Map();
  private initializationAttempts = 0;
  private maxAttempts = 5;

  vendedorSeleccionado: Vendedor = {
    id: 1,
    nombre: 'Carlos Ortega',
    apellidos: 'Martín',
    direccion: 'Jr. 18 de Agosto y Rogelia, Centro Huancayo',
    distrito: 'Huancayo',
    telefono: '987654321',
    codigo: 'V001',
    lat: -12.0669,
    lng: -75.2048
  };

  geocercas: Geocerca[] = [
    {
      id: 1,
      nombre: 'Norte-001',
      direccion: 'Av. 16 de Agosto y Rogelia, Centro Huancayo',
      centro: 'Huancayo',
      distrito: 'Huancayo',
      latitud: -12.0600,
      longitud: -75.2000,
      radio: 500,
      activa: true,
      color: '#10b981'
    },
    {
      id: 2,
      nombre: 'Norte-002',
      direccion: 'Av. Real s/n, El Tambo',
      centro: 'El Tambo',
      distrito: 'El Tambo',
      latitud: -12.0450,
      longitud: -75.1950,
      radio: 300,
      activa: true,
      color: '#3b82f6'
    },
    {
      id: 3,
      nombre: 'Sur-001',
      direccion: 'Av. Mariscal Castilla, Chilca',
      centro: 'Chilca',
      distrito: 'Chilca',
      latitud: -12.0850,
      longitud: -75.2100,
      radio: 400,
      activa: false,
      color: '#6b7280'
    },
    {
      id: 4,
      nombre: 'Centro-001',
      direccion: 'Plaza Constitución, Huancayo',
      centro: 'Plaza Principal',
      distrito: 'Huancayo',
      latitud: -12.0669,
      longitud: -75.2048,
      radio: 200,
      activa: true,
      color: '#f59e0b'
    }
  ];

  geocercasFiltradas: Geocerca[] = [];

  constructor(private cdr: ChangeDetectorRef) {
    this.geocercasFiltradas = [...this.geocercas];
  }

  ngOnInit(): void {
    console.log('🚀 Componente Vendedores y Geocercas iniciado');
    this.mapStatus = 'Preparando componentes...';
  }

  ngAfterViewInit(): void {
    console.log('🔧 Vista inicializada, programando inicialización del mapa...');

    // Usar múltiples estrategias para asegurar la inicialización
    this.scheduleMapInitialization();
  }

  ngOnDestroy(): void {
    this.destroyMap();
  }

  private scheduleMapInitialization(): void {
    console.log('📅 Programando inicialización del mapa...');

    // Estrategia 1: Timeout inicial corto
    setTimeout(() => {
      this.attemptMapInitialization();
    }, 500);

    // Estrategia 2: Timeout de respaldo
    setTimeout(() => {
      if (!this.map) {
        console.log('🔄 Segundo intento de inicialización...');
        this.attemptMapInitialization();
      }
    }, 1500);

    // Estrategia 3: Timeout de emergencia
    setTimeout(() => {
      if (!this.map) {
        console.log('🚨 Intento de emergencia...');
        this.attemptMapInitialization();
      }
    }, 3000);
  }

  private attemptMapInitialization(): void {
    this.initializationAttempts++;
    console.log(`🎯 Intento de inicialización #${this.initializationAttempts}`);

    if (this.initializationAttempts > this.maxAttempts) {
      console.error('❌ Se agotaron los intentos de inicialización');
      this.mapStatus = 'Error: No se pudo inicializar automáticamente. Usa el botón "🔄 Inicializar Mapa"';
      this.mapLoading = false;
      return;
    }

    // Verificar que el contenedor esté disponible y tenga dimensiones
    const container = document.getElementById('map-container');
    if (!container) {
      console.log('⏳ Contenedor no encontrado, reintentando...');
      setTimeout(() => this.attemptMapInitialization(), 1000);
      return;
    }

    const rect = container.getBoundingClientRect();
    if (rect.height === 0 || rect.width === 0) {
      console.log('⏳ Contenedor sin dimensiones, reintentando...', rect);
      setTimeout(() => this.attemptMapInitialization(), 1000);
      return;
    }

    console.log('✅ Contenedor válido encontrado, inicializando mapa...');
    this.initializeMapDirect();
  }

  private async initializeMapDirect(): Promise<void> {
    try {
      this.mapLoading = true;
      this.mapStatus = 'Creando mapa...';
      this.cdr.detectChanges();

      console.log('🗺️ Iniciando creación del mapa...');

      // Limpiar contenedor
      const mapContainer = document.getElementById('map-container');
      if (mapContainer) {
        mapContainer.innerHTML = '';
      }

      // Crear mapa con Leaflet directamente
      this.map = L.map('map-container', {
        center: [this.vendedorSeleccionado.lat, this.vendedorSeleccionado.lng],
        zoom: 13,
        zoomControl: true,
        attributionControl: false
      });

      console.log('🌍 Mapa creado, agregando tiles...');
      this.mapStatus = 'Cargando tiles...';
      this.cdr.detectChanges();

      // Agregar capa de tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(this.map);

      console.log('🎯 Tiles agregados, creando marcadores...');
      this.mapStatus = 'Agregando marcadores...';
      this.cdr.detectChanges();

      // Esperar un poco para que los tiles se carguen
      await new Promise(resolve => setTimeout(resolve, 500));

      // Agregar contenido al mapa
      this.addMapContent();

      console.log('✅ Mapa inicializado completamente');
      this.mapStatus = 'Mapa cargado correctamente';
      this.mapLoading = false;
      this.cdr.detectChanges();

    } catch (error) {
      console.error('❌ Error inicializando mapa:', error);
      this.mapStatus = `Error: ${error}`;
      this.mapLoading = false;
      this.cdr.detectChanges();
    }
  }

  private addMapContent(): void {
    if (!this.map) return;

    console.log('📍 Agregando marcadores...');

    // Agregar marcador del vendedor
    const vendedorIcon = L.divIcon({
      className: 'custom-vendedor-marker',
      html: '<div style="background: #3b82f6; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">👤</div>',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });

    const vendedorMarker = L.marker([this.vendedorSeleccionado.lat, this.vendedorSeleccionado.lng], {
      icon: vendedorIcon
    }).addTo(this.map);

    vendedorMarker.bindPopup(`
      <div style="text-align: center;">
        <h4>${this.vendedorSeleccionado.nombre} ${this.vendedorSeleccionado.apellidos}</h4>
        <p>${this.vendedorSeleccionado.direccion}</p>
        <small>Código: ${this.vendedorSeleccionado.codigo}</small>
      </div>
    `);

    this.markers.set('vendedor-1', vendedorMarker);

    // Agregar geocercas
    this.geocercas.forEach(geocerca => {
      this.addGeocercaToMap(geocerca);
    });

    // Configurar eventos
    this.map.on('click', (e) => {
      if (this.modoEdicion) {
        this.agregarPuntoEnMapa(e.latlng.lat, e.latlng.lng);
      }
    });
  }

  private addGeocercaToMap(geocerca: Geocerca): void {
    if (!this.map) return;

    // Marcador
    const geocercaIcon = L.divIcon({
      className: 'custom-geocerca-marker',
      html: `<div style="background: ${geocerca.color}; color: white; width: 25px; height: 25px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">📍</div>`,
      iconSize: [25, 25],
      iconAnchor: [12, 12]
    });

    const marker = L.marker([geocerca.latitud, geocerca.longitud], {
      icon: geocercaIcon
    }).addTo(this.map);

    marker.bindPopup(`
      <div>
        <h4>${geocerca.nombre}</h4>
        <p>${geocerca.direccion}</p>
        <p>Radio: ${geocerca.radio}m</p>
        <p>Estado: ${geocerca.activa ? 'Activa' : 'Inactiva'}</p>
      </div>
    `);

    this.markers.set(`geocerca-${geocerca.id}`, marker);

    // Círculo de geocerca
    const circle = L.circle([geocerca.latitud, geocerca.longitud], {
      radius: geocerca.radio,
      color: geocerca.color,
      fillColor: geocerca.color,
      fillOpacity: geocerca.activa ? 0.2 : 0.1,
      weight: 2,
      opacity: geocerca.activa ? 1 : 0.5
    }).addTo(this.map);

    this.geocercasMap.set(`circle-${geocerca.id}`, circle);
  }

  private destroyMap(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.markers.clear();
    this.geocercasMap.clear();
  }

  // Método público para forzar inicialización
  forzarInicializacion(): void {
    console.log('🔄 Forzando inicialización del mapa...');
    this.destroyMap();
    this.initializationAttempts = 0;
    this.mapLoading = true;
    this.mapStatus = 'Reinicializando...';

    setTimeout(() => {
      this.initializeMapDirect();
    }, 500);
  }

  filtrarGeocercas(): void {
    if (!this.searchTerm.trim()) {
      this.geocercasFiltradas = [...this.geocercas];
      return;
    }

    const termino = this.searchTerm.toLowerCase();
    this.geocercasFiltradas = this.geocercas.filter(geocerca =>
      geocerca.nombre.toLowerCase().includes(termino) ||
      geocerca.direccion.toLowerCase().includes(termino) ||
      geocerca.distrito.toLowerCase().includes(termino)
    );
  }

  centrarEnVendedor(): void {
    if (this.map) {
      this.map.setView([this.vendedorSeleccionado.lat, this.vendedorSeleccionado.lng], 15);
    }
  }

  centrarEnGeocerca(geocerca: Geocerca): void {
    if (this.map) {
      this.map.setView([geocerca.latitud, geocerca.longitud], 16);
    }
  }

  toggleGeocerca(geocerca: Geocerca): void {
    geocerca.activa = !geocerca.activa;

    // Actualizar en el mapa
    const circle = this.geocercasMap.get(`circle-${geocerca.id}`);
    if (circle) {
      circle.setStyle({
        fillOpacity: geocerca.activa ? 0.2 : 0.1,
        opacity: geocerca.activa ? 1 : 0.5
      });
    }
  }

  editarGeocerca(geocerca: Geocerca): void {
    console.log('Editar geocerca:', geocerca);
  }

  quitarGeocerca(id: number): void {
    if (confirm('¿Estás seguro de eliminar esta geocerca?')) {
      // Remover del mapa
      const marker = this.markers.get(`geocerca-${id}`);
      const circle = this.geocercasMap.get(`circle-${id}`);

      if (marker && this.map) {
        this.map.removeLayer(marker);
        this.markers.delete(`geocerca-${id}`);
      }

      if (circle && this.map) {
        this.map.removeLayer(circle);
        this.geocercasMap.delete(`circle-${id}`);
      }

      // Remover del array
      this.geocercas = this.geocercas.filter(g => g.id !== id);
      this.filtrarGeocercas();
    }
  }

  agregarGeocerca(): void {
    const nuevaGeocerca: Geocerca = {
      id: Date.now(),
      nombre: `Nueva-${this.geocercas.length + 1}`,
      direccion: 'Nueva dirección',
      centro: 'Centro',
      distrito: 'Huancayo',
      latitud: -12.0669 + (Math.random() - 0.5) * 0.02,
      longitud: -75.2048 + (Math.random() - 0.5) * 0.02,
      radio: 300,
      activa: true,
      color: '#10b981'
    };

    this.geocercas.push(nuevaGeocerca);
    this.filtrarGeocercas();

    // Agregar al mapa si existe
    if (this.map) {
      this.addGeocercaToMap(nuevaGeocerca);
    }
  }

  toggleModoEdicion(): void {
    this.modoEdicion = !this.modoEdicion;
    console.log('Modo edición:', this.modoEdicion ? 'Activado' : 'Desactivado');
  }

  agregarPuntoEnMapa(lat: number, lng: number): void {
    if (!this.map) return;

    const puntoIcon = L.divIcon({
      className: 'custom-punto-marker',
      html: '<div style="background: #ef4444; color: white; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">📌</div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    const marker = L.marker([lat, lng], { icon: puntoIcon }).addTo(this.map);
    marker.bindPopup(`
      <div>
        <h4>Nuevo Punto</h4>
        <p>📍 ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
      </div>
    `);

    this.markers.set(`punto-${Date.now()}`, marker);
    console.log('Punto agregado:', { lat, lng });
  }

  mostrarTodas(): void {
    if (!this.map) return;

    const group = new L.FeatureGroup(Array.from(this.markers.values()));
    this.map.fitBounds(group.getBounds().pad(0.1));
  }

  async obtenerUbicacion(): Promise<void> {
    try {
      if (!navigator.geolocation) {
        alert('Geolocalización no soportada');
        return;
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      if (this.map) {
        this.map.setView([lat, lng], 16);

        const miUbicacionIcon = L.divIcon({
          className: 'custom-ubicacion-marker',
          html: '<div style="background: #10b981; color: white; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">📍</div>',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        const marker = L.marker([lat, lng], { icon: miUbicacionIcon }).addTo(this.map);
        marker.bindPopup('Tu ubicación actual');
        this.markers.set('mi-ubicacion', marker);
      }
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      alert('No se pudo obtener tu ubicación');
    }
  }

  limpiarMapa(): void {
    if (confirm('¿Limpiar todos los puntos del mapa?')) {
      this.destroyMap();
      setTimeout(() => {
        this.forzarInicializacion();
      }, 500);
    }
  }
}
