import { Component } from '@angular/core';
import { Forecast } from './forecast/forecast';

@Component({
  selector: 'app-root',
  imports: [Forecast],
  template: '<app-forecast />',
  styleUrl: './app.scss'
})
export class App {}
