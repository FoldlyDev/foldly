# TODO List

## Pending Tasks

### 1. Prevent Page Refresh on Link Operations

- **Task ID**: `prevent-page-refresh-links`
- **Description**: Find a way to modify links and create links without causing an entire page refresh
- **Status**: Pending
- **Priority**: High
- **Impact**: User Experience

## Completed Tasks

### 1. Fix File Size Schema for Scalability ✅

- **Task ID**: `fix-file-size-schema`
- **Description**: Fix file size schema because later on we will need both MB and GB options (a solution could be to make this field a string in the database instead of a number)
- **Status**: ✅ Completed (January 30, 2025)
- **Priority**: Medium
- **Impact**: Future Scalability
- **Resolution**: Added `max_file_size_mb` column to subscription_plans table via migration 0007. Currently all plans use 10MB limit due to Supabase free tier constraints.

## Future Tasks (Post-Supabase Free Tier)

### 1. Increase File Size Limits Per Plan

- **Task ID**: `increase-file-size-limits`
- **Description**: Once upgraded from Supabase free tier, increase file size limits to planned values (Free: 50MB, Pro: 100MB, Business: 500MB)
- **Status**: Future
- **Priority**: High (when upgrading)
- **Impact**: User Experience, Feature Differentiation
- **Note**: Currently all plans are limited to 10MB due to Supabase free tier constraints

## Notes

- Tasks created to address current limitations in the links feature
- Focus on improving user experience and preparing for future enhancements
- File size limits are temporarily constrained by Supabase free tier (10MB max)
