// src/app/features/reportes/detalles/detalles-registro.component.ts
import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';

interface Registro {
  id: string;
  fecha: string; // 'YYYY-MM-DD'
  horaIngreso: string; // 'HH:mm'
  horaSalida?: string;
  vendedor: string;
  ubicacion: string;
  lat: number;
  lng: number;
  nroPedido?: string | null;
  nroCobro?: string | null;
  cliente?: string;
  pedido?: boolean;
  cobro?: boolean;
  monto?: number;
}

@Component({
  selector: 'app-detalles-registro',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './detalles-registro.component.html',
  styleUrls: ['./detalles-registro.component.css']
})
export class DetallesRegistroComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: false }) mapContainerRef!: ElementRef<HTMLDivElement>;
  map: L.Map | null = null;
  mapLoading = true;
  mapStatus = 'Inicializando mapa...';

  // Filtros
  filtroVendedor = '';
  filtroCliente = '';
  fechaDesde: string = '';
  fechaHasta: string = '';
  mostrarPedidos = true;
  mostrarCobros = true;

  // Datos
  registros: Registro[] = [];
  registrosFiltrados: Registro[] = [];

  // Marcadores
  markers: Map<string, L.Marker> = new Map();

  private STORAGE_KEY = 'detalle-registros';

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.cargarPersistenciaInicial();
    this.configurarFechasPredeterminadas();
    this.aplicarFiltros();
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

  /* -------- Configuración de fechas ---------- */
  private configurarFechasPredeterminadas(): void {
    if (this.registros.length > 0) {
      // Encontrar fecha mínima y máxima de los datos
      const fechas = this.registros.map(r => new Date(r.fecha));
      const fechaMin = new Date(Math.min(...fechas.map(f => f.getTime())));
      const fechaMax = new Date(Math.max(...fechas.map(f => f.getTime())));

      // Añadir un día de margen
      fechaMin.setDate(fechaMin.getDate() - 1);
      fechaMax.setDate(fechaMax.getDate() + 1);

      this.fechaDesde = fechaMin.toISOString().slice(0, 10);
      this.fechaHasta = fechaMax.toISOString().slice(0, 10);
    } else {
      // Fallback a últimos 7 días si no hay datos
      const now = new Date();
      const before = new Date();
      before.setDate(now.getDate() - 7);
      this.fechaDesde = before.toISOString().slice(0, 10);
      this.fechaHasta = now.toISOString().slice(0, 10);
    }
  }

  /* -------- Persistencia / Datos quemados ---------- */
  private cargarPersistenciaInicial(): void {
    try {
      const datosGuardados = localStorage?.getItem(this.STORAGE_KEY);
      if (datosGuardados) {
        const parsed = JSON.parse(datosGuardados) as Registro[];
        this.registros = parsed;
        return;
      }
    } catch (err) {
      console.error('Error parseando registros desde localStorage:', err);
    }

    // Si no hay datos guardados, cargamos "quemados" y los persistimos
    this.registros = this.getRegistrosEjemplo();
    this.guardarPersistencia();
  }

  private guardarPersistencia(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.registros));
      }
    } catch (err) {
      console.error('Error guardando registros en localStorage:', err);
    }
  }

  private getRegistrosEjemplo(): Registro[] {
    return [
      {
        id: 'R-1001',
        fecha: '2025-07-17',
        horaIngreso: '08:30',
        horaSalida: '08:55',
        vendedor: 'PLATAZO LUIS',
        ubicacion: 'Av. Amazonas y Quito, Centro, Quito',
        lat: -0.186879,
        lng: -78.503194,
        nroPedido: 'P-2001',
        nroCobro: null,
        cliente: 'Sebastián Moreno',
        pedido: true,
        cobro: false,
        monto: 120
      },
      {
        id: 'R-1002',
        fecha: '2025-07-17',
        horaIngreso: '09:00',
        horaSalida: '09:15',
        vendedor: 'PLATAZO LUIS',
        ubicacion: 'Calle 10, Norte',
        lat: -0.173200,
        lng: -78.489100,
        nroPedido: null,
        nroCobro: 'C-3001',
        cliente: 'María Guerrero',
        pedido: false,
        cobro: true,
        monto: 50
      },
      {
        id: 'R-1003',
        fecha: '2025-07-18',
        horaIngreso: '10:10',
        horaSalida: '10:40',
        vendedor: 'JUAN CARLOS',
        ubicacion: 'Sector Industrial Norte',
        lat: -0.156700,
        lng: -78.548800,
        nroPedido: 'P-2002',
        nroCobro: 'C-3002',
        cliente: 'Empresa ABC',
        pedido: true,
        cobro: true,
        monto: 300
      },
      {
        id: 'R-1004',
        fecha: '2025-07-18',
        horaIngreso: '11:30',
        horaSalida: '11:45',
        vendedor: 'MARIA PACHECO',
        ubicacion: 'Plaza Centro',
        lat: -0.180000,
        lng: -78.500000,
        nroPedido: 'P-2003',
        nroCobro: null,
        cliente: 'J. Ramirez',
        pedido: true,
        cobro: false,
        monto: 80
      },
      {
        id: 'R-1005',
        fecha: '2025-07-19',
        horaIngreso: '12:05',
        horaSalida: '12:20',
        vendedor: 'CARLOS ORTEGA',
        ubicacion: 'Av. 10 de Agosto',
        lat: -0.170000,
        lng: -78.495000,
        nroPedido: null,
        nroCobro: 'C-3003',
        cliente: 'Ana López',
        pedido: false,
        cobro: true,
        monto: 40
      }
    ];
  }

  /* ---------------- MAPA ---------------- */
  private initializeMap(): void {
    try {
      this.mapStatus = 'Creando mapa...';
      this.mapLoading = true;
      this.cdr.detectChanges();

      // Usar ViewChild en lugar de getElementById
      const el = this.mapContainerRef?.nativeElement;
      if (!el) {
        throw new Error('Elemento del mapa no encontrado');
      }

      el.innerHTML = ''; // Limpiar contenido previo

      const center: [number, number] = this.registros.length > 0
        ? [this.registros[0].lat, this.registros[0].lng]
        : [-0.186879, -78.503194];

      this.map = L.map(el, { center, zoom: 12, attributionControl: false });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      }).addTo(this.map);
      L.control.scale().addTo(this.map);

      this.renderRegistrosEnMapa();

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

  private createMarker(reg: Registro): L.Marker {
    const color = reg.pedido && reg.cobro ? '#f59e0b' : (reg.pedido ? '#10b981' : (reg.cobro ? '#ef4444' : '#3b82f6'));
    const icon = L.divIcon({
      className: 'registro-marker',
      html: `<div style="background:${color}; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-weight:700; border:2px solid #fff;">${reg.vendedor.charAt(0)}</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 28],
      popupAnchor: [0, -28]
    });

    const marker = L.marker([reg.lat, reg.lng], { icon });

    const popup = `
      <div style="min-width:180px">
        <strong>${reg.vendedor}</strong><br/>
        <small>${reg.fecha} ${reg.horaIngreso}${reg.horaSalida ? ' - ' + reg.horaSalida : ''}</small><br/>
        ${reg.cliente ? `<div>Cliente: ${reg.cliente}</div>` : ''}
        ${reg.nroPedido ? `<div>Pedido: ${reg.nroPedido}</div>` : ''}
        ${reg.nroCobro ? `<div>Cobro: ${reg.nroCobro}</div>` : ''}
        <div style="margin-top:6px;color:#374151">Monto: ${reg.monto ?? 0}</div>
      </div>
    `;
    marker.bindPopup(popup);
    return marker;
  }

  // Cambiar de protected a public para poder llamarse desde el template
  public renderRegistrosEnMapa(): void {
    if (!this.map) return;

    // limpiar marcadores anteriores
    this.markers.forEach(m => {
      if (this.map) this.map.removeLayer(m);
    });
    this.markers.clear();

    // sólo mostramos los registros filtrados y respetando toggles pedidos/cobros
    const visibles = this.registrosFiltrados.filter(r => {
      if (!this.mostrarPedidos && r.pedido) return false;
      if (!this.mostrarCobros && r.cobro) return false;
      return true;
    });

    visibles.forEach(r => {
      const m = this.createMarker(r).addTo(this.map!);
      this.markers.set(r.id, m);
    });

    // ajustar vista si hay marcadores
    if (this.markers.size > 0) {
      const group = new L.FeatureGroup(Array.from(this.markers.values()));
      this.map.fitBounds(group.getBounds().pad(0.12));
    }
  }

  centrarEnRegistro(reg: Registro): void {
    if (!this.map) return;
    this.map.setView([reg.lat, reg.lng], 16, { animate: true });
    const m = this.markers.get(reg.id);
    if (m) m.openPopup();
  }

  /* ------------- FILTRADO ------------- */
  aplicarFiltros(): void {
    const desde = this.fechaDesde ? new Date(this.fechaDesde) : null;
    const hasta = this.fechaHasta ? new Date(this.fechaHasta) : null;

    this.registrosFiltrados = this.registros.filter(r => {
      const matchVendedor = !this.filtroVendedor || r.vendedor.toLowerCase().includes(this.filtroVendedor.toLowerCase());
      const matchCliente = !this.filtroCliente || (r.cliente && r.cliente.toLowerCase().includes(this.filtroCliente.toLowerCase()));
      let matchFecha = true;

      if (desde) {
        matchFecha = new Date(r.fecha) >= desde;
      }
      if (matchFecha && hasta) {
        const fechaRegistro = new Date(r.fecha);
        const endOfDay = new Date(hasta);
        endOfDay.setHours(23, 59, 59, 999);
        matchFecha = fechaRegistro <= endOfDay;
      }

      return matchVendedor && matchCliente && matchFecha;
    });

    // actualizar mapa
    this.renderRegistrosEnMapa();
  }

  limpiarFiltros(): void {
    this.filtroVendedor = '';
    this.filtroCliente = '';
    this.mostrarPedidos = true;
    this.mostrarCobros = true;

    // Reconfigurar fechas basándose en los datos
    this.configurarFechasPredeterminadas();
    this.aplicarFiltros();
  }

  /* ------------- EXPORTAR ------------- */
  exportarExcelCSV(): void {
    if (!this.registrosFiltrados || this.registrosFiltrados.length === 0) {
      alert('No hay registros para exportar');
      return;
    }

    const headers = [
      'id','fecha','hora_ingreso','hora_salida','nombre_vendedor','ubicacion','nro_pedido','nro_cobro','nombre_cliente','pedido','cobro','monto'
    ];

    const rows = this.registrosFiltrados.map(r => ([
      r.id,
      r.fecha,
      r.horaIngreso,
      r.horaSalida || '',
      r.vendedor,
      r.ubicacion,
      r.nroPedido || '',
      r.nroCobro || '',
      r.cliente || '',
      r.pedido ? 'X' : '',
      r.cobro ? 'X' : '',
      r.monto != null ? String(r.monto) : ''
    ]));

    const toCsvLine = (arr: string[]) => arr.map(v => {
      if (v.includes(',') || v.includes('"') || v.includes('\n')) {
        return `"${v.replace(/"/g, '""')}"`;
      }
      return v;
    }).join(',');

    const csvContent = [headers, ...rows].map(r => toCsvLine(r)).join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fecha = new Date().toISOString().slice(0,10);
    a.download = `detalle_registros_${fecha}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Método público para permitir persistir manualmente (si en el futuro quieres editar/añadir)
  guardarDatosLocal(): void {
    this.guardarPersistencia();
    alert('✅ Registros guardados en localStorage');
  }
}
