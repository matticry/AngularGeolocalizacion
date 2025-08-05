// src/app/layout/main-layout.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule],
  template: `
    <div class="layout-container">
      <!-- Sidebar -->
      <aside class="sidebar" [class.sidebar-collapsed]="sidebarCollapsed">
        <div class="sidebar-header">
          <div class="logo" [class.logo-collapsed]="sidebarCollapsed">
            <span class="logo-icon">🌍</span>
            <span class="logo-text" *ngIf="!sidebarCollapsed">Sistema de Geolocalización</span>
          </div>
        </div>

        <nav class="sidebar-nav">
          <ul class="nav-list">

            <!-- Separador -->
            <li class="nav-divider" *ngIf="!sidebarCollapsed"></li>

            <!-- CONFIGURACIÓN -->
            <li class="nav-item nav-group">
              <div class="nav-link nav-group-header"
                   (click)="toggleNavGroup('configuracion')"
                   [class.active]="expandedGroups['configuracion']"
                   [title]="sidebarCollapsed ? 'Configuración' : ''">
                <div class="nav-main-content">
                  <span class="nav-icon">⚙️</span>
                  <span class="nav-text" *ngIf="!sidebarCollapsed">Configuración</span>
                </div>
                <span class="nav-arrow" *ngIf="!sidebarCollapsed"
                      [class.nav-arrow-expanded]="expandedGroups['configuracion']">▼</span>
              </div>
              <ul class="nav-sublist" *ngIf="!sidebarCollapsed && expandedGroups['configuracion']">
                <li class="nav-subitem">
                  <a routerLink="/configuracion/geolocalizacion"
                     routerLinkActive="active"
                     class="nav-sublink">
                    <span class="nav-subicon">📍</span>
                    <span class="nav-subtext">Geolocalización</span>
                  </a>
                </li>
                <li class="nav-subitem">
                  <a routerLink="/configuracion/geocercas"
                     routerLinkActive="active"
                     class="nav-sublink">
                    <span class="nav-subicon">🔵</span>
                    <span class="nav-subtext">Geocercas y Vendedores</span>
                  </a>
                </li>
              </ul>
            </li>

            <!-- MAESTRO -->
            <li class="nav-item nav-group">
              <div class="nav-link nav-group-header"
                   (click)="toggleNavGroup('maestro')"
                   [class.active]="expandedGroups['maestro']"
                   [title]="sidebarCollapsed ? 'Maestro' : ''">
                <div class="nav-main-content">
                  <span class="nav-icon">🗂️</span>
                  <span class="nav-text" *ngIf="!sidebarCollapsed">Maestro</span>
                </div>
                <span class="nav-arrow" *ngIf="!sidebarCollapsed"
                      [class.nav-arrow-expanded]="expandedGroups['maestro']">▼</span>
              </div>
              <ul class="nav-sublist" *ngIf="!sidebarCollapsed && expandedGroups['maestro']">
                <li class="nav-subitem">
                  <a routerLink="/maestro/geolocalizacion"
                     routerLinkActive="active"
                     class="nav-sublink">
                    <span class="nav-subicon">🌍</span>
                    <span class="nav-subtext">Geolocalización</span>
                  </a>
                </li>
                <li class="nav-subitem">
                  <a routerLink="/maestro/geocercas"
                     routerLinkActive="active"
                     class="nav-sublink">
                    <span class="nav-subicon">📐</span>
                    <span class="nav-subtext">Geocercas</span>
                  </a>
                </li>
              </ul>
            </li>

            <!-- REPORTES -->
            <li class="nav-item nav-group">
              <div class="nav-link nav-group-header"
                   (click)="toggleNavGroup('reportes')"
                   [class.active]="expandedGroups['reportes']"
                   [title]="sidebarCollapsed ? 'Reportes' : ''">
                <div class="nav-main-content">
                  <span class="nav-icon">📈</span>
                  <span class="nav-text" *ngIf="!sidebarCollapsed">Reportes</span>
                </div>
                <span class="nav-arrow" *ngIf="!sidebarCollapsed"
                      [class.nav-arrow-expanded]="expandedGroups['reportes']">▼</span>
              </div>
              <ul class="nav-sublist" *ngIf="!sidebarCollapsed && expandedGroups['reportes']">
                <li class="nav-subitem">
                  <a routerLink="/reportes/vendedores"
                     routerLinkActive="active"
                     class="nav-sublink">
                    <span class="nav-subicon">👥</span>
                    <span class="nav-subtext">Vendedores</span>
                  </a>
                </li>
                <li class="nav-subitem">
                  <a routerLink="/reportes/detalles-registro"
                     routerLinkActive="active"
                     class="nav-sublink">
                    <span class="nav-subicon">📋</span>
                    <span class="nav-subtext">Detalles Registro</span>
                  </a>
                </li>
              </ul>
            </li>
          </ul>
        </nav>
      </aside>

      <!-- Main Content Area -->
      <div class="main-content" [class.content-expanded]="sidebarCollapsed">
        <!-- Header -->
        <header class="main-header">
          <div class="header-left">
            <button class="hamburger-btn" (click)="toggleSidebar()">
              <span class="hamburger-lines">
                <span></span>
                <span></span>
                <span></span>
              </span>
            </button>
            <div class="breadcrumb">
              <span class="breadcrumb-text">{{ getCurrentPageTitle() }}</span>
            </div>
          </div>

          <div class="header-right">
            <div class="header-actions">
              <button class="header-btn" title="Notificaciones">
                <span class="header-icon">🔔</span>
                <span class="notification-badge" *ngIf="notificationCount > 0">{{ notificationCount }}</span>
              </button>

              <div class="user-section">
                <div class="user-info" (click)="toggleUserMenu()">
                  <span class="user-name">{{ currentUser.name }}</span>
                  <div class="user-avatar">
                    <span>{{ userInitials }}</span>
                  </div>
                </div>

                <div class="user-dropdown" *ngIf="userMenuOpen">
                  <a href="#" class="dropdown-item">👤 Mi Perfil</a>
                  <a href="#" class="dropdown-item">⚙️ Configuración</a>
                  <div class="dropdown-divider"></div>
                  <a href="#" class="dropdown-item logout">🚪 Cerrar Sesión</a>
                </div>
              </div>
            </div>
          </div>
        </header>

        <!-- Page Content -->
        <main class="page-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .layout-container {
      display: flex;
      height: 100vh;
      background: #f5f5f5;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    /* SIDEBAR STYLES */
    .sidebar {
      width: 250px;
      background: #ffffff;
      border-right: 1px solid #d1d5db;
      transition: width 0.3s ease;
      position: relative;
      z-index: 1000;
      box-shadow: 2px 0 4px rgba(0, 0, 0, 0.05);
    }

    .sidebar-collapsed {
      width: 60px;
    }

    .sidebar-header {
      padding: 1rem;
      border-bottom: 1px solid #e5e7eb;
      background: #fafafa;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      transition: all 0.3s ease;
    }

    .logo-collapsed {
      justify-content: center;
    }

    .logo-icon {
      font-size: 1.5rem;
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      width: 35px;
      height: 35px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .logo-text {
      font-size: 0.9rem;
      font-weight: 600;
      color: #374151;
      line-height: 1.2;
    }

    .sidebar-nav {
      padding: 0.5rem 0;
      overflow-y: auto;
      height: calc(100vh - 70px);
    }

    .nav-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .nav-item {
      margin-bottom: 2px;
    }

    .nav-link {
      display: flex;
      align-items: center;
      padding: 0.75rem 1rem;
      color: #6b7280;
      text-decoration: none;
      transition: all 0.2s ease;
      position: relative;
      font-size: 0.9rem;
    }

    .nav-link:hover {
      background: #f3f4f6;
      color: #374151;
    }

    .nav-link.active {
      background: #dbeafe;
      color: #1d4ed8;
      font-weight: 500;
      border-right: 3px solid #3b82f6;
    }

    .nav-main-content {
      display: flex;
      align-items: center;
      flex: 1;
    }

    .nav-icon {
      font-size: 1.1rem;
      width: 20px;
      display: flex;
      justify-content: center;
      margin-right: 0.75rem;
      flex-shrink: 0;
    }

    .nav-text {
      font-weight: 500;
      flex: 1;
    }

    .sidebar-collapsed .nav-link {
      justify-content: center;
      padding: 0.75rem;
    }

    .sidebar-collapsed .nav-icon {
      margin-right: 0;
    }

    /* Navigation Groups and Subsections */
    .nav-divider {
      height: 1px;
      background: #e5e7eb;
      margin: 0.75rem 0;
    }

    .nav-group {
      margin-bottom: 2px;
    }

    .nav-group-header {
      display: flex !important;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      font-weight: 500;
      color: #374151;
      border-radius: 0;
    }

    .nav-group-header:hover {
      background: #f3f4f6;
      color: #374151;
    }

    .nav-group-header.active {
      background: #f3f4f6;
      color: #1d4ed8;
      border-right: none;
    }

    .nav-arrow {
      font-size: 0.7rem;
      transition: transform 0.2s ease;
      color: #9ca3af;
      margin-left: 0.5rem;
    }

    .nav-arrow-expanded {
      transform: rotate(180deg);
    }

    .nav-sublist {
      list-style: none;
      margin: 0;
      padding: 0;
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
    }

    .nav-subitem {
      margin-bottom: 1px;
    }

    .nav-sublink {
      display: flex;
      align-items: center;
      padding: 0.6rem 1rem 0.6rem 2.5rem;
      color: #6b7280;
      text-decoration: none;
      transition: all 0.2s ease;
      border-radius: 0;
      font-size: 0.85rem;
    }

    .nav-sublink:hover {
      background: #f3f4f6;
      color: #374151;
    }

    .nav-sublink.active {
      background: #dbeafe;
      color: #1d4ed8;
      font-weight: 500;
      border-right: 3px solid #3b82f6;
    }

    .nav-subicon {
      font-size: 0.9rem;
      width: 16px;
      display: flex;
      justify-content: center;
      margin-right: 0.6rem;
    }

    .nav-subtext {
      font-weight: 500;
    }

    /* Sidebar collapsed state for groups */
    .sidebar-collapsed .nav-group-header {
      justify-content: center;
      padding: 0.75rem;
    }

    .sidebar-collapsed .nav-arrow {
      display: none;
    }

    .sidebar-collapsed .nav-sublist {
      display: none;
    }

    /* MAIN CONTENT STYLES */
    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: #ffffff;
    }

    /* HEADER STYLES */
    .main-header {
      background: #ffffff;
      border-bottom: 1px solid #e5e7eb;
      padding: 0 1.5rem;
      height: 60px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .hamburger-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 8px;
      border-radius: 4px;
      transition: background 0.2s ease;
    }

    .hamburger-btn:hover {
      background: #f3f4f6;
    }

    .hamburger-lines {
      display: flex;
      flex-direction: column;
      width: 18px;
      height: 14px;
      justify-content: space-between;
    }

    .hamburger-lines span {
      height: 2px;
      background: #6b7280;
      border-radius: 1px;
      transition: all 0.3s ease;
    }

    .breadcrumb {
      display: flex;
      align-items: center;
    }

    .breadcrumb-text {
      font-size: 1.1rem;
      font-weight: 600;
      color: #374151;
    }

    .header-right {
      display: flex;
      align-items: center;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .header-btn {
      background: none;
      border: none;
      padding: 8px;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.2s ease;
      position: relative;
    }

    .header-btn:hover {
      background: #f3f4f6;
    }

    .header-icon {
      font-size: 1.1rem;
      color: #6b7280;
    }

    .notification-badge {
      position: absolute;
      top: 2px;
      right: 2px;
      background: #ef4444;
      color: white;
      font-size: 0.7rem;
      padding: 0.1rem 0.3rem;
      border-radius: 8px;
      min-width: 16px;
      text-align: center;
    }

    .user-section {
      position: relative;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.2s ease;
    }

    .user-info:hover {
      background: #f3f4f6;
    }

    .user-name {
      font-size: 0.9rem;
      font-weight: 500;
      color: #374151;
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 0.8rem;
    }

    .user-dropdown {
      position: absolute;
      top: 100%;
      right: 0;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      min-width: 160px;
      z-index: 1000;
      margin-top: 0.5rem;
    }

    .dropdown-item {
      display: block;
      padding: 0.75rem 1rem;
      color: #6b7280;
      text-decoration: none;
      transition: background 0.2s ease;
      font-size: 0.9rem;
    }

    .dropdown-item:hover {
      background: #f3f4f6;
      color: #374151;
    }

    .dropdown-item.logout {
      color: #ef4444;
    }

    .dropdown-item.logout:hover {
      background: #fef2f2;
    }

    .dropdown-divider {
      height: 1px;
      background: #e5e7eb;
      margin: 0.5rem 0;
    }

    /* PAGE CONTENT */
    .page-content {
      flex: 1;
      overflow-y: auto;
      background: #f9fafb;
    }

    /* RESPONSIVE */
    @media (max-width: 768px) {
      .sidebar {
        position: fixed;
        left: -250px;
        height: 100vh;
        z-index: 1000;
        transition: left 0.3s ease;
      }

      .sidebar.sidebar-open {
        left: 0;
      }

      .sidebar-collapsed {
        left: -60px;
      }

      .main-content {
        margin-left: 0;
      }

      .main-header {
        padding: 0 1rem;
      }

      .user-name {
        display: none;
      }

      .breadcrumb-text {
        font-size: 1rem;
      }
    }
  `]
})
export class MainLayoutComponent implements OnInit {
  sidebarCollapsed = false;
  userMenuOpen = false;
  hasNotifications = true;
  notificationCount = 3;

