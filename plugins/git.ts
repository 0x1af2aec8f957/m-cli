import type {
    CloneOptions,
    PushOptions,
    FetchOptions,
    Config,
    Reference,
    Remote,
    Revwalk,
    Repository,
    Commit,
    Oid,
    Tree,
    Tag,
    Index,
    Signature
} from 'nodegit'; /// doc: https://github.com/nodegit/nodegit

import Git, {Reset} from 'nodegit'; /// doc: https://github.com/nodegit/nodegit
import Inquirer from 'inquirer';
import ora from "ora"; /// doc: https://github.com/SBoudrias/Inquirer.js

import {
    SSH_PRIVATE_KEY_PATH,
    SSH_PUBLIC_KEY_PATH
} from "../utils/constant";
import { getSSHPassword } from "../utils/common";
import log from "../plugins/logger";

/*{
    Clone,
    Checkout,
    Branch,
    Commit,
    Config,
    Ignore,
    Merge,
    Push,
    Remote,
    Repository,
    Reset,
    Status,
    Tag
}*/

export interface BranchAll {
    remotes: Reference[],
    locales: Reference[]
}

export async function clone(url: string, localPath: string, hasProgress: boolean = true, _password?: string): Promise<Repository>{ // 远程仓库克隆
    let progressCount = 0; // 仓库拉取进度
    let spinner: ora.Ora | undefined;
    const newPassword: string = _password ?? await getSSHPassword(); // 接收用户输入的密码

    if (hasProgress) spinner ??= log.loading('正在拉取远程仓库代码');

    return Git.Clone.clone(url, localPath, <CloneOptions>{
        fetchOpts: {
            callbacks: {
                certificateCheck: () => 0, // 解决Mac中的libgit2无法正确查找GitHub证书
                credentials: (_url: string, userName: string) => Git.Cred.sshKeyNew( /// 证书代理，doc: https://www.nodegit.org/guides/cloning/ssh-with-agent
                    userName,
                    SSH_PUBLIC_KEY_PATH,
                    SSH_PRIVATE_KEY_PATH,
                    newPassword
                ),
                transferProgress: () => { // 克隆进度
                   if(hasProgress && spinner) spinner.text = `[${progressCount ++}]拉取仍在继续，请稍等🍹`;
                }
            }
        }
    }).then((repo: Repository) => {
        if(hasProgress && spinner) spinner.succeed('远程仓库代码拉取成功');
        return repo;
    }).catch((err: any) => {
        if(hasProgress && spinner) spinner.fail('远程仓库代码拉取失败');
        log.error(`在拉取远程仓库代码时发生意外，将中断后续流程<${err?.message}>`, true);
        return err;
    });
}

export function init(){ // 本地仓库初始化

}

export const config = {
    async getUsername(_repo: Repository | string): Promise<string>{
        const repo: Repository = typeof _repo === 'string' ? await Git.Repository.open(_repo) :  _repo;
        const config: Config = await repo.config();
        return config.getPath('user.name');
    },
    async getEmail(_repo: Repository | string): Promise<string>{
        const repo: Repository = typeof _repo === 'string' ? await Git.Repository.open(_repo) :  _repo;
        const config: Config = await repo.config();
        return config.getPath('user.email');
    },
    async getSignature(_repo: Repository | string): Promise<Signature>{
        const username = await this.getUsername(_repo);
        const email = await this.getEmail(_repo);
        return Git.Signature.now(username, email);
    },
    async setUsername(_repo: Repository | string, name: string): Promise<number>{
        const repo: Repository = typeof _repo === 'string' ? await Git.Repository.open(_repo) :  _repo;
        const config: Config = await repo.config();
        return config.setString('user.name', name);
    },
    async setEmail(_repo: Repository | string, email: string): Promise<number>{
        const repo: Repository = typeof _repo === 'string' ? await Git.Repository.open(_repo) :  _repo;
        const config: Config = await repo.config();
        return config.setString('user.email', email);
    },
    async setSignature(_repo: Repository | string, signature: Signature): Promise<number[]>{
        return Promise.all([
            this.setUsername(_repo, signature.name()),
            this.setEmail(_repo, signature.email()),
        ]);
    },
    async getRemotes(_repo: Repository | string): Promise<Remote[]>{
        const repo: Repository = typeof _repo === 'string' ? await Git.Repository.open(_repo) :  _repo;
        return repo.getRemotes();
    },
    async setRemote(_repo: Repository | string, name: string | Remote = 'origin', address: string): Promise<number>{
        const repo: Repository = typeof _repo === 'string' ? await Git.Repository.open(_repo) :  _repo;
        const remote: string = typeof name === 'string' ? name : name.name();
        return Git.Remote.setUrl(repo, remote, address);
    }
}

