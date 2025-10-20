import { Injectable } from '@angular/core';
import { BarcodeScanner, BarcodeFormat } from '@capacitor-mlkit/barcode-scanning';
import { AlertController } from '@ionic/angular/standalone';

@Injectable({
  providedIn: 'root'
})
export class QrScannerService {

  constructor(private alertController: AlertController) { }

  async checkPermission(): Promise<boolean> {
    try {
      console.log('🔐 Verificando estado actual de permisos...');
      const { camera } = await BarcodeScanner.checkPermissions();
      console.log('📋 Estado de permiso de cámara:', camera);
      
      if (camera === 'granted' || camera === 'limited') {
        console.log('✅ Permisos ya otorgados');
        return true;
      }
      
      if (camera === 'denied') {
        console.log('❌ Permisos denegados permanentemente');
        // El usuario negó el permiso permanentemente
        await this.showPermissionAlert();
        return false;
      }
      
      console.log('🙏 Solicitando permisos de cámara...');
      // Solicitar permisos
      const { camera: newStatus } = await BarcodeScanner.requestPermissions();
      console.log('📋 Nuevo estado de permiso:', newStatus);
      return newStatus === 'granted' || newStatus === 'limited';
    } catch (error) {
      console.error('❌ Error al verificar permisos:', error);
      return false;
    }
  }

  async startScan(): Promise<string | null> {
    try {
      console.log('🔍 Iniciando verificación de permisos...');
      // Verificar permisos primero
      const hasPermission = await this.checkPermission();
      console.log('✅ Permisos:', hasPermission);
      
      if (!hasPermission) {
        console.log('❌ Sin permisos de cámara');
        return null;
      }

      console.log('🔍 Verificando si el escáner está soportado...');
      // Verificar si el escáner está disponible
      const { supported } = await BarcodeScanner.isSupported();
      console.log('✅ Escáner soportado:', supported);
      
      if (!supported) {
        console.log('❌ Escáner no soportado');
        await this.showNotSupportedAlert();
        return null;
      }

      console.log('🎨 Ocultando el fondo de la app...');
      // Ocultar el fondo de la app
      document.querySelector('body')?.classList.add('barcode-scanner-active');

      console.log('📸 Iniciando escaneo de QR...');
      // Iniciar el escaneo
      const { barcodes } = await BarcodeScanner.scan({
        formats: [BarcodeFormat.QrCode]
      });

      console.log('📊 Códigos encontrados:', barcodes?.length || 0);

      // Restaurar el fondo
      await this.stopScan();

      if (barcodes && barcodes.length > 0) {
        console.log('✅ Código QR encontrado:', barcodes[0].rawValue);
        return barcodes[0].rawValue || null;
      }

      console.log('⚠️ No se encontraron códigos QR');
      return null;
    } catch (error) {
      console.error('❌ Error al escanear:', error);
      const errorMessage = (error as Error).message || 'Error desconocido';
      console.error('💥 Detalle del error:', errorMessage);
      await this.stopScan();
      throw error; // Propagar el error para que se vea en el home
    }
  }

  async stopScan(): Promise<void> {
    try {
      // Restaurar el fondo de la app
      document.querySelector('body')?.classList.remove('barcode-scanner-active');
    } catch (error) {
      console.error('Error al detener el escáner:', error);
    }
  }

  private async showPermissionAlert() {
    const alert = await this.alertController.create({
      header: 'Permiso Requerido',
      message: 'Se necesita acceso a la cámara para escanear códigos QR. Por favor, habilita el permiso en la configuración de tu dispositivo.',
      buttons: ['OK']
    });
    await alert.present();
  }

  private async showNotSupportedAlert() {
    const alert = await this.alertController.create({
      header: 'No Disponible',
      message: 'El escáner de códigos QR no está disponible en este dispositivo.',
      buttons: ['OK']
    });
    await alert.present();
  }
}
