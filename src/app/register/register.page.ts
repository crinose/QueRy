import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonLabel, IonInput, IonButton, IonText, IonSpinner, IonBackButton, IonButtons, IonFab, IonFabButton, IonIcon, AlertController } from '@ionic/angular/standalone';
import { FirebaseAuthService } from '../services/firebase-auth.service';
import { FirebaseDataService } from '../services/firebase-data.service';
import { TranslationService } from '../services/translation.service';
import { StorageService } from '../services/storage.service';
import { addIcons } from 'ionicons';
import { languageOutline } from 'ionicons/icons';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonLabel, IonInput, IonButton, IonText, IonSpinner, IonBackButton, IonButtons, IonFab, IonFabButton, IonIcon, CommonModule, FormsModule]
})
export class RegisterPage implements OnInit {
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  isLoading: boolean = false;

  constructor(
    private firebaseAuth: FirebaseAuthService,
    private firebaseData: FirebaseDataService,
    private router: Router,
    public translation: TranslationService,
    private alertController: AlertController,
    private storage: StorageService
  ) {
    addIcons({ languageOutline });
  }

  async ngOnInit() {
    // ESPERAR a que el storage se inicialice completamente
    await this.storage.waitForInitialization();
    
    // Verificar si el usuario ya vio el onboarding
    const hasSeenOnboarding = await this.storage.hasSeenOnboarding();
    console.log('🔍 Register - hasSeenOnboarding:', hasSeenOnboarding);
    
    if (!hasSeenOnboarding) {
      console.log('❌ No ha visto onboarding, redirigiendo...');
      this.router.navigate(['/onboarding']);
      return;
    }
    
    // NO verificar autenticación aquí - dejar que el usuario se registre
  }

  async register() {
    // Validaciones
    if (!this.email || !this.password || !this.confirmPassword) {
      await this.showAlert(
        this.translation.translate('error'),
        this.translation.translate('fieldRequired')
      );
      return;
    }

    if (!this.isValidEmail(this.email)) {
      await this.showAlert(
        this.translation.translate('error'),
        this.translation.translate('invalidEmail')
      );
      return;
    }

    if (this.password !== this.confirmPassword) {
      await this.showAlert(
        this.translation.translate('error'),
        'Las contraseñas no coinciden'
      );
      return;
    }

    if (this.password.length < 6) {
      await this.showAlert(
        this.translation.translate('error'),
        'La contraseña debe tener al menos 6 caracteres'
      );
      return;
    }

    this.isLoading = true;
    
    try {
      // Registrar en Firebase Auth y enviar email de verificación
      const user = await this.firebaseAuth.register(this.email, this.password);
      
      // Cerrar sesión inmediatamente para que tenga que hacer login manual
      await this.firebaseAuth.logout();
      
      // Esperar un momento para que el estado se actualice
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await this.showAlert(
        this.translation.translate('emailVerificationRequired'),
        this.translation.translate('emailVerificationSent')
      );
      
      // Ir a login
      this.router.navigate(['/login']);
    } catch (error: any) {
      await this.showAlert(
        this.translation.translate('error'),
        error.message
      );
    } finally {
      this.isLoading = false;
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: [this.translation.translate('ok')]
    });
    await alert.present();
  }

  toggleLanguage() {
    const currentLang = this.translation.getCurrentLanguage();
    const newLang = currentLang === 'en' ? 'es' : 'en';
    this.translation.setLanguage(newLang);
    console.log('🌐 Idioma cambiado a:', newLang);
  }
}
