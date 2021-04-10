import type { ExecSyncOptionsWithStringEncoding } from 'child_process';

import { spawnSync } from 'child_process';
import path from 'path';
import process from "process";
import { YARN_SCRIPT_PATH, NODE_COMMAND } from "../utils/constant";

import log from '../plugins/logger';

export default {
    // alias: '',
    command: 'doctor',
    description: '环境诊断',
    options: {},
    async action(_options: {}): Promise<void> {
        const webpackInfo = await import('webpack/package.json');
        const tsNodeInfo = await import('ts-node/package.json');

        const commonOptions: ExecSyncOptionsWithStringEncoding = {
            // @ts-ignore
            windowsVerbatimArguments: true,
            windowsHide: true,
            FORCE_COLOR: true, // yarn颜色输出
            env: Object.assign({ // 需要单独设置的环境变量
                // TS_NODE_PROJECT: path.resolve(`${__dirname}`, '..', 'config', '.tsconfig.json'), // 解析webpack.config.ts的tsconfig.json配置文件路径
                NODE_ENV: 'production',
                ENV: 'production',
            }, process.env),
            encoding: "utf-8",
            stdio:[0, 1, 2/*, 'ipc'*/],
            cwd: process.cwd()
        }

        spawnSync(NODE_COMMAND, [ // 检测webpack配置文件是否有语法错误
            path.resolve(__dirname, '..', 'node_modules', 'ts-node', tsNodeInfo.bin['ts-node']), // ts-node路径[已经在cli入口文件更改了tsconfig.json的路径，无需再次使用tsconfig-paths等工具]地址
            path.resolve(__dirname, '..', 'node_modules', 'webpack', webpackInfo.bin.webpack), // webpack路径地址
            'configtest',
            path.resolve(__dirname, '..', 'config', '.webpack.config.ts')
        ], commonOptions)

        log.log(process.execPath, process.version); // node版本及位置检测

        log.log(YARN_SCRIPT_PATH, Buffer.from((spawnSync(process.execPath, [ // yarn版本检测
            YARN_SCRIPT_PATH,
            '-v',
        ]).stdout)).toString());
    }

}
