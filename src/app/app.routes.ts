// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/auth/login',
    pathMatch: 'full'
  },

  // Rutas de autenticación (SIN GUARD)
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/components/login/login.component').then(c => c.LoginComponent),
        title: 'Iniciar Sesión'
      }
    ]
  },

  // Rutas principales con layout (CON GUARD) 🔒
  {
    path: '',
    loadComponent: () => import('./layout/main-layout.component').then(m => m.MainLayoutComponent),
    canActivate: [authGuard], // ← GUARD APLICADO A TODO EL LAYOUT
    children: [
      // Dashboard Principal
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
        title: 'Dashboard'
      },

      // CONFIGURACIÓN - Rutas directas sin children anidados
      {
        path: 'configuracion/geolocalizacion',
        loadComponent: () => import('./features/configuracion/geolocalizacion/geolocalizacion.component').then(m => m.GeolocalizacionConfigComponent),
        title: 'Configuración - Geolocalización'
      },
      {
        path: 'configuracion/geocercas',
        loadComponent: () => import('./features/configuracion/geocercas/geocercas.component').then(m => m.GeocercasConfigComponent),
        title: 'Configuración - Geocercas'
      },
      {
        path: 'configuracion/vendedores',
        loadComponent: () => import('./features/configuracion/vendedores/vendedores.component').then(m => m.VendedoresConfigComponent),
        title: 'Configuración - Vendedores'
      },

      // MAESTRO - Rutas directas
      {
        path: 'maestro/geolocalizacion',
        loadComponent: () => import('./features/maestro/geolocalizacion/geolocalizacion-maestro.component').then(m => m.GeolocalizacionMaestroComponent),
        title: 'Maestro - Geolocalización'
      },
      {
        path: 'maestro/geocercas',
        loadComponent: () => import('./features/maestro/geocercas/geocercas-maestro.component').then(m => m.GeocercasMaestroComponent),
        title: 'Maestro - Geocercas'
      },

      // REPORTES - Rutas directas
      {
        path: 'reportes/vendedores',
        loadComponent: () => import('./features/reportes/geolocalizacion/geolocalizacion-reporte.component').then(m => m.GeolocalizacionReporteComponent),
        title: 'Reportes - Vendedores'
      },
      {
        path: 'reportes/detalles-registro',
        loadComponent: () => import('./features/reportes/detalles/detalles-registro.component').then(m => m.DetallesRegistroComponent),
        title: 'Reportes - Detalles de Registro'
      }
    ]
  },

  // Ruta wildcard - redirige al login si la ruta no existe
  {
    path: '**',
    redirectTo: '/auth/login'
  }
];
