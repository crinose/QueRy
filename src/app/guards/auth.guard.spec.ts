import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(() => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['isAuthenticated']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    });
  });

  
  it('should allow access when user is authenticated', async () => {
    mockAuthService.isAuthenticated.and.returnValue(Promise.resolve(true));

    const result = await TestBed.runInInjectionContext(() => authGuard());

    expect(result).toBe(true);
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });


  it('should deny access and redirect to login when user is not authenticated', async () => {
    mockAuthService.isAuthenticated.and.returnValue(Promise.resolve(false));

    const result = await TestBed.runInInjectionContext(() => authGuard());

    expect(result).toBe(false);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should call authService.isAuthenticated()', async () => {
    mockAuthService.isAuthenticated.and.returnValue(Promise.resolve(true));

    await TestBed.runInInjectionContext(() => authGuard());

    expect(mockAuthService.isAuthenticated).toHaveBeenCalled();
  });
});
