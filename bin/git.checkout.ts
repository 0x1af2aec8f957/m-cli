import log from "../plugins/logger";
import { branch, commit } from '../plugins/git';

export default {
    alias: 'gco', // 使用Git缩写命令
    command: 'git-checkout <locale-branch> [remote-branch]',
    description: '切换分支',
    options: {
        '-b, --branch': '切换并创建新分支',
        '--rebase': '重置提交信息',
    },
    async action(localeBranch: string, remoteBranch: string | undefined, options: {branch: boolean, rebase: boolean}): Promise<void> {
        const workDir: string = process.cwd();
        const branches = await branch.all(workDir);

        if (branches.locales.some((_branch) => _branch.shorthand() === localeBranch) && options.branch) { // 已存在分支直接切换
            log.warning(`本地分支存在 ${localeBranch}，将放弃创建`);
            await branch.checkout(workDir, localeBranch);
            log.success(`[${localeBranch}]成功切换分支`);
            return;
        }

        await branch.create(workDir, localeBranch, remoteBranch); // 创建新分支
        await branch.checkout(workDir, localeBranch); // 切换分支

        if (options.rebase) {
            await branch.reset(workDir, null); // 重置提交
            await commit.amend(workDir); // 追加提交
        }

        log.success(`[${localeBranch}]成功切换分支`);
    }
}
