import { Injectable, inject } from '@angular/core';
import { Database, ref, set, push, get, remove, update, query, orderByChild, limitToLast } from '@angular/fire/database';
import { FirebaseAuthService } from './firebase-auth.service';

export interface QRScan {
  id?: string;
  content: string;
  customName?: string;
  type: string;
  format: string;
  timestamp: number;
  isFavorite?: boolean;
}

export interface UserConfig {
  vibrationEnabled: boolean;
  soundEnabled: boolean;
  saveHistoryEnabled: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class FirebaseDataService {
  private db: Database;
  private authService: FirebaseAuthService;

  constructor(db: Database, authService: FirebaseAuthService) {
    this.db = db;
    this.authService = authService;
  }

  /**
   * Guarda un código QR escaneado en el historial del usuario
   */
  async saveQRScan(content: string, type: string, format: string): Promise<void> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }
    const userId = currentUser.uid;

    const scanRef = push(ref(this.db, `qr-history/${userId}/scans`));
    const scan: QRScan = {
      content,
      type,
      format,
      timestamp: Date.now()
    };

    await set(scanRef, scan);
  }

  /**
   * Obtiene el historial de QR del usuario actual
   */
  async getQRHistory(limit: number = 50): Promise<QRScan[]> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }
    const userId = currentUser.uid;

    const scansRef = ref(this.db, `qr-history/${userId}/scans`);
    // Sin orderByChild para evitar el error de índice
    const snapshot = await get(scansRef);
    const scans: QRScan[] = [];

    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        scans.push({
          id: childSnapshot.key!,
          ...childSnapshot.val()
        });
      });
    }

    // Ordenar manualmente por timestamp de más reciente a más antiguo
    scans.sort((a, b) => b.timestamp - a.timestamp);
    
    // Limitar resultados
    return scans.slice(0, limit);
  }

  /**
   * Elimina un QR específico del historial
   */
  async deleteQRScan(scanId: string): Promise<void> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }
    const userId = currentUser.uid;

    const scanRef = ref(this.db, `qr-history/${userId}/scans/${scanId}`);
    await remove(scanRef);
  }

  /**
   * Limpia todo el historial de QR del usuario
   */
  async clearQRHistory(): Promise<void> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }
    const userId = currentUser.uid;

    const scansRef = ref(this.db, `qr-history/${userId}/scans`);
    await remove(scansRef);
  }

  /**
   * Marca o desmarca un QR como favorito
   */
  async toggleFavorite(scanId: string): Promise<void> {
    // Obtener el usuario directamente del auth sin usar getCurrentUserId
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }
    const userId = currentUser.uid;

    const scanRef = ref(this.db, `qr-history/${userId}/scans/${scanId}`);
    const snapshot = await get(scanRef);
    
    if (snapshot.exists()) {
      const currentValue = snapshot.val();
      const newFavoriteValue = !currentValue.isFavorite;
      await update(scanRef, { isFavorite: newFavoriteValue });
    }
  }

  /**
   * Obtiene solo los QR marcados como favoritos
   */
  async getFavorites(): Promise<QRScan[]> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }
    const userId = currentUser.uid;

    const scansRef = ref(this.db, `qr-history/${userId}/scans`);
    const snapshot = await get(scansRef);
    const favorites: QRScan[] = [];

    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const scan = childSnapshot.val();
        if (scan.isFavorite === true) {
          favorites.push({
            id: childSnapshot.key!,
            ...scan
          });
        }
      });
    }

    // Ordenar de más reciente a más antiguo
    return favorites.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Guarda la configuración del usuario
   */
  async saveUserConfig(config: UserConfig): Promise<void> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      throw new Error('Usuario no autenticado');
    }

    const configRef = ref(this.db, `user-config/${userId}`);
    await set(configRef, config);
  }

  /**
   * Obtiene la configuración del usuario
   */
  async getUserConfig(): Promise<UserConfig> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      throw new Error('Usuario no autenticado');
    }

    const configRef = ref(this.db, `user-config/${userId}`);
    const snapshot = await get(configRef);

    if (snapshot.exists()) {
      return snapshot.val();
    }

    // Configuración por defecto
    const defaultConfig: UserConfig = {
      vibrationEnabled: true,
      soundEnabled: true,
      saveHistoryEnabled: true
    };

    // Guardar configuración por defecto
    await this.saveUserConfig(defaultConfig);
    return defaultConfig;
  }

  async updateCustomName(scanId: string, customName: string): Promise<void> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const scanRef = ref(this.db, `qr-history/${user.uid}/scans/${scanId}`);
    await update(scanRef, { 
      customName: customName.trim() || null 
    });
    console.log('✅ Nombre personalizado actualizado en Firebase:', customName);
  }

  /**
   * Actualiza valores específicos de la configuración
   */
  async updateUserConfig(updates: Partial<UserConfig>): Promise<void> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      throw new Error('Usuario no autenticado');
    }

    const configRef = ref(this.db, `user-config/${userId}`);
    await update(configRef, updates);
  }

  /**
   * Guarda información del perfil del usuario
   */
  async saveUserProfile(username: string, email: string): Promise<void> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      throw new Error('Usuario no autenticado');
    }

    const userRef = ref(this.db, `users/${userId}`);
    await set(userRef, {
      username,
      email,
      createdAt: Date.now()
    });
  }

  /**
   * Obtiene el perfil del usuario
   */
  async getUserProfile(): Promise<any> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      throw new Error('Usuario no autenticado');
    }

    const userRef = ref(this.db, `users/${userId}`);
    const snapshot = await get(userRef);

    return snapshot.exists() ? snapshot.val() : null;
  }
}
