import { Test, TestingModule } from '@nestjs/testing';

import { LOCK_SERVICE_OPTIONS, LockModule, LockService } from '../src';
import { getRedisClientConfig, mockConfigService } from './config.service.mock';

describe('forRootAsync', () => {
  const redis = getRedisClientConfig(mockConfigService as any);

  it('Can create instance with provider method', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        LockModule.forRootAsync({
          useFactory: () => ({ redis }),
        }),
      ],
    }).compile();
    await module.init();

    const options = module.get(LOCK_SERVICE_OPTIONS);
    expect(options.redis).toHaveProperty('port');
    expect(options.redis.port).toEqual(redis.port);

    await module.close();
  });
});

describe('forRoot', () => {
  const options = getRedisClientConfig(mockConfigService as any);

  it('Can create instance ', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LockModule.forRoot({ redis: options })],
    }).compile();
    await module.init();

    const lockService = module.get<LockService>(LockService);
    expect(lockService).toBeDefined();
    expect(lockService.options).toBeDefined();
    expect(lockService.options.redis.port).toEqual(options.port);

    await module.close();
  });
});
