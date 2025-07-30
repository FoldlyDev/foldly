// Link Upload Feature Services
// Service layer for link-based file upload functionality

// Export link validation service
export { linkUploadValidationService, LinkUploadValidationService } from '../lib/services/link-validation';

// Re-export service types
export type {
  LinkUploadValidation,
  FileUploadValidation,
} from '../lib/services/link-validation';

// TODO: Implement these services
// export { LinkUploadService } from './link-upload-service';
// export { LinkBatchService } from './link-batch-service';