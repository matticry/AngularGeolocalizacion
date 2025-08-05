// src/app/features/configuracion/geolocalizacion/geolocalizacion.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-geolocalizacion-config',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>⚙️ Configuración - Geolocalización</h1>
        <p>Configura los parámetros de geolocalización del sistema</p>
      </div>
      <div class="content-card">
        <h3>Configuraciones Disponibles</h3>
        <ul>
          <li>Precisión GPS</li>
          <li>Intervalo de actualización</li>
          <li>Zona horaria</li>
          <li>Coordenadas por defecto</li>
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
export class GeolocalizacionConfigComponent { }
