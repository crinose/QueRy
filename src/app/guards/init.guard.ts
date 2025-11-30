import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AppModeService } from '../services/app-mode.service';
import { StorageService } from '../services/storage.service';
import { FirebaseAuthService } from '../services/firebase-auth.service';

export const initGuard = async () => {
  const router = inject(Router);
  const appMode = inject(AppModeService);
  const storage = inject(StorageService);
  const firebaseAuth = inject(FirebaseAuthService);

  console.log('🚦 InitGuard: Decidiendo ruta inicial...');

  // Esperar a que los servicios estén inicializados
  await storage.initializeDatabase();
  await appMode.waitForInit();

  const currentMode = appMode.getMode();
  const hasSeenOnboarding = await storage.getConfigValue('has_seen_onboarding');

  // Si no ha visto el onboarding, ir allí
  if (hasSeenOnboarding !== 'true') {
    console.log('🚦 InitGuard: Redirigiendo a onboarding');
    router.navigate(['/onboarding']);
    return false;
  }

  // Si está en modo authenticated, intentar auto-login
  if (currentMode === 'authenticated') {
    console.log('🚦 InitGuard: Modo authenticated, intentando auto-login...');
    const autoLoginSuccess = await firebaseAuth.attemptAutoLogin();
    
    if (autoLoginSuccess) {
      console.log('🚦 InitGuard: Auto-login exitoso, redirigiendo a home');
      router.navigate(['/home'], { replaceUrl: true });
      return false;
    } else {
      console.log('🚦 InitGuard: Auto-login falló, redirigiendo a login');
      router.navigate(['/login']);
      return false;
    }
  }

  // Modo guest o cualquier otro caso -> login
  console.log('🚦 InitGuard: Modo guest, redirigiendo a login');
  router.navigate(['/login']);
  return false;
};
