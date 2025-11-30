// Importaciones necesarias para el componente
import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
// Componentes de Ionic que se usan en el template
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton, 
  IonItem, IonInput, IonTabs, IonTabBar, IonTabButton, IonLabel, IonIcon, IonButtons,
  IonList, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonBadge, IonText,
  IonFab, IonFabButton,
  AlertController, ToastController, GestureController, ActionSheetController
} from '@ionic/angular/standalone';
// Servicios propios de la aplicacion
import { TranslationService } from '../services/translation.service';
import { AuthService } from '../services/auth.service';
import { StorageService } from '../services/storage.service';
import { QrScannerService } from '../services/qr-scanner.service';
import { QrHistoryService, QrHistoryItem } from '../services/qr-history.service';
import { AppModeService } from '../services/app-mode.service';
import { FirebaseAuthService } from '../services/firebase-auth.service';
import { FirebaseDataService } from '../services/firebase-data.service';
import { Subscription } from 'rxjs';
import { Keyboard } from '@capacitor/keyboard';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
// Iconos de ionicons que se usan en la interfaz
import { addIcons } from 'ionicons';
import { logOutOutline, arrowDownOutline, qrCodeOutline, trashOutline, timeOutline, linkOutline, starOutline, star, imageOutline, imagesOutline, heartOutline, logoGoogle, cardOutline, shareSocialOutline, close } from 'ionicons/icons';
// Libreria para generar codigos QR
import * as QRCode from 'qrcode';
// Libreria para leer codigos QR de imagenes
import jsQR from 'jsqr';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton, 
    IonItem, IonInput, IonTabBar, IonTabButton, IonLabel, IonIcon, IonButtons,
    IonList, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonBadge, IonText,
    IonFab, IonFabButton
  ],
})
export class HomePage implements OnInit, OnDestroy, AfterViewInit {
  
  @ViewChild(IonContent, { read: ElementRef }) content!: ElementRef;
  
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
  // Suscripción para escuchar cambios de autenticación
  private authSubscription?: Subscription;
  // Direccion de la animacion al cambiar de pestaña (slide-in-left o slide-in-right)
  slideDirection: string = 'slide-in-right';
  
  // Array con el historial de codigos QR del usuario actual
  qrHistory: QrHistoryItem[] = [];
  
