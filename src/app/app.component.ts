import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { StorageService } from './services/storage.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor(private storage: StorageService) {
    console.log('🚀 AppComponent constructor ejecutado');
    this.initializeApp();
  }

  async initializeApp() {
    console.log('🚀 initializeApp() llamado');
    try {
      await this.storage.initializeDatabase();
      console.log('✅ App inicializada correctamente');
    } catch (error) {
      console.error('❌ Error inicializando app:', error);
    }
  }
}
