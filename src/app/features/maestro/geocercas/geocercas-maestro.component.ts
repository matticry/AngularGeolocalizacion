// src/app/features/maestro/geocercas/geocercas-maestro.component.ts
import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';

interface PuntoPoligono {
  lat: number;
  lng: number;
}

interface GeocercaMaestra {
  id: string;
  nombre: string;
  descripcion: string;
  latitud: number;
  longitud: number;
  radio?: number;
  puntos?: PuntoPoligono[];
  color: string;
  tipo: 'comercial' | 'residencial' | 'industrial' | 'publica' | 'especial';
  forma: 'circulo' | 'poligono';
  activa: boolean;
  fechaCreacion: Date;
  zona: string;
  prioridad: 'alta' | 'media' | 'baja';
  alertas: boolean;
}

interface GeocercaEnCreacion {
  puntos: PuntoPoligono[];
  forma: 'circulo' | 'poligono';
  radio: number;
}

@Component({
  selector: 'app-geocercas-maestro',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './geocercas-maestro.component.html',
  styleUrls: ['./geocercas-maestro.component.css']
})
export class GeocercasMaestroComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('mapContainer', { static: false }) mapContainerRef!: ElementRef;

  mapLoading = true;
  mapStatus = 'Inicializando mapa...';
  modoCreacion = false;
  mostrarFormulario = false;
  geocercaEnEdicion: GeocercaMaestra | null = null;
  geocercaSeleccionada: GeocercaMaestra | null = null;
  puntoSeleccionado: { lat: number; lng: number } | null = null;

  // Filtros
  filtroTipo = '';
  filtroEstado = '';
  filtroForma = '';

  // Creación de geocercas
  geocercaCreacion: GeocercaEnCreacion = {
    puntos: [],
    forma: 'circulo',
    radio: 300
  };

  private map: L.Map | null = null;
  private markers: Map<string, L.Marker> = new Map();
  private shapes: Map<string, L.Circle | L.Polygon> = new Map();
  private marcadoresTemporales: L.Marker[] = [];
  private formaTemporalActual: L.Circle | L.Polygon | null = null;

  // Datos (simulando persistencia)
  geocercasMaestras: GeocercaMaestra[] = [
    {
      id: 'gc-001',
      nombre: 'Centro Comercial Plaza Norte',
      descripcion: 'Principal centro comercial de la zona norte',
      latitud: -0.1868,
      longitud: -78.5107,
      radio: 500,
      color: '#3b82f6',
      tipo: 'comercial',
      forma: 'circulo',
      activa: true,
      fechaCreacion: new Date('2024-01-15'),
      zona: 'norte',
      prioridad: 'alta',
      alertas: true
    },
    {
      id: 'gc-002',
      nombre: 'Zona Residencial Las Flores',
      descripcion: 'Área residencial exclusiva',
      latitud: -0.1732,
      longitud: -78.4891,
      radio: 800,
      color: '#10b981',
      tipo: 'residencial',
      forma: 'circulo',
      activa: true,
      fechaCreacion: new Date('2024-02-01'),
      zona: 'oeste',
      prioridad: 'media',
      alertas: false
    },
    {
      id: 'gc-003',
      nombre: 'Polígono Industrial Norte',
      descripcion: 'Zona industrial principal con forma irregular',
      latitud: -0.1567,
      longitud: -78.5488,
      puntos: [
        { lat: -0.1550, lng: -78.5470 },
        { lat: -0.1580, lng: -78.5430 },
        { lat: -0.1590, lng: -78.5510 },
        { lat: -0.1560, lng: -78.5520 }
      ],
      color: '#f59e0b',
      tipo: 'industrial',
      forma: 'poligono',
      activa: false,
      fechaCreacion: new Date('2024-01-20'),
      zona: 'este',
      prioridad: 'baja',
      alertas: false
    }
  ];

  geocercasFiltradas: GeocercaMaestra[] = [];

  // Formulario
  formularioGeocerca: Partial<GeocercaMaestra> = {
    nombre: '',
    descripcion: '',
    latitud: -0.186879,
    longitud: -78.503194,
    radio: 300,
    color: '#3b82f6',
    tipo: 'comercial',
    forma: 'circulo',
    activa: true,
    zona: 'centro',
    prioridad: 'media',
    alertas: true
  };

  constructor(private cdr: ChangeDetectorRef) {
    this.aplicarFiltros();
  }

  ngOnInit(): void {
    console.log('🗂️ Iniciando Maestro de Geocercas con Polígonos...');
    this.cargarDatos();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initializeMap().then(r => {
        this.mapLoading = false;
        this.mapStatus = 'Mapa inicializado';
        this.cdr.detectChanges();
      });
    }, 500);
  }

  ngOnDestroy(): void {
    this.destroyMap();
  }

  get geocercasActivas(): number {
    return this.geocercasMaestras.filter(g => g.activa).length;
  }

  get geocercasInactivas(): number {
    return this.geocercasMaestras.filter(g => !g.activa).length;
  }

  private async initializeMap(): Promise<void> {
    try {
      this.mapLoading = true;
      this.mapStatus = 'Creando mapa...';
      this.cdr.detectChanges();

      const mapContainer = document.getElementById('maestro-map');
      if (!mapContainer) {
        throw new Error('Contenedor del mapa no encontrado');
      }

      mapContainer.innerHTML = '';

      this.map = L.map('maestro-map', {
        center: [-0.186879, -78.503194],
        zoom: 12,
        zoomControl: true,
        attributionControl: false
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(this.map);

      // Eventos del mapa
      this.map.on('click', (e) => {
        if (this.modoCreacion) {
          this.agregarPuntoCreacion(e.latlng.lat, e.latlng.lng);
        } else {
          this.puntoSeleccionado = { lat: e.latlng.lat, lng: e.latlng.lng };
        }
      });

      this.map.on('dblclick', () => {
        if (this.modoCreacion && this.geocercaCreacion.forma === 'poligono') {
          this.finalizarPoligono();
        }
      });

      this.cargarGeocercasEnMapa();

      this.mapStatus = 'Mapa cargado correctamente';
      this.mapLoading = false;
      this.cdr.detectChanges();

    } catch (error) {
      console.error('Error inicializando mapa:', error);
      this.mapStatus = `Error: ${error}`;
      this.mapLoading = false;
      this.cdr.detectChanges();
    }
  }

  private destroyMap(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.markers.clear();
    this.shapes.clear();
    this.marcadoresTemporales = [];
    this.formaTemporalActual = null;
  }

  toggleModoCreacion(): void {
    this.modoCreacion = !this.modoCreacion;
    if (!this.modoCreacion) {
      this.limpiarCreacion();
      this.puntoSeleccionado = null;
      this.mostrarFormulario = false;
    }
    this.mapStatus = this.modoCreacion ? 'Modo creación activo' : 'Mapa listo';
  }

  cambiarForma(forma: 'circulo' | 'poligono'): void {
    this.geocercaCreacion.forma = forma;
    this.limpiarPuntos();
  }

  agregarPuntoCreacion(lat: number, lng: number): void {
    if (!this.map) return;
    if (this.geocercaCreacion.forma === 'circulo' && this.geocercaCreacion.puntos.length > 0) {
      this.limpiarPuntos();
    }
    this.geocercaCreacion.puntos.push({ lat, lng });
    this.agregarMarcadorTemporal(lat, lng);
    this.actualizarFormaTemporal();
  }

  private agregarMarcadorTemporal(lat: number, lng: number): void {
    if (!this.map) return;

    const numero = this.geocercaCreacion.puntos.length;
    const icon = L.divIcon({
      className: 'custom-punto-temporal',
      html: `<div style="background: #3b82f6; color: white; width: 25px; height: 25px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); font-weight: bold; font-size: 12px;">${numero}</div>`,
      iconSize: [25, 25],
      iconAnchor: [12, 12]
    });

    const marker = L.marker([lat, lng], { icon }).addTo(this.map);
    this.marcadoresTemporales.push(marker);
  }

  private actualizarFormaTemporal(): void {
    if (!this.map || this.geocercaCreacion.puntos.length === 0) return;

    if (this.formaTemporalActual) {
      this.map.removeLayer(this.formaTemporalActual);
      this.formaTemporalActual = null;
    }
    if (this.geocercaCreacion.forma === 'circulo' && this.geocercaCreacion.puntos.length === 1) {
      this.actualizarCirculoTemporal();
    } else if (this.geocercaCreacion.forma === 'poligono' && this.geocercaCreacion.puntos.length >= 2) {
      this.actualizarPoligonoTemporal();
    }
  }

  actualizarCirculoTemporal(): void {
    if (!this.map || this.geocercaCreacion.puntos.length === 0) return;

    if (this.formaTemporalActual) {
      this.map.removeLayer(this.formaTemporalActual);
    }

    const punto = this.geocercaCreacion.puntos[0];
    this.formaTemporalActual = L.circle([punto.lat, punto.lng], {
      radius: this.geocercaCreacion.radio,
      color: '#3b82f6',
      fillColor: '#3b82f6',
      fillOpacity: 0.3,
      weight: 2,
      dashArray: '5, 5'
    }).addTo(this.map);
  }

  private actualizarPoligonoTemporal(): void {
    if (!this.map || this.geocercaCreacion.puntos.length < 2) return;

    if (this.formaTemporalActual) {
      this.map.removeLayer(this.formaTemporalActual);
    }

    const latLngs: [number, number][] = this.geocercaCreacion.puntos.map(p => [p.lat, p.lng]);

    this.formaTemporalActual = L.polygon(latLngs, {
      color: '#3b82f6',
      fillColor: '#3b82f6',
      fillOpacity: 0.3,
      weight: 2,
      dashArray: '5, 5'
    }).addTo(this.map);
  }

  finalizarPoligono(): void {
    if (this.geocercaCreacion.puntos.length >= 3) {
      console.log('Polígono finalizado con', this.geocercaCreacion.puntos.length, 'puntos');
    }
  }

  removerPunto(index: number): void {
    this.geocercaCreacion.puntos.splice(index, 1);
    this.limpiarMarcadoresTemporales();
    this.geocercaCreacion.puntos.forEach(punto => {
      this.agregarMarcadorTemporal(punto.lat, punto.lng);
    });

    this.actualizarFormaTemporal();
  }

  limpiarPuntos(): void {
    this.geocercaCreacion.puntos = [];
    this.limpiarMarcadoresTemporales();
    if (this.formaTemporalActual && this.map) {
      this.map.removeLayer(this.formaTemporalActual);
      this.formaTemporalActual = null;
    }
  }

  private limpiarMarcadoresTemporales(): void {
    if (!this.map) return;

    this.marcadoresTemporales.forEach(marker => {
      this.map!.removeLayer(marker);
    });
    this.marcadoresTemporales = [];
  }

  private limpiarCreacion(): void {
    this.limpiarPuntos();
    this.geocercaCreacion = {
      puntos: [],
      forma: 'circulo',
      radio: 300
    };
  }

  puedeCrearGeocerca(): boolean {
    if (this.geocercaCreacion.forma === 'circulo') {
      return this.geocercaCreacion.puntos.length === 1;
    } else {
      return this.geocercaCreacion.puntos.length >= 3;
    }
  }

  confirmarCreacion(): void {
    if (!this.puedeCrearGeocerca()) return;

    const punto = this.geocercaCreacion.puntos[0];
    this.formularioGeocerca = {
      ...this.formularioGeocerca,
      latitud: punto.lat,
      longitud: punto.lng,
      forma: this.geocercaCreacion.forma
    };

    if (this.geocercaCreacion.forma === 'circulo') {
      this.formularioGeocerca.radio = this.geocercaCreacion.radio;
      delete this.formularioGeocerca.puntos;
    } else {
      this.formularioGeocerca.puntos = [...this.geocercaCreacion.puntos];
      delete this.formularioGeocerca.radio;
    }

    this.geocercaEnEdicion = null;
    this.mostrarFormulario = true;
    this.modoCreacion = false;
    this.limpiarCreacion();
  }

  getInstruccionCreacion(): string {
    if (this.geocercaCreacion.forma === 'circulo') {
      return this.geocercaCreacion.puntos.length === 0
        ? 'Haz clic en el mapa para colocar el centro del círculo'
        : 'Ajusta el radio y confirma la creación';
    } else {
      const puntos = this.geocercaCreacion.puntos.length;
      if (puntos === 0) return 'Haz clic en el mapa para agregar puntos del polígono';
      if (puntos < 3) return `${puntos}/3 puntos mínimos requeridos`;
      return 'Doble clic para cerrar o continúa agregando puntos';
    }
  }

  // Gestión de datos
  private cargarDatos(): void {
    const datosGuardados = localStorage.getItem('geocercas-maestras');
    if (datosGuardados) {
      try {
        const datos = JSON.parse(datosGuardados);
        this.geocercasMaestras = datos.map((g: any) => ({
          ...g,
          fechaCreacion: new Date(g.fechaCreacion),
          forma: g.forma || 'circulo' // Retrocompatibilidad
        }));
      } catch (error) {
        console.error('Error cargando datos:', error);
      }
    }
    this.aplicarFiltros();
  }

  guardarDatos(): void {
    try {
      localStorage.setItem('geocercas-maestras', JSON.stringify(this.geocercasMaestras));
      alert('✅ Datos guardados correctamente');
    } catch (error) {
      console.error('Error guardando datos:', error);
      alert('❌ Error al guardar datos');
    }
  }

  exportarDatos(): void {
    const dataStr = JSON.stringify(this.geocercasMaestras, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `geocercas-maestras-${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    URL.revokeObjectURL(url);
  }

  // Gestión del mapa
  private cargarGeocercasEnMapa(): void {
    if (!this.map) return;

    this.geocercasMaestras.forEach(geocerca => {
      this.agregarGeocercaAlMapa(geocerca);
    });
  }

  private agregarGeocercaAlMapa(geocerca: GeocercaMaestra): void {
    if (!this.map) return;

    // Crear marcador
    const formaIcon = geocerca.forma === 'circulo' ? '⭕' : '🔷';
    const icon = L.divIcon({
      className: 'custom-geocerca-marker',
      html: `<div style="background: ${geocerca.color}; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); font-size: 12px; position: relative;">
        ${this.getTipoIcon(geocerca.tipo)}
        <span style="position: absolute; bottom: -2px; right: -2px; background: white; color: ${geocerca.color}; border-radius: 50%; width: 12px; height: 12px; font-size: 8px; display: flex; align-items: center; justify-content: center;">${formaIcon}</span>
      </div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });

    const marker = L.marker([geocerca.latitud, geocerca.longitud], { icon })
      .addTo(this.map);
    marker.bindPopup(`
      <div style="text-align: center; min-width: 200px;">
        <h4 style="margin: 0 0 0.5rem 0; color: ${geocerca.color};">${geocerca.nombre}</h4>
        <p style="margin: 0 0 0.5rem 0; font-size: 0.9rem;">${geocerca.descripcion}</p>
        <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: #666; margin-bottom: 0.5rem;">
          <span><strong>Forma:</strong> ${geocerca.forma === 'circulo' ? 'Círculo' : 'Polígono'}</span>
          <span><strong>${geocerca.forma === 'circulo' ? 'Radio' : 'Puntos'}:</strong> ${geocerca.forma === 'circulo' ? geocerca.radio + 'm' : geocerca.puntos?.length}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: #666;">
          <span><strong>Tipo:</strong> ${geocerca.tipo}</span>
          <span><strong>Zona:</strong> ${geocerca.zona}</span>
        </div>
        <div style="margin-top: 0.5rem;">
          <span style="background: ${geocerca.activa ? '#d1fae5' : '#fee2e2'}; color: ${geocerca.activa ? '#065f46' : '#991b1b'}; padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.7rem;">
            ${geocerca.activa ? '🟢 Activa' : '🔴 Inactiva'}
          </span>
        </div>
      </div>
    `);

    // Crear forma geométrica
    if (geocerca.forma === 'circulo' && geocerca.radio) {
      const circle = L.circle([geocerca.latitud, geocerca.longitud], {
        radius: geocerca.radio,
        color: geocerca.color,
        fillColor: geocerca.color,
        fillOpacity: geocerca.activa ? 0.2 : 0.1,
        weight: 2,
        opacity: geocerca.activa ? 1 : 0.5
      }).addTo(this.map);

      this.shapes.set(geocerca.id, circle);
    } else if (geocerca.forma === 'poligono' && geocerca.puntos) {
      const latLngs: [number, number][] = geocerca.puntos.map(p => [p.lat, p.lng]);

      const polygon = L.polygon(latLngs, {
        color: geocerca.color,
        fillColor: geocerca.color,
        fillOpacity: geocerca.activa ? 0.2 : 0.1,
        weight: 2,
        opacity: geocerca.activa ? 1 : 0.5
      }).addTo(this.map);

      this.shapes.set(geocerca.id, polygon);
    }

    this.markers.set(geocerca.id, marker);

    // Eventos
    marker.on('click', () => {
      this.seleccionarGeocerca(geocerca);
    });
  }

  private removerGeocercaDelMapa(id: string): void {
    const marker = this.markers.get(id);
    const shape = this.shapes.get(id);

    if (marker && this.map) {
      this.map.removeLayer(marker);
      this.markers.delete(id);
    }

    if (shape && this.map) {
      this.map.removeLayer(shape);
      this.shapes.delete(id);
    }
  }

  // Gestión de geocercas
  crearGeocercaEnPunto(): void {
    if (!this.puntoSeleccionado) return;

    this.formularioGeocerca = {
      ...this.formularioGeocerca,
      latitud: this.puntoSeleccionado.lat,
      longitud: this.puntoSeleccionado.lng
    };

    this.geocercaEnEdicion = null;
    this.mostrarFormulario = true;
    this.puntoSeleccionado = null;
  }

  editarGeocerca(geocerca: GeocercaMaestra): void {
    this.geocercaEnEdicion = geocerca;
    this.formularioGeocerca = { ...geocerca };
    this.mostrarFormulario = true;
    this.modoCreacion = false;
    this.limpiarCreacion();
  }

  guardarGeocerca(): void {
    if (!this.formularioGeocerca.nombre || !this.formularioGeocerca.latitud || !this.formularioGeocerca.longitud) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    if (this.formularioGeocerca.forma === 'circulo' && !this.formularioGeocerca.radio) {
      alert('Por favor especifica el radio para el círculo');
      return;
    }

    if (this.formularioGeocerca.forma === 'poligono' && (!this.formularioGeocerca.puntos || this.formularioGeocerca.puntos.length < 3)) {
      alert('Los polígonos necesitan al menos 3 puntos');
      return;
    }

    if (this.geocercaEnEdicion) {
      // Actualizar existente
      const index = this.geocercasMaestras.findIndex(g => g.id === this.geocercaEnEdicion!.id);
      if (index !== -1) {
        this.geocercasMaestras[index] = {
          ...this.geocercaEnEdicion,
          ...this.formularioGeocerca
        } as GeocercaMaestra;

        // Actualizar en mapa
        this.removerGeocercaDelMapa(this.geocercaEnEdicion.id);
        this.agregarGeocercaAlMapa(this.geocercasMaestras[index]);
      }
    } else {
      // Crear nueva
      const nuevaGeocerca: GeocercaMaestra = {
        id: `gc-${Date.now()}`,
        nombre: this.formularioGeocerca.nombre!,
        descripcion: this.formularioGeocerca.descripcion || '',
        latitud: this.formularioGeocerca.latitud!,
        longitud: this.formularioGeocerca.longitud!,
        color: this.formularioGeocerca.color!,
        tipo: this.formularioGeocerca.tipo!,
        forma: this.formularioGeocerca.forma!,
        activa: this.formularioGeocerca.activa!,
        fechaCreacion: new Date(),
        zona: this.formularioGeocerca.zona!,
        prioridad: this.formularioGeocerca.prioridad!,
        alertas: this.formularioGeocerca.alertas!
      };

      if (this.formularioGeocerca.forma === 'circulo') {
        nuevaGeocerca.radio = this.formularioGeocerca.radio!;
      } else {
        nuevaGeocerca.puntos = this.formularioGeocerca.puntos!;
      }

      this.geocercasMaestras.push(nuevaGeocerca);
      this.agregarGeocercaAlMapa(nuevaGeocerca);
    }

    this.aplicarFiltros();
    this.cancelarFormulario();
    alert('✅ Geocerca guardada correctamente');
  }

  cancelarFormulario(): void {
    this.mostrarFormulario = false;
    this.geocercaEnEdicion = null;
    this.formularioGeocerca = {
      nombre: '',
      descripcion: '',
      latitud: -0.186879,
      longitud: -78.503194,
      radio: 300,
      color: '#3b82f6',
      tipo: 'comercial',
      forma: 'circulo',
      activa: true,
      zona: 'centro',
      prioridad: 'media',
      alertas: true
    };
  }

  eliminarGeocerca(geocerca: GeocercaMaestra): void {
    if (confirm(`¿Estás seguro de eliminar la geocerca "${geocerca.nombre}"?`)) {
      this.geocercasMaestras = this.geocercasMaestras.filter(g => g.id !== geocerca.id);
      this.removerGeocercaDelMapa(geocerca.id);
      this.aplicarFiltros();
      alert('✅ Geocerca eliminada correctamente');
    }
  }

  toggleEstadoGeocerca(geocerca: GeocercaMaestra): void {
    geocerca.activa = !geocerca.activa;

    // Actualizar en mapa
    const shape = this.shapes.get(geocerca.id);
    if (shape) {
      shape.setStyle({
        fillOpacity: geocerca.activa ? 0.2 : 0.1,
        opacity: geocerca.activa ? 1 : 0.5
      });
    }

    this.aplicarFiltros();
  }

  seleccionarGeocerca(geocerca: GeocercaMaestra): void {
    this.geocercaSeleccionada = geocerca;
  }

  centrarEnGeocerca(geocerca: GeocercaMaestra): void {
    if (this.map) {
      this.map.setView([geocerca.latitud, geocerca.longitud], 16);
      this.seleccionarGeocerca(geocerca);
    }
  }

  // Filtros
  aplicarFiltros(): void {
    this.geocercasFiltradas = this.geocercasMaestras.filter(geocerca => {
      const matchTipo = !this.filtroTipo || geocerca.tipo === this.filtroTipo;
      const matchEstado = !this.filtroEstado ||
        (this.filtroEstado === 'activa' && geocerca.activa) ||
        (this.filtroEstado === 'inactiva' && !geocerca.activa);
      const matchForma = !this.filtroForma || geocerca.forma === this.filtroForma;

      return matchTipo && matchEstado && matchForma;
    });
  }

  // Controles del mapa
  centrarMapa(): void {
    if (this.map) {
      this.map.setView([-0.186879, -78.503194], 12);
    }
  }

  ajustarVista(): void {
    if (!this.map || this.markers.size === 0) return;

    const group = new L.FeatureGroup(Array.from(this.markers.values()));
    this.map.fitBounds(group.getBounds().pad(0.1));
  }

  limpiarSeleccion(): void {
    this.geocercaSeleccionada = null;
    this.puntoSeleccionado = null;
  }

  // Utilidades
  getTipoIcon(tipo: string): string {
    const iconos = {
      comercial: '🏪',
      residencial: '🏠',
      industrial: '🏭',
      publica: '🏛️',
      especial: '⭐'
    };
    return iconos[tipo as keyof typeof iconos] || '📍';
  }
}