  // Bandera para mostrar solo favoritos
  showingFavorites: boolean = false;
  
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
    private toastController: ToastController,
    private appMode: AppModeService,
    private firebaseAuth: FirebaseAuthService,
    private firebaseData: FirebaseDataService,
    private gestureCtrl: GestureController,
    private actionSheetCtrl: ActionSheetController
  ) {
    // Registrar iconos de ionicons que se usan en el template
    addIcons({ logOutOutline, arrowDownOutline, qrCodeOutline, trashOutline, timeOutline, linkOutline, starOutline, star, imagesOutline, heartOutline, logoGoogle, cardOutline, shareSocialOutline, close });
  }

  async ngOnInit() {
    // Suscripcion a cambios de idioma para actualizar el historial con los timestamps traducidos
    this.languageSubscription = this.translationService.currentLanguage$.subscribe(() => {
      // Trigger de deteccion de cambios en Angular
    });
    
    // NO escuchar cambios de Firebase Auth aquí - interferir con auto-login
    // El guard ya maneja la validación de sesión
    
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
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  // Configura los gestures de swipe después de que la vista se inicialice
  ngAfterViewInit() {
    this.setupSwipeGesture();
  }

  // Configura el gesto de swipe para navegar entre tabs
  private setupSwipeGesture() {
    if (!this.content || !this.content.nativeElement) {
      console.log('⚠️ Content element not ready yet');
      setTimeout(() => this.setupSwipeGesture(), 100);
      return;
    }
    
    const contentElement = this.content.nativeElement.querySelector('ion-content') || this.content.nativeElement;
    
    const gesture = this.gestureCtrl.create({
      el: contentElement,
      threshold: 10,
      gestureName: 'swipe-tabs',
      direction: 'x',
      passive: false,
      onStart: () => {
        console.log('👆 Swipe started');
      },
      onMove: (detail) => {
        // Durante el movimiento del gesto
      },
      onEnd: (detail) => {
        console.log('👆 Swipe ended, deltaX:', detail.deltaX, 'velocityX:', detail.velocityX);
        const deltaX = detail.deltaX;
        const velocity = detail.velocityX;
        
        // Detectar swipe hacia la izquierda (ir a la siguiente tab)
        if (deltaX < -30 || velocity < -0.2) {
          console.log('⬅️ Swipe left detected');
          this.swipeToNextTab();
        }
        // Detectar swipe hacia la derecha (ir a la tab anterior)
        else if (deltaX > 30 || velocity > 0.2) {
          console.log('➡️ Swipe right detected');
          this.swipeToPreviousTab();
        }
      }
    });
    
    gesture.enable();
    console.log('✅ Gesture enabled on:', contentElement);
  }

  // Navega a la siguiente tab con swipe
  private swipeToNextTab() {
    const currentIndex = this.tabOrder.indexOf(this.selectedTab);
    const nextIndex = (currentIndex + 1) % this.tabOrder.length;
    this.selectTab(this.tabOrder[nextIndex]);
  }

  // Navega a la tab anterior con swipe
  private swipeToPreviousTab() {
    const currentIndex = this.tabOrder.indexOf(this.selectedTab);
    const previousIndex = currentIndex === 0 ? this.tabOrder.length - 1 : currentIndex - 1;
    this.selectTab(this.tabOrder[previousIndex]);
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
    if (this.appMode.isAuthenticatedMode()) {
      // BORRAR SESIÓN
      await this.storageService.setConfigValue('session_active', 'false');
      await this.storageService.setConfigValue('firebase_uid', '');
      await this.storageService.setConfigValue('user_email', '');
      // Cerrar sesion de Firebase
      await this.firebaseAuth.logout();
      // Limpiar el modo
      await this.appMode.clearMode();
    }
    // Volver a login independientemente del modo
    this.router.navigate(['/login']);
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
        
        let qrId: number | string = 0;
        
        // Guardar en historial segun el modo (guest = SQLite, authenticated = Firebase)
        if (this.appMode.isGuestMode()) {
          await this.qrHistoryService.addCreatedQr(this.textToConvert);
          // Obtener el ID del QR recién creado
          const history = await this.qrHistoryService.getHistory();
          const latestItem = history[0];
          qrId = latestItem?.id || 0;
        } else {
          await this.firebaseData.saveQRScan(this.textToConvert, 'created', 'QR_CODE');
          // Para Firebase, obtener el ID del item recién creado
          const history = await this.firebaseData.getQRHistory(1);
          if (history.length > 0) {
            qrId = history[0].id || '0';
          }
        }
        
        // Ocultar el teclado antes de navegar
        await Keyboard.hide();
        
        // Navegar a la página de resultado con el QR creado
        this.router.navigate(['/qr-result'], {
          state: { 
            qrData: this.textToConvert,
            qrId: qrId,
            fromCreation: true // Indica que ya fue guardado, no volver a guardar
          }
        });
        
        // Limpiar el campo de texto
        this.textToConvert = '';
        this.qrCodeDataURL = '';
        
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

  // Escanea un codigo QR desde una imagen de la galeria
  async scanFromImage() {
    console.log('🖼️ scanFromImage iniciado');
    
    try {
      // Solicitar permiso y abrir galeria
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos // Solo galeria, no camara
      });

      if (!image.dataUrl) {
        await this.showToast(this.translate('errorReadingImage'));
        return;
      }

      // Crear una imagen HTML para procesarla
      const img = new Image();
      img.src = image.dataUrl;

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
      });

      // Crear canvas para extraer los datos de la imagen
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        await this.showToast(this.translate('errorReadingImage'));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      context.drawImage(img, 0, 0);

      // Obtener los datos de pixeles de la imagen
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

      // Usar jsQR para decodificar el QR
      const qrCode = jsQR(imageData.data, imageData.width, imageData.height);

      if (qrCode && qrCode.data) {
        console.log('✅ QR encontrado en imagen:', qrCode.data);
        
        // Navegar a la pagina de resultado con los datos del QR
        this.router.navigate(['/qr-result'], {
          state: { qrData: qrCode.data }
        });
      } else {
        console.log('⚠️ No se encontró QR en la imagen');
        await this.showToast(this.translate('noQRFound'));
      }
    } catch (error) {
      console.error('❌ Error en scanFromImage:', error);
      await this.showToast(this.translate('errorReadingImage'));
    }
  }

  // Carga el historial de codigos QR del usuario actual desde el servicio
  async loadHistory() {
    this.showingFavorites = false;
    if (this.appMode.isGuestMode()) {
      // Modo invitado: usar SQLite local
      this.qrHistory = await this.qrHistoryService.getHistory();
    } else {
      // Modo autenticado: usar Firebase
      try {
        const firebaseHistory = await this.firebaseData.getQRHistory(50);
        // Convertir formato de Firebase a formato de QrHistoryItem
        this.qrHistory = firebaseHistory.map(item => {
          // Detectar si es una URL
          const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
          const isUrl = urlPattern.test(item.content);
          
          return {
            id: item.id!, // Mantener el ID original de Firebase como string
            firebaseId: item.id!, // Guardar también el ID de Firebase
            content: item.content,
            customName: item.customName, // Incluir nombre personalizado
            type: item.type as 'scanned' | 'created',
            timestamp: new Date(item.timestamp).toISOString(),
            isUrl: isUrl,
            isFavorite: item.isFavorite
          };
        });
      } catch (error) {
        console.error('Error loading Firebase history:', error);
        this.qrHistory = [];
      }
    }
  }

  // Carga solo los favoritos
  async loadFavorites() {
    this.showingFavorites = true;
    if (this.appMode.isGuestMode()) {
      this.qrHistory = await this.qrHistoryService.getFavorites();
    } else {
      // Firebase: obtener favoritos
      try {
        const firebaseFavorites = await this.firebaseData.getFavorites();
        this.qrHistory = firebaseFavorites.map(item => {
          const urlPattern = /^(https?:\/\/)?([\ da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
          const isUrl = urlPattern.test(item.content);
          
          return {
            id: item.id!, // Mantener el ID original de Firebase como string
            firebaseId: item.id!, // Guardar también el ID de Firebase
            content: item.content,
            customName: item.customName, // Incluir nombre personalizado
            type: item.type as 'scanned' | 'created',
            timestamp: new Date(item.timestamp).toISOString(),
            isUrl: isUrl,
            isFavorite: item.isFavorite
          };
        });
      } catch (error) {
        console.error('Error loading Firebase favorites:', error);
        this.qrHistory = [];
      }
    }
  }

  // Alterna entre historial completo y favoritos
  async toggleFavoritesView() {
    if (this.showingFavorites) {
      await this.loadHistory();
    } else {
      await this.loadFavorites();
    }
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
  async deleteHistoryItem(id: number | string) {
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
            if (this.appMode.isGuestMode()) {
              await this.qrHistoryService.deleteItem(id as number);
            } else {
              // En Firebase, id es string
              await this.firebaseData.deleteQRScan(id.toString());
            }
            // Recargar vista actual
            if (this.showingFavorites) {
              await this.loadFavorites();
            } else {
              await this.loadHistory();
            }
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
            if (this.appMode.isGuestMode()) {
              await this.qrHistoryService.clearHistory();
            } else {
              await this.firebaseData.clearQRHistory();
            }
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
        qrId: item.id,
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

  // Abre el menú de opciones de soporte
  async openSupportMenu(event: Event) {
    // Mostrar mensaje previo antes del menú
    const alert = await this.alertController.create({
      header: this.translate('supportHeader'),
      message: this.translate('supportIntroMessage'),
      backdropDismiss: true,
      buttons: [
        {
          text: 'OK',
          role: 'cancel'
        }
      ]
    });
    
    await alert.present();
    
    // Abrir el menú cuando se cierre el alert (sin importar cómo se cierre)
    await alert.onDidDismiss();
    setTimeout(async () => {
      await this.showDonationMenu();
    }, 100);
  }

  // Muestra el menú de donaciones
  async showDonationMenu() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: this.translate('supportUs'),
      subHeader: this.translate('supportMessage'),
      buttons: [
        {
          text: this.translate('donate1'),
          icon: 'logo-google',
          handler: () => {
            this.processDonation(1);
          }
        },
        {
          text: this.translate('donate3'),
          icon: 'logo-google',
          handler: () => {
            this.processDonation(3);
          }
        },
        {
          text: this.translate('donate5'),
          icon: 'logo-google',
          handler: () => {
            this.processDonation(5);
          }
        },
        {
          text: this.translate('donate10'),
          icon: 'logo-google',
          handler: () => {
            this.processDonation(10);
          }
        },
        {
          text: this.translate('subscribeMonthly'),
          icon: 'card-outline',
          handler: () => {
            this.processSubscription();
          }
        },
        {
          text: this.translate('shareApp'),
          icon: 'share-social-outline',
          handler: () => {
            this.shareApp();
          }
        },
        {
          text: this.translate('cancel'),
          icon: 'close',
          role: 'cancel'
        }
      ]
    });

    await actionSheet.present();
  }

  // Procesa donación con Google Pay
  async processDonation(amount: number) {
    // TODO: Implementar integración con Google Pay API
    // Por ahora mostrar mensaje informativo
    const alert = await this.alertController.create({
      header: this.translate('googlePayDonation'),
      message: `${this.translate('donationAmount')}: $${amount} USD<br><br>${this.translate('googlePayComingSoon')}`,
      buttons: [
        {
          text: this.translate('close'),
          role: 'cancel'
        }
      ]
    });
    
    await alert.present();
  }

  // Procesa suscripción mensual
  async processSubscription() {
    // TODO: Implementar integración con Google Pay suscripciones
    const alert = await this.alertController.create({
      header: this.translate('monthlySubscription'),
      message: `${this.translate('subscriptionAmount')}: $3 USD/mes<br><br>${this.translate('googlePayComingSoon')}`,
      buttons: [
        {
          text: this.translate('close'),
          role: 'cancel'
        }
      ]
    });
    
    await alert.present();
  }

  // Comparte la aplicación
  async shareApp() {
    const shareData = {
      title: 'QueRy - QR Scanner',
      text: this.translate('shareAppText'),
      url: 'https://github.com/tuusuario/query' // Reemplazar con tu URL
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        await this.showSuccessToast(this.translate('thankYou'));
      } else {
        // Fallback: copiar al portapapeles
        await this.copyToClipboard(shareData.url);
      }
    } catch (error) {
      console.error('Error al compartir:', error);
    }
  }

  // Muestra toast de éxito
  async showSuccessToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom',
      color: 'success'
    });
    await toast.present();
  }

  // Copia texto al portapapeles
  async copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      await this.showSuccessToast(this.translate('copiedToClipboard'));
    } catch (error) {
      console.error('Error al copiar al portapapeles:', error);
      await this.showToast(this.translate('errorCopying'));
    }
  }
}
