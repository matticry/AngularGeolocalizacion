// src/app/features/reportes/geolocalizacion/geolocalizacion-reporte.component.ts
import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-geolocalizacion-reporte',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>📈 Reportes - Geolocalización</h1>
        <p>Genera reportes de datos de geolocalización</p>
      </div>
      <div class="content-card">
        <h3>Reportes Disponibles</h3>
        <ul>
          <li>Reporte de ubicaciones visitadas</li>
          <li>Análisis de rutas</li>
          <li>Tiempo en ubicaciones</li>
          <li>Precisión de GPS</li>
        </ul>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 2rem;
      background: #f8fafc;
      min-height: 100vh;
    }
    .page-header {
      margin-bottom: 2rem;
    }
    .page-header h1 {
      color: #1e293b;
      margin-bottom: 0.5rem;
    }
    .page-header p {
      color: #64748b;
    }
    .content-card {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
  `]
})
export class GeolocalizacionReporteComponent { }
