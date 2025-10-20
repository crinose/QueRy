import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { DatabaseService } from './database.service';
import { StorageService, User } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private useNativeDB: boolean = false;

  constructor(
    private databaseService: DatabaseService,
    private storageService: StorageService
  ) {
    // Determinar si usar SQLite nativo o LocalStorage
    this.useNativeDB = Capacitor.getPlatform() !== 'web';
    console.log('🔧 DataService usando:', this.useNativeDB ? 'SQLite (nativo)' : 'LocalStorage (web)');
  }

  // El servicio activo según la plataforma
  private get service() {
    return this.useNativeDB ? this.databaseService : this.storageService;
  }

  // ==================== DELEGACIÓN DE MÉTODOS ====================

  async initializeDatabase(): Promise<void> {
    return this.service.initializeDatabase();
  }

  async createUser(user: Omit<User, 'id' | 'created_at'>): Promise<User> {
    return this.service.createUser(user);
  }

  async getAllUsers(): Promise<User[]> {
    return this.service.getAllUsers();
  }

  async getUserById(id: number): Promise<User | null> {
    return this.service.getUserById(id);
  }

  async getUserByUsername(username: string): Promise<User | null> {
    return this.service.getUserByUsername(username);
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | null> {
    return this.service.updateUser(id, updates);
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.service.deleteUser(id);
  }

  async login(username: string, password: string): Promise<User> {
    return this.service.login(username, password);
  }

  async logout(): Promise<void> {
    return this.service.logout();
  }

  async setCurrentUser(userId: number): Promise<void> {
    return this.service.setCurrentUser(userId);
  }

  async getCurrentUser(): Promise<User | null> {
    return this.service.getCurrentUser();
  }

  async isUserLoggedIn(): Promise<boolean> {
    return this.service.isUserLoggedIn();
  }

  async getConfigValue(key: string): Promise<string | null> {
    return this.service.getConfigValue(key);
  }

  async setConfigValue(key: string, value: string): Promise<void> {
    return this.service.setConfigValue(key, value);
  }

  async getLanguage(): Promise<string> {
    return this.service.getLanguage();
  }

  async setLanguage(language: string): Promise<void> {
    return this.service.setLanguage(language);
  }

  async getTheme(): Promise<string> {
    return this.service.getTheme();
  }

  async setTheme(theme: string): Promise<void> {
    return this.service.setTheme(theme);
  }

  async hasSeenOnboarding(): Promise<boolean> {
    return this.service.hasSeenOnboarding();
  }

  async setOnboardingComplete(): Promise<void> {
    return this.service.setOnboardingComplete();
  }

  async clearAllData(): Promise<void> {
    return this.service.clearAllData();
  }

  async debugShowAllData(): Promise<void> {
    return this.service.debugShowAllData();
  }
}
