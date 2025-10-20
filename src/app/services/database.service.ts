import { Injectable } from '@angular/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

export interface User {
  id?: number;
  username: string;
  password: string;
  email: string;
  created_at?: string;
}

export interface AppConfig {
  id?: number;
  key: string;
  value: string;
}

export interface QRHistory {
  id?: number;
  content: string;
  type: 'generated' | 'scanned';
  timestamp?: string;
  favorite?: number; // SQLite usa 0/1 para boolean
}

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private sqlite: SQLiteConnection = new SQLiteConnection(CapacitorSQLite);
  private db!: SQLiteDBConnection;
  private dbName: string = 'qrapp.db';
  private isInitialized: boolean = false;

  constructor() {}

  // ==================== INICIALIZACIÓN ====================
  
  async initializeDatabase(): Promise<void> {
    if (this.isInitialized) {
      console.log('✅ BD ya inicializada');
      return;
    }

    try {
      const platform = Capacitor.getPlatform();
      console.log('🔧 Inicializando BD en plataforma:', platform);
      
      // Esperar a que jeep-sqlite esté listo en web
      if (platform === 'web') {
        console.log('🔧 Esperando jeep-sqlite para web...');
        const jeepSqliteEl = document.querySelector('jeep-sqlite');
        if (jeepSqliteEl) {
          await customElements.whenDefined('jeep-sqlite');
          console.log('✅ jeep-sqlite element definido');
          
          // Inicializar el web store
          if (typeof (jeepSqliteEl as any).initWebStore === 'function') {
            await (jeepSqliteEl as any).initWebStore();
            console.log('✅ jeep-sqlite web store inicializado');
          } else {
            console.log('⚠️ initWebStore no está disponible, continuando...');
          }
        } else {
          console.log('⚠️ jeep-sqlite element no encontrado en el DOM');
        }
      }
      
      // Crear o abrir la base de datos
      this.db = await this.sqlite.createConnection(
        this.dbName,
        false,
        'no-encryption',
        1,
        false
      );

      await this.db.open();

      // Crear tablas
      await this.createTables();
      
      // Insertar configuración por defecto
      await this.insertDefaultConfig();

      // Crear usuario demo
      await this.createDemoUser();

      this.isInitialized = true;
      console.log('✅ Base de datos SQLite inicializada correctamente');
    } catch (error) {
      console.error('❌ Error inicializando base de datos:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    // Tabla de usuarios
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        email TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `;

    // Tabla de configuración
    const createConfigTable = `
      CREATE TABLE IF NOT EXISTS config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL
      );
    `;

    // Tabla de sesión actual
    const createSessionTable = `
      CREATE TABLE IF NOT EXISTS session (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        user_id INTEGER,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `;

    // Tabla de historial QR (para futuro)
    const createQRHistoryTable = `
      CREATE TABLE IF NOT EXISTS qr_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        type TEXT NOT NULL,
        timestamp TEXT DEFAULT (datetime('now')),
        favorite INTEGER DEFAULT 0
      );
    `;

    await this.db.execute(createUsersTable);
    await this.db.execute(createConfigTable);
    await this.db.execute(createSessionTable);
    await this.db.execute(createQRHistoryTable);
    
    console.log('✅ Tablas creadas');
  }

  private async insertDefaultConfig(): Promise<void> {
    const configs = [
      { key: 'language', value: 'es' },
      { key: 'has_seen_onboarding', value: 'false' },
      { key: 'theme', value: 'light' }
    ];

    for (const config of configs) {
      const checkQuery = `SELECT * FROM config WHERE key = ?`;
      const result = await this.db.query(checkQuery, [config.key]);
      
      if (!result.values || result.values.length === 0) {
        const insertQuery = `INSERT INTO config (key, value) VALUES (?, ?)`;
        await this.db.run(insertQuery, [config.key, config.value]);
      }
    }
    
    console.log('✅ Configuración por defecto insertada');
  }

  private async createDemoUser(): Promise<void> {
    try {
      const checkQuery = `SELECT * FROM users WHERE username = ?`;
      const result = await this.db.query(checkQuery, ['demo']);
      
      if (!result.values || result.values.length === 0) {
        await this.createUser({
          username: 'demo',
          password: 'demo123',
          email: 'demo@example.com'
        });
        console.log('✅ Usuario demo creado (username: demo, password: demo123)');
      }
    } catch (error) {
      console.log('Usuario demo ya existe o error:', error);
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initializeDatabase();
    }
  }

  // ==================== CRUD USUARIOS ====================
  
  async createUser(user: Omit<User, 'id' | 'created_at'>): Promise<User> {
    await this.ensureInitialized();

    // Verificar si el usuario ya existe
    const checkQuery = `SELECT * FROM users WHERE username = ?`;
    const existingUser = await this.db.query(checkQuery, [user.username]);
    
    if (existingUser.values && existingUser.values.length > 0) {
      throw new Error('El nombre de usuario ya existe');
    }

    // Verificar email
    const checkEmailQuery = `SELECT * FROM users WHERE email = ?`;
    const existingEmail = await this.db.query(checkEmailQuery, [user.email]);
    
    if (existingEmail.values && existingEmail.values.length > 0) {
      throw new Error('El email ya está registrado');
    }

    // Insertar usuario
    const insertQuery = `
      INSERT INTO users (username, password, email) 
      VALUES (?, ?, ?)
    `;
    const result = await this.db.run(insertQuery, [user.username, user.password, user.email]);
    
    console.log('✅ Usuario creado:', user.username);
    
    return {
      id: result.changes?.lastId,
      ...user,
      created_at: new Date().toISOString()
    };
  }

  async getAllUsers(): Promise<User[]> {
    await this.ensureInitialized();
    
    const query = `SELECT * FROM users ORDER BY created_at DESC`;
    const result = await this.db.query(query);
    
    return result.values || [];
  }

  async getUserById(id: number): Promise<User | null> {
    await this.ensureInitialized();
    
    const query = `SELECT * FROM users WHERE id = ?`;
    const result = await this.db.query(query, [id]);
    
    return result.values && result.values.length > 0 ? result.values[0] : null;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    await this.ensureInitialized();
    
    const query = `SELECT * FROM users WHERE username = ?`;
    const result = await this.db.query(query, [username]);
    
    return result.values && result.values.length > 0 ? result.values[0] : null;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | null> {
    await this.ensureInitialized();
    
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    
    const updateQuery = `UPDATE users SET ${fields} WHERE id = ?`;
    await this.db.run(updateQuery, [...values, id]);
    
    console.log('✅ Usuario actualizado');
    return await this.getUserById(id);
  }

  async deleteUser(id: number): Promise<boolean> {
    await this.ensureInitialized();
    
    const deleteQuery = `DELETE FROM users WHERE id = ?`;
    const result = await this.db.run(deleteQuery, [id]);
    
    console.log('✅ Usuario eliminado');
    return (result.changes?.changes || 0) > 0;
  }

  // ==================== AUTENTICACIÓN Y SESIÓN ====================
  
  async login(username: string, password: string): Promise<User> {
    await this.ensureInitialized();
    
    const user = await this.getUserByUsername(username);
    
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    
    if (user.password !== password) {
      throw new Error('Contraseña incorrecta');
    }
    
    // Guardar sesión
    await this.setCurrentUser(user.id!);
    
    console.log('✅ Login exitoso:', username);
    return user;
  }

  async logout(): Promise<void> {
    await this.ensureInitialized();
    
    const deleteQuery = `DELETE FROM session WHERE id = 1`;
    await this.db.run(deleteQuery);
    
    console.log('✅ Logout exitoso');
  }

  async setCurrentUser(userId: number): Promise<void> {
    await this.ensureInitialized();
    
    // Primero eliminar sesión anterior
    await this.db.run(`DELETE FROM session WHERE id = 1`);
    
    // Insertar nueva sesión
    const insertQuery = `INSERT INTO session (id, user_id) VALUES (1, ?)`;
    await this.db.run(insertQuery, [userId]);
    
    console.log('✅ Sesión guardada para usuario ID:', userId);
  }

  async getCurrentUser(): Promise<User | null> {
    await this.ensureInitialized();
    
    const query = `SELECT user_id FROM session WHERE id = 1`;
    const result = await this.db.query(query);
    
    if (!result.values || result.values.length === 0) {
      return null;
    }
    
    const userId = result.values[0].user_id;
    return await this.getUserById(userId);
  }

  async isUserLoggedIn(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }

  // ==================== CONFIGURACIÓN ====================
  
  async getConfigValue(key: string): Promise<string | null> {
    await this.ensureInitialized();
    
    const query = `SELECT value FROM config WHERE key = ?`;
    const result = await this.db.query(query, [key]);
    
    return result.values && result.values.length > 0 ? result.values[0].value : null;
  }

  async setConfigValue(key: string, value: string): Promise<void> {
    await this.ensureInitialized();
    
    const updateQuery = `UPDATE config SET value = ? WHERE key = ?`;
    const result = await this.db.run(updateQuery, [value, key]);
    
    // Si no se actualizó, insertar
    if (result.changes?.changes === 0) {
      const insertQuery = `INSERT INTO config (key, value) VALUES (?, ?)`;
      await this.db.run(insertQuery, [key, value]);
    }
    
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
    return value === 'true';
  }

  async setOnboardingComplete(): Promise<void> {
    await this.setConfigValue('has_seen_onboarding', 'true');
  }

  // ==================== HISTORIAL QR (Para futuro) ====================
  
  async addQRToHistory(qr: Omit<QRHistory, 'id' | 'timestamp'>): Promise<QRHistory> {
    await this.ensureInitialized();
    
    const insertQuery = `
      INSERT INTO qr_history (content, type, favorite) 
      VALUES (?, ?, ?)
    `;
    const result = await this.db.run(insertQuery, [qr.content, qr.type, qr.favorite || 0]);
    
    console.log('✅ QR agregado al historial');
    
    return {
      id: result.changes?.lastId,
      ...qr,
      timestamp: new Date().toISOString()
    };
  }

  async getQRHistory(): Promise<QRHistory[]> {
    await this.ensureInitialized();
    
    const query = `SELECT * FROM qr_history ORDER BY timestamp DESC`;
    const result = await this.db.query(query);
    
    return result.values || [];
  }

  async deleteQRFromHistory(id: number): Promise<boolean> {
    await this.ensureInitialized();
    
    const deleteQuery = `DELETE FROM qr_history WHERE id = ?`;
    const result = await this.db.run(deleteQuery, [id]);
    
    console.log('✅ QR eliminado del historial');
    return (result.changes?.changes || 0) > 0;
  }

  async clearQRHistory(): Promise<void> {
    await this.ensureInitialized();
    
    await this.db.run(`DELETE FROM qr_history`);
    console.log('✅ Historial limpiado');
  }

  // ==================== UTILIDADES ====================
  
  async clearAllData(): Promise<void> {
    await this.ensureInitialized();
    
    await this.db.execute(`
      DELETE FROM users;
      DELETE FROM config;
      DELETE FROM session;
      DELETE FROM qr_history;
    `);
    
    console.log('⚠️ Todos los datos eliminados');
  }

  async debugShowAllData(): Promise<void> {
    await this.ensureInitialized();
    
    console.group('🔍 DEBUG: Todos los datos SQLite');
    console.log('Usuarios:', await this.getAllUsers());
    console.log('Usuario actual:', await this.getCurrentUser());
    console.log('Idioma:', await this.getLanguage());
    console.log('Tema:', await this.getTheme());
    console.log('Onboarding visto:', await this.hasSeenOnboarding());
    console.log('Historial QR:', await this.getQRHistory());
    console.groupEnd();
  }

  async closeDatabase(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.isInitialized = false;
      console.log('✅ Base de datos cerrada');
    }
  }
}
