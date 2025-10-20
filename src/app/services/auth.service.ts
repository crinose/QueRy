import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { StorageService } from './storage.service';
import { User } from './storage.service';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();
  
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$: Observable<boolean> = this.isAuthenticatedSubject.asObservable();

  constructor(
    private storage: StorageService,
    private router: Router
  ) {
    this.loadCurrentUser();
  }

  private async loadCurrentUser(): Promise<void> {
    try {
      const user = await this.storage.getCurrentUser();
      this.currentUserSubject.next(user);
      this.isAuthenticatedSubject.next(user !== null);
    } catch (error) {
      console.error('Error cargando usuario actual:', error);
    }
  }

  async login(username: string, password: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = await this.storage.login(username, password);
      this.currentUserSubject.next(user);
      this.isAuthenticatedSubject.next(true);
      
      return { success: true, message: 'Login exitoso' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Error al iniciar sesión' };
    }
  }

  async register(username: string, password: string, email: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = await this.storage.createUser({ username, password, email });
      await this.storage.setCurrentUser(user.id!);
      this.currentUserSubject.next(user);
      this.isAuthenticatedSubject.next(true);
      
      return { success: true, message: 'Registro exitoso' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Error al registrar usuario' };
    }
  }

  async logout(): Promise<void> {
    await this.storage.logout();
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    await this.router.navigate(['/login']);
  }

  async isAuthenticated(): Promise<boolean> {
    return await this.storage.isUserLoggedIn();
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }
}
