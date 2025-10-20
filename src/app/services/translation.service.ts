//Servicio de Traducción para manejar múltiples idiomas en la aplicación

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { StorageService } from './storage.service';

export interface Translations {
  [key: string]: string;
}

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private currentLanguage = new BehaviorSubject<string>('en');
  public currentLanguage$ = this.currentLanguage.asObservable();

  private translations: { [key: string]: Translations } = {
    //Lenguaje EN (English)
    en: {
      // Pagina Home
      welcome: 'Welcome to QueRy',
      chooseOption: 'Choose one of the options below to get started:',
      tapToStart: 'Tap any button below to start!',
      history: 'History',
      readQR: 'Read QR',
      createQR: 'Create QR Code',
      historyDesc: 'Your QR code history will appear here...',
      readQRDesc: 'Tap the button below to scan a QR code with your camera',
      enterText: 'Enter text to convert to QR',
      generateQR: 'Generate QR',
      // Pagina Configuracion
      configuration: 'Configuration',
      appSettings: 'App Settings',
      appVersion: 'App Version',
      language: 'Language',
      selectLanguage: 'Select Language',
      cancel: 'Cancel',
      ok: 'OK',
      // Login/Registro
      login: 'Login',
      register: 'Register',
      username: 'Username',
      password: 'Password',
      email: 'Email',
      noAccount: "Don't have an account?",
      hasAccount: 'Already have an account?',
      loginButton: 'Sign In',
      registerButton: 'Sign Up',
      logout: 'Logout',
      // Onboarding
      skip: 'Skip',
      next: 'Next',
      getStarted: 'Get Started',
      onboarding1Title: 'Welcome to QueRy',
      onboarding1Desc: 'The easiest way to generate and scan QR codes',
      onboarding2Title: 'Generate QR Codes',
      onboarding2Desc: 'Create QR codes from text, URLs and more',
      onboarding3Title: 'Scan QR Codes',
      onboarding3Desc: 'Quickly scan and save QR codes',
      // Errores
      error: 'Error',
      success: 'Success',
      fieldRequired: 'This field is required',
      invalidEmail: 'Invalid email',
      loginError: 'Incorrect username or password',
      registerError: 'Error registering user',
      // Reseteo de Contraseña
      forgotPassword: 'Forgot Password?',
      resetPassword: 'Reset Password',
      resetPasswordMessage: 'Enter your username and email to reset your password',
      userNotFound: 'User not found',
      emailMismatch: 'Email does not match',
      emailSent: 'Email Sent!',
      emailSentMessage: 'A password reset link has been sent to your email. Check your inbox and follow the instructions.\n\nFor demo purposes, you can also change your password directly by clicking "Change Now".',
      changeNow: 'Change Now (Demo)',
      newPassword: 'New Password',
      newPasswordMessage: 'Enter your new password',
      confirmPassword: 'Confirm Password',
      passwordMismatch: 'Passwords do not match',
      passwordTooShort: 'Password must be at least 6 characters',
      passwordResetSuccess: 'Password reset successfully',
      reset: 'Reset',
      save: 'Save',
      // QR Scanner
      scanQR: 'Scan QR Code',
      qrResult: 'QR Result',
      scannedContent: 'Scanned Content',
      detectedUrl: 'Detected URL',
      copyToClipboard: 'Copy to Clipboard',
      copiedToClipboard: '✓ Copied to clipboard successfully',
      copyError: 'Error copying to clipboard',
      openUrl: 'Open URL',
      scanAnother: 'Scan Another QR',
      back: 'Back',
      // QR History
      qrScanned: 'Scanned',
      qrCreated: 'Created',
      emptyHistory: 'No QR codes in history yet',
      clearHistory: 'Clear History',
      clearHistoryMessage: 'Are you sure you want to clear all history?',
      confirmDelete: 'Delete',
      confirmDeleteMessage: 'Are you sure you want to delete this item?',
      delete: 'Delete',
      clear: 'Clear',
      // QR Generation
      qrCreatedSuccess: 'QR code created successfully',
      qrGenerationError: 'Error generating QR code. Please try again.',
      createAnother: 'Create Another',
      // 404 Page
      pageNotFoundTitle: 'Page Not Found',
      pageNotFoundMessage: "Sorry, the page you're looking for doesn't exist or has been moved.",
      goToHome: 'Go to Home',
    },
    //Lenguaje ES (Español)
    es: {
      // Pagina Home
      welcome: 'Bienvenido a QueRy',
      chooseOption: 'Elige una de las opciones a continuación para comenzar:',
      tapToStart: '¡Toca cualquier botón para empezar!',
      history: 'Historial',
      readQR: 'Leer QR',
      createQR: 'Crear QR',
      historyDesc: 'Tu historial de códigos QR aparecerá aquí...',
      readQRDesc: 'Toca el botón de abajo para escanear un código QR con tu cámara',
      enterText: 'Ingresa el texto para convertir a QR',
      generateQR: 'Generar QR',
      // Pagina Configuracion
      configuration: 'Configuración',
      appSettings: 'Configuración de la App',
      appVersion: 'Versión de la App',
      language: 'Idioma',
      selectLanguage: 'Seleccionar Idioma',
      cancel: 'Cancelar',
      ok: 'Aceptar',
      // Login/Registro
      login: 'Iniciar Sesión',
      register: 'Registrarse',
      username: 'Usuario',
      password: 'Contraseña',
      email: 'Correo',
      noAccount: '¿No tienes cuenta?',
      hasAccount: '¿Ya tienes cuenta?',
      loginButton: 'Entrar',
      registerButton: 'Crear Cuenta',
      logout: 'Cerrar Sesión',
      // Onboarding
      skip: 'Saltar',
      next: 'Siguiente',
      getStarted: 'Comenzar',
      onboarding1Title: 'Bienvenido a QueRy',
      onboarding1Desc: 'La forma más fácil de generar y escanear códigos QR',
      onboarding2Title: 'Genera Códigos QR',
      onboarding2Desc: 'Crea códigos QR desde texto, URLs y más',
      onboarding3Title: 'Escanea Códigos QR',
      onboarding3Desc: 'Escanea y guarda códigos QR rápidamente',
      // Errores
      error: 'Error',
      success: 'Éxito',
      fieldRequired: 'Este campo es requerido',
      invalidEmail: 'Correo inválido',
      loginError: 'Usuario o contraseña incorrectos',
      registerError: 'Error al registrar usuario',
      // Reseteo de Contraseña
      forgotPassword: '¿Olvidaste tu contraseña?',
      resetPassword: 'Restablecer Contraseña',
      resetPasswordMessage: 'Ingresa tu usuario y correo para restablecer tu contraseña',
      userNotFound: 'Usuario no encontrado',
      emailMismatch: 'El correo no coincide',
      emailSent: '¡Correo Enviado!',
      emailSentMessage: 'Se ha enviado un enlace para restablecer tu contraseña a tu correo electrónico. Revisa tu bandeja de entrada y sigue las instrucciones.\n\nPara propósitos de demostración, también puedes cambiar tu contraseña directamente haciendo clic en "Cambiar Ahora".',
      changeNow: 'Cambiar Ahora (Demo)',
      newPassword: 'Nueva Contraseña',
      newPasswordMessage: 'Ingresa tu nueva contraseña',
      confirmPassword: 'Confirmar Contraseña',
      passwordMismatch: 'Las contraseñas no coinciden',
      passwordTooShort: 'La contraseña debe tener al menos 6 caracteres',
      passwordResetSuccess: 'Contraseña restablecida exitosamente',
      reset: 'Restablecer',
      save: 'Guardar',
      // QR Scanner
      scanQR: 'Escanear Código QR',
      qrResult: 'Resultado del QR',
      scannedContent: 'Contenido Escaneado',
      detectedUrl: 'URL Detectada',
      copyToClipboard: 'Copiar al Portapapeles',
      copiedToClipboard: '✓ Copiado al portapapeles exitosamente',
      copyError: 'Error al copiar al portapapeles',
      openUrl: 'Abrir URL',
      scanAnother: 'Escanear Otro QR',
      back: 'Atrás',
      // QR History
      qrScanned: 'Leído',
      qrCreated: 'Creado',
      emptyHistory: 'Aún no hay códigos QR en el historial',
      clearHistory: 'Limpiar Historial',
      clearHistoryMessage: '¿Estás seguro de que quieres eliminar todo el historial?',
      confirmDelete: 'Eliminar',
      confirmDeleteMessage: '¿Estás seguro de que quieres eliminar este elemento?',
      delete: 'Eliminar',
      clear: 'Limpiar',
      // QR Generation
      qrCreatedSuccess: 'Código QR creado exitosamente',
      qrGenerationError: 'Error al generar el código QR. Por favor, intenta de nuevo.',
      createAnother: 'Crear Otro',
      // 404 Page
      pageNotFoundTitle: 'Página No Encontrada',
      pageNotFoundMessage: 'Lo sentimos, la página que buscas no existe o ha sido movida.',
      goToHome: 'Ir al Inicio',
    }
  };

  constructor(private storage: StorageService) {
    // Cargar Lenguaje desde el storage
    this.loadLanguageFromStorage();
  }

  private async loadLanguageFromStorage() {
    try {
      const savedLanguage = await this.storage.getLanguage();
      this.setLanguage(savedLanguage);
    } catch (error) {
      console.error('Error cargando idioma desde storage:', error);
      this.setLanguage('en');
    }
  }

  async setLanguage(language: string) {
    this.currentLanguage.next(language);
    try {
      await this.storage.setLanguage(language);
    } catch (error) {
      console.error('Error guardando idioma en storage:', error);
    }
  }

  getCurrentLanguage(): string {
    return this.currentLanguage.value;
  }

  translate(key: string): string {
    const language = this.getCurrentLanguage();
    return this.translations[language]?.[key] || this.translations['en'][key] || key;
  }

  getLanguageDisplay(language: string): string {
    return language === 'es' ? 'Español' : 'English';
  }
}
