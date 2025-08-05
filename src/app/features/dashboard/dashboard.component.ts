// src/app/features/dashboard/dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface LocationData {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  status: 'active' | 'inactive' | 'pending';
  lastUpdate: Date;
  accuracy: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dashboard-container">
      <!-- Dashboard Header -->
      <div class="dashboard-header">
        <div class="header-content">
          <div class="header-title">
            <h1>Gestión de Ubicaciones</h1>
            <p>Administra tu inventario de ubicaciones</p>
          </div>
          <div class="header-actions">
            <button class="action-btn secondary" (click)="exportData()">
              <span class="btn-icon">📤</span>
              Exportar
            </button>
            <button class="action-btn primary" (click)="addLocation()">
              <span class="btn-icon">➕</span>
              Nueva Ubicación
            </button>
          </div>
        </div>
      </div>

      <!-- Statistics Cards -->
      <div class="stats-grid">
        <div class="stat-card total">
          <div class="stat-icon">
            <span class="icon">📍</span>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ totalLocations }}</div>
            <div class="stat-label">Total Ubicaciones</div>
          </div>
        </div>

        <div class="stat-card active">
          <div class="stat-icon">
            <span class="icon">✅</span>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ activeLocations }}</div>
            <div class="stat-label">Activas</div>
          </div>
        </div>

        <div class="stat-card warning">
          <div class="stat-icon">
            <span class="icon">⚠️</span>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ inactiveLocations }}</div>
            <div class="stat-label">Señal Baja</div>
          </div>
        </div>

        <div class="stat-card info">
          <div class="stat-icon">
            <span class="icon">📊</span>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ categories }}</div>
            <div class="stat-label">Categorías</div>
          </div>
        </div>
      </div>

      <!-- Search and Filters -->
      <div class="search-section">
        <div class="search-container">
          <div class="search-input-group">
            <span class="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Buscar por nombre, código o descripción..."
              [(ngModel)]="searchTerm"
              (input)="onSearchChange()"
              class="search-input">
          </div>
          <select class="filter-select" [(ngModel)]="selectedCategory" (change)="onFilterChange()">
            <option value="">Todas las categorías</option>
            <option value="comercial">Comercial</option>
            <option value="residencial">Residencial</option>
            <option value="industrial">Industrial</option>
            <option value="publica">Pública</option>
          </select>
        </div>
      </div>

      <!-- Data Table -->
      <div class="table-section">
        <div class="table-container">
          <div class="table-header">
            <h3>Lista de Ubicaciones</h3>
            <div class="table-actions">
              <button class="table-btn" (click)="refreshData()">
                <span class="btn-icon">🔄</span>
              </button>
              <button class="table-btn" (click)="toggleView()">
                <span class="btn-icon">{{ viewMode === 'grid' ? '📋' : '⚏' }}</span>
              </button>
            </div>
          </div>

          <!-- Empty State -->
          <div class="empty-state" *ngIf="filteredLocations.length === 0">
            <div class="empty-icon">📍</div>
            <h3>No hay ubicaciones</h3>
            <p>No se encontraron ubicaciones que coincidan con los filtros aplicados.</p>
            <button class="action-btn primary" (click)="addLocation()">
              <span class="btn-icon">➕</span>
              Agregar Primera Ubicación
            </button>
          </div>

          <!-- Table View -->
          <div class="table-wrapper" *ngIf="filteredLocations.length > 0 && viewMode === 'table'">
            <table class="data-table">
              <thead>
                <tr>
                  <th>
                    <input type="checkbox" [checked]="allSelected" (change)="toggleSelectAll()">
                  </th>
                  <th>Nombre</th>
                  <th>Dirección</th>
                  <th>Coordenadas</th>
                  <th>Estado</th>
                  <th>Precisión</th>
                  <th>Última Actualización</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let location of filteredLocations; trackBy: trackByLocationId"
                    [class.selected]="selectedLocations.includes(location.id)">
                  <td>
                    <input type="checkbox"
                           [checked]="selectedLocations.includes(location.id)"
                           (change)="toggleLocationSelection(location.id)">
                  </td>
                  <td>
                    <div class="location-name">
                      <strong>{{ location.name }}</strong>
                    </div>
                  </td>
                  <td>
                    <div class="location-address">{{ location.address }}</div>
                  </td>
                  <td>
                    <div class="coordinates">
                      <small>{{ location.latitude | number:'1.6-6' }}, {{ location.longitude | number:'1.6-6' }}</small>
                    </div>
                  </td>
                  <td>
                    <span class="status-badge" [ngClass]="'status-' + location.status">
                      {{ getStatusLabel(location.status) }}
                    </span>
                  </td>
                  <td>
                    <div class="accuracy">
                      <span class="accuracy-value">{{ location.accuracy }}%</span>
                      <div class="accuracy-bar">
                        <div class="accuracy-fill" [style.width.%]="location.accuracy"></div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <small>{{ location.lastUpdate | date:'short':'':'es-ES' }}</small>
                  </td>
                  <td>
                    <div class="action-buttons">
                      <button class="icon-btn view" (click)="viewLocation(location)" title="Ver">
                        👁️
                      </button>
                      <button class="icon-btn edit" (click)="editLocation(location)" title="Editar">
                        ✏️
                      </button>
                      <button class="icon-btn delete" (click)="deleteLocation(location)" title="Eliminar">
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Grid View -->
          <div class="grid-view" *ngIf="filteredLocations.length > 0 && viewMode === 'grid'">
            <div class="location-card" *ngFor="let location of filteredLocations; trackBy: trackByLocationId">
              <div class="card-header">
                <h4>{{ location.name }}</h4>
                <span class="status-badge" [ngClass]="'status-' + location.status">
                  {{ getStatusLabel(location.status) }}
                </span>
              </div>
              <div class="card-content">
                <p class="address">📍 {{ location.address }}</p>
                <div class="coordinates">
                  <small>{{ location.latitude | number:'1.6-6' }}, {{ location.longitude | number:'1.6-6' }}</small>
                </div>
                <div class="accuracy">
                  <span>Precisión: {{ location.accuracy }}%</span>
                  <div class="accuracy-bar">
                    <div class="accuracy-fill" [style.width.%]="location.accuracy"></div>
                  </div>
                </div>
              </div>
              <div class="card-actions">
                <button class="icon-btn view" (click)="viewLocation(location)">👁️</button>
                <button class="icon-btn edit" (click)="editLocation(location)">✏️</button>
                <button class="icon-btn delete" (click)="deleteLocation(location)">🗑️</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div class="pagination-section" *ngIf="filteredLocations.length > 0">
          <div class="pagination-info">
            Mostrando {{ startIndex + 1 }} - {{ endIndex }} de {{ totalResults }} registros
          </div>
          <div class="pagination-controls">
            <select [(ngModel)]="itemsPerPage" (change)="onItemsPerPageChange()" class="items-select">
              <option value="5">5 registros</option>
              <option value="10">10 registros</option>
              <option value="25">25 registros</option>
              <option value="50">50 registros</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      background: linear-gradient(135deg, #a7f3d0 0%, #6ee7b7 100%);
      min-height: 100vh;
      padding: 2rem;
    }

    .dashboard-header {
      margin-bottom: 2rem;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 2rem;
    }

    .header-title h1 {
      font-size: 2rem;
      font-weight: 700;
      color: #064e3b;
      margin: 0 0 0.5rem 0;
    }

    .header-title p {
      color: #047857;
      margin: 0;
      font-size: 1.1rem;
    }

    .header-actions {
      display: flex;
      gap: 1rem;
    }

    .action-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 0.9rem;
    }

    .action-btn.primary {
      background: #059669;
      color: white;
      box-shadow: 0 2px 4px rgba(5, 150, 105, 0.3);
    }

    .action-btn.primary:hover {
      background: #047857;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(5, 150, 105, 0.4);
    }

    .action-btn.secondary {
      background: white;
      color: #059669;
      border: 1px solid #d1fae5;
    }

    .action-btn.secondary:hover {
      background: #f0fdf4;
      transform: translateY(-1px);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s ease;
    }

    .stat-card:hover {
      transform: translateY(-2px);
    }

    .stat-icon {
      width: 60px;
      height: 60px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }

    .stat-card.total .stat-icon { background: #dbeafe; }
    .stat-card.active .stat-icon { background: #d1fae5; }
    .stat-card.warning .stat-icon { background: #fef3c7; }
    .stat-card.info .stat-icon { background: #e0e7ff; }

    .stat-content {
      flex: 1;
    }

    .stat-number {
      font-size: 2rem;
      font-weight: 700;
      color: #1f2937;
      line-height: 1;
    }

    .stat-label {
      color: #6b7280;
      font-size: 0.9rem;
      margin-top: 0.25rem;
    }

    .search-section {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 2rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    .search-container {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .search-input-group {
      flex: 1;
      position: relative;
    }

    .search-icon {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: #6b7280;
    }

    .search-input {
      width: 100%;
      padding: 0.75rem 1rem 0.75rem 2.5rem;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 0.9rem;
      transition: border-color 0.2s ease;
    }

    .search-input:focus {
      outline: none;
      border-color: #059669;
      box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1);
    }

    .filter-select {
      padding: 0.75rem 1rem;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      background: white;
      font-size: 0.9rem;
      min-width: 200px;
    }

    .table-section {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .table-header {
      padding: 1.5rem;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .table-header h3 {
      margin: 0;
      color: #1f2937;
      font-weight: 600;
    }

    .table-actions {
      display: flex;
      gap: 0.5rem;
    }

    .table-btn {
      background: none;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      padding: 0.5rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .table-btn:hover {
      background: #f9fafb;
      border-color: #059669;
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      color: #6b7280;
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      color: #374151;
      margin-bottom: 0.5rem;
    }

    .table-wrapper {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
    }

    .data-table th,
    .data-table td {
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }

    .data-table th {
      background: #f9fafb;
      font-weight: 600;
      color: #374151;
      font-size: 0.9rem;
    }

    .data-table tr:hover {
      background: #f9fafb;
    }

    .data-table tr.selected {
      background: #ecfdf5;
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .status-active {
      background: #d1fae5;
      color: #065f46;
    }

    .status-inactive {
      background: #fee2e2;
      color: #991b1b;
    }

    .status-pending {
      background: #fef3c7;
      color: #92400e;
    }

    .accuracy {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .accuracy-bar {
      width: 60px;
      height: 4px;
      background: #e5e7eb;
      border-radius: 2px;
      overflow: hidden;
    }

    .accuracy-fill {
      height: 100%;
      background: linear-gradient(135deg, #10b981, #059669);
      transition: width 0.3s ease;
    }

    .action-buttons {
      display: flex;
      gap: 0.5rem;
    }

    .icon-btn {
      background: none;
      border: none;
      padding: 0.375rem;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 0.9rem;
    }

    .icon-btn.view:hover { background: #dbeafe; }
    .icon-btn.edit:hover { background: #fef3c7; }
    .icon-btn.delete:hover { background: #fee2e2; }

    .grid-view {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
      padding: 1.5rem;
    }

    .location-card {
      background: #f9fafb;
      border-radius: 8px;
      padding: 1.5rem;
      border: 1px solid #e5e7eb;
      transition: transform 0.2s ease;
    }

    .location-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }

    .card-header h4 {
      margin: 0;
      color: #1f2937;
    }

    .card-content {
      margin-bottom: 1rem;
    }

    .address {
      color: #6b7280;
      margin: 0.5rem 0;
    }

    .coordinates {
      color: #9ca3af;
      font-size: 0.8rem;
      margin-bottom: 0.5rem;
    }

    .card-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }

    .pagination-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-top: 1px solid #e5e7eb;
    }

    .pagination-info {
      color: #6b7280;
      font-size: 0.9rem;
    }

    .items-select {
      padding: 0.5rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      background: white;
      font-size: 0.9rem;
    }

    @media (max-width: 768px) {
      .dashboard-container {
        padding: 1rem;
      }

      .header-content {
        flex-direction: column;
        gap: 1rem;
      }

      .search-container {
        flex-direction: column;
      }

      .filter-select {
        min-width: auto;
      }

      .table-wrapper {
        font-size: 0.8rem;
      }

      .stats-grid {
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  // Statistics
  totalLocations = 247;
  activeLocations = 189;
  inactiveLocations = 23;
  categories = 8;

  // Search and filters
  searchTerm = '';
  selectedCategory = '';
  viewMode: 'table' | 'grid' = 'table';
  itemsPerPage = 10;

  // Selection
  selectedLocations: number[] = [];
  allSelected = false;

  // Mock data
  locations: LocationData[] = [
    {
      id: 1,
      name: 'Centro Comercial Plaza Norte',
      address: 'Av. Tupac Amaru 899, Independencia',
      latitude: -12.0464,
      longitude: -77.0428,
      status: 'active',
      lastUpdate: new Date('2024-08-05T10:30:00'),
      accuracy: 98.5
    },
    {
      id: 2,
      name: 'Parque de las Leyendas',
      address: 'Av. Las Leyendas s/n, San Miguel',
      latitude: -12.0732,
      longitude: -77.0891,
      status: 'active',
      lastUpdate: new Date('2024-08-05T09:15:00'),
      accuracy: 95.2
    },
    {
      id: 3,
      name: 'Hospital Nacional Dos de Mayo',
      address: 'Av. Grau 13, Cercado de Lima',
      latitude: -12.0567,
      longitude: -77.0488,
      status: 'pending',
      lastUpdate: new Date('2024-08-04T16:45:00'),
      accuracy: 87.3
    },
    {
      id: 4,
      name: 'Universidad Nacional Mayor de San Marcos',
      address: 'Av. Venezuela 3400, Lima',
      latitude: -12.0539,
      longitude: -77.0843,
      status: 'inactive',
      lastUpdate: new Date('2024-08-03T14:20:00'),
      accuracy: 76.8
    },
    {
      id: 5,
      name: 'Aeropuerto Jorge Chávez',
      address: 'Av. Elmer Faucett s/n, Callao',
      latitude: -12.0219,
      longitude: -77.1143,
      status: 'active',
      lastUpdate: new Date('2024-08-05T11:00:00'),
      accuracy: 99.1
    }
  ];

  filteredLocations: LocationData[] = [];
  totalResults = 0;
  startIndex = 0;
  endIndex = 0;

  constructor() { }

  ngOnInit(): void {
    this.updateFilteredLocations();
  }

  // Search and filter methods
  onSearchChange(): void {
    this.updateFilteredLocations();
  }

  onFilterChange(): void {
    this.updateFilteredLocations();
  }

  private updateFilteredLocations(): void {
    let filtered = [...this.locations];

    // Apply search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(location =>
        location.name.toLowerCase().includes(term) ||
        location.address.toLowerCase().includes(term)
      );
    }

    // Apply category filter
    if (this.selectedCategory) {
      // This would be implemented based on actual category field
      // For now, just showing the structure
    }

    this.filteredLocations = filtered;
    this.totalResults = filtered.length;
    this.updatePagination();
  }

  private updatePagination(): void {
    this.startIndex = 0;
    this.endIndex = Math.min(this.itemsPerPage, this.totalResults);
  }

  onItemsPerPageChange(): void {
    this.updatePagination();
  }

  // Selection methods
  toggleLocationSelection(locationId: number): void {
    const index = this.selectedLocations.indexOf(locationId);
    if (index > -1) {
      this.selectedLocations.splice(index, 1);
    } else {
      this.selectedLocations.push(locationId);
    }
    this.updateSelectAllState();
  }

  toggleSelectAll(): void {
    if (this.allSelected) {
      this.selectedLocations = [];
    } else {
      this.selectedLocations = this.filteredLocations.map(loc => loc.id);
    }
    this.updateSelectAllState();
  }

  private updateSelectAllState(): void {
    this.allSelected = this.selectedLocations.length === this.filteredLocations.length;
  }

  // Action methods
  addLocation(): void {
    console.log('Agregar nueva ubicación');
    // Implement add location logic
  }

  exportData(): void {
    console.log('Exportar datos');
    // Implement export logic
  }

  viewLocation(location: LocationData): void {
    console.log('Ver ubicación:', location);
    // Implement view logic
  }

  editLocation(location: LocationData): void {
    console.log('Editar ubicación:', location);
    // Implement edit logic
  }

  deleteLocation(location: LocationData): void {
    console.log('Eliminar ubicación:', location);
    // Implement delete logic
  }

  refreshData(): void {
    console.log('Refrescar datos');
    // Implement refresh logic
  }

  toggleView(): void {
    this.viewMode = this.viewMode === 'table' ? 'grid' : 'table';
  }

  // Utility methods
  getStatusLabel(status: string): string {
    const labels = {
      'active': 'Activa',
      'inactive': 'Inactiva',
      'pending': 'Pendiente'
    };
    return labels[status as keyof typeof labels] || status;
  }

  trackByLocationId(index: number, location: LocationData): number {
    return location.id;
  }
}
