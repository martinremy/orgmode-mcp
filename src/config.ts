import { readFileSync } from 'fs';
import { resolve, isAbsolute, dirname } from 'path';
import { homedir } from 'os';
import fg from 'fast-glob';
import { z } from 'zod';

/**
 * Schema for the configuration file
 */
const ConfigSchema = z.object({
  orgFiles: z.array(z.string()).min(1, 'At least one org file path must be specified'),
});

export type Config = z.infer<typeof ConfigSchema>;

/**
 * Validation result for configuration
 */
export interface ConfigValidationResult {
  isValid: boolean;
  config?: Config;
  expandedPaths?: string[];
  errors: string[];
  warnings: string[];
}

/**
 * Load and validate the configuration file from the project root
 *
 * @param configPath Path to the config.json file (defaults to ./config.json)
 * @returns Validation result with expanded file paths
 */
export function loadConfig(configPath: string = './config.json'): ConfigValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Resolve the config path
  const resolvedPath = resolve(configPath);

  // Try to read the config file
  let rawConfig: unknown;
  try {
    const fileContent = readFileSync(resolvedPath, 'utf-8');
    rawConfig = JSON.parse(fileContent);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      errors.push(`Configuration file not found at: ${resolvedPath}`);
    } else if (error instanceof SyntaxError) {
      errors.push(`Invalid JSON in configuration file: ${error.message}`);
    } else {
      errors.push(`Error reading configuration file: ${(error as Error).message}`);
    }
    return { isValid: false, errors, warnings };
  }

  // Validate the structure
  const parseResult = ConfigSchema.safeParse(rawConfig);
  if (!parseResult.success) {
    errors.push('Configuration validation failed:');
    parseResult.error.errors.forEach(err => {
      errors.push(`  - ${err.path.join('.')}: ${err.message}`);
    });
    return { isValid: false, errors, warnings };
  }

  const config = parseResult.data;

  // Expand glob patterns and collect all matching files
  const expandedPaths: string[] = [];
  const configDir = dirname(resolvedPath);

  for (const pattern of config.orgFiles) {
    try {
      // Expand tilde (~) to home directory
      let expandedPattern = pattern.startsWith('~/')
        ? pattern.replace(/^~/, homedir())
        : pattern;

      // If it's an absolute path, use it as-is; otherwise resolve relative to config file
      const searchPattern = isAbsolute(expandedPattern) ? expandedPattern : resolve(configDir, expandedPattern);

      // Use fast-glob to expand the pattern
      const matches = fg.sync(searchPattern, {
        absolute: true,
        onlyFiles: true,
        dot: false,
      });

      if (matches.length === 0) {
        warnings.push(`No files found matching pattern: ${pattern}`);
      } else {
        expandedPaths.push(...matches);
      }
    } catch (error) {
      warnings.push(`Error expanding pattern "${pattern}": ${(error as Error).message}`);
    }
  }

  // Check if any files were found
  if (expandedPaths.length === 0) {
    errors.push('No org files found matching the specified patterns');
    return { isValid: false, config, errors, warnings };
  }

  // Remove duplicates (in case patterns overlap)
  const uniquePaths = Array.from(new Set(expandedPaths));

  return {
    isValid: true,
    config,
    expandedPaths: uniquePaths,
    errors,
    warnings,
  };
}

/**
 * Validate configuration and log results
 * Throws an error if configuration is invalid
 *
 * @param configPath Path to the config.json file
 * @returns Array of expanded file paths
 */
export function validateAndLoadConfig(configPath?: string): string[] {
  const result = loadConfig(configPath);

  // Log warnings
  if (result.warnings.length > 0) {
    console.warn('Configuration warnings:');
    result.warnings.forEach(warning => console.warn(`  ⚠️  ${warning}`));
  }

  // Handle errors
  if (!result.isValid || result.errors.length > 0) {
    console.error('Configuration errors:');
    result.errors.forEach(error => console.error(`  ❌ ${error}`));
    throw new Error('Invalid configuration. Please check config.json');
  }

  // Log success
  console.log(`✅ Configuration loaded successfully`);
  console.log(`   Found ${result.expandedPaths!.length} org file(s):`);
  result.expandedPaths!.forEach(path => console.log(`   - ${path}`));

  return result.expandedPaths!;
}
