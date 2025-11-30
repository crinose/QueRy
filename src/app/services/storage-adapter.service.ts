import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

/**
 * Adaptador de almacenamiento persistente
 * 
 * Este servicio usa Capacitor Preferences que garantiza persistencia en Android/iOS.
 * A diferencia de localStorage que puede borrarse en Android, Preferences usa:
 * - Android: SharedPreferences (almacenamiento nativo persistente)
 * - iOS: UserDefaults (almacenamiento nativo persistente)
 * - Web: localStorage (como fallback)
 * 
 * Los datos NO se pierden al:
 * - Cerrar la aplicación
 * - Reiniciar el dispositivo
 * - Limpiar la caché del WebView
 */
@Injectable({
  providedIn: 'root'
})
export class StorageAdapter {
  private platform: string;

  constructor() {
    this.platform = Capacitor.getPlatform();
    console.log('🔧 StorageAdapter inicializado en plataforma:', this.platform);
  }

  /**
   * Guardar un valor (string)
   * 
   * @param key - Clave única para identificar el dato
   * @param value - Valor a guardar (string)
   */
  async set(key: string, value: string): Promise<void> {
    try {
      await Preferences.set({ key, value });
      console.log(`✅ Storage guardado: ${key} =`, value);
    } catch (error) {
      console.error(`❌ Error guardando ${key}:`, error);
      throw error;
    }
  }

  /**
   * Obtener un valor guardado
   * 
   * @param key - Clave del dato a obtener
   * @returns El valor guardado o null si no existe
   */
  async get(key: string): Promise<string | null> {
    try {
      const { value } = await Preferences.get({ key });
      console.log(`🔍 Storage leído: ${key} =`, value);
      return value;
    } catch (error) {
      console.error(`❌ Error leyendo ${key}:`, error);
      return null;
    }
  }

  /**
   * Eliminar un valor específico
   * 
   * @param key - Clave del dato a eliminar
   */
  async remove(key: string): Promise<void> {
    try {
      await Preferences.remove({ key });
      console.log(`🗑️ Storage eliminado: ${key}`);
    } catch (error) {
      console.error(`❌ Error eliminando ${key}:`, error);
      throw error;
    }
  }

  /**
   * Eliminar TODOS los valores guardados
   * 
   * ⚠️ CUIDADO: Esto borra toda la configuración
   */
  async clear(): Promise<void> {
    try {
      await Preferences.clear();
      console.log('⚠️ Storage completamente limpiado');
    } catch (error) {
      console.error('❌ Error limpiando storage:', error);
      throw error;
    }
  }

  /**
   * Obtener todas las claves guardadas
   * 
   * @returns Array de strings con todas las claves
   */
  async keys(): Promise<string[]> {
    try {
      const { keys } = await Preferences.keys();
      console.log('🔑 Keys en storage:', keys);
      return keys;
    } catch (error) {
      console.error('❌ Error obteniendo keys:', error);
      return [];
    }
  }

  /**
   * Guardar un objeto completo (se serializa a JSON)
   * 
   * @param key - Clave única
   * @param value - Objeto a guardar
   */
  async setObject(key: string, value: any): Promise<void> {
    const json = JSON.stringify(value);
    await this.set(key, json);
  }

  /**
   * Obtener un objeto guardado (se deserializa desde JSON)
   * 
   * @param key - Clave del objeto
   * @returns El objeto deserializado o null
   */
  async getObject<T>(key: string): Promise<T | null> {
    const json = await this.get(key);
    if (!json) return null;

    try {
      return JSON.parse(json) as T;
    } catch (error) {
      console.error(`❌ Error parseando JSON de ${key}:`, error);
      return null;
    }
  }

  /**
   * Verificar si existe una clave
   * 
   * @param key - Clave a verificar
   * @returns true si existe, false si no
   */
  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  /**
   * Migrar datos desde localStorage a Preferences
   * 
   * Útil para la primera vez que se actualiza la app.
   * Copia todos los datos del localStorage antiguo a Preferences.
   */
  async migrateFromLocalStorage(): Promise<void> {
    if (this.platform === 'web') {
      console.log('ℹ️ En web, no es necesario migrar (usa localStorage nativo)');
      return;
    }

    console.log('🔄 Iniciando migración desde localStorage...');
    let migratedCount = 0;

    try {
      // Listar todas las claves importantes que queremos migrar
      const keysToMigrate = [
        'appMode',
        'app_config',
        'app_users',
        'app_session',
        'has_seen_onboarding'
      ];

      for (const key of keysToMigrate) {
        const value = localStorage.getItem(key);
        if (value) {
          await this.set(key, value);
          migratedCount++;
          console.log(`✅ Migrado: ${key}`);
        }
      }

      console.log(`✅ Migración completada: ${migratedCount} items migrados`);
    } catch (error) {
      console.error('❌ Error durante la migración:', error);
    }
  }

  /**
   * Debug: Mostrar todo el contenido del storage
   */
  async debugShowAll(): Promise<void> {
    const keys = await this.keys();
    console.group('🔍 DEBUG: Contenido completo de Storage');
    console.log('Plataforma:', this.platform);
    console.log('Total de keys:', keys.length);
    
    for (const key of keys) {
      const value = await this.get(key);
      console.log(`${key}:`, value);
    }
    
    console.groupEnd();
  }
}
