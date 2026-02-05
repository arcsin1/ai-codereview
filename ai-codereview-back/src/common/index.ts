/**
 * Common Module Entry Point
 *
 * IMPORTANT:
 * To avoid circular dependencies and namespace pollution, use named imports
 *
 * @example
 * // Correct import style
 * import { TokenCounterUtil } from '@/common/utils/token-counter.util';
 * import { PlatformType } from '@/common/constants/enums';
 *
 * // Avoid using (unless necessary)
 * import * from '@/common';
 * import { ... } from '@/common';
 */

// Re-export most commonly used enum types
export * from './constants/enums';
export * from './services';
