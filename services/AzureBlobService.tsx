import { TokenCredential } from "@azure/core-auth";
import {
  AnonymousCredential,
  BlobServiceClient,
  BlobUploadCommonResponse,
  ContainerClient,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";

class AzureBlobService {
  blobServiceClient: BlobServiceClient;
  containerClient: ContainerClient;

  constructor(url: string, containerName: string) {
    console.log(`url: ${url}`);
    console.log(`containerName: ${containerName}`);
    this.blobServiceClient = new BlobServiceClient(url);
    this.containerClient = this.blobServiceClient.getContainerClient(containerName);
  }

  async uploadFile(file: File, fileName: string): Promise<string> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(fileName);
    const response: BlobUploadCommonResponse =
      await blockBlobClient.uploadData(file);
    return blockBlobClient.url;
  }
  
  async downloadFile(fileName: string): Promise<Blob | undefined> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(fileName);
    const response = await blockBlobClient.download();
    return await response.blobBody;
  }
}

export default AzureBlobService;
