import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonTextarea, IonButtons, IonBackButton } from '@ionic/angular/standalone';
import { StorageService } from '../services/storage.service';

@Component({
  selector: 'app-debug',
  templateUrl: './debug.page.html',
  standalone: true,
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonTextarea, IonButtons, IonBackButton]
})
export class DebugPage implements OnInit {
  debugInfo = '';

  constructor(private storage: StorageService) {}

  async ngOnInit() {
    await this.loadDebugInfo();
  }

  async loadDebugInfo() {
    const uid = await this.storage.getConfigValue('firebase_uid');
    const email = await this.storage.getConfigValue('user_email');
    const sessionActive = await this.storage.getConfigValue('session_active');
    const savedEmail = await this.storage.getConfigValue('saved_email');
    const savedPassword = await this.storage.getConfigValue('saved_password');

    this.debugInfo = `
=== DEBUG INFO ===

UID: ${uid || 'NO HAY'}
Email: ${email || 'NO HAY'}
Session Active: ${sessionActive || 'NO HAY'}
Saved Email: ${savedEmail || 'NO HAY'}
Saved Password: ${savedPassword ? '***' + savedPassword.slice(-3) : 'NO HAY'}

Timestamp: ${new Date().toLocaleString()}
    `;
  }

  async clearAll() {
    await this.storage.setConfigValue('firebase_uid', '');
    await this.storage.setConfigValue('user_email', '');
    await this.storage.setConfigValue('session_active', 'false');
    await this.storage.setConfigValue('saved_email', '');
    await this.storage.setConfigValue('saved_password', '');
    await this.loadDebugInfo();
    alert('Datos borrados');
  }
}
