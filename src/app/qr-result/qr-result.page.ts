import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon, IonText, IonBackButton, IonButtons, ToastController, AlertController } from '@ionic/angular/standalone';
import { TranslationService } from '../services/translation.service';
import { QrHistoryService } from '../services/qr-history.service';
import { AppModeService } from '../services/app-mode.service';
import { FirebaseDataService } from '../services/firebase-data.service';
import { Clipboard } from '@capacitor/clipboard';
import { Browser } from '@capacitor/browser';
import { Share } from '@capacitor/share';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { addIcons } from 'ionicons';
import { copyOutline, qrCodeOutline, linkOutline, openOutline, callOutline, mailOutline, logoYoutube, starOutline, star, shareOutline, downloadOutline, pencilOutline } from 'ionicons/icons';
import QRCode from 'qrcode';

@Component({
  selector: 'app-qr-result',
  templateUrl: './qr-result.page.html',
  styleUrls: ['./qr-result.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader,
    IonCardTitle, IonCardContent, IonButton, IonIcon, IonText,
    IonBackButton, IonButtons, CommonModule, FormsModule
  ]
})
export class QrResultPage implements OnInit {
  qrData: string = '';
  qrCodeImage: string = '';
  isUrl: boolean = false;
  contentType: 'url' | 'email' | 'phone' | 'youtube' | 'text' = 'text';
  actionLabel: string = '';
  actionIcon: string = 'open-outline';
  isDarkMode: boolean = false;
  qrId: number | string = 0;
  isFavorite: boolean = false;
  customName: string = '';

  constructor(
    private router: Router,
    public translation: TranslationService,
    private toastController: ToastController,
    private alertController: AlertController,
    private qrHistory: QrHistoryService,
    private appMode: AppModeService,
    private firebaseData: FirebaseDataService
  ) {
    addIcons({ copyOutline, qrCodeOutline, linkOutline, openOutline, callOutline, mailOutline, logoYoutube, starOutline, star, shareOutline, downloadOutline, pencilOutline });
    // Detectar el modo oscuro actual del body
    this.isDarkMode = document.body.classList.contains('dark-mode');
  }

  async ngOnInit() {
    // Obtener los datos del QR desde el state de navegación
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      this.qrData = navigation.extras.state['qrData'] || '';
      this.qrId = navigation.extras.state['qrId'] || 0;
      const fromHistory = navigation.extras.state['fromHistory'] || false;
      const fromCreation = navigation.extras.state['fromCreation'] || false;
      this.detectContentType();
      
      // Verificar si ya es favorito y cargar nombre personalizado
      if ((fromHistory || fromCreation) && this.qrId) {
        if (this.appMode.isGuestMode()) {
          const history = await this.qrHistory.getHistory();
          const item = history.find(h => h.id === this.qrId);
          this.isFavorite = item?.isFavorite || false;
          this.customName = item?.customName || '';
        } else {
          // Firebase: obtener el item para verificar si es favorito
          const history = await this.firebaseData.getQRHistory(50);
          const item = history.find(h => h.id === this.qrId.toString());
          this.isFavorite = item?.isFavorite || false;
          this.customName = item?.customName || '';
        }
      }
      
      // Solo guardar en el historial si NO viene del historial Y NO viene de una creación (es un escaneo nuevo)
      if (!fromHistory && !fromCreation) {
        if (this.appMode.isGuestMode()) {
          await this.qrHistory.addScannedQr(this.qrData);
          // Obtener el ID del item recién agregado
          const history = await this.qrHistory.getHistory();
          const latestItem = history[0];
          this.qrId = latestItem?.id || 0;
        } else {
          await this.firebaseData.saveQRScan(this.qrData, 'scanned', 'QR_CODE');
          // Para Firebase, obtener el ID del item recién creado
          const history = await this.firebaseData.getQRHistory(1);
          if (history.length > 0) {
            this.qrId = history[0].id || '0';
          }
        }
      }
      
      // Generar el código QR
      await this.generateQRCode();
    }

