import process from "process";
import type {Configuration, Compiler} from 'webpack';

import webpack from 'webpack';
import WebpackDevServer from 'webpack-dev-server';
import portfinder from 'portfinder'; /// doc: https://github.com/http-party/node-portfinder
import path from 'path';
import fs from 'fs';
import {bold, blue} from 'colors';

import log from "../plugins/logger";

export default {
    // alias: '',
    command: 'run [entry-file]',
    description: '启动项目',
    options: {
        '-c, --config [file-path]': '应用程序编译配置文件地址',
        '-p, --port': 'webpack-dev-server运行监听端口',
        '-m, --mode [mode-type]': '应用程序启动模式(development|production)',
        '--log [log-type]': '应用程序日志级别(info|warn|error|debug|trace|silent)',
        '--env [env-key-value...]': '给捆绑器写入额外的环境变量',
    },
    async action(entryFile: string | undefined, options: {config?: string, env?: string[], mode: 'development' | 'production', port: number, log?: 'info'|'warn'|'error'|'debug'|'trace'|'silent'}): Promise<void> { // 运行项目
        const NODE_ENV: typeof options.mode = options.mode ?? 'development'; // 启动模式
        const { log: logLevel } = options; // 日志级别
        process.env.NODE_ENV = NODE_ENV; // 设置环境变量[webpack.config.t所需要读取]
        process.env.ENV = NODE_ENV; // 设置环境变量[webpack.config.t所需要读取]
        const workDir: string = process.cwd();
        const pakInfo = await import(path.resolve(__dirname, '..', 'package.json'));

        const webpackConfig: Configuration = (await import(options.config ?? path.join(__dirname, '..', 'config', '.webpack.config.ts'))).default; // webpack配置文件读取
        const isProduction : boolean = NODE_ENV === 'production'; // 是否是生产模式
        webpackConfig.name = pakInfo.name; // 配置名称(使用cli名称)
        webpackConfig.cache = !isProduction; // 是否使用缓存
        webpackConfig.mode = NODE_ENV; // webpack模式
        webpackConfig.context = workDir; // webpack工作根目录

        const devServerOptions: WebpackDevServer.Configuration = Object.assign({ // webpack-dev-server 配置参数
            host: '0.0.0.0',
            port: 8080,
            open: true,
            https: false,
            logLevel,
            clientLogLevel: logLevel,
            hot: !isProduction,
           /* watchContentBase: !isProduction,
            injectClient: false,
            compress: isProduction,
            overlay: isProduction
                ? false
                : { warnings: false, errors: true } */
        }, webpackConfig.devServer);
        portfinder.basePort = options.port ?? process.env.PORT ?? devServerOptions.port; // 端口设置
        devServerOptions.port = await portfinder.getPortPromise(); // 获取空闲端口

        const entryJsPath: string = path.resolve(process.cwd(), 'src', 'main.js');
        const entryTsPath: string = path.resolve(process.cwd(), 'src', 'main.ts');
        const entryPath: string | null = (() => {
            if (typeof entryFile === 'string') return path.resolve(workDir, entryFile);
            if (fs.existsSync(entryJsPath)) return entryJsPath;
            if (fs.existsSync(entryTsPath)) return entryTsPath;
            return null;
        })();
        if (!entryPath){ // 找不到入口文件
            log.error('无法找到项目入口文件', true);
            return;
        }

        WebpackDevServer.addDevServerEntrypoints(webpackConfig, devServerOptions); // nodeJs接口启用热更新必须的步骤，doc: https://webpack.js.org/guides/hot-module-replacement/#via-the-nodejs-api
        const compiler: Compiler = webpack(webpackConfig);  // webpackCompiler
        compiler.hooks.failed.tap(`${pakInfo.name} run`, err => log.error(`webpack-dev-server运行错误<${err?.message}>`, true));
        const server = new WebpackDevServer(compiler, devServerOptions); // 构建webpack-dev-server
        server.listen(devServerOptions.port, <string>devServerOptions.host, err => { // 启动服务
            if (err) {
                log.error(`webpack-dev-server运行错误<${err?.message}>`);
                return;
            }

            log.log(`${blue(bold(pakInfo.name + '-run'))} 运行在 -> http://localhost:${devServerOptions.port}`);
        });

        ['SIGINT', 'SIGTERM'].forEach((signal: string) => process.on(signal, () => server.close(() => process.exit(0)))); // 主进程进程信号中断需要关闭子进程
    }

}
