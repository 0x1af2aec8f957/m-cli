import type {Configuration, Compiler, Stats} from 'webpack';

import webpack from 'webpack';
import path from 'path';
import fs from 'fs';
import moment from 'moment';
import compressing from 'compressing';
// @ts-ignore
import tree from 'tree-node-cli';


import logger from '../plugins/logger';
import { packInfo } from '../plugins/package';
import { commit, branch } from '../plugins/git';
// import { FTP_CONFIG } from '../utils/constant';

export default {
    // alias: '',
    command: 'build',
    description: '项目打包',
    options: {
        '-env, --environment [envs...]': '设置环境变量',
        '-c, --config [config-path]': 'webpack配置文件路径',
        '-f, --force': '打包前删除历史打包资源',
        '-z, --zip': '压缩文件',
        '-u, --upload [upload-path]': '上传路径',
    },
    async action(options: {envs: string[], config: string, zip: boolean, upload: string, force: boolean}): Promise<void> {
        const mode: 'development' | 'production' = 'production';
        process.env.ENV = mode; // 设置webpack生产模式环境变量
        process.env.NODE_ENV = mode; // 设置webpack生产模式环境变量

        const workDir: string = process.cwd();

        if (options.envs){ // 将环境变量写入主进程
            options.envs.forEach((item: string) => {
                const _envs = <[string, string]>item.split('=');
                process.env[<string>_envs.shift()] = _envs.shift(); // 设置环境变量
            });
        }

        const cacheDir: string = path.join(workDir, 'node_modules', '.cache'); // 缓存目录
        const webpackConfig: Configuration = (await import(options.config ?? path.join(__dirname, '..', 'config', '.webpack.config.ts'))).default; // webpack配置文件读取
        webpackConfig.stats = 'none'; // 输出的stats级别
        webpackConfig.mode = 'production'; // 模式
        webpackConfig.cache = false; // 是否缓存
        webpackConfig.context = workDir; // webpack工作根目录
        webpackConfig.output ??= {}; // 配置output[覆盖用户的一些配置]
        webpackConfig.output.path = path.resolve(workDir, 'build', options.zip ? 'assets' /* 需要压缩包时，将其它资源分开放置 */: ''); // 打包输出目录
        webpackConfig.output.clean = true; // 输出前清理目录(仅清理webpack输出目录，不会清理压缩包)
        const compiler: Compiler = webpack(webpackConfig);  // webpackCompiler

        if (fs.existsSync(cacheDir)){ // 是否存在缓存目录
            logger.warning('发现缓存文件，可能导致打包不正确，将自动清理缓存目录');
            fs.rmSync(cacheDir, {recursive: true, force: true}); // 这里无需判断目录是否递归，可以直接进行递归删除，不会引发无目录错误
        }

        if (fs.existsSync(webpackConfig.output.path) && options.force) { // 删除历史打包资源
            fs.rmSync(webpackConfig.output.path, {recursive: true, force: true});
        }

        compiler.run(async (err: Error | undefined, stats: Stats | undefined): Promise<void> => { // webpack打包运行时
            if (err) throw err;

            // 打包后生成的信息
            const statsInfo = stats?.toJson(); // webpack打包结果详细信息
            const outPutInfo: path.ParsedPath = path.parse(<string>statsInfo?.outputPath); // webpack打包结果最终输出目录
            // 提交log查询
            const logs = await commit.all(workDir, 1);
            const log = logs[0];

            // 输出信息及文件二次操作
            const outputPath = <string>statsInfo?.outputPath; // 输出目录
            const curBranch = await branch.currentBranch(workDir);
            const fileName = `${packInfo.getName(workDir)}_${moment(new Date(log.date())).format("YYYYMMDDhhmm")}_${curBranch.shorthand()}_${log.sha()}.zip`;

            fs.writeFileSync( // 写入version.text
                path.join(outputPath, 'version.txt'),
                `目录信息：\n${tree(outputPath)}\n\n提交信息：${Object.entries(logs).reduce((acc, [key, value]) => `${acc}\n${key}：${value}`, '')}`
            );

            if (options.zip){ // 压缩文件
                const compressPath: string = path.join(outPutInfo.dir, fileName);
                const spinner = logger.loading('正在压缩资源包');
                await compressing.zip.compressDir( // 压缩文件
                    outputPath,
                    compressPath
                );
                spinner.succeed(`资源包压缩成功 -> ${compressPath}`)
            }

            // if (options.upload) uploadCommand.action(uploadPath, path.join(options.upload, fileName)/* destPath */); // 上传文件
            /*if (options.upload){ // 上传文件
                FTP_CONFIG
            }*/
        });
    }

}
