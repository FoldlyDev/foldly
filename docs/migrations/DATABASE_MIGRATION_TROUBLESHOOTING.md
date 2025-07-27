# Database Migration Troubleshooting Guide

> **Critical Database Migration Error Resolution Documentation**  
> **Last Updated**: January 25, 2025  
> **Status**: Active - Contains resolved migration error procedures

## Overview

This document provides comprehensive troubleshooting procedures for database migration issues in the Foldly project. It includes real-world error resolutions, prevention strategies, and recovery procedures based on actual migration challenges encountered during development.

---

## Critical Migration Error Resolution

### Migration 0009: "Column Already Exists" Error (RESOLVED)

**Date Resolved**: January 25, 2025  
**Migration**: 0009_flexible_subscription_system  
**Impact**: High - Blocked subscription system implementation

#### Problem Description

**Error Message**:
```
ERROR: column "workspace_id" already exists
CONTEXT: SQL statement in migration 0009_flexible_subscription_system.sql
```

**Symptoms**:
- Migration 0009 failed during execution
- Database schema inconsistent with migration history
- Subscription system implementation blocked
- Development workflow interrupted

#### Root Cause Analysis

**Primary Cause**: Database Schema Drift
- The `workspace_id` column existed in the database from migration 0006
- Drizzle migration journal was not properly synchronized with actual database state
- Migration 0009 attempted to create a column that already existed
- Type casting issues in SQL prevented proper execution

**Contributing Factors**:
1. **Journal Inconsistency**: `__drizzle_migrations` table out of sync with actual schema
2. **Development Database State**: Local development database had diverged from tracked state
3. **Type Casting Issues**: Boolean values not properly cast in migration SQL
4. **Missing Verification**: No pre-migration schema verification process

#### Resolution Steps Applied

**Step 1: Database State Analysis**
```bash
# Checked current database schema
npm run introspect

# Verified existing tables and columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_subscriptions';
```

**Step 2: Schema Synchronization**
```bash
# Pulled actual schema from database
npm run pull

# Generated new migration to align state
npm run generate

# Reviewed generated migration for conflicts
```

**Step 3: Type Casting Correction**
- Fixed boolean type casting in migration SQL
- Corrected JSON type handling for features column
- Ensured proper NULL handling in subscription columns

**Step 4: Manual Migration Execution**
```bash
# Applied migration with verbose logging
npm run migrate -- --verbose

# Verified migration completion
SELECT * FROM __drizzle_migrations ORDER BY created_at DESC;
```

**Step 5: Data Validation**
```bash
# Verified subscription tables creation
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%subscription%';

# Checked user migration success
SELECT COUNT(*) FROM user_subscriptions;
```

#### Final Resolution State

**Database Status After Resolution**:
- **Total Tables**: 9 (up from 6)
- **New Tables Created**: 
  - `subscription_tiers` (3 default tiers)
  - `user_subscriptions` (5 users migrated)
  - `subscription_events` (audit trail)
- **Migration Journal**: Properly updated and synchronized
- **System Status**: Subscription system fully operational

**Verification Results**:
```sql
-- Confirmed table creation
subscription_tiers: 3 rows (free, pro, business)
user_subscriptions: 5 rows (existing users migrated)
subscription_events: 5 rows (migration events logged)

-- Verified data integrity
All foreign key constraints: ACTIVE
All indexes: CREATED
All RLS policies: ENABLED
```

---

## Common Migration Issues & Solutions

### 1. Schema Drift Detection

**Symptoms**:
- "Column already exists" errors
- "Table does not exist" when it should
- Migration shows as applied but changes missing

**Diagnosis Commands**:
```bash
# Check actual database schema
npm run introspect

# Pull current schema from database
npm run pull

# Compare with tracked migrations
SELECT * FROM __drizzle_migrations ORDER BY created_at;

# Verify table existence
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

**Resolution Process**:
1. **Backup Database**: Always create backup before fixing drift
2. **Schema Comparison**: Compare actual vs expected schema state
3. **Journal Verification**: Check migration tracking consistency
4. **Manual Alignment**: Align database state with migration history
5. **Regenerate Migration**: Create new migration for any remaining differences

### 2. Type Casting Issues

**Common Errors**:
```sql
-- Incorrect boolean casting
DEFAULT 'false' NOT NULL  -- Wrong
DEFAULT false NOT NULL    -- Correct

-- JSON type issues
'{"key": value}'::json     -- Wrong (unquoted value)
'{"key": "value"}'::json   -- Correct (quoted value)

