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
      readQR: 'Scan QR',
      createQR: 'Create QR Code',
      historyDesc: 'Your QR code history will appear here...',
      readQRDesc: 'Choose your scan method',
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
      continueWithoutAccount: 'Continue without account',
      // Modo de Cuenta
      accountMode: 'Account Mode',
      guestMode: 'Using app without account',
      guest: 'Guest',
      authenticated: 'Authenticated',
      signInToSync: 'Sign in to sync your data',
      signInToSyncDescription: 'Create an account to save your QR history in the cloud',
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
      // Verificación de Email
      emailVerificationRequired: 'Email Verification Required',
      emailVerificationSent: 'A verification email has been sent to your email address. Please check your inbox (and spam folder) and click the verification link before logging in.',
      emailNotVerified: 'Email Not Verified',
      emailNotVerifiedMessage: 'Please verify your email address before logging in. Check your inbox for the verification link.',
      resendVerificationEmail: 'Resend Verification Email',
      verificationEmailResent: 'Verification email has been resent. Please check your inbox.',
      // QR Scanner
      scanQR: 'Scan QR Code',
      scanFromImage: 'Scan from Image',
      selectImage: 'Select Image',
      noQRFound: 'No QR code found in image',
      errorReadingImage: 'Error reading image',
      qrResult: 'QR Result',
      scannedContent: 'Scanned Content',
      detectedUrl: 'Detected URL',
      copyToClipboard: 'Copy to Clipboard',
      copiedToClipboard: '✓ Copied to clipboard successfully',
      copyError: 'Error copying to clipboard',
      openUrl: 'Open URL',
      openInYouTube: 'Open in YouTube',
      sendEmail: 'Send Email',
      callNumber: 'Call Number',
      openingEmail: 'Opening email client...',
      openingDialer: 'Opening phone dialer...',
      noActionAvailable: 'No action available for this content',
      errorOpeningContent: 'Error opening content',
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
      favorites: 'Favorites',
      noFavorites: 'No favorites yet',
      addedToFavorites: 'Added to favorites',
      removedFromFavorites: 'Removed from favorites',
      // Compartir y Descargar
      share: 'Share',
      download: 'Download',
      shareNotSupported: 'Share is not supported on this device',
      errorSharing: 'Error sharing content',
      noQRToDownload: 'No QR code to download',
      qrDownloaded: 'QR code downloaded successfully',
      errorDownloading: 'Error downloading QR code',
      qrContent: 'QR Code Content',
      addToFavorites: 'Add to Favorites',
      removeFromFavorites: 'Remove from Favorites',
      favoritesOnlyGuest: 'Favorites only available in guest mode for now',
      // Editar Nombre
      editName: 'Edit Name',
      enterCustomName: 'Enter custom name',
      nameSaved: 'Name saved successfully',
      errorSavingName: 'Error saving name',
      // QR Generation
      qrCreatedSuccess: 'QR code created successfully',
      qrGenerationError: 'Error generating QR code. Please try again.',
      createAnother: 'Create Another',
      // 404 Page
      pageNotFoundTitle: 'Page Not Found',
      pageNotFoundMessage: "Sorry, the page you're looking for doesn't exist or has been moved.",
      goToHome: 'Go to Home',
      // Donaciones
      supportUs: 'Support Us',
      supportHeader: 'Thank you for your support!',
      supportMessage: 'Help keep QueRy free and open source',
      supportIntroMessage: 'At PixelPudu, we reject advertising to offer you a clean and respectful experience. Your voluntary donation is the only thing that allows us to keep this project alive and ad-free. Thank you from the bottom of our hearts for being here and helping us keep creating!',
      donate1: 'Donate $1 - Google Pay',
      donate3: 'Donate $3 - Google Pay',
      donate5: 'Donate $5 - Google Pay',
      donate10: 'Donate $10 - Google Pay',
      subscribeMonthly: 'Subscribe $3/month - Google Pay',
      shareApp: 'Share the App',
      googlePayDonation: 'Google Pay Donation',
      donationAmount: 'Donation Amount',
      googlePayComingSoon: 'Google Pay integration coming soon. Thank you for your interest!',
      monthlySubscription: 'Monthly Subscription',
      subscriptionAmount: 'Subscription',
      close: 'Close',
      thankYou: 'Thank you for your support! ❤️',
      shareAppText: 'Check out QueRy - The best QR code scanner and generator!',
    },
    //Lenguaje ES (Español)
    es: {
      // Pagina Home
      welcome: 'Bienvenido a QueRy',
      chooseOption: 'Elige una de las opciones a continuación para comenzar:',
      tapToStart: '¡Toca cualquier botón para empezar!',
      history: 'Historial',
      readQR: 'Escanear QR',
      createQR: 'Crear QR',
      historyDesc: 'Tu historial de códigos QR aparecerá aquí...',
      readQRDesc: 'Elige tu método de escaneo',
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
      continueWithoutAccount: 'Continuar sin cuenta',
      // Modo de Cuenta
      accountMode: 'Modo de Cuenta',
      guestMode: 'Usando la app sin cuenta',
      guest: 'Invitado',
      authenticated: 'Autenticado',
      signInToSync: 'Inicia sesión para sincronizar tus datos',
      signInToSyncDescription: 'Crea una cuenta para guardar tu historial de QR en la nube',
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
      // Verificación de Email
      emailVerificationRequired: 'Verificación de Email Requerida',
      emailVerificationSent: 'Se ha enviado un correo de verificación a tu dirección de email. Por favor revisa tu bandeja de entrada (y carpeta de spam) y haz clic en el enlace de verificación antes de iniciar sesión.',
      emailNotVerified: 'Email No Verificado',
      emailNotVerifiedMessage: 'Por favor verifica tu dirección de email antes de iniciar sesión. Revisa tu bandeja de entrada para encontrar el enlace de verificación.',
      resendVerificationEmail: 'Reenviar Email de Verificación',
      verificationEmailResent: 'El email de verificación ha sido reenviado. Por favor revisa tu bandeja de entrada.',
      // QR Scanner
      scanQR: 'Escanear Código QR',
      scanFromImage: 'Escanear desde Imagen',
      selectImage: 'Seleccionar Imagen',
      noQRFound: 'No se encontró código QR en la imagen',
      errorReadingImage: 'Error al leer la imagen',
      qrResult: 'Resultado QR',
      scannedContent: 'Contenido Escaneado',
      detectedUrl: 'URL Detectada',
      copyToClipboard: 'Copiar al Portapapeles',
      copiedToClipboard: '✓ Copiado al portapapeles exitosamente',
      copyError: 'Error al copiar al portapapeles',
      openUrl: 'Abrir URL',
      openInYouTube: 'Abrir en YouTube',
      sendEmail: 'Enviar Correo',
      callNumber: 'Llamar',
      openingEmail: 'Abriendo cliente de correo...',
      openingDialer: 'Abriendo marcador...',
      noActionAvailable: 'No hay acción disponible para este contenido',
      errorOpeningContent: 'Error al abrir el contenido',
      scanAnother: 'Escanear Otro QR',
      back: 'Atrás',
      // QR History
      qrScanned: 'Escaneado',
      qrCreated: 'Creado',
      emptyHistory: 'No hay códigos QR en el historial aún',
      clearHistory: 'Limpiar Historial',
      clearHistoryMessage: '¿Estás seguro de que quieres limpiar todo el historial?',
      confirmDelete: 'Eliminar',
      confirmDeleteMessage: '¿Estás seguro de que quieres eliminar este elemento?',
      delete: 'Eliminar',
      clear: 'Limpiar',
      favorites: 'Favoritos',
      noFavorites: 'No hay favoritos aún',
      addedToFavorites: 'Agregado a favoritos',
      removedFromFavorites: 'Removido de favoritos',
      // Compartir y Descargar
      share: 'Compartir',
      download: 'Descargar',
      shareNotSupported: 'Compartir no está disponible en este dispositivo',
      errorSharing: 'Error al compartir contenido',
      noQRToDownload: 'No hay código QR para descargar',
      qrDownloaded: 'Código QR descargado exitosamente',
      errorDownloading: 'Error al descargar código QR',
      qrContent: 'Contenido del Código QR',
      addToFavorites: 'Agregar a Favoritos',
      removeFromFavorites: 'Quitar de Favoritos',
      favoritesOnlyGuest: 'Favoritos solo disponibles en modo invitado por ahora',
      // Editar Nombre
      editName: 'Editar Nombre',
      enterCustomName: 'Ingresa un nombre personalizado',
      nameSaved: 'Nombre guardado exitosamente',
      errorSavingName: 'Error al guardar el nombre',
      // QR Generation
      qrCreatedSuccess: 'Código QR creado exitosamente',
      qrGenerationError: 'Error al generar el código QR. Por favor, intenta de nuevo.',
      createAnother: 'Crear Otro',
      // 404 Page
      pageNotFoundTitle: 'Página No Encontrada',
      pageNotFoundMessage: 'Lo sentimos, la página que buscas no existe o ha sido movida.',
      goToHome: 'Ir al Inicio',
      // Donaciones
      supportUs: 'Apóyanos',
      supportHeader: '¡Gracias por tu apoyo!',
      supportMessage: 'Ayuda a mantener QueRy gratuito y de código abierto',
      supportIntroMessage: 'En PixelPudu renunciamos a la publicidad para ofrecerte una experiencia limpia y respetuosa. Tu donación voluntaria es lo único que nos permite mantener este proyecto vivo y libre de anuncios. ¡Gracias de corazón por estar aquí y ayudarnos a seguir creando!',
      donate1: 'Donar $1 - Google Pay',
      donate3: 'Donar $3 - Google Pay',
      donate5: 'Donar $5 - Google Pay',
      donate10: 'Donar $10 - Google Pay',
      subscribeMonthly: 'Suscripción $3/mes - Google Pay',
      shareApp: 'Compartir la App',
      googlePayDonation: 'Donación Google Pay',
      donationAmount: 'Monto de Donación',
      googlePayComingSoon: 'Integración con Google Pay próximamente. ¡Gracias por tu interés!',
      monthlySubscription: 'Suscripción Mensual',
      subscriptionAmount: 'Suscripción',
      close: 'Cerrar',
      thankYou: '¡Gracias por tu apoyo! ❤️',
      shareAppText: '¡Mira QueRy - El mejor escaner y generador de códigos QR!',
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
