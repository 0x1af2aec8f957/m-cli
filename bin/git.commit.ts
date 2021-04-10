import moment from 'moment';
import Inquirer from 'inquirer';

import { commit } from '../plugins/git';
import log from "../plugins/logger";
import {COMMIT_TYPE} from '../utils/constant';

export default {
    alias: 'gc', // 使用Git缩写命令
    command: 'git-commit [message]',
    description: '提交变更[<type>(<scope>): <subject>]',
    options: {
        '-p, --push': '推送到远程仓库',
        '--amend': '追加提交',
        '-t, --type [type]': `提交的类型(${Object.keys(COMMIT_TYPE).join(' | ')})`,
        '--source [id]': '提交的需求来源(id)',
    },
    async action(message: string, options: {source: string, push: boolean, amend: boolean, type: keyof typeof COMMIT_TYPE}): Promise<void> {
        const workDir: string = process.cwd();
        if (options.amend && typeof message === 'undefined') { // amend提交不修改消息
            return commit.amend(workDir)
                .then(() => log.success(`[${moment().format('YYYY-MM-DD hh:mm:ss')}]提交成功`))
                .catch((err: any) => log.error(`提交失败<${err?.message}>`));
        } else { // 创建新的提交
            const commitType: string = options.type ?? await Inquirer.prompt([{ // 接收提交类型
                name: 'type',
                type: 'list',
                choices: Object.entries(COMMIT_TYPE).map(([key, value]: [string, string]) => `${key.toLocaleLowerCase()} -> ${value}`),
                message: `请选择你要提交的类型`,
                default: Object.keys(COMMIT_TYPE)[0],
                filter: (answer: string): string => <string>answer.match(/^[A-z]+/)?.toString()
            }]).then(({type} : {type: string}) => {
                if (!type) log.error('提交类型不能为空', true);
                return type;
            });

            const commitScope: string = options.source ?? await Inquirer.prompt([{ // 接收提交影响范围[需求范围]
                name: 'source',
                type: 'input',
                message: `请输入关联源ID`,
                default: 'unknown',
            }]).then(({source} : {source: string}) => source);

            const commitMessage: string = message ?? await Inquirer.prompt([{ // 接收提交消息
                name: 'message',
                type: 'input',
                message: '请输入提交信息',
                default: 'unknown',
                validate: (answer => answer.test(/^[\S]+$/) || '提交信息不能有空格')
            }]).then(({message} : {message: string}) => message);

            // 代码本地提交
            const spinner = log.loading('正在提交');
            try{
                await commit[options.amend ? 'amend' : 'create'](workDir, {message: `${commitType}(#${commitScope}): ${commitMessage}`});
                spinner.succeed(`[${moment().format('YYYY-MM-DD hh:mm:ss')}]提交成功`);
            }catch (err: any){
                spinner.fail(`提交失败${err?.message}`);
            }
        }

        // 代码远程推送
        if (options.push) await commit.push(workDir);
    }

}
