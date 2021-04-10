import type { BranchAll } from '../plugins/git';

import path from 'path';
import fs from 'fs';
import Inquirer from 'inquirer';

import {clone, branch, commit, config} from '../plugins/git';
import { dependent, packInfo } from '../plugins/package';
import { clear as  compareDevClear} from '../plugins/compareDependent';
import log from '../plugins/logger';
import {PROJECT_TYPE, REGEX_NAME, REGEX_EMAIL, COMMAND_NAME} from '../utils/constant';

export default {
    // alias: '',
    command: 'create <project-name>',
    description: '创建项目',
    options: {
        '-t, --type <project-type>': `创建的项目类型<${Object.keys(PROJECT_TYPE).map((type: string) => type.toLowerCase()).join('|')}>`, // 创建项目的类型
        '-i, --init': '初始化项目', // 创建完成后初始化项目
    },
    async action(projectName: string, options: {type: string, init: boolean}): Promise<void> {
        // 处理即将创建的工程目录
        const projectDir: string = path.resolve(process.cwd(), projectName); // 项目目录
        if (fs.existsSync(projectDir)){ // 即将创建的项目目录已存在，需要处理目录冲突
            await Inquirer.prompt([{
                name: 'isDelete',
                type: 'confirm',
                message: `检测到当前工作目录中已有 ${projectName} 文件夹，是否删除？`,
                default: false,
            }]).then(({isDelete} : {isDelete: boolean}) => {
                if (isDelete) { // 开发者确认删除操作
                    const spinner = log.loading(`正在删除目标文件夹：${projectName}`);
                    try{
                        fs.rmSync(projectDir, {recursive: true, force: true});
                        spinner.succeed('已移除受冲突的文件夹');
                    }catch (err: any){
                        spinner.fail('在移除受冲突的文件夹时发生意外');
                        log.error(`在移除受冲突的文件夹时发生意外，将中断后续流程<${err?.message}>`, true);
                    }
                    return;
                }

                log.failed('在未解决目录冲突前，后续流程将始终会被终断', true);
            });
        }

        // 模板拉取与分支切换
        const projectType = <keyof typeof PROJECT_TYPE>options.type?.split('').reduce<string>((acc, cur, index) => acc + (index === 0 ? cur.toLocaleUpperCase() : cur.toLowerCase()), '') || Object.keys(PROJECT_TYPE)[0]; // 将用户输入的类型转换为首字母大写其余部分小写，用于匹配`PROJECT_TYPE`
        const templateUrl: string = PROJECT_TYPE[projectType]; // 项目拉取模板
        const repo = await clone(templateUrl, projectDir, true); // 拉取远程仓库代码
        const workDir: string = repo.workdir(); // 获取工作目录

        const branchAll: BranchAll = await branch.all(repo); // 获取模板所有分支信息
        if (branchAll.remotes.length > 1) { // 当远程分支数量不止一个时，会将分支选择权移交给开发者
            const tmpBranchName: string = `${(await import(path.resolve(__dirname, '..', 'package.json'))).name}_${Math.floor(Math.random() * 10000)}`; // 临时分支名称
            const targetBranchName: string = (await Inquirer.prompt([{ // 接收用户选择的分支
                name: 'branch',
                type: 'list',
                choices: branchAll.remotes.map((_branch) => _branch.name()),
                message: '请选择你要拉取的分支',
                default: 'master',
            }])).branch;

            await branch.create(repo, tmpBranchName, targetBranchName); // 拉取基于用户选择的分支最新commit的代码并创建分支
            await branch.checkout(repo, tmpBranchName); // 切换到基于开发者选择的分支代码
        }

        // 重置提交信息
        await branch.reset(repo, null); // 重置所有提交
        log.success('重置模板提交信息成功');
        packInfo.setName(workDir, projectName); // 设置项目名字
        compareDevClear(workDir); // 移除本地项目模板的共性依赖，使用cli预置的依赖代替

        // 开发者git信息设置
        await Inquirer.prompt([{ // 接收开发者姓名
            name: 'name',
            type: 'input',
            choices: branchAll.remotes.map((_branch) => _branch.name()),
            message: '请输入GIT用户名',
            default: await config.getUsername(repo),
            validate: (inputText: string) => REGEX_NAME.test(inputText) || '用户名只能有字母、数字或者下划线组成'
        },{ // 接收开发者邮箱
            name: 'email',
            type: 'input',
            message: '请输入GIT邮箱',
            default: await config.getEmail(repo),
            validate: (inputText: string) => REGEX_EMAIL.test(inputText) || '邮箱输入不合法'
        },])
        .then(async ({ // 设置用户名和邮箱
                   name,
                   email
        }) => {
            packInfo.setAuthor(workDir, name); // 设置项目用户名
            packInfo.setEmail(workDir, email); // 设置项目用户邮箱
            await config.setEmail(repo, <string>email).then(() => config.setUsername(repo, <string>name)); // 设置GIT作者信息
        })
        .then(() => log.success('初始化GIT提交信息成功'))
        .catch((_err: any) => log.error(`初始化GIT提交信息失败<${_err?.message}>`, true));

        // 设置仓库地址
        await Inquirer.prompt([{ // 接收项目远程仓库
            name: 'address',
            type: 'input',
            message: '请输入GIT仓库关联的远端地址'
        }]).then(({
            address
        }) => config.setRemote(repo, undefined, address));

        // 依赖安装
        await Inquirer.prompt([{ // 依赖自动安装
            name: 'isInstall',
            type: 'confirm',
            message: `是否自动为你安装依赖？`,
            default: true,
        }]).then(({isInstall}) => isInstall ? dependent.all(workDir) : null);

        // 初始化提交信息
        await commit.amend(repo, {message: 'Project init'}); // 提交所有代码
        log.success('初始化提交信息成功');
        await branch.deleteAll(repo, false); // 删除所有分支信息
        log.success('删除多余分支成功');
        await branch.rename(repo, 'dev'); // 修改分支名称[工作分支为dev分支]
        log.success('创建工作分支成功');

        log.success(`项目创建成功\n\tcd ${projectName}\n\t${COMMAND_NAME} run`);
    }

}
