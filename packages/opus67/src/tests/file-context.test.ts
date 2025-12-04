/**
 * OPUS 67 v5.0 - Phase 2B: File-Aware Memory System Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FileContextManager } from '../brain/file-context.js';

describe('FileContextManager', () => {
  let manager: FileContextManager;

  beforeEach(() => {
    manager = new FileContextManager({
      maxFiles: 100,
      enableAutoSummary: true,
      enableRelationshipTracking: true,
      enableConsistencyChecks: true,
    });
  });

  describe('File Tracking', () => {
    it('should track a new file access', async () => {
      const content = `
        export function hello() {
          return 'world';
        }
      `;

      const metadata = await manager.accessFile('src/utils.ts', content);

      expect(metadata.path).toBe('src/utils.ts');
      expect(metadata.language).toBe('typescript');
      expect(metadata.accessCount).toBe(1);
      expect(metadata.functions).toContain('hello');
    });

    it('should increment access count on repeated access', async () => {
      const content = 'export const x = 1;';

      await manager.accessFile('src/constants.ts', content);
      const metadata = await manager.accessFile('src/constants.ts', content);

      expect(metadata.accessCount).toBe(2);
    });

    it('should detect file modification', async () => {
      const original = 'export const x = 1;';
      const modified = 'export const x = 2;';

      await manager.accessFile('src/constants.ts', original);
      const metadata = await manager.modifyFile(
        'src/constants.ts',
        modified,
        'Updated value',
        1
      );

      expect(metadata.lastEdit).toBeDefined();
      expect(metadata.lastEdit?.description).toBe('Updated value');
      expect(metadata.lastEdit?.linesChanged).toBe(1);
    });

    it('should delete file and clean up relationships', async () => {
      await manager.accessFile('src/index.ts', 'export * from "./utils";');
      await manager.accessFile('src/utils.ts', 'export const x = 1;');

      manager.deleteFile('src/utils.ts');

      expect(manager.getFile('src/utils.ts')).toBeUndefined();
      const related = manager.getRelatedFiles('src/index.ts');
      expect(related.size).toBe(0);
    });
  });

  describe('Code Analysis', () => {
    it('should extract TypeScript imports', async () => {
      const content = `
        import { foo } from './foo';
        import bar from '../bar';
        import type { Baz } from './types';
      `;

      const metadata = await manager.accessFile('src/index.ts', content);

      expect(metadata.imports).toContain('./foo');
      expect(metadata.imports).toContain('../bar');
      expect(metadata.imports).toContain('./types');
    });

    it('should extract exports', async () => {
      const content = `
        export const FOO = 'foo';
        export function bar() {}
        export class Baz {}
        export type MyType = string;
        export { internal as external };
      `;

      const metadata = await manager.accessFile('src/exports.ts', content);

      expect(metadata.exports).toContain('FOO');
      expect(metadata.exports).toContain('bar');
      expect(metadata.exports).toContain('Baz');
      expect(metadata.exports).toContain('MyType');
      expect(metadata.exports).toContain('internal');
    });

    it('should extract functions', async () => {
      const content = `
        function regular() {}
        const arrow = () => {};
        async function asyncFunc() {}
        const asyncArrow = async () => {};
      `;

      const metadata = await manager.accessFile('src/functions.ts', content);

      expect(metadata.functions.length).toBeGreaterThan(0);
      expect(metadata.functions).toContain('regular');
      expect(metadata.functions).toContain('arrow');
    });

    it('should extract classes', async () => {
      const content = `
        class MyClass {}
        export class PublicClass {}
        abstract class BaseClass {}
      `;

      const metadata = await manager.accessFile('src/classes.ts', content);

      expect(metadata.classes).toContain('MyClass');
      expect(metadata.classes).toContain('PublicClass');
      expect(metadata.classes).toContain('BaseClass');
    });

    it('should extract types and interfaces', async () => {
      const content = `
        type StringOrNumber = string | number;
        interface User {
          name: string;
        }
        export type Result<T> = T | Error;
      `;

      const metadata = await manager.accessFile('src/types.ts', content);

      expect(metadata.types).toContain('StringOrNumber');
      expect(metadata.types).toContain('User');
      expect(metadata.types).toContain('Result');
    });

    it('should detect Python syntax', async () => {
      const content = `
        def hello():
            return "world"

        class MyClass:
            pass
      `;

      const metadata = await manager.accessFile('src/module.py', content);

      expect(metadata.language).toBe('python');
      expect(metadata.functions).toContain('hello');
      expect(metadata.classes).toContain('MyClass');
    });

    it('should generate file summary', async () => {
      const content = `
        export class UserService {
          getUser() {}
          createUser() {}
        }
        export type User = { id: string; name: string };
      `;

      const metadata = await manager.accessFile('src/user-service.ts', content);

      expect(metadata.summary).toBeDefined();
      expect(metadata.summary).toContain('class');
      expect(metadata.summary).toContain('UserService');
    });
  });

  describe('Relationship Tracking', () => {
    it('should build dependencies from imports', async () => {
      await manager.accessFile('src/utils.ts', 'export const x = 1;');
      await manager.accessFile('src/index.ts', 'import { x } from "./utils";');

      const indexMeta = manager.getFile('src/index.ts');
      expect(indexMeta?.dependencies.size).toBe(1);
      expect(indexMeta?.dependencies.has('src/utils.ts')).toBe(true);
    });

    it('should track dependents', async () => {
      await manager.accessFile('src/utils.ts', 'export const x = 1;');
      await manager.accessFile('src/index.ts', 'import { x } from "./utils";');

      const utilsMeta = manager.getFile('src/utils.ts');
      expect(utilsMeta?.dependents.size).toBe(1);
      expect(utilsMeta?.dependents.has('src/index.ts')).toBe(true);
    });

    it('should get relationships for a file', async () => {
      await manager.accessFile('src/utils.ts', 'export const x = 1;');
      await manager.accessFile('src/index.ts', 'import { x } from "./utils";');

      const relationships = manager.getRelationships('src/index.ts');

      expect(relationships.length).toBeGreaterThan(0);
      expect(relationships[0].type).toBe('imports');
      expect(relationships[0].from).toBe('src/index.ts');
      expect(relationships[0].to).toBe('src/utils.ts');
    });

    it('should get related files up to max depth', async () => {
      // Create chain: a -> b -> c
      await manager.accessFile('src/c.ts', 'export const z = 3;');
      await manager.accessFile('src/b.ts', 'import { z } from "./c"; export const y = 2;');
      await manager.accessFile('src/a.ts', 'import { y } from "./b"; export const x = 1;');

      const related = manager.getRelatedFiles('src/a.ts', 2);

      expect(related.has('src/b.ts')).toBe(true);
      expect(related.has('src/c.ts')).toBe(true);
    });

    it('should emit relationship:discovered events', async () => {
      let discovered = false;

      manager.once('relationship:discovered', (rel) => {
        discovered = true;
        expect(rel.type).toBe('imports');
      });

      await manager.accessFile('src/utils.ts', 'export const x = 1;');
      await manager.accessFile('src/index.ts', 'import { x } from "./utils";');

      expect(discovered).toBe(true);
    });
  });

  describe('Consistency Checking', () => {
    it('should pass for valid file', async () => {
      await manager.accessFile('src/utils.ts', 'export const x = 1;');
      await manager.accessFile('src/index.ts', 'import { x } from "./utils";');

      const check = await manager.checkConsistency('src/index.ts');

      expect(check.passed).toBe(true);
      expect(check.errors.length).toBe(0);
    });

    it('should warn about broken imports', async () => {
      await manager.accessFile('src/index.ts', 'import { x } from "./missing";');

      const check = await manager.checkConsistency('src/index.ts');

      expect(check.passed).toBe(false);
      expect(check.warnings.some(w => w.includes('not found'))).toBe(true);
    });

    it('should suggest when file has no dependents', async () => {
      const content = 'export const unused = 1;';
      await manager.accessFile('src/unused.ts', content);

      const check = await manager.checkConsistency('src/unused.ts');

      expect(check.suggestions.some(s => s.includes('no dependents'))).toBe(true);
    });

    it('should detect circular dependencies', async () => {
      // Create cycle: a -> b -> c -> a
      // Load in reverse order so imports can be resolved
      await manager.accessFile('src/c.ts', 'import "./a"; export const c = 3;');
      await manager.accessFile('src/b.ts', 'import "./c"; export const b = 2;');
      await manager.accessFile('src/a.ts', 'import "./b"; export const a = 1;');

      // a imports b, b imports c, c imports a = circular!
      const check = await manager.checkConsistency('src/a.ts');

      // Should detect the cycle
      expect(check.passed).toBe(false);
      expect(check.warnings.some(w => w.includes('Circular'))).toBe(true);
    });

    it('should emit consistency:warning events', async () => {
      let warningEmitted = false;

      manager.once('consistency:warning', (check) => {
        warningEmitted = true;
        expect(check.warnings.length).toBeGreaterThan(0);
      });

      await manager.accessFile('src/broken.ts', 'import { x } from "./missing";');
      await manager.modifyFile('src/broken.ts', 'import { x } from "./missing";', 'Test', 0);

      expect(warningEmitted).toBe(true);
    });
  });

  describe('Query API', () => {
    beforeEach(async () => {
      await manager.accessFile('src/utils.ts', 'export const x = 1;');
      await manager.accessFile('src/types.ts', 'export type User = {};');
      await manager.accessFile('src/index.ts', 'import "./utils";');
    });

    it('should get all files', () => {
      const files = manager.getAllFiles();
      expect(files.length).toBe(3);
    });

    it('should get session files', () => {
      const sessionFiles = manager.getSessionFiles();
      expect(sessionFiles.length).toBe(3);
    });

    it('should search files by pattern', () => {
      const results = manager.searchFiles(/utils/);
      expect(results.length).toBe(1);
      expect(results[0].path).toBe('src/utils.ts');
    });

    it('should search files by string pattern', () => {
      const results = manager.searchFiles('types');
      expect(results.length).toBe(1);
      expect(results[0].path).toBe('src/types.ts');
    });

    it('should get modified files', async () => {
      await manager.modifyFile('src/utils.ts', 'export const x = 2;', 'Update', 1);

      const modified = manager.getModifiedFiles();
      expect(modified.length).toBe(1);
      expect(modified[0].path).toBe('src/utils.ts');
    });

    it('should get statistics', () => {
      const stats = manager.getStats();

      expect(stats.totalFiles).toBe(3);
      expect(stats.sessionFiles).toBe(3);
      expect(stats.languages.typescript).toBe(3);
    });

    it('should clear all context', () => {
      manager.clear();

      const stats = manager.getStats();
      expect(stats.totalFiles).toBe(0);
      expect(stats.sessionFiles).toBe(0);
    });
  });

  describe('Event Emissions', () => {
    it('should emit file:accessed event', async () => {
      let emitted = false;

      manager.once('file:accessed', (path) => {
        emitted = true;
        expect(path).toBe('src/test.ts');
      });

      await manager.accessFile('src/test.ts', 'export const x = 1;');
      expect(emitted).toBe(true);
    });

    it('should emit file:modified event', async () => {
      let emitted = false;

      manager.once('file:modified', (path, metadata) => {
        emitted = true;
        expect(path).toBe('src/test.ts');
        expect(metadata.lastEdit).toBeDefined();
      });

      await manager.accessFile('src/test.ts', 'export const x = 1;');
      await manager.modifyFile('src/test.ts', 'export const x = 2;', 'Update', 1);

      expect(emitted).toBe(true);
    });

    it('should emit file:deleted event', async () => {
      let emitted = false;

      manager.once('file:deleted', (path) => {
        emitted = true;
        expect(path).toBe('src/test.ts');
      });

      await manager.accessFile('src/test.ts', 'export const x = 1;');
      manager.deleteFile('src/test.ts');

      expect(emitted).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty file content', async () => {
      const metadata = await manager.accessFile('src/empty.ts', '');

      expect(metadata.size).toBe(0);
      expect(metadata.imports).toEqual([]);
      expect(metadata.exports).toEqual([]);
    });

    it('should handle complex import paths', async () => {
      const content = `
        import { a } from '@/utils';
        import { b } from '~/components';
        import { c } from '../../../shared';
      `;

      const metadata = await manager.accessFile('src/index.ts', content);

      expect(metadata.imports.length).toBeGreaterThan(0);
    });

    it('should normalize Windows paths', async () => {
      const metadata = await manager.accessFile('src\\windows\\path.ts', 'export const x = 1;');

      expect(metadata.path).toBe('src/windows/path.ts');
      expect(metadata.path).not.toContain('\\');
    });

    it('should handle non-existent file in checkConsistency', async () => {
      const check = await manager.checkConsistency('src/missing.ts');

      expect(check.passed).toBe(false);
      expect(check.errors).toContain('File not found in context');
    });

    it('should handle files with no imports or exports', async () => {
      const content = `
        const x = 1;
        console.log(x);
      `;

      const metadata = await manager.accessFile('src/standalone.ts', content);

      expect(metadata.imports).toEqual([]);
      expect(metadata.exports).toEqual([]);
      expect(metadata.dependencies.size).toBe(0);
    });
  });

  describe('Language-Specific Features', () => {
    it('should detect JavaScript files', async () => {
      const metadata = await manager.accessFile('src/module.js', 'export const x = 1;');
      expect(metadata.language).toBe('javascript');
    });

    it('should detect Rust files', async () => {
      const metadata = await manager.accessFile('src/lib.rs', 'pub fn hello() {}');
      expect(metadata.language).toBe('rust');
    });

    it('should detect Solidity files', async () => {
      const metadata = await manager.accessFile('contracts/Token.sol', 'contract Token {}');
      expect(metadata.language).toBe('solidity');
    });

    it('should extract Python imports', async () => {
      const content = `
        from typing import List
        import json
        from .utils import helper
      `;

      const metadata = await manager.accessFile('src/module.py', content);

      expect(metadata.imports).toContain('typing');
      expect(metadata.imports).toContain('.utils');
    });
  });
});
