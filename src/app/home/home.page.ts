// Importaciones necesarias para el componente
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
// Componentes de Ionic que se usan en el template
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton, 
  IonItem, IonInput, IonTabs, IonTabBar, IonTabButton, IonLabel, IonIcon, IonButtons,
  IonList, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonBadge, IonText,
  AlertController, ToastController
} from '@ionic/angular/standalone';
// Servicios propios de la aplicacion
import { TranslationService } from '../services/translation.service';
import { AuthService } from '../services/auth.service';
import { StorageService } from '../services/storage.service';
import { QrScannerService } from '../services/qr-scanner.service';
import { QrHistoryService, QrHistoryItem } from '../services/qr-history.service';
import { Subscription } from 'rxjs';
// Iconos de ionicons que se usan en la interfaz
import { addIcons } from 'ionicons';
import { logOutOutline, arrowDownOutline, qrCodeOutline, trashOutline, timeOutline, linkOutline } from 'ionicons/icons';
// Libreria para generar codigos QR
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton, 
    IonItem, IonInput, IonTabBar, IonTabButton, IonLabel, IonIcon, IonButtons,
    IonList, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonBadge, IonText
  ],
})
export class HomePage implements OnInit, OnDestroy {
  
  // Pestaña seleccionada por defecto al abrir la app - 'read' para leer QR
  selectedTab: string = 'read';
  // Texto que el usuario ingresa para convertir a QR
  textToConvert: string = '';
  // URL de la imagen del codigo QR generado en formato base64
  qrCodeDataURL: string = '';
  // Estado del modo oscuro - false = claro, true = oscuro
  isDarkMode: boolean = false;
  // Suscripcion para escuchar cambios de idioma y actualizar la vista
  private languageSubscription?: Subscription;
  // Direccion de la animacion al cambiar de pestaña (slide-in-left o slide-in-right)
  slideDirection: string = 'slide-in-right';
  
  // Array con el historial de codigos QR del usuario actual
  qrHistory: QrHistoryItem[] = [];
  
  // Orden de las pestañas para calcular la direccion de las animaciones de slide
  private tabOrder = ['history', 'read', 'create'];

  constructor(
    private router: Router, 
    private translationService: TranslationService,
    private authService: AuthService,
    private storageService: StorageService,
    private qrScanner: QrScannerService,
    private qrHistoryService: QrHistoryService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    // Registrar iconos de ionicons que se usan en el template
    addIcons({ logOutOutline, arrowDownOutline, qrCodeOutline, trashOutline, timeOutline, linkOutline });
  }

  async ngOnInit() {
    // Suscripcion a cambios de idioma para actualizar el historial con los timestamps traducidos
    this.languageSubscription = this.translationService.currentLanguage$.subscribe(() => {
      // Trigger de deteccion de cambios en Angular
    });
    
    // Cargar el tema guardado en storage (oscuro o claro)
    await this.loadTheme();
    
    // Cargar historial de QR del usuario desde storage
    await this.loadHistory();
  }

  // Carga el tema guardado y aplica la clase dark-mode al body si corresponde
  async loadTheme() {
    try {
      const savedTheme = await this.storageService.getTheme();
      if (savedTheme === 'dark') {
        this.isDarkMode = true;
        document.body.classList.add('dark-mode');
      } else {
        this.isDarkMode = false;
        document.body.classList.remove('dark-mode');
      }
      console.log('🎨 Tema cargado:', savedTheme || 'light');
    } catch (error) {
      console.error('Error al cargar el tema:', error);
    }
  }

  // Limpia la suscripcion de idioma cuando el componente se destruye
  ngOnDestroy() {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }

  // Cambia de pestaña con animacion de slide segun la direccion
  selectTab(tab: string) {
    if (tab === this.selectedTab) return; // Evitar animaciones innecesarias si ya esta en esa pestaña
    
    const currentIndex = this.tabOrder.indexOf(this.selectedTab);
    const newIndex = this.tabOrder.indexOf(tab);
    
    // Determinar la direccion del slide segun el orden de las pestañas
    if (this.selectedTab === 'home') {
      this.slideDirection = 'slide-in-right';
    } else if (tab === 'home') {
      this.slideDirection = 'slide-out-left';
    } else if (newIndex > currentIndex) {
      this.slideDirection = 'slide-in-right'; // Avanzar hacia la derecha
    } else if (newIndex < currentIndex) {
      this.slideDirection = 'slide-in-left'; // Retroceder hacia la izquierda
    } else {
      this.slideDirection = 'slide-in-right';
    }
    
    // Timeout pequeño para aplicar la animacion antes de cambiar el contenido
    setTimeout(() => {
      this.selectedTab = tab;
    }, 10);
  }

  // Alterna entre modo claro y oscuro, guardando la preferencia en storage
  async toggleColorMode() {
    this.isDarkMode = !this.isDarkMode;
    document.body.classList.toggle('dark-mode', this.isDarkMode);
    
    // Guardar la preferencia del tema en storage para persistencia
    try {
      await this.storageService.setTheme(this.isDarkMode ? 'dark' : 'light');
      console.log('🎨 Tema guardado:', this.isDarkMode ? 'dark' : 'light');
    } catch (error) {
      console.error('Error al guardar el tema:', error);
    }
    
    console.log('🌙 Modo oscuro:', this.isDarkMode);
    console.log('📋 Body classes:', document.body.className);
  }

