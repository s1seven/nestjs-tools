import { Transport } from '@nestjs/microservices';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { DocumentBuilder, OpenAPIObject, SwaggerCustomOptions } from '@nestjs/swagger';
import { existsSync, unlink, writeFile } from 'fs';
import type {
  AsyncApiDocument,
  AsyncApiDocumentBuilder,
  AsyncApiTemplateOptions,
  AsyncServerObject,
} from 'nestjs-asyncapi';
import { URL } from 'url';
import { promisify } from 'util';

import { AsyncApiOptions, BaseConfig, BootOptions, OpenApiOptions } from './options';

export function getMainServerUrl<Conf extends BaseConfig>(config: Conf) {
  const { proxyServerUrls, proxyServerUrl, serverUrl } = config;
  let url: string;
  if (proxyServerUrl && proxyServerUrl !== 'undefined') {
    url = proxyServerUrl;
  } else if (proxyServerUrls?.length) {
    url = proxyServerUrls[0];
  } else {
    url = serverUrl;
  }
  return url;
}

export function sanitizeOpenApiSpecs(apiObject: OpenAPIObject): void {
  Object.values(apiObject.paths).forEach((path) => {
    Object.values(path).forEach((method) => {
      if (Array.isArray(method.security)) {
        method.security = method.security.filter((s: any) => !!s);
      }
    });
  });
}

export async function saveApiObject(apiSpecs: AsyncApiDocument | OpenAPIObject, filePath: string): Promise<void> {
  if (existsSync(filePath)) {
    await promisify(unlink)(filePath);
  }
  await promisify(writeFile)(filePath, JSON.stringify(apiSpecs, null, 2));
}

function setCommonOptions(
  apiOptionsBuilder: DocumentBuilder | AsyncApiDocumentBuilder,
  apiOptions: OpenApiOptions | AsyncApiOptions,
): DocumentBuilder | AsyncApiDocumentBuilder {
  const { contacts, externalDocs, licenses, securityRequirements, securitySchemes, tags, terms } = apiOptions;
  if (contacts?.length) {
    contacts.forEach((contact) => {
      apiOptionsBuilder.setContact(contact.name, contact.url, contact.email);
    });
  }
  if (licenses?.length) {
    licenses.forEach((license) => {
      apiOptionsBuilder.setLicense(license.name, license.url);
    });
  }
  if (terms?.length) {
    terms.forEach((tos) => {
      apiOptionsBuilder.setTermsOfService(tos);
    });
  }
  if (externalDocs?.length) {
    externalDocs.forEach((externalDoc) => {
      apiOptionsBuilder.setExternalDoc(externalDoc.description, externalDoc.url);
    });
  }
  if (tags?.length) {
    tags.forEach((tag) => {
      apiOptionsBuilder.addTag(tag.resource, tag.description, tag.externalDocs);
    });
  }
  if (securityRequirements?.length && typeof apiOptionsBuilder['addSecurityRequirements'] === 'function') {
    securityRequirements.forEach((securityRequirement) => {
      apiOptionsBuilder['addSecurityRequirements'](securityRequirement);
    });
  }
  if (securitySchemes?.length) {
    securitySchemes.forEach((securityScheme) => {
      apiOptionsBuilder.addSecurity(securityScheme.name, securityScheme.scheme);
    });
  }
  return apiOptionsBuilder;
}

// eslint-disable-next-line max-lines-per-function
export async function setupOpenApi<Conf extends BaseConfig>(
  app: NestExpressApplication,
  options: BootOptions<Conf>,
  config: Conf,
): Promise<OpenAPIObject> {
  const { DocumentBuilder, SwaggerModule } = await import('@nestjs/swagger');

  const { openApi, serviceDescription, serviceName, serviceVersion } = options;
  const { customSiteTitle, customFavIcon, enableExplorer, extraModels, filePath } = openApi;
  const { proxyServerUrl, proxyServerUrls, serverUrl, swaggerPath } = config;
  const openApiOptions = new DocumentBuilder()
    .setTitle(`S1Seven ${serviceName} API`)
    .setDescription(serviceDescription)
    .setVersion(serviceVersion)
    .addServer(serverUrl);

  if (proxyServerUrl && proxyServerUrl !== 'undefined') {
    openApiOptions.addServer(proxyServerUrl);
  } else if (proxyServerUrls?.length) {
    proxyServerUrls.forEach((el) => {
      openApiOptions.addServer(el);
    });
  }

  setCommonOptions(openApiOptions, openApi);
  const openApiDocument = SwaggerModule.createDocument(app, openApiOptions.build(), { extraModels });
  const mainServerUrl = getMainServerUrl(config);
  const customFavIconPath =
    typeof customFavIcon === 'function' ? customFavIcon(app) : `${mainServerUrl}/${customFavIcon || 'favicon.ico'}`;

  const customOptions: SwaggerCustomOptions = {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customSiteTitle:
      typeof customSiteTitle === 'function' ? customSiteTitle(app) : customSiteTitle || `${serviceName} API`,
    customfavIcon: customFavIconPath,
    explorer: typeof enableExplorer === 'function' ? enableExplorer(app) : enableExplorer,
  };

  sanitizeOpenApiSpecs(openApiDocument);
  SwaggerModule.setup(swaggerPath, app, openApiDocument, customOptions);
  if (typeof filePath === 'string') {
    await saveApiObject(openApiDocument, filePath);
  } else if (typeof filePath === 'function') {
    await saveApiObject(openApiDocument, filePath(app));
  }
  return openApiDocument;
}

