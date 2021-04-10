import type {Configuration, Compiler, Stats} from 'webpack';

import webpack from 'webpack';
import path from 'path';

import logger from "../plugins/logger";

export default {
    // alias: '',
    command: 'bundle <entry-file>',
    description: '文件或项目捆绑',
    options: {
        '-env, --environment [envs...]': '设置环境变量',
        '-c, --config [config-path]': 'webpack配置文件路径',
    },
    async action(entryFile: string, options: {envs: string[], config: string}): Promise<void> {
        process.env.ENV = 'production'; // 设置webpack生产模式环境变量
        process.env.NODE_ENV = 'production'; // 设置webpack生产模式环境变量

        const workDir: string = process.cwd();

        if (options.envs){ // 将环境变量写入主进程
            options.envs.forEach((item: string) => {
                const _envs = <[string, string]>item.split('=');
                process.env[<string>_envs.shift()] = _envs.shift(); // 设置环境变量
            });
        }

        const webpackConfig: Configuration = options.config ? (await import(path.resolve(workDir, options.config))).default : {}; // webpack配置文件读取
        const compiler: Compiler = webpack(Object.assign<any, Configuration>(webpackConfig, { // webpackCompiler
            target: 'node', // node模式
            context: workDir,
            cache: false,
            entry: path.resolve(workDir, entryFile),
            output: {
                path: path.resolve(workDir, 'build'),
                clean: true,
                filename: '[name].[hash:8].bundle.js'
            },
        }));

        compiler.run(async (err: Error | undefined, stats: Stats | undefined): Promise<void> => { // webpack打包运行时
            if (err) logger.error(`打包失败<${err?.message}>`, true);

            // 打包后生成的信息
            const statsInfo = stats?.toJson(); // webpack打包结果详细信息

            // 输出信息及文件二次操作
            const outputPath = <string>statsInfo?.outputPath; // 输出目录
            logger.success(`打包输出成功 -> ${outputPath}`);
        });

    }

}
