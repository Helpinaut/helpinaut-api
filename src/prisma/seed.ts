import { PrismaClient, Category, User, Advert } from '@prisma/client';
import axios from 'axios';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function fromPostalCode(postalCode: string, countryCode: string = 'es') {
  const baseUrl = 'https://nominatim.openstreetmap.org/search';

  try {
    const response = await axios.get(baseUrl, {
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
      throw new Error(`No location  found for postal code "${postalCode}"`);
    }

    const { lat, lon, displayName } = response.data[0];

    return {
      latitude: parseFloat(lat),
      longitude: parseFloat(lon),
      displayName,
    };
  } catch (error) {
    throw new Error('Geocoding service is temporarily unavailable');
  }
}

/**
 * Deletes all records from the database to reset it before seeding.
 */
async function resetDatabase() {
  await prisma.favorite.deleteMany();
  await prisma.photo.deleteMany();
  await prisma.advert.deleteMany();
  await prisma.user.deleteMany();
  console.log('Database reset completed.');
}

/**
 * Seeds the database with initial test data (users and adverts)
 */
async function seedDatabase() {
  try {
    await resetDatabase();

    // Insert users
    const users: User[] = [];
    const usersData = [
      {
        email: 'john.doe@email.com',
        username: 'john',
        password: '12345678',
        postalCode: '41011',
      },
      {
        email: 'jane.doe@email.com',
        username: 'jane',
        password: '12345678',
        postalCode: '41012',
      },
      {
        email: 'maria.smith@email.com',
        username: 'maria',
        password: '12345678',
        postalCode: '41013',
      },
    ];

    for (const user of usersData) {
      const hashedPassword = await bcrypt.hash(user.password, 12);
      const coords = await fromPostalCode(user.postalCode);
      const created = await prisma.user.create({
        data: {
          email: user.email,
          username: user.username,
          password: hashedPassword,
          postalCode: user.postalCode,
          latitude: coords.latitude,
          longitude: coords.longitude,
        },
      });

      users.push(created);
    }

    console.log(`Inserted ${users.length} users`);

    // Insert adverts
    const adverts: Advert[] = [];
    const advertsData = [
      {
        title: 'Plumbing services',
        description: 'Fixing leaks and installing pipes.',
        price: 50,
        category: Category.PLUMBING,
        isOffer: true,
        ownerId: users[0].id,
      },
      {
        title: 'Electrician available',
        description: 'Certified electrician for home repairs.',
        price: 40,
        category: Category.ELECTRICIAN,
        isOffer: false,
        ownerId: users[1].id,
      },
      {
        title: 'Gardening help',
        description: 'Lawn mowing and plant care.',
        price: 20,
        category: Category.GARDENING,
        isOffer: true,
        ownerId: users[2].id,
      },
      {
        title: 'Math private classes',
        description: 'High school and university level tutoring.',
        price: 25,
        category: Category.CLASSES,
        isOffer: false,
        ownerId: users[2].id,
      },
    ];

    for (const advert of advertsData) {
      const owner = users.find((u) => u.id === advert.ownerId)!;
      const created = await prisma.advert.create({
        data: {
          ...advert,
          latitude: owner.latitude,
          longitude: owner.longitude,
        },
      });

      adverts.push(created);
    }

    console.log(`Inserted ${adverts.length} adverts`);
  } catch (error) {
    console.error('Seeding failed:', error);
    throw error;
  }
}

// Run seeding
seedDatabase()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
