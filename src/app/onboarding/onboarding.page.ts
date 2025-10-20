import { Component, ViewChild, CUSTOM_ELEMENTS_SCHEMA, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonButton, IonIcon, IonFab, IonFabButton } from '@ionic/angular/standalone';
import { StorageService } from '../services/storage.service';
import { TranslationService } from '../services/translation.service';
import { addIcons } from 'ionicons';
import { qrCodeOutline, scanOutline, timeOutline, languageOutline } from 'ionicons/icons';

@Component({
  selector: 'app-onboarding',
  templateUrl: './onboarding.page.html',
  styleUrls: ['./onboarding.page.scss'],
  standalone: true,
  imports: [IonContent, IonButton, IonIcon, IonFab, IonFabButton, CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class OnboardingPage implements AfterViewInit {
  @ViewChild('swiper') swiperRef: any;
  currentSlide: number = 0;

  slides = [
    {
      title: 'onboarding1Title',
      description: 'onboarding1Desc',
      icon: 'qr-code-outline',
      color: '#3880ff'
    },
    {
      title: 'onboarding2Title',
      description: 'onboarding2Desc',
      icon: 'qr-code-outline',
      color: '#10dc60'
    },
    {
      title: 'onboarding3Title',
      description: 'onboarding3Desc',
      icon: 'scan-outline',
      color: '#ffce00'
    }
  ];

  constructor(
    private storage: StorageService,
    private router: Router,
    public translation: TranslationService
  ) {
    addIcons({ qrCodeOutline, scanOutline, timeOutline, languageOutline });
  }

  ngAfterViewInit() {
    // Inicializar el slide actual después de que la vista se cargue
    setTimeout(() => {
      this.updateCurrentSlide();
      
      // Agregar listener al swiper para detectar cambios
      if (this.swiperRef && this.swiperRef.nativeElement) {
        const swiper = this.swiperRef.nativeElement.swiper;
        if (swiper) {
          swiper.on('slideChange', () => {
            this.currentSlide = swiper.activeIndex || 0;
            console.log('🔹 Slide cambió a:', this.currentSlide);
          });
        }
      }
    }, 100);
  }

  updateCurrentSlide() {
    if (this.swiperRef && this.swiperRef.nativeElement) {
      const swiper = this.swiperRef.nativeElement.swiper;
      if (swiper) {
        const activeIndex = swiper.activeIndex || swiper.realIndex || 0;
        this.currentSlide = activeIndex;
        console.log('🔹 Slide actual inicializado:', this.currentSlide);
      }
    }
  }

  onSlideChange() {
    console.log('🔹 onSlideChange triggered');
    if (this.swiperRef && this.swiperRef.nativeElement) {
      const swiper = this.swiperRef.nativeElement.swiper;
      if (swiper) {
        // En escritorio activeIndex es un número, no una promesa
        const activeIndex = swiper.activeIndex;
        if (typeof activeIndex === 'number') {
          this.currentSlide = activeIndex;
          console.log('🔹 Slide actual (number):', this.currentSlide);
        } else if (activeIndex && typeof activeIndex.then === 'function') {
          // En móvil puede ser una promesa
          activeIndex.then((index: number) => {
            this.currentSlide = index;
            console.log('🔹 Slide actual (promise):', this.currentSlide);
          });
        }
      }
    }
  }

  next() {
    console.log('🔹 Next button clicked');
    if (this.swiperRef && this.swiperRef.nativeElement) {
      const swiper = this.swiperRef.nativeElement.swiper;
      const currentIndex = swiper.activeIndex || swiper.realIndex || 0;
      console.log('🔹 Current index antes de next:', currentIndex);
      console.log('🔹 Total slides:', this.slides.length);
      
      // Si estamos en el último slide (índice 2 de 3 slides), terminar
      if (currentIndex >= this.slides.length - 1) {
        console.log('🔹 Último slide detectado, llamando finish()');
        this.finish();
      } else {
        // Si no, avanzar al siguiente slide
        console.log('🔹 Avanzando al siguiente slide');
        swiper.slideNext();
        // Actualizar currentSlide manualmente
        setTimeout(() => {
          this.currentSlide = swiper.activeIndex || swiper.realIndex || 0;
          console.log('🔹 Nuevo currentSlide:', this.currentSlide);
        }, 300);
      }
    }
  }

  skip() {
    console.log('🔹 Skip button clicked - going to finish');
    this.finish();
  }

  async finish() {
    console.log('🔹 Finish called - marking onboarding first');
    
    try {
      // PRIMERO marcar el onboarding como completado
      await this.storage.setOnboardingComplete();
      console.log('✅ Onboarding marcado, ahora navegando...');
      
      // LUEGO navegar
      await this.router.navigate(['/login']);
    } catch (error: any) {
      console.error('❌ Error en finish:', error);
      // Navegar de todos modos
      await this.router.navigate(['/login']);
    }
  }

  isLastSlide(): boolean {
    // Usar currentSlide directamente
    const isLast = this.currentSlide >= this.slides.length - 1;
    console.log('🔹 isLastSlide - currentSlide:', this.currentSlide, 'isLast:', isLast);
    return isLast;
  }

  toggleLanguage() {
    const currentLang = this.translation.getCurrentLanguage();
    const newLang = currentLang === 'en' ? 'es' : 'en';
    this.translation.setLanguage(newLang);
    console.log('🌐 Idioma cambiado a:', newLang);
  }
}
