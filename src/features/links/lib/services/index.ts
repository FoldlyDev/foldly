// Export all link services
export { linkCrudService, LinkCrudService } from './link-crud-service';
export { linkQueryService, LinkQueryService } from './link-query-service';
export { linkMetadataService, LinkMetadataService } from './link-metadata-service';

// Re-export the main service for backwards compatibility
export { linksDbService, LinksDbService } from '../db-service';