-- Timestamp issues
DEFAULT NOW()              -- Wrong (function case)
DEFAULT now()              -- Correct (lowercase)
```

**Prevention**:
- Use Drizzle schema definitions for consistent types
- Test SQL syntax in database console before migration
- Validate JSON structures before insertion

### 3. Foreign Key Constraint Violations

**Symptoms**:
- Migration fails on foreign key creation
- Data insertion fails due to missing references
- Constraint violations during data migration

**Resolution**:
```bash
# Check for orphaned records
SELECT * FROM child_table c 
LEFT JOIN parent_table p ON c.parent_id = p.id 
WHERE p.id IS NULL;

# Fix data integrity before applying constraints
UPDATE child_table SET parent_id = 'default_parent_id' 
WHERE parent_id NOT IN (SELECT id FROM parent_table);

# Apply migration after data cleanup
npm run migrate
```

### 4. Migration Order Dependencies

**Issue**: Migrations applied out of order or with missing dependencies

**Prevention**:
```bash
# Check migration order
SELECT id, created_at FROM __drizzle_migrations ORDER BY created_at;

# Verify all previous migrations applied
npm run check

# Apply missing migrations in correct order
npm run up
```

---

## Prevention Strategies

### Pre-Migration Verification Checklist

```bash
# 1. Verify database connectivity (see Database Configuration Guide for SSL/timeout issues)
npm run db:health-check

# 2. Check current schema state
npm run introspect

# 3. Verify migration journal consistency
npm run check

# 4. Backup database
npm run db:backup

# 5. Test migration on development database
npm run migrate:test

# 6. Validate migration SQL syntax
npm run migrate:validate
```

> **Note**: For connection timeouts, SSL errors, or Drizzle Kit configuration issues, refer to the comprehensive [Database Configuration Guide](../database/DATABASE_CONFIGURATION.md) for detailed troubleshooting steps.

### Database State Monitoring

**Daily Checks**:
```bash
# Schema consistency check
npm run verify:schema

# Migration journal verification
SELECT COUNT(*) FROM __drizzle_migrations;

# Table count verification
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public';
```

**Weekly Audits**:
- Compare development and production schema
- Verify all migrations documented
- Check for orphaned migration files
- Validate database performance after migrations

### Safe Migration Practices

**Development Environment**:
1. **Never Skip Testing**: Always test migrations on development database first
2. **Use Transactions**: Wrap complex migrations in transactions when possible
3. **Small Batches**: Break large migrations into smaller, reversible steps
4. **Document Changes**: Record all manual interventions and fixes

**Production Environment**:
1. **Maintenance Windows**: Schedule migrations during low-traffic periods
2. **Rollback Plans**: Prepare rollback procedures for each migration
3. **Monitoring**: Monitor database performance during and after migrations
4. **Communication**: Notify team before applying production migrations

---

## Recovery Procedures

### Emergency Migration Rollback

**Immediate Rollback** (if safe):
```bash
# Stop application
npm run stop

# Rollback to previous migration
npm run migrate:rollback

# Restart application
npm run start

# Verify system health
npm run health-check
```

**Manual Recovery** (complex cases):
```sql
-- Remove failed migration from journal
DELETE FROM __drizzle_migrations 
WHERE name = 'failed_migration_name';

-- Revert schema changes manually
DROP TABLE IF EXISTS new_table;
ALTER TABLE existing_table DROP COLUMN IF EXISTS new_column;

-- Re-apply previous state
-- (Use backup or manual SQL commands)
```

### Data Recovery After Failed Migration

**Recovery Steps**:
1. **Assess Damage**: Determine what data was affected
2. **Restore from Backup**: Use most recent clean backup
3. **Replay Transactions**: Apply necessary changes since backup
4. **Verify Integrity**: Run comprehensive data validation
5. **Monitor System**: Watch for cascading issues

**Validation Queries**:
```sql
-- Check table counts
SELECT table_name, 
       (SELECT COUNT(*) FROM table_name) as row_count
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Verify foreign key relationships
SELECT conname, conrelid::regclass, confrelid::regclass
FROM pg_constraint 
WHERE contype = 'f';

-- Check for data inconsistencies
-- (Custom queries based on your data model)
```

---

## Monitoring & Alerting

### Migration Health Checks

**Automated Monitoring**:
```bash
# Daily health check script
#!/bin/bash
set -e

echo "Checking database migration health..."

# Check database connectivity
npm run db:ping || exit 1

# Verify migration journal
MIGRATION_COUNT=$(npm run db:query "SELECT COUNT(*) FROM __drizzle_migrations" | tail -1)
echo "Migration count: $MIGRATION_COUNT"

# Check schema consistency
npm run verify:schema || exit 1

