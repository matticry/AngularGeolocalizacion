// src/app/core/interceptors/error.interceptor.ts

import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../features/auth/services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Ha ocurrido un error';

      if (error.error instanceof ErrorEvent) {
        // Error del cliente
        errorMessage = `Error: ${error.error.message}`;
      } else {
        // Error del servidor
        switch (error.status) {
          case 401:
            errorMessage = 'No autorizado. Inicia sesión nuevamente.';
            authService.logout();
            router.navigate(['/auth/login']);
            break;
          case 403:
            errorMessage = 'No tienes permisos para esta acción';
            break;
          case 404:
            errorMessage = 'Recurso no encontrado';
            break;
          case 500:
            errorMessage = 'Error interno del servidor';
            break;
          case 0:
            errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
            break;
          default:
            errorMessage = `Error: ${error.status} - ${error.statusText}`;
        }
      }

      // Solo mostrar snackbar si no es el login (para no duplicar mensajes)
      if (!req.url.includes('/login/listaempresas')) {
        snackBar.open(errorMessage, 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }

      return throwError(() => error);
    })
  );
};
