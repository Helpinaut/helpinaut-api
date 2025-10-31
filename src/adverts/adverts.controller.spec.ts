import { Test, TestingModule } from '@nestjs/testing';
import { AdvertsController } from './adverts.controller';

describe('AdvertsController', () => {
  let controller: AdvertsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdvertsController],
    }).compile();

    controller = module.get<AdvertsController>(AdvertsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
