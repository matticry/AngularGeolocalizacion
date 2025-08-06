// src/app/layout/main-layout.component.ts

import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { AuthService } from '../features/auth/services/auth.service';
import { AuthUser } from '../features/auth/models/auth.models';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Estados reactivos
  sidebarCollapsed = signal(false);
  userMenuOpen = signal(false);
  notificationCount = signal(3);

  // Usuario actual desde AuthService
  currentUser = signal<AuthUser | null>(null);

  // Control de expansión de grupos de navegación
  expandedGroups: { [key: string]: boolean } = {
    configuracion: true, // Abierto por defecto
    maestro: false,
    reportes: false
  };

  // Computed values
  userInitials = computed(() => {
    const user = this.currentUser();
    if (!user) return 'U';

    return user.username
      .split('-')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  });

  userName = computed(() => {
    const user = this.currentUser();
    return user?.username || 'Usuario';
  });

  companyName = computed(() => {
    const user = this.currentUser();
    return user?.empresaSeleccionada?.nomempresa || 'Sin empresa';
  });

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.initializeComponent();
    this.subscribeToAuthChanges();
    this.checkScreenSize();

    // Cerrar menús al hacer click fuera
    document.addEventListener('click', this.closeMenusOnClickOutside.bind(this));
    window.addEventListener('resize', () => this.checkScreenSize());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    document.removeEventListener('click', this.closeMenusOnClickOutside.bind(this));
  }

  private initializeComponent(): void {
    // Obtener usuario actual del AuthService
    const user = this.authService.currentUser;
    if (user) {
      this.currentUser.set(user);
    }
  }

  private subscribeToAuthChanges(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser.set(user);
      });
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.set(!this.sidebarCollapsed());

    // Cerrar menú de usuario si está abierto
    if (this.userMenuOpen()) {
      this.userMenuOpen.set(false);
    }
  }

  toggleUserMenu(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.userMenuOpen.set(!this.userMenuOpen());
  }

  toggleNavGroup(groupName: string): void {
    // Si el sidebar está colapsado, no hacer nada
    if (this.sidebarCollapsed()) {
      return;
    }

    this.expandedGroups[groupName] = !this.expandedGroups[groupName];
  }

  getCurrentPageTitle(): string {
    const path = window.location.pathname;

    // Dashboard
    if (path.includes('/dashboard')) {
      return 'Dashboard Principal';
    }

    // Configuración
    if (path.includes('/configuracion/geolocalizacion')) {
      return 'Configuración - Geolocalización';
    }
    if (path.includes('/configuracion/geocercas')) {
      return 'Configuración - Geocercas';
    }
    if (path.includes('/configuracion/vendedores')) {
      return 'Configuración - Vendedores';
    }
    if (path.includes('/configuracion')) {
      return 'Configuración';
    }

    // Maestro
    if (path.includes('/maestro/geolocalizacion')) {
      return 'Maestro - Geolocalización';
    }
    if (path.includes('/maestro/geocercas')) {
      return 'Maestro - Geocercas';
    }
    if (path.includes('/maestro')) {
      return 'Maestro';
    }

    // Reportes
    if (path.includes('/reportes/vendedores')) {
      return 'Reportes - Vendedores';
    }
    if (path.includes('/reportes/detalles-registro')) {
      return 'Reportes - Detalles de Registro';
    }
    if (path.includes('/reportes')) {
      return 'Reportes';
    }

    return 'Sistema de Geolocalización';
  }

  onLogout(): void {
    // Confirmar logout
    if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
      this.authService.logout();
      this.router.navigate(['/auth/login']);
    }
  }

  onProfileClick(): void {
    this.userMenuOpen.set(false);
    // TODO: Navegar a perfil de usuario
    console.log('Navegar a perfil');
  }

  onSettingsClick(): void {
    this.userMenuOpen.set(false);
    // TODO: Navegar a configuración
    console.log('Navegar a configuración');
  }

  onNotificationClick(): void {
    // TODO: Mostrar panel de notificaciones
    console.log('Mostrar notificaciones');
  }

  private checkScreenSize(): void {
    const isMobile = window.innerWidth < 768;
    if (isMobile && !this.sidebarCollapsed()) {
      this.sidebarCollapsed.set(true);
    }
  }

  private closeMenusOnClickOutside(event: Event): void {
    const target = event.target as HTMLElement;

    // Cerrar menú de usuario si se hace click fuera
    if (this.userMenuOpen() && !target.closest('.user-section')) {
      this.userMenuOpen.set(false);
    }
  }

  // Helper para trackBy en *ngFor (si se usa en el futuro)
  trackByFn(index: number, item: any): any {
    return item.id || index;
  }
}
