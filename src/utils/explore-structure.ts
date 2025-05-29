/**
 * explore-structure.ts
 * 
 * Utility functions for exploring object structures and nested properties.
 * Useful for debugging and understanding complex object hierarchies.
 */

/**
 * Configuration options for object exploration
 */
export interface ExploreOptions {
  /** Maximum depth to explore (default: 2) */
  maxDepth?: number;
  /** Whether to show function signatures (default: false) */
  showFunctionDetails?: boolean;
  /** Whether to include non-enumerable properties (default: false) */
  includeNonEnumerable?: boolean;
}

/**
 * Explores the structure of an object recursively up to a specified depth
 * @param obj - The object to explore
 * @param options - Configuration options for exploration
 * @returns A structured representation of the object
 */
export const exploreObjectStructure = (
  obj: any, 
  options: ExploreOptions = {}
): any => {
  const {
    maxDepth = 2,
    showFunctionDetails = false,
    includeNonEnumerable = false
  } = options;

  const explore = (
    item: any, 
    currentDepth: number = 0, 
    visited = new Set()
  ): any => {
    // Stop if max depth reached or item is null/undefined
    if (currentDepth >= maxDepth || item === null || item === undefined) {
      return typeof item;
    }

    // Avoid circular references
    if (typeof item === 'object' && visited.has(item)) {
      return '[Circular Reference]';
    }

    if (typeof item === 'object') {
      visited.add(item);
      const result: any = {};
      
      // Get properties (enumerable and optionally non-enumerable)
      const properties = includeNonEnumerable 
        ? Object.getOwnPropertyNames(item)
        : Object.keys(item);
      
      properties.forEach(key => {
        try {
          const value = item[key];
          
          if (typeof value === 'function') {
            if (showFunctionDetails) {
              // Extract function signature
              const funcStr = value.toString();
              const match = funcStr.match(/^[^{]*/);
              result[key] = `[Function] ${match ? match[0].trim() : ''}`;
            } else {
              result[key] = '[Function]';
            }
          } else if (typeof value === 'object' && value !== null) {
            result[key] = explore(value, currentDepth + 1, new Set(visited));
          } else {
            result[key] = typeof value;
          }
        } catch (error) {
          result[key] = '[Error accessing property]';
        }
      });
      
      visited.delete(item);
      return result;
    }

    return typeof item;
  };

  return explore(obj);
};

/**
 * Convenience function for exploring client objects specifically
 * @param client - The client object to explore
 * @param depth - Maximum depth to explore (default: 2)
 * @returns Structured representation of the client
 */
export const exploreClientStructure = (client: any, depth: number = 2): any => {
  return exploreObjectStructure(client, { 
    maxDepth: depth,
    showFunctionDetails: false,
    includeNonEnumerable: false 
  });
};

/**
 * Creates a summary of object structure with counts
 * @param obj - The object to summarise
 * @returns Summary with counts of different property types
 */
export const summariseObjectStructure = (obj: any): {
  totalProperties: number;
  functions: number;
  objects: number;
  primitives: number;
  arrays: number;
} => {
  const summary = {
    totalProperties: 0,
    functions: 0,
    objects: 0,
    primitives: 0,
    arrays: 0
  };

  const analyse = (item: any, visited = new Set()): void => {
    if (item === null || item === undefined || visited.has(item)) {
      return;
    }

    if (typeof item === 'object') {
      visited.add(item);
      
      Object.keys(item).forEach(key => {
        summary.totalProperties++;
        const value = item[key];
        
        if (typeof value === 'function') {
          summary.functions++;
        } else if (Array.isArray(value)) {
          summary.arrays++;
        } else if (typeof value === 'object' && value !== null) {
          summary.objects++;
          analyse(value, visited);
        } else {
          summary.primitives++;
        }
      });
    }
  };

  analyse(obj);
  return summary;
};
