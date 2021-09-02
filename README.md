#### m-cli

#### 前置条件

- node.version >= 11.0.0
- 需要将[ssh-agent](https://docs.github.com/en/github/authenticating-to-github/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent)存放在`~/.ssh`目录中

#### 内部`运行时`说明

> 为了便于维护和发布，`cli`在内部使用[ts-node](https://github.com/TypeStrong/ts-node)在运行时动态编译[TypeScript](https://www.typescriptlang.org)后才会运行代码，这可能会降低运行速度。

#### 安装或升级

##### Yarn[推荐]
```bash
yarn global add git+ssh://git@github.com:0x1af2aec8f957/m-cli.git # 官方源安装
yarn global add git+ssh://git@github.com:0x1af2aec8f957/m-cli.git --registry=https://registry.npm.taobao.org # 代理源加速安装
```

##### Npm(推荐)
```bash
npm install -g git+ssh://git@github.com:0x1af2aec8f957/m-cli.git # 官方源安装
npm install -g git+ssh://git@github.com:0x1af2aec8f957/m-cli.git --registry=https://registry.npm.taobao.org # 代理源加速安装
```

#### CLI内部技术说明
> 在`cli`使用的环境中无需安装`Git` `Webpack` `npm` `yarn`等，除了`Node`是必要的解析环境外，其它均为可选。  
> 程序运行期间尽可能不使用外部的环境依赖(如：`GIT`等)。

1. `cli`在内部主要以`webpack`为打包技术栈对项目进行打包。
2. `cli`在内部维护了自身运行及项目运行时必要的配置文件，你可以使用命令对其进行弹出。
3. `cli`内部使用的依赖管理设计模式参考[YARN](https://classic.yarnpkg.com/blog/2017/07/11/lets-dev-a-package-manager/)来设计完成，当前处于初始设计阶段。
4. `cli`内部使用[NodeGit](https://github.com/nodegit/nodegit)来管理Git信息。

#### 帮助文档输出

```bash
m-serve -h # 输出cli整体帮助
m-serve create -h # 输出create单个命令的帮助文档
```

#### 使用说明

##### tree
> 目录预览

```bash
m-serve --tree # 输出当前目录的树状结构
```

##### build
> 项目打包

```bash
m-serve build # 使用cli内置的配置打包
m-serve build --config webpack.config.ts # 使用工作目录的webpack.config.ts配置文件进行打包
m-serve build --zip # 打包生成zip压缩包(原始资源不会被删除)
m-serve build --force # 打包文件会覆盖历史打包文件
```

##### bundle
> 文件/代码 捆绑输出

```bash
m-serve bundle main.ts # 导出main.ts文件(会将文件内部的相关依赖整体导出，这对打包node.js应用非常友好)
m-serve bundle --config webpack.config.ts # 使用工作目录的webpack.config.ts配置文件进行导出
m-serve bundle main.ts --env 'ENV=production' # main.ts内部能够获取到ENV环境变量，值为production
```

##### create
> 项目创建

```bash
m-serve create # 创建Vue应用，等同于使用 m-serve create -t vue
m-serve create flutter  # 创建Flutter应用
m-serve create test  # 在Gitee上拉取elementUI库创建一个临时项目用于测试
m-serve create --init # 创建并初始化一个Vue项目,大多数情况不需要添加init选项来创建项目，通过init创建的项目后续可弹出配置文件进行深度修改
```

##### doc
> 文档生成

```bash
m-serve doc # 自动生成项目注释文档[可参阅deno生成的代码文档]
m-serve doc test # 自动生成提测文档
```

##### doctor
> 环境诊断

```bash
m-serve doctor # cli环境诊断
```

##### eject
> 项目弹出

```bash
m-serve eject # 暴露配置文件，与 react-scripts eject 有着同样的功效，但不会帮你自动安装依赖
```

##### ftp
> `FTP`附加命令  

#### gco
> 切换分支  
> m-serve git-checkout 等价于 m-serve gco

```bash
m-serve gco dev # 切换到dev分支
m-serve gco dev -b # 基于当前分支的代码创建并切换到dev分支
m-serve gco dev origin/master -b # 基于远程origin仓库master分支的代码创建并切换到dev分支
m-serve gco dev -b --rebase # 基于当前分支的代码创建并切换到dev分支,dev分支的代码提交记录会被重置到根提交节点
```

#### gc
> 代码提交  
> m-serve git-commit 等价于 m-serve gc

```bash
m-serve gc 'first commit' # 提交代码，first commit是提交消息
m-serve gc 'first commit' -p # 提交代码，first commit是提交消息，并推送到远程仓库
m-serve gc --amend # 追加提交到父级节点，不会产生新的提交记录
m-serve gc -t feat # 提交代码，提交类型为feat(新增)
m-serve gc -t feat --source 5678 # 提交代码，提交类型为feat(新增)，需求来源ID为5678
```

#### gmt
> [分支级]代码合并  
> m-serve merge-to 等价于 m-serve gmt  
> 该命令与同时使用`git reset` `git cherry-pick`等效  
> ！注意：该命令不会新建临时分支进行操作，这意味着操作完成后当前分支的代码提交信息会发生变更

```bash
m-serve gmt master # 将当前分支的代码合并到master分支，合并后只会产生一条提交记录
```

#### gl
> 代码拉取/同步  
> m-serve git-pull 等价于 m-serve gl

```bash
m-serve gl # 拉取/同步 远程仓库的代码
m-serve gl origin # 拉取/同步 远程仓库为origin的代码，这对多个remote仓库管理非常有效
```

#### gp
> 代码推送  
> m-serve git-push 等价于 m-serve gp

```bash
m-serve gp # 将本地提交推送到远程仓库
m-serve gp origin # 将本地提交推送到远程origin仓库，这对多个remote仓库管理非常有效
```

#### install
> 添加项目依赖  
> ~~该命令不会生成任何.lock形式的文件，也不会被缓存~~
> 该命令使用`https://registry.npm.taobao.org`为主源地址

```bash
m-serve isntall # 安装项目依赖
m-serve isntall --lockfile # 安装项目依赖,并生成.lock文件锁定依赖项用于yarn缓存
m-serve isntall webpack # 安装webpack最新版本到项目的dependencies中
m-serve isntall webpack -D # 安装webpack最新版本到项目的devDependencies中
```

#### lint
> 代码审查

```bash
m-serve lint # 代码审查
```

#### remove
> 依赖移除  
> 该命令仍在建设中，当前为硬删除，不会递归分析删除软件包自身的其它依赖包

```bash
m-serve remove webpack # 移除webpack依赖
```

#### run
> 启动项目

```bash
m-serve run # 使用cli内置的配置启动项目
m-serve run main.ts # 使用cli内置的配置启动项目，入口文件为 main.ts
m-serve --config webpack.config.ts # 使用工作目录中 webpack.config.ts 配置启动项目
```

#### upgrade
> `cli`自升级

```bash
m-serve upgrade # cli检测版本并自我升级
```

#### webpack配置无法满足需求？

如果你使用过[vue-cli](https://cli.vuejs.org)，修改配置将轻而易举。`cli`内部与其一样使用了[webpack-chain](https://github.com/neutrinojs/webpack-chain)管理配置文件。  
`cli`运行时会检测工作目录跟目录中是否包含文件`webpack.custom.ts`、`webpack.custom.js`，如果包含会将内部配置传递过来(你可以将其看作`vue-cli`中的`chainWebpack`属性)。你可以进行颗粒级别的修改。  
如需添加或移除`cli`内部配置可参考[Vue-cli·链式操作 (高级)](https://cli.vuejs.org/zh/guide/webpack.html#%E9%93%BE%E5%BC%8F%E6%93%8D%E4%BD%9C-%E9%AB%98%E7%BA%A7)
```typescript
// @workDir/webpack.custom
// @ts-ignore
import type Config from 'webpack-chain';

export default (config: Config) => {
    // console.log('webpack的详细配置：', config.toString());

    config.devServer
        .hot(true);

    /// 自定义或颗粒化修正webpack.config
    Object.keys(config.module.rule('scss').oneOfs.entries()).forEach((name: string) => { // 批量向sass-loader注入配置
        config.module
            .rule('scss')
            .oneOf(name)
            .use('sass')
            .tap((options) => ({ // 修改sass配置项
                additionalData: '@import "@/assets/stylesheet/variables.scss";', // 新增全局变量文件
                ...options
            }));
    });
};

```

#### 需要使用webpack进行代理数据？

> 你可自行整理文件夹结构，此处仅为DEMO。

```typescript
// @workDir/webpack.custom
import { responseInterceptor, Options, fixRequestBody } from 'http-proxy-middleware';
import axios from 'axios';
import type * as http from 'http';
// @ts-ignore
import type Config from 'webpack-chain';

type _Cookie = false | string | {
    [domain: string]: string
};

const certificatePaylod = new Map(); // 代理时的授权访问凭证, 开发SaaS产品时需要自动登录完成授权在这里非常容易
export interface DevServerProxy { // doc: https://github.com/chimurai/http-proxy-middleware#http-proxy-options
    [path: string]: Options
}

const proxy: DevServerProxy = {
    '/api': {
        // target: 'http://192.168.3.1:5001',
        target: 'https://www.example.com',
        changeOrigin: true,
        selfHandleResponse: true, // 开启拦截来自上游的响应 responseInterceptor, 如果不需要走 onProxyRes|onProxyReq 这里需要设置为false
        /* pathRewrite: {
            '^/': '', // rewrite...
        }, */
        onProxyReq(proxyReq, req: http.IncomingMessage, res: http.ServerResponse) {
            // add custom header to request
            certificatePaylod.set('domain', `${proxyReq.protocol}//${proxyReq.host}`/* 代理配置中的 target 属性值 */); // 设置许可域
            if (certificatePaylod.has('token')) proxyReq.setHeader('token', certificatePaylod.get('token')); // 如果 certificatePaylod 存在 token凭证 则自动写入header
            // or log the req
        },
        onProxyRes: responseInterceptor(async (responseBuffer: Buffer, proxyRes: http.IncomingMessage, req: http.IncomingMessage, res: http.ServerResponse) => {
            const response = responseBuffer.toString('utf8'); // 从代理目标获取到的数据
            const result = JSON.parse(response); // 数据源解析成JSON格式

            if (result.code === '403') { // 登录凭证过期
                await axios.post(`${certificatePaylod.get('domain')}/login`, { // 处理自动授权登录并保存访问凭证
                    userName: "example@example.com",
                    password: "example"
                }, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).then(({headers, data}) => {
                    if (headers.token) certificatePaylod.set('token', headers.token); // 存储token
                    if (data.id) certificatePaylod.set('userId', data.userId); // 存储userId
                    console.log(`已自动完成登录授权，授权用户 -> ${certificatePaylod.get('userId')}`);
                });

                return JSON.stringify({ // manipulate response and return the result
                    code: 'http-proxy-middleware-error',
                    message: 'http-proxy-middleware-error: 登录失效，已自动重新登录，请刷新界面'
                });
            }

            return response;
        })
    }
};

export default (config: Config) => {
    config.devServer // doc: https://github.com/chimurai/http-proxy-middleware#proxycontext-config
        .proxy(httpProxy)
        .end();
};
```

#### 需要使用webpack进行mock数据？

> 你可自行整理文件夹结构，此处仅为DEMO。

```typescript
// @workDir/webpack.custom
// @ts-ignore
import type Config from 'webpack-chain';
import express, { Request, Response, NextFunction } from 'express';

const mockInstance: (app: express.Application) => void = (app: express.Application) => {
    app
        .get('/mock/test', (req: Request, res: Response, next: NextFunction) => {
            res.json({ status: 1, data: { name: 'webpack.before.service.mock_module_1' } });
        })
        .get('/mock/ping', (req: Request, res: Response, next: NextFunction) => {
            res.json({ status: 1, data: { name: 'webpack.before.service.mock_module_1.ping' } });
        });
}

export default (config: Config) => {
    config.devServer // doc: https://github.com/chimurai/http-proxy-middleware#proxycontext-config
        .before(mockInstance)
        .end();
};
```

#### 需要使用`cli`安装私有源(或内部)软件包？

> 请在你的工作目录根目录新建`.yarnrc`文件进行配置。为了确保安装过程能够更加稳定无误，`cli`不会给出命令行配置的接口。

```bash
# .yarnrc
@package-example:registry=http://dev.example.com/repository
```

#### 在Windows上安装时发生错误？

1. 提示`cache-loader`与`webpack`版本不符？

```bash
# 报错示例
npm WARN ERESOLVE overriding peer dependency
npm WARN Found: webpack@5.26.2
npm WARN node_modules/m-cli/node_modules/webpack
npm WARN   optional webpack@"^5.20.0" from m-cli@0.0.1
npm WARN   node_modules/m-cli
npm WARN    m-cli@"git+ssh://git@github.com:0x1af2aec8f957/m-cli.git" from the root project
npm WARN   1 more (babel-loader)
npm WARN
npm WARN Could not resolve dependency:
npm WARN peer webpack@"^4.0.0" from cache-loader@4.1.0
npm WARN node_modules/m-cli/node_modules/cache-loader
npm WARN   optional cache-loader@"^4.1.0" fromm-cli@0.0.1
npm WARN   node_modules/m-cli
```

这是因为`webpack5`自带了cache配置项，[cache-loader](https://github.com/webpack-contrib/cache-loader)现已归档不在维护，但是`webpack-chain`尚未支持`webpack5`该项配置，如果因为此问题导致安装退出请在`install`命令后追加`--force`来获得解决。

2. 由`node-gyp`在rebuild`nodegit`的过程中发出错误？

```bash
# 报错示例
stack Error: Can't find Python executable "python2.7", you can set the PYTHON env variable.
```

这是因为`nodeGit`所依赖的`node-gyp`需要在安装时运行编译，`node-gyp`对`Windows`支持不够友好，请将你的`nodejs`版本改为`32位`即可解决。
如果还是无法解决请参考[安装node-gyp](https://www.cnblogs.com/wangyuxue/p/11218113.html)，来获得解决方案。
