// src/app/features/dashboard/dashboard.component.ts

import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatRippleModule } from '@angular/material/core';

import { AuthService } from '../auth/services/auth.service';

interface StatCard {
  id: string;
  title: string;
  value: string;
  icon: string;
  color: string;
  bgGradient: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  description: string;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  color: string;
  bgGradient: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatRippleModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  // Datos del usuario
  currentUser = signal<any>(null);

  // Computed values
  userName = computed(() => {
    const user = this.currentUser();
    return user?.username || 'Usuario';
  });

  companyName = computed(() => {
    const user = this.currentUser();
    return user?.empresaSeleccionada?.nomempresa || 'Sin empresa';
  });

  userInitials = computed(() => {
    const user = this.currentUser();
    if (!user) return 'U';

    return user.username
      .split('-')
      .map((part: string) => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  });

  tokenPreview = computed(() => {
    const user = this.currentUser();
    return user?.token ? `...${user.token.slice(-12)}` : '';
  });

  // Datos de estadísticas
  statsCards = signal<StatCard[]>([
    {
      id: 'geocercas',
      title: 'Geocercas Activas',
      value: '24',
      icon: 'location_on',
      color: '#1976d2',
      bgGradient: 'linear-gradient(135deg, #1976d2, #1565c0)',
      change: '+12%',
      changeType: 'positive',
      description: 'Zonas de trabajo definidas'
    },
    {
      id: 'vendedores',
      title: 'Vendedores',
      value: '18',
      icon: 'people',
      color: '#388e3c',
      bgGradient: 'linear-gradient(135deg, #388e3c, #2e7d32)',
      change: '+3',
      changeType: 'positive',
      description: 'Personal activo en campo'
    },
    {
      id: 'registros',
      title: 'Registros Hoy',
      value: '87',
      icon: 'assessment',
      color: '#f57c00',
      bgGradient: 'linear-gradient(135deg, #f57c00, #ef6c00)',
      change: '+24%',
      changeType: 'positive',
      description: 'Actividades registradas'
    },
    {
      id: 'cobertura',
      title: 'Cobertura',
      value: '94%',
      icon: 'public',
      color: '#7b1fa2',
      bgGradient: 'linear-gradient(135deg, #7b1fa2, #6a1b9a)',
      change: '+5%',
      changeType: 'positive',
      description: 'Áreas cubiertas efectivamente'
    }
  ]);

  // Acciones rápidas
  quickActions = signal<QuickAction[]>([
    {
      id: 'geocercas',
      title: 'Gestionar Geocercas',
      description: 'Configurar zonas de trabajo y límites geográficos',
      icon: 'add_location',
      route: '/configuracion/geocercas',
      color: '#1976d2',
      bgGradient: 'linear-gradient(135deg, #e3f2fd, #bbdefb)'
    },
    {
      id: 'vendedores',
      title: 'Gestionar Vendedores',
      description: 'Administrar personal y asignaciones',
      icon: 'person_add',
      route: '/configuracion/vendedores',
      color: '#388e3c',
      bgGradient: 'linear-gradient(135deg, #e8f5e8, #c8e6c9)'
    },
    {
      id: 'reportes',
      title: 'Ver Reportes',
      description: 'Análisis detallado de actividades y rendimiento',
      icon: 'analytics',
      route: '/reportes/detalles-registro',
      color: '#f57c00',
      bgGradient: 'linear-gradient(135deg, #fff3e0, #ffe0b2)'
    },
    {
      id: 'geolocalizacion',
      title: 'Configurar Sistema',
      description: 'Ajustes generales de geolocalización',
      icon: 'settings',
      route: '/configuracion/geolocalizacion',
      color: '#7b1fa2',
      bgGradient: 'linear-gradient(135deg, #f3e5f5, #e1bee7)'
    }
  ]);

  // Actividad reciente simulada
  recentActivity = signal<any[]>([
    {
      id: 1,
      user: 'Carlos M.',
      action: 'Ingresó a geocerca Centro',
      time: 'Hace 5 min',
      type: 'entry',
      icon: 'login'
    },
    {
      id: 2,
      user: 'Ana L.',
      action: 'Completó visita cliente',
      time: 'Hace 12 min',
      type: 'success',
      icon: 'check_circle'
    },
    {
      id: 3,
      user: 'Roberto S.',
      action: 'Salió de geocerca Norte',
      time: 'Hace 18 min',
      type: 'exit',
      icon: 'logout'
    }
  ]);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserData();
  }

  private loadUserData(): void {
    const user = this.authService.currentUser;
    if (user) {
      this.currentUser.set(user);
    }
  }

  // Navegación a acciones rápidas
  onQuickAction(action: QuickAction): void {
    console.log(`Navegando a: ${action.route}`);
    this.router.navigate([action.route]);
  }

  // Navegación a detalle de estadística
  onStatClick(stat: StatCard): void {
    switch (stat.id) {
      case 'geocercas':
        this.router.navigate(['/maestro/geocercas']);
        break;
      case 'vendedores':
        this.router.navigate(['/reportes/vendedores']);
        break;
      case 'registros':
        this.router.navigate(['/reportes/detalles-registro']);
        break;
      case 'cobertura':
        this.router.navigate(['/maestro/geolocalizacion']);
        break;
      default:
        console.log(`Click en estadística: ${stat.title}`);
    }
  }

  // Helper para obtener clase CSS de cambio
  getChangeClass(changeType: string): string {
    switch (changeType) {
      case 'positive':
        return 'change-positive';
      case 'negative':
        return 'change-negative';
      default:
        return 'change-neutral';
    }
  }

  // Helper para obtener ícono de actividad
  getActivityIcon(type: string): string {
    switch (type) {
      case 'entry':
        return 'login';
      case 'exit':
        return 'logout';
      case 'success':
        return 'check_circle';
      default:
        return 'info';
    }
  }

  // Helper para obtener clase CSS de actividad
  getActivityClass(type: string): string {
    switch (type) {
      case 'entry':
        return 'activity-entry';
      case 'exit':
        return 'activity-exit';
      case 'success':
        return 'activity-success';
      default:
        return 'activity-default';
    }
  }

  // Métodos para mostrar información dinámica
  getCurrentDay(): string {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[new Date().getDay()];
  }

  getCurrentDate(): string {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const now = new Date();
    return `${now.getDate()} de ${months[now.getMonth()]}, ${now.getFullYear()}`;
  }

  getActiveToday(): number {
    // Simular datos - en producción vendría de un servicio
    return 16;
  }

  getAlerts(): number {
    // Simular datos - en producción vendría de un servicio
    return 3;
  }

  getEfficiency(): number {
    // Simular datos - en producción vendría de un servicio
    return 94;
  }

  getLastUpdate(): string {
    return new Date().toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTokenExpiry(): string {
    // Calcular expiración del token (simulado)
    const now = new Date();
    now.setHours(now.getHours() + 2); // Token expira en 2 horas
    return now.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
