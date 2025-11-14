/**
 * gICM CLI - Validate Command
 * Validate Claude Code project setup and installed items
 */

import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';

interface ValidateOptions {
  fix?: boolean;
  verbose?: boolean;
}

interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  fix?: () => Promise<void>;
}

export async function validateCommand(options: ValidateOptions) {
  console.log(chalk.bold('\n🔍 gICM Project Validation\n'));

  const issues: ValidationIssue[] = [];
  const claudeDir = path.join(process.cwd(), '.claude');

  // 1. Check .claude directory structure
  const structureCheck = ora('Validating directory structure...').start();
  try {
    const requiredDirs = ['agents', 'skills', 'commands', 'workflows', 'settings'];

    const claudeDirExists = await fs.pathExists(claudeDir);
    if (!claudeDirExists) {
      structureCheck.fail();
      issues.push({
        severity: 'error',
        category: 'Structure',
        message: '.claude directory not found',
        fix: async () => {
          await fs.ensureDir(claudeDir);
          for (const dir of requiredDirs) {
            await fs.ensureDir(path.join(claudeDir, dir));
          }
        },
      });
    } else {
      for (const dir of requiredDirs) {
        const dirPath = path.join(claudeDir, dir);
        const dirExists = await fs.pathExists(dirPath);

        if (!dirExists) {
          issues.push({
            severity: 'warning',
            category: 'Structure',
            message: `Missing directory: .claude/${dir}`,
            fix: async () => {
              await fs.ensureDir(dirPath);
            },
          });
        }
      }
      structureCheck.succeed();
    }
  } catch (error) {
    structureCheck.fail();
    issues.push({
      severity: 'error',
      category: 'Structure',
      message: `Directory validation failed: ${(error as Error).message}`,
    });
  }

  // 2. Check for CLAUDE.md
  const claudeMdCheck = ora('Checking CLAUDE.md...').start();
  try {
    const claudeMdPath = path.join(claudeDir, 'CLAUDE.md');
    const claudeMdExists = await fs.pathExists(claudeMdPath);

    if (!claudeMdExists) {
      claudeMdCheck.warn();
      issues.push({
        severity: 'warning',
        category: 'Configuration',
        message: 'CLAUDE.md not found (recommended for project context)',
      });
    } else {
      claudeMdCheck.succeed();
    }
  } catch (error) {
    claudeMdCheck.fail();
    issues.push({
      severity: 'error',
      category: 'Configuration',
      message: `CLAUDE.md check failed: ${(error as Error).message}`,
    });
  }

  // 3. Validate agent files
  const agentCheck = ora('Validating agent files...').start();
  try {
    const agentsDir = path.join(claudeDir, 'agents');
    const agentsDirExists = await fs.pathExists(agentsDir);

    if (agentsDirExists) {
      const agentFiles = await fs.readdir(agentsDir);
      const mdFiles = agentFiles.filter((file) => file.endsWith('.md'));

      for (const file of mdFiles) {
        const filePath = path.join(agentsDir, file);
        const content = await fs.readFile(filePath, 'utf-8');

        // Check for YAML frontmatter
        if (!content.startsWith('---')) {
          issues.push({
            severity: 'warning',
            category: 'Agents',
            message: `${file}: Missing YAML frontmatter`,
          });
        }

        // Check for required fields
        const requiredFields = ['name:', 'description:', 'tools:', 'model:'];
        for (const field of requiredFields) {
          if (!content.includes(field)) {
            issues.push({
              severity: 'warning',
              category: 'Agents',
              message: `${file}: Missing required field "${field}"`,
            });
          }
        }
      }

      agentCheck.succeed(`Found ${mdFiles.length} agent(s)`);
    } else {
      agentCheck.warn();
    }
  } catch (error) {
    agentCheck.fail();
    issues.push({
      severity: 'error',
      category: 'Agents',
      message: `Agent validation failed: ${(error as Error).message}`,
    });
  }

  // 4. Check for package.json
  const packageCheck = ora('Checking package.json...').start();
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJsonExists = await fs.pathExists(packageJsonPath);

    if (!packageJsonExists) {
      packageCheck.warn();
      issues.push({
        severity: 'warning',
        category: 'Configuration',
        message: 'package.json not found in project root',
      });
    } else {
      packageCheck.succeed();
    }
  } catch (error) {
    packageCheck.fail();
    issues.push({
      severity: 'error',
      category: 'Configuration',
      message: `package.json check failed: ${(error as Error).message}`,
    });
  }

  // 5. Check for duplicate IDs (if agents/skills exist)
  const duplicateCheck = ora('Checking for duplicate IDs...').start();
  try {
    const ids = new Set<string>();
    const duplicates: string[] = [];

    const checkDirectory = async (dirName: string) => {
      const dirPath = path.join(claudeDir, dirName);
      const dirExists = await fs.pathExists(dirPath);

      if (dirExists) {
        const files = await fs.readdir(dirPath);
        const mdFiles = files.filter((file) => file.endsWith('.md'));

        for (const file of mdFiles) {
          const filePath = path.join(dirPath, file);
          const content = await fs.readFile(filePath, 'utf-8');

          // Extract ID from frontmatter
          const nameMatch = content.match(/^name:\s*(.+)$/m);
          if (nameMatch) {
            const id = nameMatch[1].trim();
            if (ids.has(id)) {
              duplicates.push(`${dirName}/${file} (ID: ${id})`);
            } else {
              ids.add(id);
            }
          }
        }
      }
    };

    await checkDirectory('agents');
    await checkDirectory('skills');
    await checkDirectory('commands');

    if (duplicates.length > 0) {
      duplicateCheck.fail();
      duplicates.forEach((dup) => {
        issues.push({
          severity: 'error',
          category: 'Duplicates',
          message: `Duplicate ID found: ${dup}`,
        });
      });
    } else {
      duplicateCheck.succeed('No duplicate IDs found');
    }
  } catch (error) {
    duplicateCheck.fail();
    issues.push({
      severity: 'error',
      category: 'Duplicates',
      message: `Duplicate check failed: ${(error as Error).message}`,
    });
  }

  // Display results
  console.log(chalk.bold('\n📋 Validation Results:\n'));

  if (issues.length === 0) {
    console.log(chalk.green('✅ No issues found! Your project is valid.\n'));
    return;
  }

  // Group issues by severity
  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');
  const infos = issues.filter((i) => i.severity === 'info');

  if (errors.length > 0) {
    console.log(chalk.red.bold(`❌ Errors (${errors.length}):\n`));
    errors.forEach((issue) => {
      console.log(
        `  ${chalk.red('✗')} ${chalk.bold(issue.category)}: ${issue.message}`
      );
    });
  }

  if (warnings.length > 0) {
    console.log(chalk.yellow.bold(`\n⚠️  Warnings (${warnings.length}):\n`));
    warnings.forEach((issue) => {
      console.log(
        `  ${chalk.yellow('⚠')} ${chalk.bold(issue.category)}: ${issue.message}`
      );
    });
  }

  if (infos.length > 0) {
    console.log(chalk.blue.bold(`\nℹ️  Info (${infos.length}):\n`));
    infos.forEach((issue) => {
      console.log(
        `  ${chalk.blue('ℹ')} ${chalk.bold(issue.category)}: ${issue.message}`
      );
    });
  }

  // Attempt to fix issues if --fix flag is provided
  if (options.fix) {
    console.log(chalk.bold('\n🔧 Attempting to fix issues...\n'));

    const fixableIssues = issues.filter((issue) => issue.fix);
    if (fixableIssues.length === 0) {
      console.log(chalk.yellow('No auto-fixable issues found.\n'));
      return;
    }

    for (const issue of fixableIssues) {
      const spinner = ora(`Fixing: ${issue.message}`).start();
      try {
        if (issue.fix) {
          await issue.fix();
          spinner.succeed(`Fixed: ${issue.message}`);
        }
      } catch (error) {
        spinner.fail(`Failed to fix: ${issue.message}`);
        console.log(chalk.red(`  Error: ${(error as Error).message}`));
      }
    }

    console.log(chalk.green('\n✅ Auto-fix complete. Run validate again to check.\n'));
  } else {
    console.log(
      chalk.dim('\n💡 Run with --fix to automatically fix some issues.\n')
    );
  }

  // Exit with error code if critical issues found
  if (errors.length > 0) {
    process.exit(1);
  }
}
