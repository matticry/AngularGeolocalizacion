// src/app/core/guards/auth.guard.ts

import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../../features/auth/services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated) {
    // Verificar si tiene empresa seleccionada para rutas que lo requieran
    if (state.url !== '/auth/login' && !authService.currentUser?.empresaSeleccionada) {
      router.navigate(['/auth/login']);
      return false;
    }
    return true;
  }

  // Redirigir al login si no está autenticado
  router.navigate(['/auth/login']);
  return false;
};
