import { Test, TestingModule } from '@nestjs/testing';
import { MyBrowserService } from './my-browser.service';

describe('MyBrowserService', () => {
  let service: MyBrowserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MyBrowserService],
    }).compile();

    service = module.get<MyBrowserService>(MyBrowserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
