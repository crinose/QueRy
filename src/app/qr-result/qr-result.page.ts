import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon, IonText, IonBackButton, IonButtons, ToastController } from '@ionic/angular/standalone';
import { TranslationService } from '../services/translation.service';
import { QrHistoryService } from '../services/qr-history.service';
import { Clipboard } from '@capacitor/clipboard';
import { addIcons } from 'ionicons';
import { copyOutline, qrCodeOutline, linkOutline } from 'ionicons/icons';
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
  isDarkMode: boolean = false;

  constructor(
    private router: Router,
    public translation: TranslationService,
    private toastController: ToastController,
    private qrHistory: QrHistoryService
  ) {
    addIcons({ copyOutline, qrCodeOutline, linkOutline });
    // Detectar el modo oscuro actual del body
    this.isDarkMode = document.body.classList.contains('dark-mode');
  }

  async ngOnInit() {
    // Obtener los datos del QR desde el state de navegación
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      this.qrData = navigation.extras.state['qrData'] || '';
      const fromHistory = navigation.extras.state['fromHistory'] || false;
      this.checkIfUrl();
      
      // Solo guardar en el historial si NO viene del historial (es un escaneo nuevo)
      if (!fromHistory) {
        await this.qrHistory.addScannedQr(this.qrData);
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
        width: 300,
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

  checkIfUrl() {
    // Verificar si es una URL válida
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    this.isUrl = urlPattern.test(this.qrData);
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

  async showToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom',
      color: 'success',
      cssClass: 'custom-toast'
    });
    await toast.present();
  }

  openUrl() {
    if (this.isUrl) {
      // Asegurar que tenga protocolo
      let url = this.qrData;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      window.open(url, '_blank');
    }
  }

  goBack() {
    this.router.navigate(['/home']);
  }
}
