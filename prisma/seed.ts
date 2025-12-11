import { PrismaClient, Category } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

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
    const users = await Promise.all([
      prisma.user.create({
        data: {
          email: 'john.doe@email.com',
          username: 'john',
          password: await bcrypt.hash('12345678', 12),
          postalCode: '41011',
        },
      }),
      prisma.user.create({
        data: {
          email: 'jane.doe@email.com',
          username: 'jane',
          password: await bcrypt.hash('12345678', 12),
          postalCode: '41012',
        },
      }),
      prisma.user.create({
        data: {
          email: 'maria.smith@email.com',
          username: 'maria',
          password: await bcrypt.hash('12345678', 12),
          postalCode: '41013',
        },
      }),
    ]);

    console.log(`Inserted ${users.length} users`);

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

    // Insert adverts
    const adverts = await Promise.all(
      advertsData.map((advert) => prisma.advert.create({ data: advert })),
    );

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