  // Control de expansión de grupos de navegación
  expandedGroups: { [key: string]: boolean } = {
    configuracion: true, // Abierto por defecto como en la imagen
    maestro: false,
    reportes: false
  };

  currentUser = {
    name: 'Admin Usuario',
    role: 'Administrador',
    email: 'admin@geoapp.com'
  };

  constructor() { }

  ngOnInit(): void {
    // Detectar tamaño de pantalla
    this.checkScreenSize();
    window.addEventListener('resize', () => this.checkScreenSize());
  }

  get userInitials(): string {
    return this.currentUser.name
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase();
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;

    // Si se colapsa el sidebar, cerrar todos los grupos
    if (this.sidebarCollapsed) {
      // Mantener estado pero ocultar visualmente
    }
  }

  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
  }

  toggleNavGroup(groupName: string): void {
    // Si el sidebar está colapsado, no hacer nada
    if (this.sidebarCollapsed) {
      return;
    }

    this.expandedGroups[groupName] = !this.expandedGroups[groupName];
  }

  getCurrentPageTitle(): string {
    // Esta función se puede mejorar para obtener el título dinámicamente
    const path = window.location.pathname;
    if (path.includes('dashboard')) return 'Dashboard';
    if (path.includes('configuracion/geocercas')) return 'Vendedores y Geocercas';
    if (path.includes('configuracion')) return 'Configuración';
    if (path.includes('maestro')) return 'Maestro';
    if (path.includes('reportes')) return 'Reportes';
    return 'Sistema de Geolocalización';
  }

  private checkScreenSize(): void {
    if (window.innerWidth < 768) {
      this.sidebarCollapsed = true;
    }
  }
}
