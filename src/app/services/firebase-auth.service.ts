import { Injectable, inject } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, User, user, sendEmailVerification, sendPasswordResetEmail, onAuthStateChanged } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { StorageService } from './storage.service';

/**
 * Servicio de Autenticación con Firebase
 * 
 * Firebase Auth tiene persistencia automática en todas las plataformas:
 * - Android: Usa mecanismos nativos de Android
 * - iOS: Usa UserDefaults
 * - Web: Usa localStorage
 * 
 * La sesión persiste automáticamente al cerrar/abrir la app.
 */
@Injectable({
  providedIn: 'root'
})
export class FirebaseAuthService {
  private auth: Auth;
  user$: Observable<User | null>;
  currentUser: User | null = null;
  private storage: StorageService;

  constructor(auth: Auth, storage: StorageService) {
    this.auth = auth;
    this.storage = storage;
    
    console.log('🔧 FirebaseAuthService inicializado');
    
    // Observable que emite cambios de usuario
    this.user$ = user(this.auth);
    
    // Suscribirse a cambios
    this.user$.subscribe(u => {
      this.currentUser = u;
      console.log('👤 Firebase usuario actualizado:', u?.email || 'Nadie logueado');
      if (u) {
        console.log('🔑 UID:', u.uid);
        console.log('✉️ Email verificado:', u.emailVerified);
      }
    });
    
    // Listener nativo de Firebase
    onAuthStateChanged(this.auth, (user) => {
      console.log('🔄 onAuthStateChanged:', user?.email || 'null');
      if (user) {
        console.log('✅ Sesión restaurada automáticamente por Firebase');
      }
    });
  }

  /**
   * Crea una cuenta nueva con email y contraseña
   * 
   * IMPORTANTE: Después de crear la cuenta, automáticamente se envía un correo
   * de verificación al email proporcionado. El usuario debe hacer clic en el
   * enlace del correo antes de poder iniciar sesión.
   * 
   * @param email - El correo del nuevo usuario
   * @param password - La contraseña (mínimo 6 caracteres)
   * @returns El objeto User de Firebase si todo sale bien
   * @throws Error si el email ya existe o la contraseña es débil
   */
  async register(email: string, password: string): Promise<User> {
    try {
      // createUserWithEmailAndPassword es la función de Firebase para registrar
      const credential = await createUserWithEmailAndPassword(this.auth, email, password);
      
      // Enviar email de verificación automáticamente
      await sendEmailVerification(credential.user);
      console.log('✉️ Email de verificación enviado a:', email);
      
      return credential.user;
    } catch (error: any) {
      // Si algo sale mal, traducimos el error a español
      throw this.handleError(error);
    }
  }

