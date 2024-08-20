import { TokenCredential } from '@azure/core-auth';
import { AnonymousCredential, BlobServiceClient, BlobUploadCommonResponse, ContainerClient, StorageSharedKeyCredential } from '@azure/storage-blob';

class AzureBlobService {
    blobServiceClient: BlobServiceClient;
    containerClient: ContainerClient;

  constructor() {
      const sasToken = process.env.AZURE_SAS_TOKEN;
      const containerName = process.env.AZURE_BLOB_CONTAINER_NAME ?? "default";
      const accountName = process.env.AZURE_BLOB_ACCOUNT_NAME;
      
      this.blobServiceClient = new BlobServiceClient(`https://${accountName}.blob.core.windows.net/?${sasToken}`);
      this.containerClient = this.blobServiceClient.getContainerClient(containerName);
}

  async uploadFile(file: File, fileName: string) : Promise<string> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(fileName);
    const response: BlobUploadCommonResponse = await blockBlobClient.uploadData(file);
    return blockBlobClient.url 
}
    async downloadFile(fileName: string): Promise<Blob | undefined> {
        const blockBlobClient = this.containerClient.getBlockBlobClient(fileName);
        const response = await blockBlobClient.download();
        return await response.blobBody;
    }
}

export default AzureBlobService;
