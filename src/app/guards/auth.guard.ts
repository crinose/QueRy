import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { AppModeService } from '../services/app-mode.service';
import { StorageService } from '../services/storage.service';

export const authGuard = async () => {
  const auth = inject(Auth);
  const appMode = inject(AppModeService);
  const storage = inject(StorageService);
  const router = inject(Router);

  await storage.initializeDatabase();
  await appMode.waitForInit();
  const currentMode = appMode.getMode();

  if (currentMode === 'guest') {
    return true;
  }

  if (currentMode === 'authenticated') {
    // Verificar si hay sesión guardada localmente
    const hasSession = await storage.getConfigValue('session_active');
    
    if (hasSession === 'true') {
      // Hay sesión local, esperar brevemente por Firebase (5 segundos para dar tiempo al auto-login)
      const user = await new Promise<User | null>((resolve) => {
        const timeout = setTimeout(() => resolve(null), 5000);
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          clearTimeout(timeout);
          unsubscribe();
          resolve(user);
        });
      });
      
      if (user) {
        return true;
      }
    }
    
    // Sin sesión válida
    await storage.setConfigValue('session_active', 'false');
    await appMode.clearMode();
    router.navigate(['/login']);
    return false;
  }

  router.navigate(['/login']);
  return false;
};
