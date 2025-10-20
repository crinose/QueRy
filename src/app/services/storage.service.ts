import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';

export interface User {
  id?: number;
  username: string;
  password: string;
  email: string;
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly USERS_KEY = 'app_users';
  private readonly CONFIG_KEY = 'app_config';
  private readonly SESSION_KEY = 'app_session';
  private isInitialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {}

  async initializeDatabase(): Promise<void> {
    // Si ya hay una inicialización en progreso, esperar a que termine
    if (this.initializationPromise) {
      console.log('⏳ Esperando inicialización en progreso...');
      return this.initializationPromise;
    }

    if (this.isInitialized) {
      console.log('✅ Storage ya inicializado');
      return;
    }

    // Crear y guardar la promesa de inicialización
    this.initializationPromise = this.performInitialization();
    await this.initializationPromise;
    this.initializationPromise = null;
  }

  private async performInitialization(): Promise<void> {
    const platform = Capacitor.getPlatform();
    console.log('🔧 Inicializando Storage en plataforma:', platform);

    // Verificar estado actual antes de inicializar
    const currentConfig = await this.getConfig();
    console.log('🔍 Config existente ANTES de insertDefaultConfig:', currentConfig);

    // Crear configuración por defecto SOLO si no existe
    await this.insertDefaultConfig();

    // Verificar estado después de inicializar
    const finalConfig = await this.getConfig();
    console.log('🔍 Config DESPUÉS de insertDefaultConfig:', finalConfig);

    // Crear usuario demo SOLO si no existe
    await this.createDemoUser();

    this.isInitialized = true;
    console.log('✅ Storage inicializado correctamente');
    
    // Mostrar estado final
    await this.debugShowAllData();
  }