  // Navega a la pagina de configuracion
  navigateToSettings() {
    this.router.navigate(['/configuration']);
  }

  // Cierra sesion llamando al servicio de autenticacion
  async logout() {
    await this.authService.logout();
  }

  // Wrapper para traducir textos usando el servicio de traduccion
  translate(key: string): string {
    return this.translationService.translate(key);
  }

  // Genera un codigo QR a partir del texto ingresado y lo guarda en historial
  async generateQR() {
    console.log('generateQR called! Text:', this.textToConvert);
    if (this.textToConvert.trim()) {
      try {
        // Generar imagen del codigo QR en formato base64 con dimensiones de 300x300
        this.qrCodeDataURL = await QRCode.toDataURL(this.textToConvert, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        
        // Guardar en historial como QR creado por el usuario
        await this.qrHistoryService.addCreatedQr(this.textToConvert);
        await this.loadHistory();
        
        // Mostrar mensaje de exito con toast
        const toast = await this.toastController.create({
          message: this.translate('qrCreatedSuccess'),
          duration: 2000,
          position: 'bottom',
          color: 'success'
        });
        await toast.present();
      } catch (error) {
        console.error('Error generating QR code:', error);
        const alert = await this.alertController.create({
          header: this.translate('error'),
          message: this.translate('qrGenerationError'),
          buttons: ['OK']
        });
        await alert.present();
      }
    }
  }

  // Inicia el escaner de codigos QR usando la camara del dispositivo
  async scanQR() {
    console.log('🎯 scanQR iniciado');
    
    // Alert de prueba para verificar que el boton funciona correctamente
    const testAlert = await this.alertController.create({
      header: 'Test',
      message: 'El botón funciona! Ahora intentando escanear...',
      buttons: ['OK']
    });
    await testAlert.present();
    await testAlert.onDidDismiss();
    
    try {
      console.log('📸 Llamando a startScan...');
      const qrData = await this.qrScanner.startScan();
      console.log('📊 Datos escaneados:', qrData);
      
      if (qrData) {
        // Navegar a la pagina de resultado con los datos del QR escaneado
        this.router.navigate(['/qr-result'], {
          state: { qrData: qrData }
        });
      } else {
        console.log('⚠️ No se obtuvo ningún dato del QR');
        await this.showToast('No se detectó ningún código QR');
      }
    } catch (error) {
      console.error('❌ Error en scanQR:', error);
      await this.showToast('Error: ' + (error as Error).message);
    }
  }

  // Carga el historial de codigos QR del usuario actual desde el servicio
  async loadHistory() {
    this.qrHistory = await this.qrHistoryService.getHistory();
  }

  // Recarga el historial cada vez que la pagina va a entrar en vista
  async ionViewWillEnter() {
    await this.loadHistory();
  }

  // Retorna la etiqueta traducida segun el tipo de QR (escaneado o creado)
  getTypeLabel(type: 'scanned' | 'created'): string {
    return type === 'scanned' ? 
      this.translate('qrScanned') : 
      this.translate('qrCreated');
  }

  // Formatea el timestamp del historial a un formato legible
  formatTimestamp(timestamp: string): string {
    return this.qrHistoryService.formatTimestamp(timestamp);
  }

  // Elimina un elemento del historial previa confirmacion del usuario
  async deleteHistoryItem(id: number) {
    const alert = await this.alertController.create({
      header: this.translate('confirmDelete'),
      message: this.translate('confirmDeleteMessage'),
      buttons: [
        {
          text: this.translate('cancel'),
          role: 'cancel'
        },
        {
          text: this.translate('delete'),
          role: 'destructive',
          handler: async () => {
            await this.qrHistoryService.deleteItem(id);
            await this.loadHistory();
          }
        }
      ]
    });
    
    await alert.present();
  }

  // Limpia todo el historial de codigos QR previa confirmacion del usuario
  async clearHistory() {
    const alert = await this.alertController.create({
      header: this.translate('clearHistory'),
      message: this.translate('clearHistoryMessage'),
      buttons: [
        {
          text: this.translate('cancel'),
          role: 'cancel'
        },
        {
          text: this.translate('clear'),
          role: 'destructive',
          handler: async () => {
            await this.qrHistoryService.clearHistory();
            await this.loadHistory();
          }
        }
      ]
    });
    
    await alert.present();
  }

  // Navega a la vista de resultado mostrando un elemento del historial
  viewHistoryItem(item: QrHistoryItem) {
    this.router.navigate(['/qr-result'], {
      state: { 
        qrData: item.content,
        fromHistory: true // Bandera para evitar duplicados en historial
      }
    });
  }

  // Limpia el codigo QR generado y el campo de texto
  clearQR() {
    this.qrCodeDataURL = '';
    this.textToConvert = '';
  }

  // Funcion de prueba para verificar eventos de click en el contenedor
  testClick() {
    console.log('Container clicked!');
  }

  // Funcion de prueba para verificar el evento focus del input
  onInputFocus() {
    console.log('Input focused!');
  }

  // Muestra un toast con mensaje de error en la parte inferior de la pantalla
  async showToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom',
      color: 'danger'
    });
    await toast.present();
  }
}
