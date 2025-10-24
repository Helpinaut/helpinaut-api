import { PrismaClient, Category } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  /**
   * Delete all records to reset database
   */
  console.log(`Deleted ${await prisma.advert.count()} adverts`);
  await prisma.advert.deleteMany();
  console.log(`Deleted ${await prisma.user.count()} users`);
  await prisma.user.deleteMany();

  /**
   * Insert users
   */
  const john = await prisma.user.upsert({
    where: { email: 'john.doe@mail.com' },
    update: {},
    create: {
      email: 'john.doe@email.com',
      username: 'john',
      password: '123456',
    },
  });
  const jane = await prisma.user.upsert({
    where: { email: 'jane.doe@mail.com' },
    update: {},
    create: {
      email: 'jane.doe@email.com',
      username: 'jane',
      password: '123456',
    },
  });
  console.log(`Inserted ${await prisma.user.count()} users`);

  /**
   * Insert adverts
   */
  const adverts = await prisma.advert.createMany({
    data: [
      {
        title: 'First advert',
        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        price: 10,
        category: Category.PLUMBING,
        offer: true,
        ownerId: john.id,
      },
      {
        title: 'Second advert',
        description: 'Pellentesque sapien orci, tincidunt eget porta eget.',
        price: 20,
        category: Category.ELECTRICIAN,
        offer: false,
        ownerId: jane.id,
      },
    ],
  });
  console.log(`Inserted ${await prisma.advert.count()} adverts`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
