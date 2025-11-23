import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { StorageService } from './storage.service';
import { User } from './storage.service';

describe('AuthService', () => {
  let service: AuthService;
  let mockStorageService: jasmine.SpyObj<StorageService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(() => {
    mockStorageService = jasmine.createSpyObj('StorageService', [
      'getCurrentUser',
      'login',
      'createUser',
      'setCurrentUser',
      'logout',
      'isUserLoggedIn'
    ]);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    // Mock getCurrentUser para constructor
    mockStorageService.getCurrentUser.and.returnValue(Promise.resolve(null));

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: StorageService, useValue: mockStorageService },
        { provide: Router, useValue: mockRouter }
      ]
    });

    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ==================== LOGIN ====================

  describe('login', () => {
    
    it('should login successfully with valid credentials', async () => {
      const mockUser: User = {
        id: 1,
        username: 'testuser',
        password: 'password123',
        email: 'test@example.com',
        created_at: '2025-01-01'
      };

      mockStorageService.login.and.returnValue(Promise.resolve(mockUser));

      const result = await service.login('testuser', 'password123');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Login exitoso');
      expect(mockStorageService.login).toHaveBeenCalledWith('testuser', 'password123');
    });

    it('should return error message when login fails', async () => {
      mockStorageService.login.and.returnValue(
        Promise.reject(new Error('Usuario no encontrado'))
      );

      const result = await service.login('wronguser', 'wrongpass');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Usuario no encontrado');
    });

    it('should update currentUser observable on successful login', async () => {
      const mockUser: User = {
        id: 1,
        username: 'testuser',
        password: 'password123',
        email: 'test@example.com',
        created_at: '2025-01-01'
      };

      mockStorageService.login.and.returnValue(Promise.resolve(mockUser));

      await service.login('testuser', 'password123');

      expect(service.getCurrentUser()).toEqual(mockUser);
    });

    it('should set isAuthenticated to true on successful login', (done) => {
      const mockUser: User = {
        id: 1,
        username: 'testuser',
        password: 'password123',
        email: 'test@example.com',
        created_at: '2025-01-01'
      };

      mockStorageService.login.and.returnValue(Promise.resolve(mockUser));

      service.isAuthenticated$.subscribe(isAuth => {
        if (isAuth) {
          expect(isAuth).toBe(true);
          done();
        }
      });

      service.login('testuser', 'password123');
    });
  });

  // ==================== REGISTER ====================

  describe('register', () => {
    
    it('should register user successfully', async () => {
      const mockUser: User = {
        id: 1,
        username: 'newuser',
        password: 'password123',
        email: 'new@example.com',
        created_at: '2025-01-01'
      };

      mockStorageService.createUser.and.returnValue(Promise.resolve(mockUser));
      mockStorageService.setCurrentUser.and.returnValue(Promise.resolve());

      const result = await service.register('newuser', 'password123', 'new@example.com');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Registro exitoso');
      expect(mockStorageService.createUser).toHaveBeenCalledWith({
        username: 'newuser',
        password: 'password123',
        email: 'new@example.com'
      });
    });

    it('should return error message when registration fails', async () => {
      mockStorageService.createUser.and.returnValue(
        Promise.reject(new Error('El nombre de usuario ya existe'))
      );

      const result = await service.register('existing', 'password123', 'test@example.com');

      expect(result.success).toBe(false);
      expect(result.message).toBe('El nombre de usuario ya existe');
    });

    it('should set current user after successful registration', async () => {
      const mockUser: User = {
        id: 5,
        username: 'newuser',
        password: 'password123',
        email: 'new@example.com',
        created_at: '2025-01-01'
      };

      mockStorageService.createUser.and.returnValue(Promise.resolve(mockUser));
      mockStorageService.setCurrentUser.and.returnValue(Promise.resolve());

      await service.register('newuser', 'password123', 'new@example.com');

      expect(mockStorageService.setCurrentUser).toHaveBeenCalledWith(5);
      expect(service.getCurrentUser()).toEqual(mockUser);
    });
  });

  // ==================== LOGOUT ====================

  describe('logout', () => {
    
    it('should logout successfully', async () => {
      mockStorageService.logout.and.returnValue(Promise.resolve());

      await service.logout();

      expect(mockStorageService.logout).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should clear current user on logout', async () => {
      mockStorageService.logout.and.returnValue(Promise.resolve());

      await service.logout();

      expect(service.getCurrentUser()).toBeNull();
    });

    it('should set isAuthenticated to false on logout', (done) => {
      mockStorageService.logout.and.returnValue(Promise.resolve());

      let callCount = 0;
      service.isAuthenticated$.subscribe(isAuth => {
        callCount++;
        if (callCount === 2) { // Skip initial value
          expect(isAuth).toBe(false);
          done();
        }
      });

      service.logout();
    });
  });

  // ==================== IS AUTHENTICATED ====================

  describe('isAuthenticated', () => {
    
    it('should return true when user is logged in', async () => {
      mockStorageService.isUserLoggedIn.and.returnValue(Promise.resolve(true));

      const result = await service.isAuthenticated();

      expect(result).toBe(true);
      expect(mockStorageService.isUserLoggedIn).toHaveBeenCalled();
    });

    it('should return false when user is not logged in', async () => {
      mockStorageService.isUserLoggedIn.and.returnValue(Promise.resolve(false));

      const result = await service.isAuthenticated();

      expect(result).toBe(false);
    });
  });

  // ==================== GET CURRENT USER ====================

  describe('getCurrentUser', () => {
    
    it('should return current user', () => {
      const mockUser: User = {
        id: 1,
        username: 'testuser',
        password: 'password123',
        email: 'test@example.com',
        created_at: '2025-01-01'
      };

      // Simulate login to set current user
      (service as any).currentUserSubject.next(mockUser);

      const result = service.getCurrentUser();

      expect(result).toEqual(mockUser);
    });

    it('should return null when no user is logged in', () => {
      const result = service.getCurrentUser();

      expect(result).toBeNull();
    });
  });
});
