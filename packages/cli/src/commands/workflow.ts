/**
 * Workflow commands - Multi-agent workflow orchestration
 */

import chalk from 'chalk';
import * as readline from 'readline';
import {
  WorkflowEngine,
  listTemplates,
  getTemplate,
  type WorkflowDefinition,
  type WorkflowExecution,
} from '@gicm/workflow-engine';

interface WorkflowOptions {
  verbose?: boolean;
  dryRun?: boolean;
  input?: string;
  template?: string;
}

const engine = new WorkflowEngine();

/**
 * Create a new workflow
 */
export async function workflowCreateCommand(
  name: string,
  options: WorkflowOptions
): Promise<void> {
  console.log(chalk.cyan(`\n Creating workflow: "${name}"\n`));

  // Check if using template
  if (options.template) {
    const template = getTemplate(options.template);
    if (!template) {
      const available = listTemplates().map((t) => t.name).join(', ');
      throw new Error(`Template "${options.template}" not found. Available: ${available}`);
    }

    const workflow = await engine.createWorkflow({
      ...template,
      name: name || template.name,
    });

    console.log(chalk.green(`  ✓ Created workflow from template "${options.template}"`));
    printWorkflow(workflow, options.verbose);
    return;
  }

  // Interactive creation
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt: string): Promise<string> =>
    new Promise((resolve) => rl.question(prompt, resolve));

  try {
    const description = await question(chalk.cyan('  Description: '));
    const stepsCount = parseInt(await question(chalk.cyan('  Number of steps: ')), 10) || 1;

    const steps: { agent: string; input: Record<string, unknown>; dependsOn?: string[] }[] = [];

    for (let i = 0; i < stepsCount; i++) {
      console.log(chalk.gray(`\n  Step ${i + 1}:`));
      const agent = await question(chalk.cyan('    Agent ID: '));
      const inputStr = await question(chalk.cyan('    Input (JSON, optional): '));
      const depsStr = await question(chalk.cyan('    Depends on (comma-separated step IDs): '));

      steps.push({
        agent,
        input: inputStr ? JSON.parse(inputStr) : {},
        dependsOn: depsStr ? depsStr.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
      });
    }

    rl.close();

    const workflow = await engine.createWorkflow({
      name,
      description,
      steps,
    });

    console.log(chalk.green(`\n  ✓ Created workflow "${name}" with ${steps.length} steps`));
    printWorkflow(workflow, options.verbose);
  } catch (error) {
    rl.close();
    throw error;
  }
}

/**
 * List workflows
 */
export async function workflowListCommand(options: WorkflowOptions): Promise<void> {
  console.log(chalk.cyan('\n Workflows:\n'));

  const workflows = await engine.listWorkflows();

  if (workflows.length === 0) {
    console.log(chalk.gray('  No workflows found.\n'));
    console.log(`  Create one with: ${chalk.cyan('gicm workflow create <name>')}`);
    console.log(`  Or from template: ${chalk.cyan('gicm workflow create <name> --template audit-deploy')}\n`);

    // Show available templates
    console.log(chalk.cyan('  Available templates:'));
    for (const template of listTemplates()) {
      console.log(`    ${chalk.white(template.name)} - ${chalk.gray(template.description)}`);
    }
    console.log('');
    return;
  }

  for (const workflow of workflows) {
    printWorkflow(workflow, options.verbose);
  }
}

/**
 * Run a workflow
 */
export async function workflowRunCommand(
  nameOrId: string,
  options: WorkflowOptions
): Promise<void> {
  console.log(chalk.cyan(`\n Running workflow: "${nameOrId}"${options.dryRun ? ' (dry run)' : ''}\n`));

  // Parse input if provided
  let input: Record<string, unknown> | undefined;
  if (options.input) {
    try {
      input = JSON.parse(options.input);
    } catch {
      throw new Error(`Invalid JSON input: ${options.input}`);
    }
  }

  // Set up event listeners for progress
  engine.on('stepStarted', (stepId) => {
    console.log(chalk.gray(`  ▶ Step "${stepId}" started...`));
  });

  engine.on('stepCompleted', (result) => {
    console.log(chalk.green(`  ✓ Step "${result.stepId}" completed (${result.duration}ms)`));
  });

  engine.on('stepFailed', (result) => {
    console.log(chalk.red(`  ✗ Step "${result.stepId}" failed: ${result.error}`));
  });

  const execution = await engine.runWorkflow({
    workflowName: nameOrId,
    workflowId: nameOrId,
    input,
    dryRun: options.dryRun,
  });

  console.log('');
  printExecution(execution, options.verbose);
}

/**
 * Get workflow status
 */
export async function workflowStatusCommand(
  id: string | undefined,
  options: WorkflowOptions
): Promise<void> {
  if (id) {
    // Show specific execution
    const execution = await engine.getExecution(id);
    if (!execution) {
      throw new Error(`Execution "${id}" not found`);
    }
    console.log(chalk.cyan(`\n Execution ${id}:\n`));
    printExecution(execution, options.verbose);
  } else {
    // Show recent executions
    console.log(chalk.cyan('\n Recent Executions:\n'));
    const executions = await engine.listExecutions(undefined, 10);

    if (executions.length === 0) {
      console.log(chalk.gray('  No executions found.\n'));
      return;
    }

    for (const execution of executions) {
      printExecution(execution, options.verbose);
    }
  }
}

