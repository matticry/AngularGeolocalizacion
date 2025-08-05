// src/app/features/configuracion/vendedores/vendedores.component.ts
import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-vendedores-config',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>⚙️ Configuración - Vendedores</h1>
        <p>Administra las configuraciones de vendedores</p>
      </div>
      <div class="content-card">
        <h3>Configuraciones de Vendedores</h3>
        <ul>
          <li>Perfiles de vendedores</li>
          <li>Zonas asignadas</li>
          <li>Permisos de acceso</li>
          <li>Rutas predefinidas</li>
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
export class VendedoresConfigComponent { }
