import type { ExecSyncOptionsWithStringEncoding } from "child_process";

import { spawnSync } from "child_process";
import { bold } from "colors";

import { PACKAGE_SOURCE_URL, CLI_INSTALL_COMMAND } from '../utils/constant';
import log from '../plugins/logger';

export default {
    // alias: '',
    command: 'upgrade',
    description: 'cli自升级',
    options: {},
    async action(_options: {}): Promise<void> {
        const pkgInfo = await import('../package.json');
        if (typeof CLI_INSTALL_COMMAND !== 'string') return log.error(`未检测到安装 ${bold(pkgInfo.name)} 时，调用的命令程序(或已被删除)\n请重新安装完成升级`, true); // 未检测到全局安装调用的命令

        const commands: string[] = [
            'install',
            '-g',
            // @ts-ignore
            pkgInfo.repository.erect,
            `--registry=${PACKAGE_SOURCE_URL}`, // 使用淘宝镜像源
            '--no-package-lock', // 阻止创建package-lock.json文件
        ];

        const spinner = log.loading(`[${CLI_INSTALL_COMMAND.toUpperCase()}]<-[${pkgInfo.name}]正在升级`);
        try {
            spawnSync(CLI_INSTALL_COMMAND, commands, <ExecSyncOptionsWithStringEncoding>{
                // @ts-ignore
                windowsVerbatimArguments: true,
                windowsHide: true,
                encoding: "utf-8",
                // FORCE_COLOR: true, // yarn 颜色输出
                // stdio:[0, 1, 2/*, 'ipc'*/], // 详情输出
            });
            spinner.succeed(`[${CLI_INSTALL_COMMAND.toUpperCase()}]->[${pkgInfo.name}]升级成功`);
        }catch (err: any){
            spinner.fail(`[${pkgInfo.name}]升级失败<${err?.message}>`);
        }

    }

}
