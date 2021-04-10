import type {Repository, Revwalk, Commit} from "nodegit";

import Git ,{ Reset } from 'nodegit';

import logger from "../plugins/logger";
import { commit } from '../plugins/git';

export default {
    alias: 'gmt',
    command: 'merge-to <branch-name>',
    description: '将变更合并到指定分支(cherry-pick)',
    options: {},
    async action(branchName: string, _options: {}): Promise<void> {
        const workDir: string = process.cwd();
        const repo: Repository = await Git.Repository.open(workDir);
        const revWalk: Revwalk = repo.createRevWalk();

        const currentBranch = await repo.getCurrentBranch(); // 当前分支
        const targetBranch = await repo.getBranch(branchName); // 目标分支

        const currentBranchLastCommit: Commit = await repo.getHeadCommit(); // 当前分支的最新提交
        const targetBranchLastCommit: Commit = await repo.getBranchCommit(targetBranch); // 目标分支的最新提交

        revWalk.sorting(Git.Revwalk.SORT.TIME);
        revWalk.push(currentBranchLastCommit.id());

        const currentBranchLogs = await revWalk.getCommitsUntil((_commit: Commit) => true); // 当前分支的提交日志
        const targetCommit: Commit | undefined = await currentBranchLogs.find((_commit: Commit) => _commit.sha() === targetBranchLastCommit.sha())?.parent(0); // 与目标分支最新提交重合的当前分支节点的最近一次提交
        if (!targetCommit){ // 如果不存在提交就退出处理
            logger.failed(`[${currentBranch.shorthand()} -> ${targetBranch.shorthand()}]目标分支的最后一次提交不在当前分支的节点上，合并失败`, true);
            return;
        }

        await Git.Reset.reset(repo, targetCommit, Reset.TYPE.SOFT, {checkoutStrategy: Git.Checkout.STRATEGY.SAFE}); // 软重置提交
        const cherryPickCommit = await commit.amend(workDir); // 需要被cherry-pick的提交节点

        await repo.checkoutBranch(targetBranch); // 切换到目标分支
        await Git.Cherrypick.cherrypick(repo, await repo.getCommit(cherryPickCommit)).then(async () => {
            const index = await repo.index();
            if (index.hasConflicts()) { // 是否有冲突产生
                logger.warning('合并成功，但发生冲突需要手动解决');
                return;
            }

            const completeCommit = await repo.getHeadCommit(); // 获取cherry-pick后的提交信息
            logger.success(`[${cherryPickCommit} -> ${completeCommit}]合并成功`);
        }).finally(() => repo.checkoutBranch(currentBranch)); // 切换回原分支
    }

}
