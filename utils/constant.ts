import type { UserInfo } from 'os';

import os from 'os';
import path from 'path';
import process from "process";
import { spawnSync } from 'child_process';

const packageInfo = require('../package.json');

// node解析包路径
export const NODE_COMMAND: string = process.platform === 'win32' ? 'node' : process.execPath; // Windows平台无法根据路径执行目标程序

// cli安装时调用的脚本
export const CLI_INSTALL_COMMAND: string | undefined = Object.entries(<{[command: string]: Buffer | null}>{ // cli安装的方式，即cli安装时使用的命令(为null时，命令不存在)
    'yarn': spawnSync('yarn', ['global', 'dir'], {cwd: __dirname}).stdout, // 获取npm全局路径
    'npm': spawnSync('npm', ['config', 'get', 'prefix'], {cwd: __dirname}).stdout // 获取yarn全局路径
    // @ts-ignore
}).find(([_command, _path]) => !!_path && new RegExp(`^(${Buffer.from(_path).toString().replace(/\n/gim, '')})`).test(require?.main.path ?? __dirname))?.[0];

// 验证使用的正则
export const REGEX_EMAIL = /^\w+@\w+\.\w+$/;
export const REGEX_NAME = /^\w+$/;

// cli配置文件
export const COMMAND_NAME: string = Object.keys(packageInfo.bin)[0];
const CONFIG_FILE_NAME: string = `.${COMMAND_NAME}-env`;
export const USER_DETAILS: UserInfo<string> = os.userInfo({ encoding: 'utf-8' });
export const { homedir: HOME_PATH }: { homedir: string } = USER_DETAILS;
export const CONFIG_FILE_PATH: string = path.resolve(HOME_PATH, CONFIG_FILE_NAME);

// ssh秘钥位置信息
export const SSH_PUBLIC_KEY_PATH = path.resolve(HOME_PATH, '.ssh', 'id_rsa.pub');
export const SSH_PRIVATE_KEY_PATH = path.resolve(HOME_PATH, '.ssh', 'id_rsa');

// 依赖项管理·脚本位置（yarn）
const YARN_PACKAGE_PATH = path.resolve(__dirname, '..', 'node_modules', 'yarn');
const YARN_PACKAGE_MANIFEST_INFO = require(path.join(YARN_PACKAGE_PATH, 'package.json'));
export const PACKAGE_SOURCE_URL = 'https://registry.npm.taobao.org'; // 淘宝镜像源
export const YARN_SCRIPT_PATH = path.resolve(YARN_PACKAGE_PATH, YARN_PACKAGE_MANIFEST_INFO.bin[YARN_PACKAGE_MANIFEST_INFO.name]);

// 受支持的项目模板类型
export enum PROJECT_TYPE { // 支持的项目类型[包含了项目模板仓库repo地址]
    Vue = 'git@github.com:0x1af2aec8f957/vue-template.git',
    React = 'git@github.com:0x1af2aec8f957/react-template.git',
    Flutter = 'git@github.com:0x1af2aec8f957/flutter-template.git',
    // Test = 'https://gitee.com/panjiachen/vue-element-admin.git',
}

export enum COMMIT_TYPE { // 代码提交类型
    Feat = '新功能',
    Fix = '修补BUG',
    Refactor = '重构（即不是新增功能，也不是修改bug的代码变动）',
    Style = '格式（不影响代码运行的变动）',
    Test = '增加测试',
    Chore = '构建过程或辅助工具的变动',
    Doc = '升级文档',
}

// FTP配置文件
export const FTP_CONFIG = {
    "host": "",
    "port": "",
    "user": "",
    "password": ""
}

/// NOTE: 这里是定义配置文件配置项属性汇总的地方，在添加配置时需要在这里添加配置项的使用信息
export type CONFIG_KEY = // 配置文件key汇总[即配置项汇总]
    'VUE_TEMPLATE_ADDRESS' // Vue项目模板拉取地址
    | 'VUE_TEMPLATE_BRANCH' // Vue项目模板拉取分支
    | 'REACT_TEMPLATE_ADDRESS' // REACT项目模板拉取地址
    | 'REACT_TEMPLATE_BRANCH' // REACT项目模板拉取分支
    | 'FLUTTER_TEMPLATE_ADDRESS' // Flutter项目模板拉取地址
    | 'FLUTTER_TEMPLATE_BRANCH' // Flutter项目模板拉取分支
    | 'GIT_USER_NAME' // 用于提交代码的Git用户名
    | 'GIT_USER_EMAIL' // 用于提交代码的Git用户邮箱
    ;
