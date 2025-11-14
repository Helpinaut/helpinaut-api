import { BadRequestException, Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class GeocodingService {
  private readonly baseUrl = 'https://nominatim.openstreetmap.org/search';

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
          `could not find any location with postal code "${postalCode}"`,
        );
      }

      const { lat, lon, displayName } = response.data[0];

      return {
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
        displayName,
      };
    } catch (error) {
      throw error;
    }
  }
}
