import logger from "../plugins/logger";
import { commit } from '../plugins/git';

export default {
    alias: 'gp', // 使用Git缩写命令
    command: 'git-push [remote-name]',
    description: '将变更推送到远程仓库',
    options: {
        '-f, --force': '强制推送'
    },
    async action(_remoteName: string, options: {force: boolean}): Promise<void> {
        const workDir: string = process.cwd();
        if (options.force) logger.error('当前环境禁止使用强制提交', true);
        await commit.push(workDir);
    }

}
