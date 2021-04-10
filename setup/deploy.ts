/// 配置文件读写
// import type {DotenvParseOutput} from 'dotenv';

import fs from 'fs';
import env from 'dotenv';
import moment from 'moment';
// import process from 'process';

import log from '../plugins/logger';
import { CONFIG_FILE_PATH, USER_DETAILS, CONFIG_KEY } from '../utils/constant';

type DotenvParseOutput = { // 配置文件获取的对象
    [name in CONFIG_KEY]: string;
};

const packageInfo = require('../package.json');

/**
 * 读取配置文件
 *
 * @param {string} key 读取的对象，不传代表读取所有配置项
 * @return {DotenvParseOutput | string} 读取的内容
 */
export function read(key?: CONFIG_KEY): DotenvParseOutput | string{ // 读取配置文件
    if (!fs.existsSync(CONFIG_FILE_PATH)) return key ? null : Object.create(null);
    const source = <DotenvParseOutput>env.parse(fs.readFileSync(CONFIG_FILE_PATH, {encoding: "utf-8"}));
    if (key) return source[key];
    return source;
}

/**
 * 写入配置文件
 *
 * @param {DotenvParseOutput} _env 写入的对象，由key和value键值对组成
 * @param {boolean} hasWarningTip 是否提示写入时的覆盖警告
 * @return {Boolean} 是否写入成功
 */
export function write(_env: DotenvParseOutput, hasWarningTip: boolean = true): boolean{ // 写入配置文件
    const source = <DotenvParseOutput>read(); // 读取已有的配置文件中的配置项
    const writeKeys = <CONFIG_KEY[]>Object.keys(_env); // 待写入配置文件的key属性[所有]
    const conflict: CONFIG_KEY[] = Object.keys(source).reduce<CONFIG_KEY[]>((acc, cur) => writeKeys.includes(<CONFIG_KEY>cur) ? [...acc, <CONFIG_KEY>cur] : acc, []); // 发生冲突的配置项
    if (conflict.length > 0 && hasWarningTip){
        log.warning(`配置文件已有 ${conflict.join('|')} 配置，正在准备复写`);
    }

    const spinner = log.loading(`正在写入 ${writeKeys.join('|')}`);
    const writeData: string = Object.entries(Object.assign(null, source, _env)).reduce<string>((acc, [name, value]) => acc + `${name}=${value}\n`, `#[${packageInfo.name}-config]Created by ${USER_DETAILS.username} in ${moment().format('YYYY-MM-DD h:mm:ss a')}\n`); // 写入的配置(源配置+新配置)，冲突会自动处理为覆盖

    try{
        fs.writeFileSync(CONFIG_FILE_PATH, Buffer.from(writeData, 'utf-8'));
        spinner.succeed('写入成功');
        return true;
    }catch (err: any){
        spinner.fail('写入失败');
        return false;
    }
}

/**
 * 弹出配置文件中所有的key值
 *
 * @return {Array<string>} 配置文件中所有的key值
 */
export function ejectKey(): CONFIG_KEY[]{ // 读取配置文件所有key属性
    return <CONFIG_KEY[]>Object.keys(<DotenvParseOutput>read());
}

/**
 * 弹出配置文件中所有的value值
 *
 * @return {Array<string>} 配置文件中所有的value值
 */
export function ejectValue(): string[]{ // 读取配置文件所有value值
    return Object.values(<DotenvParseOutput>read());
}

/**
 * 修改配置文件配置项
 *
 * @param {string} key 修改配置文件项的属性
 * @param {string} value 修改配置文件项的属性值
 * @return {Boolean} 是否修改成功
 */
export function modify(key: CONFIG_KEY, value: string): boolean{ // 修改配置文件配置项
    const writeKey: CONFIG_KEY[] = ejectKey();
    if (!writeKey.includes(key)) log.error(`配置文件没有 ${key} 项，修改失败`, true);
    return write(<DotenvParseOutput>{[key]: value}, false);
}