export const commit = { // 提交
    async all(_repo: Repository | string, count?: number): Promise<Commit[]>{ // 获取本地仓库所有的分支[包含所有远程分支]
        const repo: Repository = typeof _repo === 'string' ? await Git.Repository.open(_repo) :  _repo;
        const lastCommit: Commit = await repo.getHeadCommit();

        const revWalk: Revwalk = repo.createRevWalk();
        revWalk.sorting(Git.Revwalk.SORT.TIME);
        revWalk.push(lastCommit.id());
        if (typeof count === 'undefined') return revWalk.getCommitsUntil((_commit: Commit) => true);
        return revWalk.getCommits(count);
    },
    async create(_repo: Repository | string, options: { // 添加变动并提交
        author?: Signature,
        committer?: Signature,
        message: string,
    }): Promise<Oid>{
        const repo: Repository = typeof _repo === 'string' ? await Git.Repository.open(_repo) :  _repo;
        const updateRef: Reference = await repo.getCurrentBranch();
        const defaultSignature: Signature = await config.getSignature(repo);

        const index: Index = await repo.refreshIndex();
        const oldOid: Oid = (await repo.head()).target();
        await index.addAll(); // 添加所有文件到缓存区
        await index.write(); // 将添加的文件写入到缓存区
        const newOid: Oid = await index.writeTree(); // 将添加的文件写入到GIT树
        return repo.createCommit(
            updateRef.name() /* 'HEAD' */,
            options.author ?? defaultSignature,
            options.committer ?? defaultSignature,
            options.message,
            newOid,
            [oldOid]
            );
    },
    async amend(_repo: Repository | string, options: { // 修正提交
        author?: Signature,
        committer?: Signature,
        messageEncoding?: string,
        message?: string,
        tree?: Tree | Oid
    } = {}): Promise<Oid>{
        const repo: Repository = typeof _repo === 'string' ? await Git.Repository.open(_repo) :  _repo;
        const updateRef: Reference = await repo.getCurrentBranch();
        const parentCommit: Commit = await repo.getHeadCommit();

        const index: Index = await repo.refreshIndex();
        await index.addAll(); // 添加所有文件到缓存区
        await index.write(); // 将添加的文件写入到缓存区
        const newOid: Oid = await index.writeTree(); // 将添加的文件写入到GIT树
        return parentCommit.amend(
            updateRef.name(),
            options.author ?? parentCommit.author(),
            options.committer ?? parentCommit.committer(),
            options.messageEncoding ?? parentCommit.messageEncoding(),
            options.message ?? parentCommit.message(),
            options.tree ?? newOid
        );
    },
    async push(_repo: Repository | string, hasProgress: boolean = true, _password?: string): Promise<number>{
        let progressCount = 0; // 代码推送进度
        const repo: Repository = typeof _repo === 'string' ? await Git.Repository.open(_repo) :  _repo;
        const remotes: Remote[] = await repo.getRemotes();
        const newPassword: string = _password ?? await getSSHPassword(); // 接收用户输入的密码
        const remote: Remote = remotes.length === 1 ? <Remote>remotes.shift() : await Inquirer.prompt([{ // 接收用户选择的remote仓库
            name: 'remote',
            type: 'list',
            choices: remotes.map((_remote: Remote) => _remote.name()),
            message: '请选择你要提交的远程仓库',
            filter: (answer: string) => <Remote>remotes.find((_remote: Remote) => _remote.name() === answer)
        }]).then(({remote} : {remote: Remote}) => remote);

        const currentLocaleBranch: Reference = await repo.getCurrentBranch();
        await branch.getUpstreamBranch(repo, remote); // 获取当前分支对应的上游分支

        const spinner = log.loading('正在推送代码');
        return remote.push(
            [`${currentLocaleBranch.name()}:${currentLocaleBranch.name()}`],
            <PushOptions>{
                callbacks: {
                    certificateCheck: () => 0, // 解决Mac中的libgit2无法正确查找GitHub证书
                    credentials: (_url: string, userName: string) => Git.Cred.sshKeyNew( /// 证书代理，doc: https://www.nodegit.org/guides/cloning/ssh-with-agent
                        userName,
                        SSH_PUBLIC_KEY_PATH,
                        SSH_PRIVATE_KEY_PATH,
                        newPassword
                    ),
                    transferProgress: () => { // 克隆进度
                        if(hasProgress && spinner) spinner.text = `[${progressCount ++}]推送仍在继续，请稍等🍹`;
                    }
                }
            }
        ).then((code: number) => {
            spinner.succeed('代码推送成功')
            return code;
        }).catch((err: any) => {
            spinner.fail(`代码推送失败<${err?.message}>`);
            return err;
        })
    },
    async pull(_repo: Repository | string, hasProgress: boolean = true, _password?: string, isMerge?: boolean): Promise<Oid>{ // 代码拉取，不开放mergeBranches
        const repo: Repository = typeof _repo === 'string' ? await Git.Repository.open(_repo) :  _repo;
        const remotes: Remote[] = await repo.getRemotes();
        const remote: Remote = remotes.length === 1 ? <Remote>remotes.shift() : await Inquirer.prompt([{ // 接收用户选择的remote仓库
            name: 'remote',
            type: 'list',
            choices: remotes.map((_remote: Remote) => _remote.name()),
            message: '请选择你要拉取的远程仓库',
            filter: (answer: string) => <Remote>remotes.find((_remote: Remote) => _remote.name() === answer)
        }]).then(({remote} : {remote: Remote}) => remote);
        const currentLocaleBranch: Reference = await repo.getCurrentBranch();
        const currentRemoteBranch: Reference | void = await branch.getUpstreamBranch(repo, remote);

        if (typeof currentRemoteBranch === 'undefined') { // 当前分支无上游分支禁止同步
            log.error('当前分支没有查询到关联的远程分支，拉取失败', true);
            return currentLocaleBranch.target();
        }

        await branch.fetch(repo, remote, _password, hasProgress); // 代码同步
        const spinner = log.loading('正在进行差异化回购操作');

        const pullResult: Promise<Oid> = !isMerge ? repo.rebaseBranches( // rebase
            currentLocaleBranch.name(),
            currentRemoteBranch.name(),
            '',
            await config.getSignature(_repo),
            () => Promise.resolve()
        ) : repo.mergeBranches(currentLocaleBranch, currentRemoteBranch, await config.getSignature(_repo)); // merge

        return pullResult.then((oid: Oid) => {
            spinner.succeed('差异化回购成功');
            return oid;
        }).catch((err: any) => {
            spinner.fail(`差异化回购失败<${err?.message}>`);
            return err;
        });
    }
}

