import {ApplicationConfig, importProvidersFrom} from '@angular/core';
import {provideRouter} from '@angular/router';
import {provideHttpClient, withInterceptors} from '@angular/common/http';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';

import {routes} from './app.routes';
import {authInterceptor} from './core/interceptors/auth.interceptor';
import {errorInterceptor} from './core/interceptors/error.interceptor';

// Material Modules
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {providePrimeNG} from 'primeng/config';
import Lara from '@primeuix/themes/lara';


const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor, errorInterceptor])
    ),
    provideAnimationsAsync(),
    importProvidersFrom(MatSnackBarModule),
    providePrimeNG({
      theme: {
        preset: Lara,
        options: {
          // 🆕 Configuración específica para tema claro
          darkModeSelector: false, // Deshabilitar modo oscuro
        }
      }
    }),
  ]
};

export {appConfig};