/**
 * Show workflow history
 */
export async function workflowHistoryCommand(options: WorkflowOptions): Promise<void> {
  console.log(chalk.cyan('\n Workflow Execution History:\n'));

  const executions = await engine.listExecutions(undefined, 50);

  if (executions.length === 0) {
    console.log(chalk.gray('  No execution history found.\n'));
    return;
  }

  // Group by workflow
  const byWorkflow = new Map<string, WorkflowExecution[]>();
  for (const exec of executions) {
    const list = byWorkflow.get(exec.workflowName) || [];
    list.push(exec);
    byWorkflow.set(exec.workflowName, list);
  }

  for (const [workflowName, execs] of byWorkflow) {
    console.log(chalk.white(`  ${workflowName}:`));

    for (const exec of execs.slice(0, 5)) {
      const statusColor = exec.status === 'completed' ? chalk.green : exec.status === 'failed' ? chalk.red : chalk.yellow;
      const duration = exec.duration ? `${exec.duration}ms` : 'running';
      console.log(`    ${statusColor(exec.status.padEnd(10))} ${exec.id}  ${chalk.gray(exec.startedAt)}  ${chalk.gray(duration)}`);
    }

    if (execs.length > 5) {
      console.log(chalk.gray(`    ... and ${execs.length - 5} more`));
    }
    console.log('');
  }
}

/**
 * Delete a workflow
 */
export async function workflowDeleteCommand(id: string): Promise<void> {
  const deleted = await engine.deleteWorkflow(id);
  if (deleted) {
    console.log(chalk.green(`\n  ✓ Deleted workflow "${id}"\n`));
  } else {
    throw new Error(`Workflow "${id}" not found`);
  }
}

/**
 * List available templates
 */
export async function workflowTemplatesCommand(): Promise<void> {
  console.log(chalk.cyan('\n Workflow Templates:\n'));

  for (const template of listTemplates()) {
    const full = getTemplate(template.name);
    console.log(`  ${chalk.white(template.name)}`);
    console.log(`    ${chalk.gray(template.description)}`);

    if (full) {
      console.log(`    ${chalk.gray('Steps:')} ${full.steps.map((s) => s.agent).join(' → ')}`);
    }
    console.log('');
  }

  console.log(`  Use: ${chalk.cyan('gicm workflow create <name> --template <template-name>')}\n`);
}

// Helper functions

function printWorkflow(workflow: WorkflowDefinition, verbose?: boolean): void {
  console.log(`  ${chalk.white(workflow.name)} ${chalk.gray(`(${workflow.id})`)}`);
  if (workflow.description) {
    console.log(`    ${workflow.description}`);
  }
  console.log(`    ${chalk.gray('Steps:')} ${workflow.steps.map((s) => s.agent).join(' → ')}`);

  if (verbose) {
    console.log(`    ${chalk.gray('Created:')} ${workflow.createdAt}`);
    console.log(`    ${chalk.gray('Updated:')} ${workflow.updatedAt}`);
    console.log(`    ${chalk.gray('Version:')} ${workflow.version}`);

    for (const step of workflow.steps) {
      console.log(`    ${chalk.gray(`Step ${step.id}:`)} ${step.agent}`);
      if (step.dependsOn?.length) {
        console.log(`      ${chalk.gray('Depends on:')} ${step.dependsOn.join(', ')}`);
      }
      if (step.condition) {
        console.log(`      ${chalk.gray('Condition:')} ${step.condition}`);
      }
    }
  }
  console.log('');
}

function printExecution(execution: WorkflowExecution, verbose?: boolean): void {
  const statusColor =
    execution.status === 'completed' ? chalk.green :
    execution.status === 'failed' ? chalk.red :
    execution.status === 'running' ? chalk.yellow :
    chalk.gray;

  console.log(`  ${chalk.white(execution.workflowName)} ${chalk.gray(`[${execution.id}]`)}`);
  console.log(`    ${chalk.gray('Status:')} ${statusColor(execution.status)}`);
  console.log(`    ${chalk.gray('Started:')} ${execution.startedAt}`);

  if (execution.completedAt) {
    console.log(`    ${chalk.gray('Completed:')} ${execution.completedAt}`);
  }
  if (execution.duration) {
    console.log(`    ${chalk.gray('Duration:')} ${execution.duration}ms`);
  }
  if (execution.error) {
    console.log(`    ${chalk.red('Error:')} ${execution.error}`);
  }

  if (verbose && execution.stepResults.length > 0) {
    console.log(`    ${chalk.gray('Steps:')}`);
    for (const result of execution.stepResults) {
      const stepStatus =
        result.status === 'completed' ? chalk.green('✓') :
        result.status === 'failed' ? chalk.red('✗') :
        result.status === 'skipped' ? chalk.yellow('○') :
        chalk.gray('?');
      console.log(`      ${stepStatus} ${result.stepId} (${result.duration || 0}ms)`);
      if (result.error) {
        console.log(`        ${chalk.red(result.error)}`);
      }
    }
  }

  if (verbose && execution.output) {
    console.log(`    ${chalk.gray('Output:')}`);
    console.log(`      ${JSON.stringify(execution.output, null, 2).replace(/\n/g, '\n      ')}`);
  }

  console.log('');
}
