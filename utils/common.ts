import { Dirent } from "fs";
import Inquirer from "inquirer";
import * as path from 'path';
import * as fs from 'fs';

/**
 * 深度查找文件集合
 * @param {string} _path 需要查询的路径
 * @param {RegExp} ext 需要过滤的文件名字的正则表达式
 * @returns {string[]} _path路径下所有经过ext测试通过的文件路径集合
 */
export function fileDeps(_path: string, ext: RegExp = /[\S\s]/): string[]{ // Webpack.require.context实现
    // @ts-ignore
    return fs.readdirSync(_path, { withFileTypes: true }).reduce((manifest/* files */: string[], file: Dirent) => {
        const { name }: { name: string } = file;
        if (__filename === path.join(_path, name)) return manifest; // 排除本文件

        if (file.isDirectory()) { // 目录递归
            return manifest.concat(fileDeps(path.resolve(_path, file.name), ext));
        }

        return ext.test(path.extname(name)) ? manifest.concat(path.resolve(_path, name)) : manifest; // 匹配符合规则的文件
    }, <unknown>[]);
}

/**
 * 获取生成ssh的秘钥字符串
 * @returns {Promise<string>} 返回Promise秘钥字符串
 */
export function getSSHPassword(): Promise<string>{
    return Inquirer.prompt([{ // 接收用户输入的密码
        name: 'password',
        type: 'password',
        message: '请输入你的ssh证书生成密码',
        mask: '*',
        default: '',
    }]).then(({password}: {password: string}) => password);
}

/**
 * 去除数组中无用的值（如：空字符串、undefined、null等），会保留false、0值
 * @param {any[]} arr 需要筛选过滤的数组
 * @returns {any[]} 返回处理过后的数组
 */
export function filterActual<T> (arr: any[]){
    return <T[]>arr.filter((item: T) => ['boolean', 'number'].includes(typeof item) || Boolean(item));
}