echo "Database migration health check passed"
```

**Alert Conditions**:
- Migration failures
- Schema drift detection
- Performance degradation after migrations
- Data integrity violations
- Journal inconsistencies

### Performance Monitoring

**Key Metrics**:
- Migration execution time
- Query performance before/after migrations
- Database size changes
- Index usage patterns
- Connection pool utilization

**Monitoring Tools**:
```bash
# Migration performance tracking
time npm run migrate

# Query performance analysis
EXPLAIN ANALYZE SELECT * FROM frequently_queried_table;

# Database size monitoring
SELECT pg_size_pretty(pg_database_size('database_name'));
```

---

## Documentation Standards

### Migration Documentation Requirements

**For Each Migration**:
1. **Purpose**: Clear description of what the migration does
2. **Dependencies**: List of required previous migrations
3. **Breaking Changes**: Any backwards incompatible changes
4. **Rollback Plan**: How to reverse the migration if needed
5. **Testing Steps**: How to verify the migration succeeded
6. **Performance Impact**: Expected impact on database performance

**Template**:
```sql
-- Migration: [NUMBER]_[DESCRIPTIVE_NAME]
-- Purpose: [Clear description of changes]
-- Dependencies: Requires migrations [LIST]
-- Breaking Changes: [YES/NO - describe if yes]
-- Rollback: [Steps to reverse migration]
-- Testing: [How to verify success]
-- Performance: [Expected impact]

-- Migration SQL here...
```

### Incident Documentation

**For Each Resolved Issue**:
- **Problem Description**: Detailed error symptoms
- **Root Cause**: Why the issue occurred
- **Resolution Steps**: Exact steps taken to fix
- **Prevention**: How to avoid in future
- **Lessons Learned**: Key takeaways for team

---

## Team Communication

### Migration Communication Protocol

**Before Major Migrations**:
1. **Announce Intent**: Notify team 24-48 hours before
2. **Review Changes**: Peer review of migration SQL
3. **Plan Timing**: Coordinate with deployment schedule
4. **Prepare Rollback**: Ensure rollback procedures ready

**During Migration Issues**:
1. **Immediate Notification**: Alert team to migration problems
2. **Status Updates**: Regular progress updates during resolution
3. **Documentation**: Record all troubleshooting steps
4. **Post-Resolution**: Share lessons learned with team

**Communication Channels**:
- **Slack**: Immediate alerts and status updates
- **Documentation**: Permanent record in this document
- **Standup**: Discussion in daily team meetings
- **Retrospectives**: Process improvements from migration issues

---

## Future Improvements

### Planned Enhancements

**Short Term** (Next 30 days):
- Automated schema drift detection
- Migration testing in CI/CD pipeline
- Enhanced error reporting and logging
- Database backup automation before migrations

**Medium Term** (Next 90 days):
- Migration performance profiling
- Rollback automation tools
- Schema versioning and tagging
- Integration with monitoring systems

**Long Term** (Next 6 months):
- Zero-downtime migration strategies
- Advanced data migration tools
- Multi-environment migration orchestration
- Comprehensive migration analytics

### Process Improvements

**Based on Migration 0009 Resolution**:
1. **Mandatory Schema Verification**: Never skip pre-migration checks
2. **Enhanced Documentation**: More detailed migration documentation
3. **Automated Testing**: Test all migrations in isolated environments
4. **Team Training**: Regular training on migration troubleshooting
5. **Tool Enhancement**: Improve migration tooling and error handling

---

## Support & Resources

### Internal Resources

- **Database Configuration Guide**: [`DATABASE_CONFIGURATION.md`](../database/DATABASE_CONFIGURATION.md) - SSL/connection configuration
- **Database Team**: Primary contact for migration issues
- **DevOps Team**: Infrastructure and deployment support
- **Development Team**: Application-level migration concerns

### External Resources

- **Drizzle ORM Documentation**: [https://orm.drizzle.team/](https://orm.drizzle.team/)
- **PostgreSQL Migration Best Practices**: [PostgreSQL Documentation](https://www.postgresql.org/)
- **Supabase Migration Guide**: [Supabase Docs](https://supabase.com/docs)

### Emergency Contacts

**Critical Migration Failures**:
1. **Primary**: Database Administrator
2. **Secondary**: Lead Developer
3. **Escalation**: Technical Lead

**Response Times**:
- **Critical Issues**: 30 minutes
- **High Priority**: 2 hours
- **Medium Priority**: 8 hours
- **Low Priority**: 24 hours

---

**Document Status**: 📋 **Active** - Contains resolved migration procedures and prevention strategies  
**Coverage**: Complete migration error resolution with real-world examples  
**Maintenance**: Updated after each significant migration issue resolution  
**Team Access**: All developers should reference this document before applying migrations

**Last Updated**: January 25, 2025 - Migration 0009 error resolution documented