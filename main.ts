#!/usr/bin/env ts-node --script-mode --transpile-only --files
// This shebang is not portable.  It only works on Mac

import { satisfies } from 'semver';
import { bold } from 'colors';
import * as path from 'path';
import * as Program from 'commander';
import type * as commander from 'commander';

import { fileDeps } from './utils/common';
import logger from './plugins/logger';

(async function main(): Promise<void>{
    const { program }: typeof Program = Program;
    const packageConf = await import('./package.json');
    const isVersionValid: boolean = satisfies(process.version, packageConf.engines.node);
    if (!isVersionValid) { // 版本检测
        logger.error(`你使用的NodeJs版本为${bold(process.version)}，即将执行的代码需要${bold(packageConf.engines.node)}！\n请升级你的NodeJs版本。`);
        process.exit(1);
    }

    (<commander.Command>program) // 主程序名字+版本+描述
        .name?.(<string>Object.keys(packageConf.bin).shift())
        .description(<string>packageConf.description)
        .version(<string>packageConf.version);

    for (const module of fileDeps(path.join(__dirname, 'bin'))) { // 命令自动注册[递归查找@root/bin目录]
        const {command, description, action, alias, options = {}} = (await import(module)).default;

        const _options = Object.entries<string>(options);
        const _command: commander.Command = <commander.Command>program.command(<string>command).description(<string>description).action(<(...arg: any) => void>action);
        if (alias) _command.alias(alias); // 别名设置
        if (!!_options.length) _options.forEach(([key, value]: [string, string]) => _command.option(key, value));
    }

    for (const module of fileDeps(path.join(__dirname, 'option'))) { // 选项自动注册[递归查找@root/option目录]
        const {description, action, flags} = (await import(module)).default;
        program.option(flags, description, action);
    }

    await program.parseAsync(<string[]>process.argv); // 参数解析
})()