export function getAsyncApiProtocolType(transport: symbol | Transport): string {
  switch (transport) {
    case Transport.MQTT:
      return 'mqtt';
    case Transport.REDIS:
      return 'redis';
    case Transport.RMQ:
      return 'amqp';
    case Transport.NATS:
      return 'nats';
    case Transport.KAFKA:
      return 'kafka';
    default:
      return null;
  }
}

export function getAsyncApiProtocolTypeByUrl(url: string): string {
  return new URL(url).protocol.replace(':', '');
}

export function sanitizeAsyncApiSpecs(apiObject: AsyncApiDocument): void {
  Object.keys(apiObject.channels).forEach((channelName) => {
    if (channelName === 'undefined') {
      delete apiObject.channels[channelName];
    }
  });
}

// prevent password from being leaked
function sanitizeBrokerUrl(brokerUrl: string) {
  const { protocol, host, pathname } = new URL(brokerUrl);
  return `${protocol}//${host}${pathname}`;
}

type AsyncApiServer = { name: string; server: AsyncServerObject };

// eslint-disable-next-line max-lines-per-function
export async function setupAsyncApi<Conf extends BaseConfig>(
  app: NestExpressApplication,
  options: BootOptions<Conf>,
  config: Conf,
): Promise<AsyncApiDocument> {
  const { AsyncApiDocumentBuilder, AsyncApiModule } = await import('nestjs-asyncapi');
  const { asyncApi, serviceDescription, serviceName, serviceVersion } = options;
  const { defaultContentType, enableExplorer, extraModels, filePath } = asyncApi;
  const { asyncApiPath, brokerUrl, microservices } = config;

  const asyncApiOptions = new AsyncApiDocumentBuilder()
    .setTitle(`S1Seven ${serviceName} Async API`)
    .setDescription(serviceDescription)
    .setVersion(serviceVersion)
    .setDefaultContentType(defaultContentType);

  if (microservices?.length) {
    const asyncApiServers: AsyncApiServer[] = microservices.map((microservice) => {
      const strategy = 'strategy' in microservice ? microservice.strategy : null;
      const transport =
        'transport' in microservice && microservice.transport ? microservice.transport : strategy?.transportId;
      const protocol = getAsyncApiProtocolType(transport) || getAsyncApiProtocolTypeByUrl(brokerUrl);
      const url = sanitizeBrokerUrl(brokerUrl);
      const server: AsyncServerObject = {
        url,
        protocol,
        bindings: {},
      };
      return {
        name: `${protocol} broker`,
        server,
      };
    });
    asyncApiServers.forEach(({ name, server }) => {
      asyncApiOptions.addServer(name, server);
    });
  } else {
    const protocol = getAsyncApiProtocolTypeByUrl(brokerUrl);
    const url = sanitizeBrokerUrl(brokerUrl);
    const server: AsyncServerObject = {
      url,
      protocol,
      bindings: {},
    };
    asyncApiOptions.addServer(`${protocol} broker`, server);
  }

  setCommonOptions(asyncApiOptions, asyncApi);
  const asyncApiDocument = AsyncApiModule.createDocument(app, asyncApiOptions.build(), { extraModels });
  sanitizeAsyncApiSpecs(asyncApiDocument);

  if (enableExplorer) {
    const templateOptions: AsyncApiTemplateOptions = {
      sidebarOrganization: 'byTags',
      singleFile: true,
    };
    await AsyncApiModule.setup(asyncApiPath, app, asyncApiDocument, templateOptions);
  }
  if (typeof filePath === 'string') {
    await saveApiObject(asyncApiDocument, filePath);
  } else if (typeof filePath === 'function') {
    await saveApiObject(asyncApiDocument, filePath(app));
  }
  return asyncApiDocument;
}
