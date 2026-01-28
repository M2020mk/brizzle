import * as path from "path";

/**
 * Logger utility for CLI output with colored messages.
 *
 * Provides methods for logging file operations and messages with
 * appropriate colors and formatting for terminal output.
 *
 * Colors:
 * - Green: create (new file)
 * - Yellow: force, skip, not found, warn
 * - Red: remove, error
 * - Cyan: dry-run operations (would create, would force, would remove)
 */
export const log = {
  /** Log file creation (green) */
  create: (filePath: string) => {
    const relative = path.relative(process.cwd(), filePath);
    console.log(`      \x1b[32mcreate\x1b[0m  ${relative}`);
  },

  /** Log file overwrite with --force (yellow) */
  force: (filePath: string) => {
    const relative = path.relative(process.cwd(), filePath);
    console.log(`       \x1b[33mforce\x1b[0m  ${relative}`);
  },

  /** Log file skip (exists, no --force) (yellow) */
  skip: (filePath: string) => {
    const relative = path.relative(process.cwd(), filePath);
    console.log(`        \x1b[33mskip\x1b[0m  ${relative}`);
  },

  /** Log file/directory removal (red) */
  remove: (filePath: string) => {
    const relative = path.relative(process.cwd(), filePath);
    console.log(`      \x1b[31mremove\x1b[0m  ${relative}`);
  },

  /** Log file not found (yellow) */
  notFound: (filePath: string) => {
    const relative = path.relative(process.cwd(), filePath);
    console.log(`   \x1b[33mnot found\x1b[0m  ${relative}`);
  },

  /** Log dry-run file creation (cyan) */
  wouldCreate: (filePath: string) => {
    const relative = path.relative(process.cwd(), filePath);
    console.log(`\x1b[36mwould create\x1b[0m  ${relative}`);
  },

  /** Log dry-run file overwrite (cyan) */
  wouldForce: (filePath: string) => {
    const relative = path.relative(process.cwd(), filePath);
    console.log(` \x1b[36mwould force\x1b[0m  ${relative}`);
  },

  /** Log dry-run file removal (cyan) */
  wouldRemove: (filePath: string) => {
    const relative = path.relative(process.cwd(), filePath);
    console.log(`\x1b[36mwould remove\x1b[0m  ${relative}`);
  },

  /** Log error message (red) */
  error: (message: string) => {
    console.error(`\x1b[31mError:\x1b[0m ${message}`);
  },

  /** Log warning message (yellow) */
  warn: (message: string) => {
    console.warn(`\x1b[33mWarning:\x1b[0m ${message}`);
  },

  /** Log info message (no color) */
  info: (message: string) => {
    console.log(message);
  },
};
