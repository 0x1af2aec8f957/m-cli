/// 使用文档及模型设计参考 doc: https://classic.yarnpkg.com/en/docs/cli
import type { ExecSyncOptionsWithStringEncoding, SpawnSyncReturns} from "child_process";

import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import process from "process";

import { YARN_SCRIPT_PATH, PACKAGE_SOURCE_URL, NODE_COMMAND } from '../utils/constant';
import { filterActual } from '../utils/common';
import log from '../plugins/logger';

export enum ModeType { // 安装类型
    EXACT = 'E',
    DEV = 'D',
    PEER = 'P',
    OPTIONAlL = 'O',
    TILDE = 'T'
}

const commonOptions: ExecSyncOptionsWithStringEncoding = {
    // @ts-ignore
    windowsVerbatimArguments: true,
    windowsHide: true,
    env: Object.assign({ // 需要单独设置的环境变量
        FORCE_COLOR: true, // 强制颜色输出
    }, process.env),
    encoding: "utf-8",
    FORCE_COLOR: true, // yarn 颜色输出
    stdio:[0, 1, 2/*, 'ipc'*/],
}

export function searchDependenciesTarget(_workDir: string = process.cwd(), name: string) : 'dependencies' | 'devDependencies' | 'peerDependencies' | 'optionalDependencies' | void{ // 搜索包的依赖属性
    const packInfo = require(path.resolve(_workDir, 'package.json'));

    switch (true){
        case packInfo.dependencies.some(([_name]: string[]) => _name === name):
            return 'dependencies';
        case packInfo.devDependencies.some(([_name]: string[]) => _name === name):
            return 'devDependencies';
        case packInfo.peerDependencies.some(([_name]: string[]) => _name === name):
            return 'peerDependencies';
        case packInfo.optionalDependencies.some(([_name]: string[]) => _name === name):
            return 'optionalDependencies';
        default:
            break;
    }
}

export const dependent = {
    add (_workDir: string = process.cwd(), packageInfo: { // 添加单个依赖
        name: string,
        hasLockfile?: boolean,
        version?: string,
        mode?: keyof typeof ModeType
    }): SpawnSyncReturns<string> {
        const mode = packageInfo.mode ?? ModeType.EXACT;
        const hasLockfile = packageInfo.hasLockfile ?? false;
        const commands: string[] = filterActual<string>([
            YARN_SCRIPT_PATH,
            'add',
            `${packageInfo.name}${packageInfo.version ? ('@' + packageInfo.version) : ''}`,
            `--registry=${PACKAGE_SOURCE_URL}`, // 使用淘宝镜像源
            hasLockfile ? '' : '--no-lockfile', // 不生成不读取.lock文件
            '--silent', // 不打印安装日志
            `--${mode.toLowerCase()}`, // 安装到开发依赖还是依赖环境
        ]);

        return spawnSync(NODE_COMMAND, commands, Object.assign(<ExecSyncOptionsWithStringEncoding>{
            cwd: _workDir,
        }, commonOptions));

    },
    all(_workDir: string = process.cwd()): SpawnSyncReturns<string> { // 安装所有依赖
        const commands: string[] = [
            YARN_SCRIPT_PATH,
            'install',
            `--registry=${PACKAGE_SOURCE_URL}`,
            '--no-lockfile',
            '--silent',
        ];

        return spawnSync(NODE_COMMAND, commands, Object.assign(<ExecSyncOptionsWithStringEncoding>{
            cwd: _workDir,
        }, commonOptions));

    },
    remove(_workDir: string = process.cwd(), name: string): void { // 移除依赖[非递归解除关系依赖]
        const packInfoPath: string = path.resolve(_workDir, 'package.json');
        const packSavePath: string = path.resolve(_workDir, 'node_modules', name);
        const packInfo = require(packInfoPath);
        const spinner = log.loading(`正在移除 ${name}`);

        try{ // 移除文件夹及重写包描述文件
            if (fs.existsSync(packSavePath)) fs.rmSync(packSavePath, {recursive: true, force: true}); // 移除依赖包
            const target = searchDependenciesTarget(_workDir, name);
            if (target) {
                delete packInfo[target][name];
                fs.writeFileSync(packInfoPath, JSON.stringify(packInfo, null, 2)); // 重写包描述文件
            }
            spinner.succeed(`[${name}]移除成功`);
        }catch (err: any){
            spinner.fail(`[${name}]移除失败`);
        }
    }
}

export const packInfo = {
    getName(_workDir: string): string{ // 获取工作目录项目名字
        const packInfo = require(path.resolve(_workDir, 'package.json'));
        return packInfo.name;
    },
    setName(_workDir: string, name: string): void{ // 设置工程名字
        const packInfoPath: string = path.resolve(_workDir, 'package.json');
        const packInfo = require(packInfoPath);
        packInfo.name = name;
        fs.writeFileSync(packInfoPath, JSON.stringify(packInfo, null, 2)); // 重写包描述文件
    },
    getVersion(_workDir: string): string{ // 获取版本
        const packInfo = require(path.resolve(_workDir, 'package.json'));
        return packInfo.version;
    },
    setVersion(_workDir: string, version: string): void{ // 设置版本
        const packInfoPath: string = path.resolve(_workDir, 'package.json');
        const packInfo = require(packInfoPath);
        packInfo.version = version;
        fs.writeFileSync(packInfoPath, JSON.stringify(packInfo, null, 2)); // 重写包描述文件
    },
    getDescription(_workDir: string): string{ // 获取描述
        const packInfo = require(path.resolve(_workDir, 'package.json'));
        return packInfo.description;
    },
    setDescription(_workDir: string, description: string): void{ // 设置描述
        const packInfoPath: string = path.resolve(_workDir, 'package.json');
        const packInfo = require(packInfoPath);
        packInfo.description = description;
        fs.writeFileSync(packInfoPath, JSON.stringify(packInfo, null, 2)); // 重写包描述文件
    },
    getAuthor(_workDir: string): string{ // 获取作者
        const packInfo = require(path.resolve(_workDir, 'package.json'));
        return packInfo.author;
    },
    setAuthor(_workDir: string, author: string): void{ // 设置作者
        const packInfoPath: string = path.resolve(_workDir, 'package.json');
        const packInfo = require(packInfoPath);
        packInfo.author = author;
        fs.writeFileSync(packInfoPath, JSON.stringify(packInfo, null, 2)); // 重写包描述文件
    },
    getEmail(_workDir: string): string{ // 获取邮箱
        const packInfo = require(path.resolve(_workDir, 'package.json'));
        return packInfo.email;
    },
    setEmail(_workDir: string, email: string): void{ // 设置邮箱
        const packInfoPath: string = path.resolve(_workDir, 'package.json');
        const packInfo = require(packInfoPath);
        packInfo.email = email;
        fs.writeFileSync(packInfoPath, JSON.stringify(packInfo, null, 2)); // 重写包描述文件
    },
}
