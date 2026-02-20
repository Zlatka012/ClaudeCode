describe('Forecast', () => {
  const geoApiPattern = '**/geocoding-api.open-meteo.com/**';
  const weatherApiPattern = '**/api.open-meteo.com/**';

  function interceptSuccess(weatherCode = 0) {
    cy.intercept('GET', geoApiPattern, { fixture: 'geo-response.json' }).as('geoApi');
    cy.intercept('GET', weatherApiPattern, {
      body: { current: { weather_code: weatherCode } },
    }).as('weatherApi');
  }

  beforeEach(() => {
    interceptSuccess();
    cy.visit('/');
  });

  it('should show loading indicator before data is fetched', () => {
    cy.intercept('GET', geoApiPattern, (req) => req.reply({ delay: 500, fixture: 'geo-response.json' })).as('slowGeo');
    cy.intercept('GET', weatherApiPattern, { fixture: 'weather-response.json' }).as('weatherApi');

    cy.visit('/');
    cy.contains('Loading weather...').should('be.visible');

    cy.wait('@slowGeo');
    cy.wait('@weatherApi');
  });

  it('should display weather description after successful API calls', () => {
    cy.wait('@geoApi');
    cy.wait('@weatherApi');

    cy.contains("it's sunny").should('be.visible');
  });

  it('should not display error or loading after successful load', () => {
    cy.wait('@geoApi');
    cy.wait('@weatherApi');

    cy.contains('Loading weather...').should('not.exist');
    cy.contains('Could not').should('not.exist');
  });

  it('should display error when city is not found', () => {
    cy.intercept('GET', geoApiPattern, { body: { results: [] } }).as('geoEmpty');

    cy.visit('/');
    cy.wait('@geoEmpty');

    cy.contains('not found').should('be.visible');
    cy.contains('Loading weather...').should('not.exist');
  });

  it('should display error when geocoding API fails', () => {
    cy.intercept('GET', geoApiPattern, { statusCode: 500 }).as('geoError');

    cy.visit('/');
    cy.wait('@geoError');

    cy.contains('Could not reach geocoding API.').should('be.visible');
    cy.contains('Loading weather...').should('not.exist');
  });

  it('should display error when weather API fails', () => {
    cy.intercept('GET', geoApiPattern, { fixture: 'geo-response.json' }).as('geoOk');
    cy.intercept('GET', weatherApiPattern, { statusCode: 500 }).as('weatherError');

    cy.visit('/');
    cy.wait('@geoOk');
    cy.wait('@weatherError');

    cy.contains('Could not fetch weather data.').should('be.visible');
    cy.contains('Loading weather...').should('not.exist');
  });

  it('should display "unknown" for an unrecognised weather code', () => {
    interceptSuccess(999);

    cy.visit('/');
    cy.wait('@geoApi');
    cy.wait('@weatherApi');

    cy.contains("it's unknown").should('be.visible');
  });

  it('should call geocoding API with city name only (before comma)', () => {
    cy.wait('@geoApi').its('request.url').should('include', 'name=Ke%C5%BEmarok');
  });

  it('should pass coordinates from geocoding response to weather request', () => {
    cy.wait('@geoApi');
    cy.wait('@weatherApi').its('request.url').then((url) => {
      expect(url).to.include('latitude=49.13571');
      expect(url).to.include('longitude=20.43352');
    });
  });
});
