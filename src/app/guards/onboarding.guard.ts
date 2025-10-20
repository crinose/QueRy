import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { StorageService } from '../services/storage.service';

export const onboardingGuard = async () => {
  const storage = inject(StorageService);
  const router = inject(Router);

  const hasSeenOnboarding = await storage.hasSeenOnboarding();
  console.log('🔍 OnboardingGuard - hasSeenOnboarding:', hasSeenOnboarding);

  if (!hasSeenOnboarding) {
    console.log('❌ Redirigiendo a onboarding');
    router.navigate(['/onboarding']);
    return false;
  }

  console.log('✅ Onboarding completado, permitiendo acceso');
  return true;
};
