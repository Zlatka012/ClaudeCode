import { Component, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

const WMO_DESCRIPTIONS: Record<number, string> = {
  0: 'sunny',
  1: 'mainly clear',
  2: 'partly cloudy',
  3: 'cloudy',
  45: 'foggy',
  48: 'foggy',
  51: 'drizzling',
  53: 'drizzling',
  55: 'drizzling',
  56: 'freezing drizzle',
  57: 'freezing drizzle',
  61: 'raining',
  63: 'raining',
  65: 'heavily raining',
  66: 'freezing rain',
  67: 'freezing rain',
  71: 'snowing',
  73: 'snowing',
  75: 'heavily snowing',
  77: 'snowing',
  80: 'rainy with showers',
  81: 'rainy with showers',
  82: 'heavy rain showers',
  85: 'snowy showers',
  86: 'heavy snow showers',
  95: 'thunderstorming',
  96: 'thunderstorming with hail',
  99: 'thunderstorming with hail',
};

interface GeoResult {
  results: { latitude: number; longitude: number }[];
}

interface WeatherResult {
  current: { weather_code: number };
}

@Component({
  selector: 'app-forecast',
  imports: [],
  templateUrl: './forecast.html',
  styleUrl: './forecast.scss',
})
export class Forecast implements OnInit {
  city = 'Kežmarok, Slovakia';

  loading = signal(true);
  error = signal<string | null>(null);
  weatherDescription = signal<string | null>(null);

  constructor(private http: HttpClient) {}

  ngOnInit() {
    const cityName = this.city.split(',')[0].trim();
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&format=json`;

    this.http.get<GeoResult>(geoUrl).subscribe({
      next: (geo) => {
        if (!geo.results?.length) {
          this.error.set(`City "${this.city}" not found.`);
          this.loading.set(false);
          return;
        }
        const { latitude, longitude } = geo.results[0];
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=weather_code`;

        this.http.get<WeatherResult>(weatherUrl).subscribe({
          next: (data) => {
            const code = data.current.weather_code;
            this.weatherDescription.set(WMO_DESCRIPTIONS[code] ?? 'unknown');
            this.loading.set(false);
          },
          error: () => {
            this.error.set('Could not fetch weather data.');
            this.loading.set(false);
          },
        });
      },
      error: () => {
        this.error.set('Could not reach geocoding API.');
        this.loading.set(false);
      },
    });
  }
}
