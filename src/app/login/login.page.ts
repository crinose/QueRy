import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonLabel, IonInput, IonButton, IonText, IonSpinner, IonFab, IonFabButton, IonIcon, AlertController } from '@ionic/angular/standalone';
import { FirebaseAuthService } from '../services/firebase-auth.service';
import { FirebaseDataService } from '../services/firebase-data.service';
import { AppModeService } from '../services/app-mode.service';
import { TranslationService } from '../services/translation.service';
import { StorageService } from '../services/storage.service';
import { addIcons } from 'ionicons';
import { languageOutline } from 'ionicons/icons';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonLabel, IonInput, IonButton, IonText, IonSpinner, IonFab, IonFabButton, IonIcon, CommonModule, FormsModule]
})
export class LoginPage implements OnInit {
  username: string = ''; // Ahora acepta email
  password: string = '';
  isLoading: boolean = false;

  constructor(
    private firebaseAuth: FirebaseAuthService,
    private firebaseData: FirebaseDataService,
    private appMode: AppModeService,
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
    console.log('🔍 Login - hasSeenOnboarding:', hasSeenOnboarding);
    
    if (!hasSeenOnboarding) {
      console.log('❌ No ha visto onboarding, redirigiendo...');
      this.router.navigate(['/onboarding']);
      return;
    }
    
    // NO verificar autenticación aquí - dejar que el usuario haga login
  }

  async login() {
    if (!this.username || !this.password) {
      await this.showAlert(
        this.translation.translate('error'),
        this.translation.translate('fieldRequired')
      );
      return;
    }

    this.isLoading = true;
    
    try {
      // Login con Firebase usando email
      await this.firebaseAuth.login(this.username, this.password);
      
      // Verificar si el email está verificado
      const currentUser = this.firebaseAuth.getCurrentUser();
      if (currentUser && !currentUser.emailVerified) {
        // Email no verificado - cerrar sesión y mostrar mensaje
        await this.firebaseAuth.logout();
        
        // Preguntar si quiere reenviar el email
        const alert = await this.alertController.create({
          header: this.translation.translate('emailNotVerified'),
          message: this.translation.translate('emailNotVerifiedMessage'),
          buttons: [
            {
              text: this.translation.translate('cancel'),
              role: 'cancel'
            },
            {
              text: this.translation.translate('resendVerificationEmail'),
              handler: async () => {
                try {
                  // Hacer login temporal para poder reenviar
                  await this.firebaseAuth.login(this.username, this.password);
                  await this.firebaseAuth.resendVerificationEmail();
                  await this.firebaseAuth.logout();
                  
                  await this.showAlert(
                    this.translation.translate('success'),
                    this.translation.translate('verificationEmailResent')
                  );
                } catch (error: any) {
                  await this.showAlert(
                    this.translation.translate('error'),
                    error.message
                  );
                }
              }
            }
          ]
        });
        
        await alert.present();
        this.isLoading = false;
        return;
      }
      
      // Esperar un momento para que Firebase actualice el estado de autenticación
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Inicializar perfil y configuración del usuario en el primer login
      try {
        const profile = await this.firebaseData.getUserProfile();
        if (!profile) {
          // Primera vez que inicia sesión, crear perfil y configuración
          await this.firebaseData.saveUserProfile(this.username, this.username);
          await this.firebaseData.saveUserConfig({
            vibrationEnabled: true,
            soundEnabled: true,
            saveHistoryEnabled: true
          });
        }
      } catch (profileError) {
        console.log('Error al verificar/crear perfil:', profileError);
        // Intentar crear el perfil de todas formas
        try {
          await this.firebaseData.saveUserProfile(this.username, this.username);
          await this.firebaseData.saveUserConfig({
            vibrationEnabled: true,
            soundEnabled: true,
            saveHistoryEnabled: true
          });
        } catch (e) {
          console.log('No se pudo crear el perfil, continuando:', e);
        }
      }
      
      // Limpiar la contraseña por seguridad
      this.password = '';
      
      // GUARDAR SESIÓN ACTIVA
      const userId = this.firebaseAuth.getCurrentUserId();
      if (userId) {
        await this.storage.setConfigValue('session_active', 'true');
        await this.storage.setConfigValue('firebase_uid', userId);
        await this.storage.setConfigValue('user_email', this.username);
        console.log('💾 SESIÓN GUARDADA');
        console.log('   UID:', userId);
        console.log('   Email:', this.username);
      }
      
      // Establecer modo autenticado (esto se guarda en Preferences)
      console.log('💾 Guardando modo authenticated...');
      await this.appMode.setMode('authenticated');
      
      // VERIFICAR que realmente se guardó
      const verificarModo = this.appMode.getMode();
      console.log('✅ Verificación - Modo actual:', verificarModo);
      
      // Esperar para asegurar persistencia
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('🚀 Navegando a home...');
      this.router.navigate(['/home']);
    } catch (error: any) {
      await this.showAlert(
        this.translation.translate('error'),
        error.message
      );
    } finally {
      this.isLoading = false;
    }
  }

  async continueAsGuest() {
    // Establecer modo invitado
    await this.appMode.setMode('guest');
    
    // Ir directamente al home sin autenticación
    this.router.navigate(['/home']);
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }

  async resetPassword() {
    const alert = await this.alertController.create({
      header: this.translation.translate('resetPassword'),
      message: 'Ingresa tu correo electrónico para recibir un enlace de recuperación',
      inputs: [
        {
          name: 'email',
          type: 'email',
          placeholder: this.translation.translate('email')
        }
      ],
      buttons: [
        {
          text: this.translation.translate('cancel'),
          role: 'cancel'
        },
        {
          text: 'Enviar',
          handler: async (data) => {
            if (!data.email) {
              await this.showAlert(
                this.translation.translate('error'),
                'Por favor ingresa tu correo electrónico'
              );
              return false;
            }

            try {
              await this.firebaseAuth.resetPassword(data.email);
              await this.showAlert(
                this.translation.translate('success'),
                'Se ha enviado un correo de recuperación. Revisa tu bandeja de entrada.'
              );
              return true;
            } catch (error: any) {
              await this.showAlert(
                this.translation.translate('error'),
                error.message
              );
              return false;
            }
          }
        }
      ]
    });

    await alert.present();
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