    // Si no hay datos, volver atrás
    if (!this.qrData) {
      this.goBack();
    }
  }

  async generateQRCode() {
    try {
      this.qrCodeImage = await QRCode.toDataURL(this.qrData, {
        width: 250,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    } catch (error) {
      console.error('Error al generar código QR:', error);
    }
  }

  detectContentType() {
    const data = this.qrData.toLowerCase().trim();
    
    // Detectar email
    if (data.includes('@') && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data)) {
      this.contentType = 'email';
      this.isUrl = false;
      this.actionLabel = this.translation.translate('sendEmail');
      this.actionIcon = 'mail-outline';
      return;
    }
    
    // Detectar teléfono
    if (data.startsWith('tel:') || /^[+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/.test(data.replace(/\s/g, ''))) {
      this.contentType = 'phone';
      this.isUrl = false;
      this.actionLabel = this.translation.translate('callNumber');
      this.actionIcon = 'call-outline';
      return;
    }
    
    // Detectar YouTube
    if (data.includes('youtube.com') || data.includes('youtu.be')) {
      this.contentType = 'youtube';
      this.isUrl = true;
      this.actionLabel = this.translation.translate('openInYouTube');
      this.actionIcon = 'logo-youtube';
      return;
    }
    
    // Detectar URL general
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    if (urlPattern.test(data)) {
      this.contentType = 'url';
      this.isUrl = true;
      this.actionLabel = this.translation.translate('openUrl');
      this.actionIcon = 'open-outline';
      return;
    }
    
    // Es solo texto
    this.contentType = 'text';
    this.isUrl = false;
    this.actionLabel = '';
    this.actionIcon = 'open-outline';
  }

  async copyToClipboard() {
    try {
      await Clipboard.write({
        string: this.qrData
      });
      
      await this.showToast(this.translation.translate('copiedToClipboard'));
    } catch (error) {
      console.error('Error al copiar:', error);
      await this.showToast(this.translation.translate('copyError'));
    }
  }

  async showToast(message: string, color: 'success' | 'danger' = 'success') {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom',
      color: color,
      cssClass: 'custom-toast'
    });
    await toast.present();
  }

  async openContent() {
    try {
      switch (this.contentType) {
        case 'url':
        case 'youtube':
          // Abrir URL permitiendo que el sistema muestre selector de apps
          let url = this.qrData;
          if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
          }
          
          // En dispositivos móviles, usar window.open permite que Android/iOS 
          // muestre el selector de apps (YouTube, Chrome, etc.)
          if (Capacitor.getPlatform() !== 'web') {
            window.open(url, '_system');
          } else {
            // En web, abrir en nueva pestaña
            window.open(url, '_blank');
          }
          break;
          
        case 'email':
          // Abrir cliente de email
          window.location.href = `mailto:${this.qrData}`;
          await this.showToast(this.translation.translate('openingEmail'));
          break;
          
        case 'phone':
          // Abrir marcador telefónico
          const phone = this.qrData.startsWith('tel:') ? this.qrData : `tel:${this.qrData}`;
          window.location.href = phone;
          await this.showToast(this.translation.translate('openingDialer'));
          break;
          
        case 'text':
          // Solo texto, no hay acción específica
          await this.showToast(this.translation.translate('noActionAvailable'), 'danger');
          break;
      }
    } catch (error) {
      console.error('Error opening content:', error);
      await this.showToast(this.translation.translate('errorOpeningContent'), 'danger');
    }
  }

  // Mantener openUrl() para compatibilidad
  async openUrl() {
    await this.openContent();
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  async toggleFavorite() {
    if (!this.qrId) return;
    
    try {
      if (this.appMode.isGuestMode()) {
        await this.qrHistory.toggleFavorite(this.qrId as number);
        this.isFavorite = !this.isFavorite;
      } else {
        // Firebase
        await this.firebaseData.toggleFavorite(this.qrId.toString());
        this.isFavorite = !this.isFavorite;
      }
      
      const message = this.isFavorite ? 
        this.translation.translate('addedToFavorites') : 
        this.translation.translate('removedFromFavorites');
      await this.showToast(message);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      await this.showToast(this.translation.translate('errorOpeningContent'), 'danger');
    }
  }

  async shareQR() {
    try {
      // Verificar si Share está disponible
      const canShare = await Share.canShare();
      if (!canShare.value) {
        await this.showToast(this.translation.translate('shareNotSupported'), 'danger');
        return;
      }

      // Compartir el contenido del QR
      await Share.share({
        title: this.translation.translate('qrContent'),
        text: this.qrData,
        dialogTitle: this.translation.translate('share')
      });
    } catch (error) {
      console.error('Error sharing:', error);
      await this.showToast(this.translation.translate('errorSharing'), 'danger');
    }
  }

  async downloadQR() {
    try {
      if (!this.qrCodeImage) {
        await this.showToast(this.translation.translate('noQRToDownload'), 'danger');
        return;
      }

      const platform = Capacitor.getPlatform();
      const fileName = `QR_${Date.now()}.png`;
      
      // Extraer solo el base64 sin el prefijo data:image/png;base64,
      const base64Data = this.qrCodeImage.split(',')[1];

      if (platform === 'web') {
        // En web, usar el método tradicional de descarga
        const base64Response = await fetch(this.qrCodeImage);
        const blob = await base64Response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        // En Android/iOS, guardar en el directorio de documentos
        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Documents
        });

        console.log('Archivo guardado en:', savedFile.uri);
      }

      await this.showToast(this.translation.translate('qrDownloaded'));
    } catch (error) {
      console.error('Error downloading QR:', error);
      await this.showToast(this.translation.translate('errorDownloading'), 'danger');
    }
  }

  async editName() {
    if (!this.qrId) return;

    const alert = await this.alertController.create({
      header: this.translation.translate('editName'),
      inputs: [
        {
          name: 'customName',
          type: 'text',
          placeholder: this.translation.translate('enterCustomName'),
          value: this.customName
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
            const newName = data.customName?.trim() || '';
            
            try {
              if (this.appMode.isGuestMode()) {
                await this.qrHistory.updateCustomName(this.qrId as number, newName);
              } else {
                await this.firebaseData.updateCustomName(this.qrId.toString(), newName);
              }
              
              this.customName = newName;
              await this.showToast(this.translation.translate('nameSaved'));
            } catch (error) {
              console.error('Error updating custom name:', error);
              await this.showToast(this.translation.translate('errorSavingName'), 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }
}
