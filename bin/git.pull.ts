import logger from "../plugins/logger";
import { commit } from '../plugins/git';

export default {
    alias: 'gl', // 使用Git缩写命令
    command: 'git-pull [remote-name]',
    description: '更新本地仓库代码至最新',
    options: {
        '-f, --force': '强制推送'
    },
    async action(_remoteName: string, options: {force: boolean}): Promise<void> {
        const workDir: string = process.cwd();
        if (options.force) logger.error('当前环境禁止使用强制提交', true);
        await commit.pull(workDir);
    }

}
