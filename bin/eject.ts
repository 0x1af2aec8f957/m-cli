import fs from 'fs';
import Inquirer from "inquirer";
import path from 'path';

import { write } from '../plugins/compareDependent';
import logger from "../plugins/logger";

export default {
    // alias: '',
    command: 'eject',
    description: '暴露配置文件',
    options: {
        '--package': '仅弹出依赖配置'
    },
    async action(options: {package: boolean}): Promise<void> {
        const workDir: string = process.cwd();
        write(workDir); // 写入工程目录包描述文件
        logger.success('写入包描述文件成功');
        if(options.package) return;

        const webpackConfigPath: string = path.resolve(__dirname, '..', 'config', '.webpack.config.ts'); // cli中webpack配置文件位置
        const eslintConfigPath: string = path.resolve(__dirname, '..', 'config', '.eslintrc.json'); // cli中eslint配置文件位置
        const stylelintConfigPath: string = path.resolve(__dirname, '..', 'config', '.stylelintrc.json'); // cli中stylelint配置文件位置
        const webpackDestPath: string = path.resolve(workDir, 'webpack.config.ts'); // 需要写入的webpack目标配置文件
        const eslintDestPath: string = path.resolve(workDir, '.eslintrc.json'); // 需要写入的eslint目标配置文件
        const stylelintDestPath: string = path.resolve(workDir, '.stylelintrc.json'); // 需要写入的stylelint目标配置文件

        if (fs.existsSync(webpackDestPath)){ // 如果webpack配置文件已存在需要提示
            const isDelete = await Inquirer.prompt([{ // 接收用户输入的密码
                name: 'isDelete',
                type: 'confirm',
                message: `检测到当前工作目录中已有 webpack.config.ts 文件，是否删除？`,
                default: false,
            }]).then(({isDelete}: {isDelete: boolean}) => isDelete);

            if(!isDelete) {
                logger.error('webpack配置文件写入失败', true);
                return;
            }

            fs.rmSync(webpackDestPath, {recursive: true, force: true}); // 移除冲突的文件
            fs.copyFileSync(webpackConfigPath, webpackDestPath); // 拷贝webpack配置文件到工程目录
        }

        if (fs.existsSync(eslintConfigPath)){ // 如果eslint配置文件已存在需要提示
            const isDelete = await Inquirer.prompt([{ // 接收用户输入的密码
                name: 'isDelete',
                type: 'confirm',
                message: `检测到当前工作目录中已有 .eslintrc.json 文件，是否删除？`,
                default: false,
            }]).then(({isDelete}: {isDelete: boolean}) => isDelete);

            if(!isDelete) {
                logger.error('eslint配置文件写入失败', true);
                return;
            }

            fs.rmSync(eslintConfigPath, {recursive: true, force: true}); // 移除冲突的文件
            fs.copyFileSync(eslintConfigPath, eslintDestPath); // 拷贝eslint配置文件到工程目录
        }

        if (fs.existsSync(stylelintDestPath)){ // 如果stylelint配置文件已存在需要提示
            const isDelete = await Inquirer.prompt([{ // 接收用户输入的密码
                name: 'isDelete',
                type: 'confirm',
                message: `检测到当前工作目录中已有 .stylelintrc.json 文件，是否删除？`,
                default: false,
            }]).then(({isDelete}: {isDelete: boolean}) => isDelete);

            if(!isDelete) {
                logger.error('stylelint配置文件写入失败', true);
                return;
            }

            fs.rmSync(stylelintDestPath, {recursive: true, force: true}); // 移除冲突的文件
            fs.copyFileSync(stylelintConfigPath, stylelintDestPath); // 拷贝stylelint配置文件到工程目录
        }

    }

}
