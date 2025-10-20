import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonButton, IonIcon } from '@ionic/angular/standalone';
import { TranslationService } from '../services/translation.service';
import { addIcons } from 'ionicons';
import { homeOutline } from 'ionicons/icons';

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.page.html',
  styleUrls: ['./not-found.page.scss'],
  standalone: true,
  imports: [IonContent, IonButton, IonIcon, CommonModule]
})
export class NotFoundPage {
  constructor(
    private router: Router,
    public translation: TranslationService
  ) {
    addIcons({ homeOutline });
  }

  goHome() {
    this.router.navigate(['/home']);
  }
}
