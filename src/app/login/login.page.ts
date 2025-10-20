import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonLabel, IonInput, IonButton, IonText, IonSpinner, IonFab, IonFabButton, IonIcon, AlertController } from '@ionic/angular/standalone';
import { AuthService } from '../services/auth.service';
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
  username: string = '';
  password: string = '';
  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
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

    // Verificar si ya está autenticado
    const isAuthenticated = await this.authService.isAuthenticated();
    if (isAuthenticated) {
      console.log('✅ Ya está autenticado, redirigiendo a home');
      this.router.navigate(['/home']);
    }
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
    const result = await this.authService.login(this.username, this.password);
    this.isLoading = false;

    if (result.success) {
      // Limpiar la contraseña por seguridad
      this.password = '';
      this.router.navigate(['/home']);
    } else {
      await this.showAlert(
        this.translation.translate('error'),
        result.message
      );
    }
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }

  async resetPassword() {
    const alert = await this.alertController.create({
      header: this.translation.translate('resetPassword'),
      message: this.translation.translate('resetPasswordMessage'),
      inputs: [
        {
          name: 'username',
          type: 'text',
          placeholder: this.translation.translate('username')
        },
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
          text: this.translation.translate('reset'),
          handler: async (data) => {
            if (!data.username || !data.email) {
              await this.showAlert(
                this.translation.translate('error'),
                this.translation.translate('fieldRequired')
              );
              return false;
            }

            // Verificar que el usuario y email coincidan
            const user = await this.storage.getUserByUsername(data.username);
            
            if (!user) {
              await this.showAlert(
                this.translation.translate('error'),
                this.translation.translate('userNotFound')
              );
              return false;
            }

            if (user.email !== data.email) {
              await this.showAlert(
                this.translation.translate('error'),
                this.translation.translate('emailMismatch')
              );
              return false;
            }

            // Mostrar mensaje de confirmación de envío de correo
            await this.showEmailSentConfirmation(user.id!);
            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  async showEmailSentConfirmation(userId: number) {
    // Mensaje de confirmación con opción de cambiar contraseña directamente (simulación)
    const alert = await this.alertController.create({
      header: this.translation.translate('emailSent'),
      message: this.translation.translate('emailSentMessage'),
      buttons: [
        {
          text: this.translation.translate('ok'),
          role: 'cancel'
        },
        {
          text: this.translation.translate('changeNow'),
          handler: async () => {
            // Permitir cambiar la contraseña directamente (solo para demo)
            await this.showNewPasswordDialog(userId);
            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  async showNewPasswordDialog(userId: number) {
    const alert = await this.alertController.create({
      header: this.translation.translate('newPassword'),
      message: this.translation.translate('newPasswordMessage'),
      inputs: [
        {
          name: 'password',
          type: 'password',
          placeholder: this.translation.translate('newPassword')
        },
        {
          name: 'confirmPassword',
          type: 'password',
          placeholder: this.translation.translate('confirmPassword')
        }
      ],
      buttons: [
        {
          text: this.translation.translate('cancel'),
          role: 'cancel'
        },
        {
          text: this.translation.translate('save'),
          handler: async (data) => {
            if (!data.password || !data.confirmPassword) {
              await this.showAlert(
                this.translation.translate('error'),
                this.translation.translate('fieldRequired')
              );
              return false;
            }

            if (data.password.length < 6) {
              await this.showAlert(
                this.translation.translate('error'),
                this.translation.translate('passwordTooShort')
              );
              return false;
            }

            if (data.password !== data.confirmPassword) {
              await this.showAlert(
                this.translation.translate('error'),
                this.translation.translate('passwordMismatch')
              );
              return false;
            }

            // Actualizar la contraseña
            await this.storage.updateUser(userId, { password: data.password });
            
            await this.showAlert(
              this.translation.translate('success'),
              this.translation.translate('passwordResetSuccess')
            );
            
            return true;
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
