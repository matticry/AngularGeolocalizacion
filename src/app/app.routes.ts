// src/app/app.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  // Ruta por defecto - redirige al dashboard
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },

  // Rutas principales con layout
  {
    path: '',
    loadComponent: () => import('./layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      // Dashboard Principal
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },

      // CONFIGURACIÓN - Rutas directas sin children anidados
      {
        path: 'configuracion/geolocalizacion',
        loadComponent: () => import('./features/configuracion/geolocalizacion/geolocalizacion.component').then(m => m.GeolocalizacionConfigComponent)
      },
      {
        path: 'configuracion/geocercas',
        loadComponent: () => import('./features/configuracion/geocercas/geocercas.component').then(m => m.GeocercasConfigComponent)
      },
      {
        path: 'configuracion/vendedores',
        loadComponent: () => import('./features/configuracion/vendedores/vendedores.component').then(m => m.VendedoresConfigComponent)
      },

      // MAESTRO - Rutas directas
      {
        path: 'maestro/geolocalizacion',
        loadComponent: () => import('./features/maestro/geolocalizacion/geolocalizacion-maestro.component').then(m => m.GeolocalizacionMaestroComponent)
      },
      {
        path: 'maestro/geocercas',
        loadComponent: () => import('./features/maestro/geocercas/geocercas-maestro.component').then(m => m.GeocercasMaestroComponent)
      },

      // REPORTES - Rutas directas
      {
        path: 'reportes/vendedores',
        loadComponent: () => import('./features/reportes/geolocalizacion/geolocalizacion-reporte.component').then(m => m.GeolocalizacionReporteComponent)
      },
      {
        path: 'reportes/detalles-registro',
        loadComponent: () => import('./features/reportes/detalles/detalles-registro.component').then(m => m.DetallesRegistroComponent)
      }
    ]
  },


  // Ruta wildcard - redirige al dashboard si la ruta no existe
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
