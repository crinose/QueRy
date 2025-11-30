import { Injectable } from '@angular/core';
import { StorageAdapter } from './storage-adapter.service';

// El modo puede ser 'guest' (invitado sin cuenta) o 'authenticated' (con cuenta de Firebase)
export type AppMode = 'guest' | 'authenticated';

/**
 * Servicio para manejar el Modo Dual de la App
 * 
 * Este servicio controla si el usuario está usando la app:
 * - GUEST: Sin cuenta, todo se guarda local en SQLite
 * - AUTHENTICATED: Con cuenta de Firebase, todo se sincroniza en la nube
 * 
 * El modo se guarda usando Capacitor Preferences para garantizar persistencia en Android/iOS.
 */
@Injectable({
  providedIn: 'root'
})
export class AppModeService {
  // Variable privada que guarda el modo actual
  private mode: AppMode = 'guest';
  private initialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  constructor(private storage: StorageAdapter) {
    // Inicializar de forma asíncrona
    this.initPromise = this.initialize();
  }

  /**
   * Inicializa el servicio cargando el modo guardado
   */
  private async initialize(): Promise<void> {
    if (this.initialized) return;

    // Intentar migrar datos antiguos de localStorage (solo una vez)
    await this.storage.migrateFromLocalStorage();

    // Cargar el modo guardado
    const savedMode = await this.storage.get('appMode');
    console.log('🔧 Iniciando AppModeService - Modo guardado:', savedMode);
    
    // Solo aceptamos 'guest' o 'authenticated', nada más
    if (savedMode === 'authenticated' || savedMode === 'guest') {
      this.mode = savedMode;
    }

    this.initialized = true;
    console.log('✅ AppModeService inicializado con modo:', this.mode);
  }

  /**
   * Espera a que el servicio esté completamente inicializado
   */
  async waitForInit(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise;
    }
  }

  /**
   * Cambia el modo de la app
   * 
   * Cuando un usuario hace login, llamamos setMode('authenticated').
   * Cuando hace logout o elige "Continuar sin cuenta", llamamos setMode('guest').
   * 
   * @param mode - 'guest' o 'authenticated'
   */
  async setMode(mode: AppMode): Promise<void> {
    this.mode = mode;
    // Guardamos en Preferences para que persista al recargar
    await this.storage.set('appMode', mode);
    console.log('✅ Modo guardado:', mode);
  }

  /**
   * Obtiene el modo actual
   * 
   * @returns El modo actual: 'guest' o 'authenticated'
   */
  getMode(): AppMode {
    return this.mode;
  }

  /**
   * Revisa si estamos en modo invitado
   * 
   * Usamos esto para saber si debemos usar SQLite en lugar de Firebase.
   * Ejemplo: if (appMode.isGuestMode()) { usar SQLite } else { usar Firebase }
   * 
   * @returns true si el modo es 'guest'
   */
  isGuestMode(): boolean {
    return this.mode === 'guest';
  }

  /**
   * Revisa si estamos en modo autenticado
   * 
   * @returns true si el modo es 'authenticated'
   */
  isAuthenticatedMode(): boolean {
    return this.mode === 'authenticated';
  }

  /**
   * Borra el modo guardado y vuelve a guest
   * 
   * Esto se usa cuando alguien hace logout.
   * Limpiamos todo y volvemos al modo por defecto (guest).
   */
  async clearMode(): Promise<void> {
    this.mode = 'guest';
    await this.storage.remove('appMode');
    console.log('🗑️ Modo limpiado, volviendo a guest');
  }
}
