// src/app/features/auth/components/login/login.component.ts

import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AuthService } from '../../services/auth.service';
import { LoginRequest, LoginResponse } from '../../models/auth.models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  hidePassword = signal(true);
  isLoading = signal(false);
  empresas = signal<any[]>([]);
  showEmpresaSelection = signal(false);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.loginForm = this.createForm();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      nombreUsuario: ['', [Validators.required, Validators.minLength(3)]],
      contrasena: ['', [Validators.required, Validators.minLength(4)]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading.set(true);

      const credentials: LoginRequest = this.loginForm.value;

      this.authService.login(credentials).subscribe({
        next: (response: LoginResponse) => {
          this.isLoading.set(false);
          this.empresas.set(response.listado);
          this.showEmpresaSelection.set(true);

          this.showSuccessMessage('Login exitoso. Selecciona tu empresa.');
        },
        error: (error) => {
          this.isLoading.set(false);
          console.error('Error en login:', error);

          let errorMessage = 'Error al iniciar sesión';
          if (error.status === 401) {
            errorMessage = 'Usuario o contraseña incorrectos';
          } else if (error.status === 0) {
            errorMessage = 'Error de conexión. Verifica el servidor.';
          }

          this.showErrorMessage(errorMessage);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  onEmpresaSelect(empresa: any): void {
    this.authService.selectEmpresa(empresa);
    this.router.navigate(['/dashboard']);
    this.showSuccessMessage(`Bienvenido a ${empresa.nomempresa}`);
  }

  togglePasswordVisibility(): void {
    this.hidePassword.set(!this.hidePassword());
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  // Getters para validaciones en el template
  get nombreUsuarioErrors() {
    const control = this.loginForm.get('nombreUsuario');
    if (control?.errors && control?.touched) {
      if (control.errors['required']) return 'El usuario es requerido';
      if (control.errors['minlength']) return 'El usuario debe tener al menos 3 caracteres';
    }
    return null;
  }

  get contrasenaErrors() {
    const control = this.loginForm.get('contrasena');
    if (control?.errors && control?.touched) {
      if (control.errors['required']) return 'La contraseña es requerida';
      if (control.errors['minlength']) return 'La contraseña debe tener al menos 4 caracteres';
    }
    return null;
  }
}
