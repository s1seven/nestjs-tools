/* eslint-disable max-lines-per-function */
import aedes, { Aedes } from 'aedes';
import { AddressInfo, createServer, Server } from 'net';

import { ApplicationBoot } from '../src';
import { bootOptions, Config } from './bootstrap.mock';

describe('Boot unit tests', () => {
  let applicationBoot: ApplicationBoot<Config>;
  let broker: Aedes;
  let tcpServer: Server;

  beforeAll(async () => {
    broker = aedes();
    tcpServer = createServer(broker.handle);
    await new Promise((resolve) => {
      tcpServer.listen(7883, () => {
        resolve((tcpServer.address() as AddressInfo).port);
      });
    });
  });

  beforeEach(() => {
    applicationBoot = new ApplicationBoot<Config>(bootOptions);
  });

  afterEach(async () => {
    applicationBoot.removeAllListeners();
    if (applicationBoot.app) {
      await applicationBoot.app.close();
    }
  });

  afterAll(async () => {
    applicationBoot = null;
    await new Promise<void>((resolve) => {
      tcpServer.close(() => {
        broker.close(() => resolve());
      });
    });
  }, 8000);

  it('ApplicationBoot should be defined', () => {
    expect(applicationBoot).toBeDefined();
  });

  it('ApplicationBoot should call preSetup hook, when it is defined', async () => {
    const preSetup = jest.fn();
    const setupAppSpy = jest.spyOn(applicationBoot, 'setupApp');
    applicationBoot.bootstrap({ preSetup });
    //
    await new Promise<void>((resolve, reject) => {
      applicationBoot.once('started', () => resolve()).once('error', reject);
    });
    expect(preSetup).toBeCalledTimes(1);
    expect(setupAppSpy).toBeCalledTimes(1);
  }, 8000);

  it('ApplicationBoot should call all expected setters, during setup phase', async () => {
    const setStaticAssetsSpy = jest.spyOn(applicationBoot, 'setStaticAssets');
    const setGlobalFiltersSpy = jest.spyOn(applicationBoot, 'setGlobalFilters');
    const setGlobalInterceptorsSpy = jest.spyOn(applicationBoot, 'setGlobalInterceptors');
    const setGlobalPipesSpy = jest.spyOn(applicationBoot, 'setGlobalPipes');
    const setCompressionSpy = jest.spyOn(applicationBoot, 'setCompression');
    const setCorsSpy = jest.spyOn(applicationBoot, 'setCors');
    const setHelmetSpy = jest.spyOn(applicationBoot, 'setHelmet');
    const setRateLimitSpy = jest.spyOn(applicationBoot, 'setRateLimit');
    applicationBoot.bootstrap();
    //
    await new Promise<void>((resolve, reject) => {
      applicationBoot.once('started', () => resolve()).once('error', reject);
    });
    expect(setStaticAssetsSpy).toBeCalledWith(bootOptions.staticAssets);
    expect(setGlobalFiltersSpy).toBeCalledWith([]);
    expect(setGlobalInterceptorsSpy).toBeCalledWith([]);
    expect(setGlobalPipesSpy).toBeCalledWith([]);
    expect(setCompressionSpy).toBeCalledWith(bootOptions.compressionOptions);
    expect(setCorsSpy).toBeCalledWith(bootOptions.corsOptions);
    expect(setHelmetSpy).toBeCalledWith(bootOptions.helmetOptions);
    expect(setRateLimitSpy).toBeCalledWith(bootOptions.rateLimitOptions);
  }, 8000);

  it('ApplicationBoot should call postSetup hook, when it is defined', async () => {
    const postSetup = jest.fn();
    const setupAppSpy = jest.spyOn(applicationBoot, 'setupApp');
    applicationBoot.bootstrap({ postSetup });
    //
    await new Promise<void>((resolve, reject) => {
      applicationBoot.once('started', () => resolve()).once('error', reject);
    });
    expect(postSetup).toBeCalledTimes(1);
    expect(setupAppSpy).toBeCalledTimes(1);
  }, 8000);

  it('ApplicationBoot should call postInit hook, when it is defined', async () => {
    const postInit = jest.fn();
    const setupAppSpy = jest.spyOn(applicationBoot, 'setupApp');
    applicationBoot.bootstrap({ postInit });
    //
    await new Promise<void>((resolve, reject) => {
      applicationBoot.once('started', () => resolve()).once('error', reject);
    });
    expect(postInit).toBeCalledTimes(1);
    expect(setupAppSpy).toBeCalledTimes(1);
  }, 8000);
});