  /**
   * Inicia sesión con email y contraseña
   * 
   * @param email - El correo del usuario
   * @param password - La contraseña del usuario
   * @returns El objeto User si las credenciales son correctas
   * @throws Error si el usuario no existe o la contraseña es incorrecta
   */
  async login(email: string, password: string): Promise<User> {
    try {
      const credential = await signInWithEmailAndPassword(this.auth, email, password);
      
      // ASEGURAR que storage esté inicializado antes de guardar
      await this.storage.initializeDatabase();
      
      // GUARDAR CREDENCIALES PARA RE-AUTENTICACIÓN AUTOMÁTICA
      await this.storage.setConfigValue('saved_email', email);
      await this.storage.setConfigValue('saved_password', password);
      console.log('💾 Credenciales guardadas para auto-login');
      console.log('   Email:', email);
      console.log('   Password guardada: ***');
      
      return credential.user;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Cierra la sesión del usuario actual
   * 
   * Borra todos los datos de sesión y vuelve currentUser a null
   */
  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      
      // BORRAR CREDENCIALES GUARDADAS
      await this.storage.setConfigValue('saved_email', '');
      await this.storage.setConfigValue('saved_password', '');
      console.log('🗑️ Credenciales borradas');
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Revisa si hay alguien logueado en este momento
   * 
   * @returns true si hay un usuario activo, false si no hay nadie
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  /**
   * Obtiene el objeto completo del usuario actual
   * 
   * @returns El User de Firebase o null si no hay sesión
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Obtiene solo el ID único del usuario (UID)
   * 
   * Este ID lo usa Firebase para identificar al usuario en la base de datos.
   * Cada usuario tiene un UID único que nunca cambia.
   * 
   * @returns El UID como string o null si no hay usuario
   */
  getCurrentUserId(): string | null {
    return this.currentUser?.uid || null;
  }

  /**
   * Intenta re-autenticar automáticamente usando credenciales guardadas
   * 
   * Se llama al inicio de la app para restaurar la sesión
   */
  async attemptAutoLogin(): Promise<boolean> {
    try {
      console.log('🔄 Intentando auto-login...');
      
      // ASEGURAR que storage esté inicializado antes de leer
      await this.storage.initializeDatabase();
      
      const savedEmail = await this.storage.getConfigValue('saved_email');
      const savedPassword = await this.storage.getConfigValue('saved_password');
      
      console.log('🔍 Credenciales leídas:');
      console.log('   Email:', savedEmail);
      console.log('   Password:', savedPassword ? '***' + savedPassword.slice(-3) : 'null');
      
      if (!savedEmail || !savedPassword || savedEmail === '' || savedPassword === '') {
        console.log('⚠️ No hay credenciales guardadas');
        return false;
      }
      
      console.log('🔑 Credenciales encontradas, re-autenticando...');
      await signInWithEmailAndPassword(this.auth, savedEmail, savedPassword);
      console.log('✅ AUTO-LOGIN EXITOSO');
      return true;
    } catch (error) {
      console.error('❌ Error en auto-login:', error);
      // Si falló, limpiar credenciales (probablemente cambiaron la contraseña)
      await this.storage.setConfigValue('saved_email', '');
      await this.storage.setConfigValue('saved_password', '');
      return false;
    }
  }

  /**
   * Envía un correo para resetear la contraseña
   * 
   * Firebase manda un email automático con un link para cambiar la contraseña.
   * El usuario hace clic en el link y puede poner una contraseña nueva.
   * 
   * @param email - El correo del usuario que olvidó su contraseña
   */
  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(this.auth, email);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Reenvía el email de verificación al usuario actual
   * 
   * Útil cuando el usuario no recibió el email inicial o lo borró por error.
   * Solo funciona si hay un usuario logueado y su email aún no está verificado.
   * 
   * @throws Error si no hay usuario logueado o el email ya está verificado
   */
  async resendVerificationEmail(): Promise<void> {
    try {
      if (!this.currentUser) {
        throw new Error('No hay usuario logueado');
      }
      
      if (this.currentUser.emailVerified) {
        throw new Error('El email ya está verificado');
      }
      
      await sendEmailVerification(this.currentUser);
      console.log('✉️ Email de verificación reenviado');
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Traduce los errores de Firebase a mensajes entendibles
   * 
   * Firebase devuelve errores en inglés con códigos raros como "auth/user-not-found".
   * Esta función los convierte a mensajes normales en español.
   * 
   * @param error - El error original de Firebase
   * @returns Un nuevo Error con mensaje en español
   */
  private handleError(error: any): Error {
    let message = 'Error desconocido';
    
    // Revisamos el código del error y asignamos un mensaje apropiado
    switch (error.code) {
      case 'auth/email-already-in-use':
        message = 'Este correo electrónico ya está registrado';
        break;
      case 'auth/invalid-email':
        message = 'Correo electrónico inválido';
        break;
      case 'auth/operation-not-allowed':
        message = 'Operación no permitida';
        break;
      case 'auth/weak-password':
        message = 'La contraseña debe tener al menos 6 caracteres';
        break;
      case 'auth/user-disabled':
        message = 'Esta cuenta ha sido deshabilitada';
        break;
      case 'auth/user-not-found':
        message = 'Usuario no encontrado';
        break;
      case 'auth/wrong-password':
        message = 'Contraseña incorrecta';
        break;
      case 'auth/invalid-credential':
        message = 'Credenciales inválidas';
        break;
      default:
        // Si no reconocemos el error, usamos el mensaje original
        message = error.message || 'Error al procesar la solicitud';
    }
    
    return new Error(message);
  }
}
