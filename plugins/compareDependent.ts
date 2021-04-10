/// 依赖对比
import path from 'path';
import fs from 'fs';

import log from './logger';
import selfPackage from '../package.json'; // 项目本身的包描述文件

const workDir: string = process.cwd();
const peerDependencies: typeof selfPackage.optionalDependencies = selfPackage.optionalDependencies; // 与工作项目具有共性依赖的依赖项

export function eject(): typeof peerDependencies{ // 弹出依赖[cli预置的外部项目所需依赖]
    return peerDependencies;
}

export function share(_workDir: string = workDir): {[name in keyof typeof peerDependencies]: string}{ // 提取共用的依赖[cli预置与实际工作目录的依赖对比]
    const workPackage = require(path.resolve(_workDir, 'package.json')); // 实际项目的包描述文件
    const devDependencies = workPackage.devDependencies; // 工作目录中的开发依赖
    return <{[name in keyof typeof peerDependencies]: string}>
        Object.entries(eject())
            .filter(([name]: [string, string]) => Object.keys(devDependencies).includes(name))
            .reduce((acc, [name, version]) => ({...acc, [name]: version}), {});
}

export function clear(_workDir: string = workDir): void{ // 移除共性依赖[会删除node_modules内包文件夹]
    const workPackagePath = path.resolve(_workDir, 'package.json');
    const workPackageContent = require(workPackagePath); // 实际项目的包描述文件
    const devDependencies = workPackageContent.devDependencies;
    const sharePack = share(_workDir);

    Object.keys(workPackageContent.devDependencies).forEach((name: keyof typeof devDependencies) => {
        // @ts-ignore
        if (typeof sharePack[name] !== 'undefined') {
            delete devDependencies[name]; // 删除工作目录中的共性依赖包

            const removePath: string = path.resolve(_workDir, 'node_modules', <string>name);
            fs.rmSync(removePath, {recursive: true, force: true}); // 移除依赖包[非解除递归依赖]
        }
    });

    fs.writeFileSync(workPackagePath, JSON.stringify(workPackageContent, null, 2)); // 重写包描述文件
}

export function write(_workDir: string = workDir): void{ // 添加共性依赖[不自动安装]
    const workPackagePath = path.resolve(_workDir, 'package.json');
    const workPackageContent = require(workPackagePath); // 实际项目的包描述文件
    const devDependencies = workPackageContent.devDependencies;
    // const peerDependencies = eject();
    Object.entries(peerDependencies).forEach(([name, version]) => {
        const oldDependentVersion: string = devDependencies[name];
        if (typeof oldDependentVersion !== 'undefined') log.warning(`[${name}]发现项目已存在该软件包，已将历史版本(${oldDependentVersion})替换到${version}版本`);
        devDependencies[name] = version;
    });

    fs.writeFileSync(workPackagePath, JSON.stringify(workPackageContent, null, 2)); // 重写包描述文件
}
