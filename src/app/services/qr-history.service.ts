import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { TranslationService } from './translation.service';

export interface QrHistoryItem {
  id: number;
  content: string;
  type: 'scanned' | 'created';
  timestamp: string;
  isUrl: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class QrHistoryService {
  private readonly QR_HISTORY_KEY_PREFIX = 'qr_history_';

  constructor(
    private storage: StorageService,
    private translation: TranslationService
  ) {}

  private async getHistoryKey(): Promise<string> {
    const user = await this.storage.getCurrentUser();
    return `${this.QR_HISTORY_KEY_PREFIX}${user?.username || 'guest'}`;
  }

  async getHistory(): Promise<QrHistoryItem[]> {
    const key = await this.getHistoryKey();
    const data = localStorage.getItem(key);
    if (!data) return [];
    
    try {
      const history = JSON.parse(data);
      // Ordenar por timestamp descendente (más reciente primero)
      return history.sort((a: QrHistoryItem, b: QrHistoryItem) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } catch (error) {
      console.error('Error al cargar historial:', error);
      return [];
    }
  }

  async addScannedQr(content: string): Promise<void> {
    await this.addToHistory(content, 'scanned');
  }

  async addCreatedQr(content: string): Promise<void> {
    await this.addToHistory(content, 'created');
  }

  private async addToHistory(content: string, type: 'scanned' | 'created'): Promise<void> {
    const history = await this.getHistory();
    
    const isUrl = this.checkIfUrl(content);
    
    const newItem: QrHistoryItem = {
      id: Date.now(),
      content: content,
      type: type,
      timestamp: new Date().toISOString(),
      isUrl: isUrl
    };

    // Agregar al inicio del historial
    history.unshift(newItem);

    // Limitar el historial a 50 elementos
    if (history.length > 50) {
      history.pop();
    }

    const key = await this.getHistoryKey();
    localStorage.setItem(key, JSON.stringify(history));
    console.log(`✅ QR ${type === 'scanned' ? 'escaneado' : 'creado'} agregado al historial`);
  }

  async deleteItem(id: number): Promise<void> {
    const history = await this.getHistory();
    const filtered = history.filter(item => item.id !== id);
    const key = await this.getHistoryKey();
    localStorage.setItem(key, JSON.stringify(filtered));
    console.log('✅ Item eliminado del historial');
  }

  async clearHistory(): Promise<void> {
    const key = await this.getHistoryKey();
    localStorage.removeItem(key);
    console.log('✅ Historial limpiado');
  }

  private checkIfUrl(content: string): boolean {
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    return urlPattern.test(content);
  }

  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    const lang = this.translation.getCurrentLanguage();

    if (seconds < 60) {
      return lang === 'es' ? 'Justo ahora' : 'Just now';
    }
    if (minutes < 60) {
      return lang === 'es' ? 
        `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}` :
        `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }
    if (hours < 24) {
      return lang === 'es' ?
        `Hace ${hours} hora${hours > 1 ? 's' : ''}` :
        `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    if (days < 7) {
      return lang === 'es' ?
        `Hace ${days} día${days > 1 ? 's' : ''}` :
        `${days} day${days > 1 ? 's' : ''} ago`;
    }
    
    return date.toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US');
  }
}
