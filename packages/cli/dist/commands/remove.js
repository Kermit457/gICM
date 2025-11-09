import chalk from 'chalk';
import ora from 'ora';
import prompts from 'prompts';
import { getInstalledItems, saveInstalledItems, deleteFile, fileExists } from '../utils/files.js';
export async function removeCommand(itemRef, options) {
    const spinner = ora();
    try {
        const slug = itemRef.includes('/') ? itemRef.split('/')[1] : itemRef;
        const installed = await getInstalledItems();
        const item = installed.find(i => i.slug === slug || i.id === slug);
        if (!item) {
            console.log(chalk.yellow(`Item not found: ${slug}`));
            console.log();
            console.log('View installed items with:', chalk.cyan('gicm list'));
            return;
        }
        console.log(chalk.bold(`Remove: ${item.name}`));
        console.log(chalk.gray(`Files: ${item.files.length} file(s)`));
        console.log();
        // Confirm removal
        if (!options.yes) {
            const response = await prompts({
                type: 'confirm',
                name: 'confirm',
                message: 'Remove this item?',
                initial: false
            });
            if (!response.confirm) {
                console.log(chalk.yellow('Removal cancelled'));
                return;
            }
        }
        spinner.start(`Removing ${item.name}...`);
        // Delete files
        let deletedCount = 0;
        for (const filePath of item.files) {
            if (await fileExists(filePath)) {
                await deleteFile(filePath);
                deletedCount++;
            }
        }
        // Update config
        const updated = installed.filter(i => i.id !== item.id);
        await saveInstalledItems(updated);
        spinner.succeed(`Removed ${chalk.green(item.name)} (${deletedCount} files deleted)`);
    }
    catch (error) {
        spinner.fail('Removal failed');
        throw error;
    }
}
//# sourceMappingURL=remove.js.map