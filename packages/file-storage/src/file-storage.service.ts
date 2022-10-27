import { Injectable } from '@nestjs/common';
import { Readable, Writable } from 'stream';

import { InjectFileStorageStrategy } from './decorators';
import { FileStorage, FileStorageBaseArgs } from './file-storage.class';
import {
  FileStorageLocalDownloadFile,
  FileStorageLocalDownloadStream,
  FileStorageLocalFileExists,
  FileStorageLocalUploadFile,
  FileStorageLocalUploadStream,
} from './file-storage-fs.class';
import {
  FileStorageS3DeleteFile,
  FileStorageS3DownloadFile,
  FileStorageS3DownloadStream,
  FileStorageS3FileExists,
  FileStorageS3UploadFile,
  FileStorageS3UploadStream,
} from './file-storage-s3.class';

@Injectable()
export class FileStorageService implements Omit<FileStorage, 'transformFilePath'> {
  constructor(@InjectFileStorageStrategy() private readonly fileStorage: FileStorage) {}

  fileExists(args: FileStorageLocalFileExists | FileStorageS3FileExists): Promise<boolean> {
    return this.fileStorage.fileExists(args);
  }

  uploadFile(args: FileStorageLocalUploadFile | FileStorageS3UploadFile): Promise<void> {
    return this.fileStorage.uploadFile(args);
  }

  uploadStream(args: FileStorageLocalUploadStream | FileStorageS3UploadStream): Writable | Promise<Writable> {
    return this.fileStorage.uploadStream(args);
  }

  downloadFile(args: FileStorageLocalDownloadFile | FileStorageS3DownloadFile): Promise<Buffer | string> {
    return this.fileStorage.downloadFile(args);
  }

  downloadStream(args: FileStorageLocalDownloadStream | FileStorageS3DownloadStream): Readable | Promise<Readable> {
    return this.fileStorage.downloadStream(args);
  }

  deleteFile(args: FileStorageBaseArgs | FileStorageS3DeleteFile): Promise<boolean> {
    return this.fileStorage.deleteFile(args);
  }
}
