import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isAuthenticated = await authService.isAuthenticated();
  console.log('🔍 AuthGuard - isAuthenticated:', isAuthenticated);

  if (!isAuthenticated) {
    console.log('❌ No autenticado, redirigiendo a login');
    router.navigate(['/login']);
    return false;
  }

  console.log('✅ Usuario autenticado, permitiendo acceso');
  return true;
};
