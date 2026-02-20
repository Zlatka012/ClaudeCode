import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { Forecast } from './forecast';

describe('Forecast', () => {
  let component: Forecast;
  let fixture: ComponentFixture<Forecast>;

  const mockGeoResponse = {
    results: [{ latitude: 49.13571, longitude: 20.43352 }],
  };

  const mockWeatherResponse = {
    current: { weather_code: 0 },
  };

  const mockHttpClient = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    mockHttpClient.get.mockImplementation((url: string) => {
      if (url.includes('geocoding-api.open-meteo.com')) {
        return of(mockGeoResponse);
      }
      return of(mockWeatherResponse);
    });

    await TestBed.configureTestingModule({
      imports: [Forecast],
      providers: [{ provide: HttpClient, useValue: mockHttpClient }],
    }).compileComponents();

    fixture = TestBed.createComponent(Forecast);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should start in loading state', () => {
    expect(component.loading()).toBe(true);
    expect(component.error()).toBeNull();
    expect(component.weatherDescription()).toBeNull();
  });

  it('should display weather description after successful API calls', () => {
    fixture.detectChanges();

    expect(component.loading()).toBe(false);
    expect(component.error()).toBeNull();
    expect(component.weatherDescription()).toBe('sunny');
  });

  it('should set error when city is not found in geocoding response', () => {
    mockHttpClient.get.mockImplementation((url: string) => {
      if (url.includes('geocoding-api.open-meteo.com')) {
        return of({ results: [] });
      }
      return of(mockWeatherResponse);
    });
    fixture.detectChanges();

    expect(component.loading()).toBe(false);
    expect(component.error()).toBe(`City "${component.city}" not found.`);
    expect(component.weatherDescription()).toBeNull();
  });

  it('should set error when geocoding API fails', () => {
    mockHttpClient.get.mockImplementation((url: string) => {
      if (url.includes('geocoding-api.open-meteo.com')) {
        return throwError(() => new Error('Server Error'));
      }
      return of(mockWeatherResponse);
    });
    fixture.detectChanges();

    expect(component.loading()).toBe(false);
    expect(component.error()).toBe('Could not reach geocoding API.');
    expect(component.weatherDescription()).toBeNull();
  });

  it('should set error when weather API fails', () => {
    mockHttpClient.get.mockImplementation((url: string) => {
      if (url.includes('geocoding-api.open-meteo.com')) {
        return of(mockGeoResponse);
      }
      return throwError(() => new Error('Server Error'));
    });
    fixture.detectChanges();

    expect(component.loading()).toBe(false);
    expect(component.error()).toBe('Could not fetch weather data.');
    expect(component.weatherDescription()).toBeNull();
  });

  it('should use city name (before comma) in geocoding request', () => {
    fixture.detectChanges();

    expect(mockHttpClient.get).toHaveBeenCalledWith(
      expect.stringContaining('name=Ke%C5%BEmarok'),
    );
  });

  it('should pass coordinates from geocoding to weather request', () => {
    fixture.detectChanges();

    expect(mockHttpClient.get).toHaveBeenCalledWith(
      expect.stringContaining('latitude=49.13571'),
    );
    expect(mockHttpClient.get).toHaveBeenCalledWith(
      expect.stringContaining('longitude=20.43352'),
    );
  });

  it('should fall back to "unknown" for unrecognised weather code', () => {
    mockHttpClient.get.mockImplementation((url: string) => {
      if (url.includes('geocoding-api.open-meteo.com')) {
        return of(mockGeoResponse);
      }
      return of({ current: { weather_code: 999 } });
    });
    fixture.detectChanges();

    expect(component.weatherDescription()).toBe('unknown');
    expect(component.loading()).toBe(false);
  });

  it('should render loading message in template while loading', () => {
    mockHttpClient.get.mockReturnValue(new Observable());
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Loading weather...');
  });

  it('should render weather description in template after load', () => {
    fixture.detectChanges();
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain("it's sunny");
  });

  it('should render error message in template on failure', () => {
    mockHttpClient.get.mockImplementation(() =>
      throwError(() => new Error('Server Error')),
    );
    fixture.detectChanges();
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Could not reach geocoding API.');
  });
});
