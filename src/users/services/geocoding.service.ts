import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class GeocodingService {
  private readonly baseUrl = 'https://nominatim.openstreetmap.org/search';

  /**
   * Resolves a postal code into latitude and longitude geographic coordinates
   * using the Nominatim (OpenStreetMap) API.
   * @param postalCode - Postal code to resolve.
   * @param countryCode - ISO country code (default: 'es').
   * @throws BadRequestException if no location is found.
   * @throws ServiceUnavailableException if the geocoding service fails.
   * @returns Parsed coordinates and name location.
   */
  async fromPostalCode(postalCode: string, countryCode: string = 'es') {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          q: `${postalCode} Spain`,
          format: 'json',
          limit: 1,
          countrycodes: countryCode,
        },
        headers: {
          'User-Agent': 'Helpinaut/1.0 (helpinaut.app)',
        },
      });

      if (!response.data || response.data.length === 0) {
        throw new BadRequestException(
          `No location  found for postal code "${postalCode}"`,
        );
      }

      const { lat, lon, displayName } = response.data[0];

      return {
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
        displayName,
      };
    } catch (error) {
      throw new ServiceUnavailableException(
        'Geocoding service is temporarily unavailable',
      );
    }
  }
}
