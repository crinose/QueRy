import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { StorageService } from './services/storage.service';
import { AppModeService } from './services/app-mode.service';
import { FirebaseAuthService } from './services/firebase-auth.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor(
    private storage: StorageService,
    private appMode: AppModeService,
    private firebaseAuth: FirebaseAuthService,
    private router: Router
  ) {
    console.log('PIXELPUDU: AppComponent constructor ejecutado');
    console.log('🚀 AppComponent constructor ejecutado');
    this.initializeApp();
  }

  async initializeApp() {
    console.log('PIXELPUDU: initializeApp llamado');
    console.log('🚀 AppComponent inicializado');
    // La navegación inicial ahora la maneja initGuard
  }
}

