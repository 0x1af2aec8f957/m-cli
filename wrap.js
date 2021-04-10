#!/usr/bin/env node
/// 外层入口文件，用于解析内部ts代码
/// 不通过tsc编译后的方式运行，直接运行ts源代码，便于维护和发布

/// 运行时[运行环境]判断
const { spawnSync } = require('child_process');
const npmGlobalPath = ((_buffer) => !!_buffer ? Buffer.from(_buffer).toString().replace(/\n/gim, '') : _buffer)(spawnSync('npm', ['config', 'get', 'prefix'], {cwd: __dirname}).stdout); // 获取npm全局路径
const yarnGlobalPath = ((_buffer) => !!_buffer ? Buffer.from(_buffer).toString().replace(/\n/gim, '') : _buffer)(spawnSync('yarn', ['global', 'dir'], {cwd: __dirname}).stdout); // 获取yarn全局路径
const isProduction = new RegExp(`^(${yarnGlobalPath}|${npmGlobalPath})`).test(require.main.path ?? __dirname); // 获取用户运行的程序是否被安装[用来变相判断是否是生产使用环境]

/// 主程序代码
module.exports = (() => require('./main.ts') /* 主文件执行 */ )(require('ts-node').register({ // TypeScript.require模块注册
    dir: __dirname, /* tsconfig.json的基准位置 */
    transpileOnly: isProduction, // 生产环境丢失类型检查
    // files: false,
    /// NOTE: 如使用tsconfig配置文件请忽略如下配置
    /* ignore: ["node_modules"], // 忽略的路径
    compilerOptions:{
        // "incremental": true,                   /!* 增量编译 提高编译速度*!/
        "allowJs": true,
        "target": "ESNext",                       /!* 编译目标ES版本*!/
        "module": "CommonJS",                     /!* 编译目标模块系统*!/
        // "lib": [],                             /!* 编译过程中需要引入的库文件列表*!/
        "declaration": true,                      /!* 编译时创建声明文件 *!/
        // "outDir": "dist",                         /!* ts编译输出目录 *!/
        // "rootDir": "src",                         /!* ts编译根目录. *!/
        "importHelpers": true,                 /!* 从tslib导入辅助工具函数(如__importDefault)*!/
        "strict": true,                        /!* 严格模式开关 等价于noImplicitAny、strictNullChecks、strictFunctionTypes、strictBindCallApply等设置true *!/
        "noUnusedLocals": true,                   /!* 未使用局部变量报错*!/
        "noUnusedParameters": true,               /!* 未使用参数报错*!/
        "noImplicitReturns": true,                /!* 有代码路径没有返回值时报错*!/
        "noFallthroughCasesInSwitch": true,       /!* 不允许switch的case语句贯穿*!/
        "moduleResolution": "node",               /!* 模块解析策略 *!/
        "resolveJsonModule": true,                /!* import()支持JSON *!/
        "typeRoots": [                            /!* 要包含的类型声明文件路径列表*!/
            "./typings",
            "./node_modules/@types"
        ],
        "allowSyntheticDefaultImports": true,    /!* 允许从没有设置默认导出的模块中默认导入，仅用于提示，不影响编译结果*!/
        "esModuleInterop": true                  /!* 允许编译生成文件时，在代码中注入工具类(__importDefault、__importStar)对ESM与commonjs混用情况做兼容处理*!/
    } */
}));
