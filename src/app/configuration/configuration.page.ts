import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon, IonList, IonItem, IonLabel, IonNote, IonFab, IonFabButton, AlertController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBackOutline, informationOutline } from 'ionicons/icons';
import { TranslationService } from '../services/translation.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-configuration',
  templateUrl: './configuration.page.html',
  styleUrls: ['./configuration.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon, IonList, IonItem, IonLabel, IonNote, IonFab, IonFabButton]
})
export class ConfigurationPage implements OnInit, OnDestroy {
  selectedLanguage: string = 'English';
  private languageSubscription?: Subscription;
  
  private languages = [
    { text: 'English', value: 'en' },
    { text: 'Español', value: 'es' }
  ];

  constructor(
    private router: Router, 
    private alertController: AlertController,
    private translationService: TranslationService
  ) {
    addIcons({ arrowBackOutline, informationOutline });
  }

  // Subscricion a cambios de idioma
  ngOnInit() {
    this.languageSubscription = this.translationService.currentLanguage$.subscribe(language => {
      this.selectedLanguage = this.translationService.getLanguageDisplay(language);
    });
  }

  // Limpiar subscripcion al destruir el componente
  ngOnDestroy() {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }

  async changeLanguage() {
    const alert = await this.alertController.create({
      header: this.translationService.translate('selectLanguage'),
      inputs: this.languages.map(lang => ({
        name: 'language',
        type: 'radio',
        label: lang.text,
        value: lang.value,
        checked: lang.value === this.translationService.getCurrentLanguage()
      })),
      buttons: [
        {
          text: this.translationService.translate('cancel'),
          role: 'cancel'
        },
        {
          text: this.translationService.translate('ok'),
          handler: (data) => {
            if (data) {
              this.translationService.setLanguage(data);
              console.log('Language changed to:', data);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  testErrorPage() {
    // Intentar navegar a una página que no existe para probar el manejo de errores 404
    this.router.navigate(['/pagina-inexistente-para-probar-404']);
  }
}
