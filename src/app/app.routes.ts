import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { onboardingGuard } from './guards/onboarding.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'onboarding',
    loadComponent: () => import('./onboarding/onboarding.page').then((m) => m.OnboardingPage),
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
    canActivate: [authGuard]
  },
  {
    path: 'configuration',
    loadComponent: () => import('./configuration/configuration.page').then((m) => m.ConfigurationPage),
    canActivate: [authGuard]
  },
  {
    path: 'qr-result',
    loadComponent: () => import('./qr-result/qr-result.page').then((m) => m.QrResultPage),
    canActivate: [authGuard]
  },
  {
    path: 'not-found',
    loadComponent: () => import('./not-found/not-found.page').then((m) => m.NotFoundPage),
  },
  {
    path: '**',
    redirectTo: 'not-found',
    pathMatch: 'full'
  },
];