  async waitForInitialization(): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    if (this.initializationPromise) {
      await this.initializationPromise;
    }
  }

  private async insertDefaultConfig(): Promise<void> {
    const config = await this.getConfig();
    console.log('🔍 Config actual al inicializar:', config);
    
    // Solo insertar valores que NO existen (verificar undefined específicamente)
    if (config.language === undefined) {
      await this.setConfigValue('language', 'es');
    }
    if (config.has_seen_onboarding === undefined) {
      await this.setConfigValue('has_seen_onboarding', 'false');
    }
    if (config.theme === undefined) {
      await this.setConfigValue('theme', 'light');
    }
    
    console.log('✅ Configuración verificada:', await this.getConfig());
  }

  private async createDemoUser(): Promise<void> {
    const users = await this.getAllUsers();
    const demoExists = users.find(u => u.username === 'demo');
    
    if (!demoExists) {
      await this.createUser({
        username: 'demo',
        password: 'demo123',
        email: 'demo@example.com'
      });
      console.log('✅ Usuario demo creado (username: demo, password: demo123)');
    }
  }

  // ==================== CRUD USUARIOS ====================

  async createUser(user: Omit<User, 'id' | 'created_at'>): Promise<User> {
    const users = await this.getAllUsers();
    
    if (users.find(u => u.username === user.username)) {
      throw new Error('El nombre de usuario ya existe');
    }

    if (users.find(u => u.email === user.email)) {
      throw new Error('El email ya está registrado');
    }

    const newUser: User = {
      ...user,
      id: Date.now(),
      created_at: new Date().toISOString()
    };

    users.push(newUser);
    await this.saveUsers(users);

    console.log('✅ Usuario creado:', newUser.username);
    return newUser;
  }

  async getAllUsers(): Promise<User[]> {
    const data = localStorage.getItem(this.USERS_KEY);
    return data ? JSON.parse(data) : [];
  }

  async getUserById(id: number): Promise<User | null> {
    const users = await this.getAllUsers();
    return users.find(u => u.id === id) || null;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const users = await this.getAllUsers();
    return users.find(u => u.username === username) || null;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | null> {
    const users = await this.getAllUsers();
    const index = users.findIndex(u => u.id === id);
    
    if (index === -1) return null;

    users[index] = { ...users[index], ...updates };
    await this.saveUsers(users);

    console.log('✅ Usuario actualizado');
    return users[index];
  }

  async deleteUser(id: number): Promise<boolean> {
    const users = await this.getAllUsers();
    const filtered = users.filter(u => u.id !== id);
    
    if (filtered.length === users.length) return false;

    await this.saveUsers(filtered);
    console.log('✅ Usuario eliminado');
    return true;
  }

  private async saveUsers(users: User[]): Promise<void> {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  }

  // ==================== AUTENTICACIÓN ====================

  async login(username: string, password: string): Promise<User> {
    const user = await this.getUserByUsername(username);
    
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    if (user.password !== password) {
      throw new Error('Contraseña incorrecta');
    }

    await this.setCurrentUser(user.id!);
    console.log('✅ Login exitoso:', username);
    return user;
  }

  async logout(): Promise<void> {
    localStorage.removeItem(this.SESSION_KEY);
    console.log('✅ Logout exitoso');
  }

  async setCurrentUser(userId: number): Promise<void> {
    localStorage.setItem(this.SESSION_KEY, JSON.stringify({ userId }));
    console.log('✅ Sesión guardada para usuario ID:', userId);
  }

  async getCurrentUser(): Promise<User | null> {
    const data = localStorage.getItem(this.SESSION_KEY);
    if (!data) return null;

    const { userId } = JSON.parse(data);
    return await this.getUserById(userId);
  }

  async isUserLoggedIn(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }

  // ==================== CONFIGURACIÓN ====================

  async getConfig(): Promise<any> {
    const data = localStorage.getItem(this.CONFIG_KEY);
    return data ? JSON.parse(data) : {};
  }

  async getConfigValue(key: string): Promise<string | null> {
    const config = await this.getConfig();
    return config[key] || null;
  }

  async setConfigValue(key: string, value: string): Promise<void> {
    const config = await this.getConfig();
    config[key] = value;
    localStorage.setItem(this.CONFIG_KEY, JSON.stringify(config));
    console.log(`✅ Config actualizada: ${key} = ${value}`);
  }

  async getLanguage(): Promise<string> {
    const lang = await this.getConfigValue('language');
    return lang || 'es';
  }

  async setLanguage(language: string): Promise<void> {
    await this.setConfigValue('language', language);
  }

  async getTheme(): Promise<string> {
    const theme = await this.getConfigValue('theme');
    return theme || 'light';
  }

  async setTheme(theme: string): Promise<void> {
    await this.setConfigValue('theme', theme);
  }

  async hasSeenOnboarding(): Promise<boolean> {
    const value = await this.getConfigValue('has_seen_onboarding');
    console.log('🔍 hasSeenOnboarding - valor en storage:', value);
    const result = value === 'true';
    console.log('🔍 hasSeenOnboarding - resultado:', result);
    return result;
  }

  async setOnboardingComplete(): Promise<void> {
    console.log('🔹 Marcando onboarding como completado...');
    await this.setConfigValue('has_seen_onboarding', 'true');
    console.log('✅ Onboarding marcado como completado');
    
    // Verificar que se guardó
    const saved = await this.hasSeenOnboarding();
    console.log('🔍 Verificación: hasSeenOnboarding =', saved);
    
    // Verificar localStorage directamente
    const rawConfig = localStorage.getItem(this.CONFIG_KEY);
    console.log('🔍 Config RAW en localStorage:', rawConfig);
  }

  // ==================== UTILIDADES ====================

  async clearAllData(): Promise<void> {
    localStorage.clear();
    console.log('⚠️ Todos los datos eliminados');
  }

  async debugShowAllData(): Promise<void> {
    console.group('🔍 DEBUG: Todos los datos');
    console.log('Usuarios:', await this.getAllUsers());
    console.log('Usuario actual:', await this.getCurrentUser());
    console.log('Config:', await this.getConfig());
    console.groupEnd();
  }
}
