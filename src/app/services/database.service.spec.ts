import { TestBed } from '@angular/core/testing';
import { DatabaseService } from './database.service';

describe('DatabaseService', () => {
  let service: DatabaseService;
  let mockDb: any;

  beforeEach(() => {
    // Mock de la base de datos SQLite
    mockDb = {
      execute: jasmine.createSpy('execute').and.returnValue(Promise.resolve()),
      run: jasmine.createSpy('run').and.returnValue(Promise.resolve({ 
        changes: { lastId: 1, changes: 1 } 
      })),
      query: jasmine.createSpy('query').and.returnValue(Promise.resolve({ 
        values: [] 
      }))
    };

    TestBed.configureTestingModule({
      providers: [DatabaseService]
    });

    service = TestBed.inject(DatabaseService);
    // Reemplazar la BD real por el mock
    (service as any).db = mockDb;
    (service as any).isInitialized = true;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ==================== AUTENTICACIÓN ====================

  describe('Authentication', () => {
    
    describe('login', () => {
      
      it('should login successfully with valid credentials', async () => {
        const mockUser = {
          id: 1,
          username: 'demo',
          password: 'demo123',
          email: 'demo@demo.com',
          created_at: '2025-01-01'
        };

        spyOn(service, 'getUserByUsername').and.returnValue(Promise.resolve(mockUser));
        spyOn(service, 'setCurrentUser').and.returnValue(Promise.resolve());

        const result = await service.login('demo', 'demo123');

        expect(result).toEqual(mockUser);
        expect(service.setCurrentUser).toHaveBeenCalledWith(1);
      });

      it('should throw error when user not found', async () => {
        spyOn(service, 'getUserByUsername').and.returnValue(Promise.resolve(null));

        await expectAsync(service.login('noexiste', 'password123'))
          .toBeRejectedWithError('Usuario no encontrado');
      });

      it('should throw error with incorrect password', async () => {
        const mockUser = {
          id: 1,
          username: 'demo',
          password: 'demo123',
          email: 'demo@demo.com',
          created_at: '2025-01-01'
        };

        spyOn(service, 'getUserByUsername').and.returnValue(Promise.resolve(mockUser));

        await expectAsync(service.login('demo', 'wrongpassword'))
          .toBeRejectedWithError('Contraseña incorrecta');
      });
    });

    
    describe('logout', () => {
      
      it('should clear session successfully', async () => {
        mockDb.run.and.returnValue(Promise.resolve());

        await service.logout();

        expect(mockDb.run).toHaveBeenCalledWith(
          jasmine.stringContaining('DELETE FROM session')
        );
      });
    });

    describe('getCurrentUser', () => {
      
      it('should return current user when logged in', async () => {
        const mockUser = {
          id: 1,
          username: 'demo',
          password: 'demo123',
          email: 'demo@demo.com',
          created_at: '2025-01-01'
        };

        mockDb.query.and.returnValue(Promise.resolve({ 
          values: [{ user_id: 1 }] 
        }));
        
        spyOn(service, 'getUserById').and.returnValue(Promise.resolve(mockUser));

        const result = await service.getCurrentUser();

        expect(result).toEqual(mockUser);
      });

      it('should return null when no user logged in', async () => {
        mockDb.query.and.returnValue(Promise.resolve({ values: [] }));

        const result = await service.getCurrentUser();

        expect(result).toBeNull();
      });
    });

    describe('isUserLoggedIn', () => {
      
      it('should return true when user is logged in', async () => {
        const mockUser = {
          id: 1,
          username: 'demo',
          password: 'demo123',
          email: 'demo@demo.com',
          created_at: '2025-01-01'
        };

        spyOn(service, 'getCurrentUser').and.returnValue(Promise.resolve(mockUser));

        const result = await service.isUserLoggedIn();

        expect(result).toBe(true);
      });

      it('should return false when no user logged in', async () => {
        spyOn(service, 'getCurrentUser').and.returnValue(Promise.resolve(null));

        const result = await service.isUserLoggedIn();

        expect(result).toBe(false);
      });
    });

    describe('setCurrentUser', () => {
      
      it('should save user_id to session successfully', async () => {
        mockDb.run.and.returnValue(Promise.resolve());

        await service.setCurrentUser(1);

        expect(mockDb.run).toHaveBeenCalledWith(
          jasmine.stringContaining('DELETE FROM session')
        );
        expect(mockDb.run).toHaveBeenCalledWith(
          jasmine.stringContaining('INSERT INTO session'),
          [1]
        );
      });
    });
  });

  // ==================== GESTIÓN DE USUARIOS ====================

  describe('User Management', () => {
    
    describe('createUser', () => {
      
      it('should create user successfully with generated ID', async () => {
        const newUser = {
          username: 'testuser',
          password: 'password123',
          email: 'test@example.com'
        };

        // Mock: usuario no existe
        mockDb.query.and.returnValue(Promise.resolve({ values: [] }));
        
        // Mock: inserción exitosa
        mockDb.run.and.returnValue(Promise.resolve({ 
          changes: { lastId: 5, changes: 1 } 
        }));

        const result = await service.createUser(newUser);

        expect(result.id).toBe(5);
        expect(result.username).toBe('testuser');
        expect(result.email).toBe('test@example.com');
        expect(result.created_at).toBeDefined();
      });

      it('should throw error when username already exists', async () => {
        const newUser = {
          username: 'existing',
          password: 'password123',
          email: 'test@example.com'
        };

        // Mock: username existe
        mockDb.query.and.returnValue(Promise.resolve({ 
          values: [{ id: 1, username: 'existing' }] 
        }));

        await expectAsync(service.createUser(newUser))
          .toBeRejectedWithError('El nombre de usuario ya existe');
      });

      it('should throw error when email already exists', async () => {
        const newUser = {
          username: 'newuser',
          password: 'password123',
          email: 'existing@example.com'
        };

        // Mock: username no existe, pero email sí
        mockDb.query.and.returnValues(
          Promise.resolve({ values: [] }), // username check
          Promise.resolve({ values: [{ id: 1, email: 'existing@example.com' }] }) // email check
        );

        await expectAsync(service.createUser(newUser))
          .toBeRejectedWithError('El email ya está registrado');
      });

      it('should assign created_at timestamp automatically', async () => {
        const newUser = {
          username: 'testuser',
          password: 'password123',
          email: 'test@example.com'
        };

        mockDb.query.and.returnValue(Promise.resolve({ values: [] }));
        mockDb.run.and.returnValue(Promise.resolve({ 
          changes: { lastId: 1, changes: 1 } 
        }));

        const result = await service.createUser(newUser);

        expect(result.created_at).toBeDefined();
        expect(typeof result.created_at).toBe('string');
      });
    });

    describe('getUserByUsername', () => {
      
      it('should return user when found', async () => {
        const mockUser = {
          id: 1,
          username: 'testuser',
          password: 'password123',
          email: 'test@example.com',
          created_at: '2025-01-01'
        };

        mockDb.query.and.returnValue(Promise.resolve({ 
          values: [mockUser] 
        }));

        const result = await service.getUserByUsername('testuser');

        expect(result).toEqual(mockUser);
        expect(mockDb.query).toHaveBeenCalledWith(
          jasmine.stringContaining('SELECT * FROM users WHERE username'),
          ['testuser']
        );
      });

      it('should return null when user not found', async () => {
        mockDb.query.and.returnValue(Promise.resolve({ values: [] }));

        const result = await service.getUserByUsername('nonexistent');

        expect(result).toBeNull();
      });
    });

    describe('getUserById', () => {
      
      it('should return user when found', async () => {
        const mockUser = {
          id: 1,
          username: 'testuser',
          password: 'password123',
          email: 'test@example.com',
          created_at: '2025-01-01'
        };

        mockDb.query.and.returnValue(Promise.resolve({ 
          values: [mockUser] 
        }));

        const result = await service.getUserById(1);

        expect(result).toEqual(mockUser);
      });

      it('should return null when user not found', async () => {
        mockDb.query.and.returnValue(Promise.resolve({ values: [] }));

        const result = await service.getUserById(999);

        expect(result).toBeNull();
      });
    });
  });

  // ==================== CONFIGURACIÓN ====================

  describe('Configuration', () => {
    
    describe('getConfigValue', () => {
      
      it('should return config value when exists', async () => {
        mockDb.query.and.returnValue(Promise.resolve({ 
          values: [{ value: 'es' }] 
        }));

        const result = await service.getConfigValue('language');

        expect(result).toBe('es');
      });

      it('should return null when config not exists', async () => {
        mockDb.query.and.returnValue(Promise.resolve({ values: [] }));

        const result = await service.getConfigValue('nonexistent');

        expect(result).toBeNull();
      });
    });

    describe('setConfigValue', () => {
      
      it('should update existing config value', async () => {
        mockDb.run.and.returnValue(Promise.resolve({ 
          changes: { changes: 1 } 
        }));

        await service.setConfigValue('language', 'en');

        expect(mockDb.run).toHaveBeenCalledWith(
          jasmine.stringContaining('UPDATE config'),
          ['en', 'language']
        );
      });

      it('should insert new config if not exists', async () => {
        mockDb.run.and.returnValues(
          Promise.resolve({ changes: { changes: 0 } }), // UPDATE returns 0
          Promise.resolve({ changes: { changes: 1 } })  // INSERT succeeds
        );

        await service.setConfigValue('new_key', 'new_value');

        expect(mockDb.run).toHaveBeenCalledTimes(2);
        expect(mockDb.run).toHaveBeenCalledWith(
          jasmine.stringContaining('INSERT INTO config'),
          ['new_key', 'new_value']
        );
      });
    });

    describe('getLanguage', () => {
      
      it('should return language when set', async () => {
        spyOn(service, 'getConfigValue').and.returnValue(Promise.resolve('es'));

        const result = await service.getLanguage();

        expect(result).toBe('es');
        expect(service.getConfigValue).toHaveBeenCalledWith('language');
      });

      it('should return es as default when not set', async () => {
        spyOn(service, 'getConfigValue').and.returnValue(Promise.resolve(null));

        const result = await service.getLanguage();

        expect(result).toBe('es');
      });
    });

    describe('setLanguage', () => {
      
      it('should save language successfully', async () => {
        spyOn(service, 'setConfigValue').and.returnValue(Promise.resolve());

        await service.setLanguage('en');

        expect(service.setConfigValue).toHaveBeenCalledWith('language', 'en');
      });
    });
  });

  // ==================== HISTORIAL QR ====================

  describe('QR History', () => {
    
    describe('addQRToHistory', () => {
      
      it('should add QR to history with timestamp', async () => {
        mockDb.run.and.returnValue(Promise.resolve({ 
          changes: { lastId: 10 } 
        }));

        const qrData = {
          content: 'https://example.com',
          type: 'generated' as const
        };

        const result = await service.addQRToHistory(qrData);

        expect(result.id).toBe(10);
        expect(result.content).toBe('https://example.com');
        expect(result.type).toBe('generated');
        expect(result.timestamp).toBeDefined();
        expect(mockDb.run).toHaveBeenCalled();
      });

      it('should distinguish between generated and scanned types', async () => {
        mockDb.run.and.returnValue(Promise.resolve({ 
          changes: { lastId: 11 } 
        }));

        const qrData = {
          content: 'scanned-content',
          type: 'scanned' as const
        };

        const result = await service.addQRToHistory(qrData);

        expect(result.type).toBe('scanned');
      });
    });

    describe('getQRHistory', () => {
      
      it('should return QR history ordered by timestamp DESC', async () => {
        const mockHistory = [
          { id: 2, content: 'QR2', type: 'scanned', timestamp: '2025-01-02' },
          { id: 1, content: 'QR1', type: 'generated', timestamp: '2025-01-01' }
        ];

        mockDb.query.and.returnValue(Promise.resolve({ 
          values: mockHistory 
        }));

        const result = await service.getQRHistory();

        expect(result.length).toBe(2);
        expect(result[0].id).toBe(2); // Most recent first
        expect(mockDb.query).toHaveBeenCalledWith(
          jasmine.stringContaining('ORDER BY timestamp DESC')
        );
      });

      it('should return empty array when no history', async () => {
        mockDb.query.and.returnValue(Promise.resolve({ values: [] }));

        const result = await service.getQRHistory();

        expect(result).toEqual([]);
      });
    });

    describe('deleteQRFromHistory', () => {
      
      it('should delete QR from history successfully', async () => {
        mockDb.run.and.returnValue(Promise.resolve({ 
          changes: { changes: 1 } 
        }));

        const result = await service.deleteQRFromHistory(1);

        expect(result).toBe(true);
        expect(mockDb.run).toHaveBeenCalledWith(
          jasmine.stringContaining('DELETE FROM qr_history WHERE id'),
          [1]
        );
      });

      it('should return false when QR not found', async () => {
        mockDb.run.and.returnValue(Promise.resolve({ 
          changes: { changes: 0 } 
        }));

        const result = await service.deleteQRFromHistory(999);

        expect(result).toBe(false);
      });
    });
  });
});
