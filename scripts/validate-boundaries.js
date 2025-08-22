#!/usr/bin/env node

/**
 * BOUNDARY VALIDATION SCRIPT
 * Validates Next.js 15 client/server boundary compliance
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const VIOLATIONS = [];
const SRC_DIR = path.join(__dirname, '..', 'src');

/**
 * Check if file has proper directive
 */
function checkFileDirectives(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const hasUseClient = content.includes("'use client'");
  const hasUseServer = content.includes("'use server'");
  const hasClerkServerImport = content.includes('@clerk/nextjs/server');
  const hasDbImport = content.includes('@/lib/database/connection');
  const hasAuthCall = content.includes('await auth()');

  // Check for violations
  if (
    hasClerkServerImport &&
    !hasUseServer &&
    !filePath.includes('/api/') &&
    !filePath.includes('page.tsx') &&
    !filePath.includes('layout.tsx')
  ) {
    VIOLATIONS.push({
      file: filePath,
      type: 'MISSING_USE_SERVER',
      description:
        'File imports @clerk/nextjs/server but missing "use server" directive',
    });
  }

  if (hasUseClient && (hasClerkServerImport || hasDbImport || hasAuthCall)) {
    VIOLATIONS.push({
      file: filePath,
      type: 'CLIENT_SERVER_MIX',
      description: 'Client file imports server-only modules',
    });
  }
}

/**
 * Check React Query patterns
 */
function checkReactQueryPatterns(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const hasUseQuery =
    content.includes('useQuery') || content.includes('useMutation');
  const hasDirectServerImport = content.match(
    /import.*from.*['"].*\/actions['"]/
  );

  if (
    hasUseQuery &&
    hasDirectServerImport &&
    !content.includes('dynamic import')
  ) {
    VIOLATIONS.push({
      file: filePath,
      type: 'STATIC_SERVER_IMPORT_IN_QUERY',
      description:
        'React Query hook has static server action import (should use dynamic import)',
    });
  }
}

/**
 * Main validation
 */
function validateBoundaries() {
  console.log('🔍 Validating Next.js client/server boundaries...\n');

  // Get all TypeScript files
  const files = glob.sync('**/*.{ts,tsx}', { cwd: SRC_DIR, absolute: true });

  files.forEach(file => {
    if (file.includes('node_modules') || file.includes('.next')) return;

    try {
      checkFileDirectives(file);
      checkReactQueryPatterns(file);
    } catch (error) {
      console.warn(`Warning: Could not read ${file}`);
    }
  });

  // Report results
  if (VIOLATIONS.length === 0) {
    console.log('✅ All boundary checks passed! No violations found.\n');
    return true;
  } else {
    console.log(`❌ Found ${VIOLATIONS.length} boundary violations:\n`);

    VIOLATIONS.forEach((violation, index) => {
      console.log(`${index + 1}. ${violation.type}`);
      console.log(`   File: ${path.relative(process.cwd(), violation.file)}`);
      console.log(`   Issue: ${violation.description}\n`);
    });

    return false;
  }
}

// Run validation
const isValid = validateBoundaries();
process.exit(isValid ? 0 : 1);
