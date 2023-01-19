import { Test, TestingModule } from '@nestjs/testing';
import { MyBrowserController } from './my-browser.controller';
import { MyBrowserService } from './my-browser.service';

describe('MyBrowserController', () => {
  let controller: MyBrowserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MyBrowserController],
      providers: [MyBrowserService],
    }).compile();

    controller = module.get<MyBrowserController>(MyBrowserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