export const branch = { // 分支
    async fetch(_repo: Repository | string, remote?: Remote, _password?: string, hasProgress?: boolean): Promise<void>{ // 请求同步仓库基础信息
        let progressCount = 0; // 代码拉取进度

        const repo: Repository = typeof _repo === 'string' ? await Git.Repository.open(_repo) :  _repo;
        const newPassword: string = _password ?? await getSSHPassword(); // 接收用户输入的密码
        const _hasProgress: boolean = hasProgress ?? true; // 是否有进度提示，默认为true

        const spinner = log.loading('正在同步差异化信息');
        const options: FetchOptions = { // 请求用户选择的remote
            callbacks: {
                certificateCheck: () => 0, // 解决Mac中的libgit2无法正确查找GitHub证书
                credentials: (_url: string, userName: string) => Git.Cred.sshKeyNew( /// 证书代理，doc: https://www.nodegit.org/guides/cloning/ssh-with-agent
                    userName,
                    SSH_PUBLIC_KEY_PATH,
                    SSH_PRIVATE_KEY_PATH,
                    newPassword
                ),
                transferProgress: () => { // 克隆进度
                    if(_hasProgress && spinner) spinner.text = `[${progressCount ++}]拉取仍在继续，请稍等🍹`;
                }
            }
        };

        const fetchResult: Promise<void> = typeof remote === 'undefined' ? repo.fetchAll(options)  /* 请求同步所有远程仓库 */ : repo.fetch(remote, options) /* 请求同步指定远程仓库 */;
        return fetchResult
            .then(() => { // 同步成功
                spinner.succeed('仓库分支及差异化提交同步成功');
            })
            .catch((err: any) => { // 同步失败
                spinner.fail(`仓库分支及差异化提交同步失败<${err?.message}>`);
            })
    },
    async all(_repo: Repository | string): Promise<BranchAll>{ // 获取本地仓库所有的分支[包含所有远程分支]
        const repo: Repository = typeof _repo === 'string' ? await Git.Repository.open(_repo) :  _repo;
        const refs: Reference[] = await repo.getReferences();
        return refs.reduce((acc: BranchAll, cur: Reference) => {
            acc[cur.isRemote() ? 'remotes' : 'locales'].push(cur);
            return acc;
        }, {remotes: [], locales: []});
    },
    async currentBranch(_repo: Repository | string): Promise<Reference>{
        const repo: Repository = typeof _repo === 'string' ? await Git.Repository.open(_repo) :  _repo;
        return repo.getCurrentBranch();
    },
    async create(_repo: Repository | string, name: string, originBranch?: Reference | string): Promise<Reference>{ // 创建新的分支
        const repo: Repository = typeof _repo === 'string' ? await Git.Repository.open(_repo) :  _repo;
        const commit: Commit = typeof originBranch === 'undefined' ? await repo.getHeadCommit() : await repo.getBranchCommit(originBranch); // 获取切换分支时的基准commit
        return repo.createBranch(name, commit, false);
    },
    async rename(_repo: Repository | string, name: string): Promise<Reference>{ // 修改当前分支的名称
        const currentBranch: Reference = await this.currentBranch(_repo);
        const oldName: string = currentBranch.name();
        const head: string = currentBranch.shorthand();
        const newName: string = oldName.replace(new RegExp(`${head}$`), name);
        return currentBranch.rename(newName, Number(false), '');
    },
    async reset(_repo: Repository | string, _commit: Commit | Tag | null, resetType: number = Reset.TYPE.SOFT/* 软重置，重置提交但不回退代码 */): Promise<number>{ // 重置代码
        const repo: Repository = typeof _repo === 'string' ? await Git.Repository.open(_repo) :  _repo;
        const commits: Commit[] = await commit.all(_repo); // 获取分支所有commit列表
        const rootCommit = commits.length === 0 ? await repo.getHeadCommit() : <Commit>commits.pop();
        // @ts-ignore
        rootCommit.repo = repo; // FIXME: Commit无repo属性，导致nodeGit在nebula判断时始终无法正确判断
        return Git.Reset.reset(repo, _commit ?? rootCommit, resetType, {checkoutStrategy: Git.Checkout.STRATEGY.SAFE});
    },
    async checkout(_repo: Repository | string, name: Reference | string): Promise<Reference>{ // 切换分支
        const repo: Repository = typeof _repo === 'string' ? await Git.Repository.open(_repo) :  _repo;
        const branchName: Reference = typeof name === 'string' ? await repo.getBranch(name) : name;
        return repo.checkoutBranch(branchName);
    },
    async delete(_repo: Repository | string, name: Reference | string): Promise<number>{
        const repo: Repository = typeof _repo === 'string' ? await Git.Repository.open(_repo) :  _repo;
        const branchName: Reference = typeof name === 'string' ? await repo.getBranch(name) : name;
        return Git.Branch.delete(branchName);
    },
    async deleteAll(_repo: Repository | string, hasCurrent: boolean = true): Promise<number[]>{
        const repo: Repository = typeof _repo === 'string' ? await Git.Repository.open(_repo) :  _repo;
        const refs: Reference[] = await repo.getReferences();
        const currentBranch: Reference = await repo.getCurrentBranch();
        return refs
            .filter((ref: Reference) => !ref.isRemote() && (hasCurrent || currentBranch.name() !== ref.name()))
            .map<number>((ref: Reference) => ref.delete());
    },
    async getCurrentRemotePath(_repo: Repository | string): Promise<string | null>{ // 获取当前分支的当前Remote路径
        const repo: Repository = typeof _repo === 'string' ? await Git.Repository.open(_repo) :  _repo;
        const currentLocaleBranch: Reference = await repo.getCurrentBranch();
        const config: Config = await repo.config();

        return config
            .getPath(`branch.${currentLocaleBranch.shorthand()}.merge`) // 从配置项中获取
            .then((branchName: string) => branchName.substring(11)); // 成功获取并返回删减固定前缀`refs/heads`后的字符串
    },
    async getUpstreamBranch(_repo: Repository | string, remote?: Remote | string): Promise<Reference | void>{ // 获取本地分支关联的的远程上游分支,如果没有关联则返回undefined
        const repo: Repository = typeof _repo === 'string' ? await Git.Repository.open(_repo) :  _repo;
        const remoteTarget = typeof remote === 'undefined' ? (await repo.getRemotes()).shift() : await repo.getRemote(remote); // 默认取第一个远程仓库
        const currentLocaleBranch: Reference = await repo.getCurrentBranch();
        const currentRemoteShortBranchName: string | null = await this.getCurrentRemotePath(repo) // 从配置项中获取
            .catch((_err: any) => { // 获取失败，未关联远程仓库对应的分支
                log.warning(`未获取到分支${currentLocaleBranch.shorthand()}关联的远程分支信息，正在尝试自动关联`);
                return this.setUpstreamBranch(repo, `${remoteTarget?.name()}/${currentLocaleBranch.shorthand()}`)
                    .then(() => { // 自动关联成功，重新获取
                        log.success('自动关联成功');
                        return this.getCurrentRemotePath(repo);
                    })
                    .catch((err: any) => { // 自动关联失败
                        log.warning(`自动关联失败，无法获取到当前分支对应的上游分支信息<${err?.message}>`);
                        return null;
                    }); // 尝试自动关联远程分支
            }); // 获取失败返回null

        if(typeof currentRemoteShortBranchName === 'string') {
            const currentRemoteBranchName: string = `refs/remotes/${remoteTarget?.name()}/${currentRemoteShortBranchName}`;
            return repo.getBranch(currentRemoteBranchName);
        }
    },
    async setUpstreamBranch(_repo: Repository | string, upstreamBranch: Reference | string): Promise<number>{ // 设置本地分支的上游远程仓库关联分支
        const repo: Repository = typeof _repo === 'string' ? await Git.Repository.open(_repo) :  _repo;
        const currentLocaleBranch: Reference = await repo.getCurrentBranch();
        return Git.Branch.setUpstream(currentLocaleBranch, typeof upstreamBranch === 'string' ? upstreamBranch : upstreamBranch.shorthand())
    }
}
