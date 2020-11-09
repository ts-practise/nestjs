import { getCurrentDb } from '@/core';
import chalk from 'chalk';
import ora from 'ora';
import { execShell, panic } from '../../common';
import { MigrationRefreshArguments } from '../types';
import { SeedHandler } from './seed.handler';
import { getTypeorm } from './typeorm';

export const MigrationRefreshHandler = async (
    args: MigrationRefreshArguments,
) => {
    const prefix = await getTypeorm(args);
    let suffix = `-c ${getCurrentDb('name')}`;
    if (args.transaction) suffix = `${suffix} -t ${args.transaction}`;
    const commands = {
        revert: `${prefix} migration:revert ${suffix}`,
        run: `${prefix} migration:run ${suffix}`,
    };
    let spinner = ora('Start to destory db').start();
    try {
        args.force
            ? await getCurrentDb('connection').dropDatabase()
            : await execShell(commands.revert, args.pretty);
        spinner.succeed(chalk.greenBright.underline('👍 Destory db successed'));
    } catch (err) {
        console.log(chalk.red(err));
        spinner.fail(chalk.red('\n❌ Destory db failed!'));
        process.exit(0);
    }

    spinner = ora('Start to run migration').start();

    try {
        await execShell(commands.run, args.pretty);
        spinner.succeed(
            chalk.greenBright.underline('👍 Run migration successed'),
        );
    } catch (err) {
        panic(spinner, 'Run migration failed!', err);
    }

    if (args.seed) {
        await SeedHandler(args);
    }

    process.exit(0);
};
