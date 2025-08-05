// src/app/features/reportes/detalles/detalles-registro.component.ts
import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-detalles-registro',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>📈 Reportes - Detalles del Registro</h1>
        <p>Consulta detalles específicos de registros</p>
      </div>
      <div class="content-card">
        <h3>Detalles de Registros</h3>
        <ul>
          <li>Logs de geolocalización</li>
          <li>Historial de movimientos</li>
          <li>Registros de eventos</li>
          <li>Auditoría de cambios</li>
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
export class DetallesRegistroComponent { }
