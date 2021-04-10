import { ModeType } from '../plugins/package';

import { dependent } from '../plugins/package';

type InstallOptions = { // 依赖安装选项(跟安装位置有关)
    [_mode in keyof typeof ModeType]?: boolean
}

interface Options extends InstallOptions{ // 其它安装可选项(安装时其余的扩展功能)
    lockfile: boolean
}

export default {
    // alias: '',
    command: 'install [package-name@version]',
    description: '安装依赖',
    options: {
        '--lockfile': '是否生成.lock锁定依赖项',
        ...Object.entries(ModeType).reduce((acc, [name, value]) => ({
            [`-${value}, --${name.toLowerCase()}`]: `安装的依赖类型${name}，将依赖安装到${name.toLowerCase()}节点`,
            ...acc
        }), Object.create(null))
    },
    action(packageName: string, options: Options): void | Promise<void> {
        const workDir: string = process.cwd();
        const models = Object.keys(ModeType).map((_mode: string) => _mode.toLowerCase()); // 安装位置的汇总
        const hasLockfile: boolean = options.lockfile ?? false;
        const mode = <keyof typeof ModeType>Object.keys(options).filter((option: string) => models.includes(option)).shift() ?? Object.keys(ModeType)[0];
        if (typeof packageName === 'undefined') {
            dependent.all(workDir);
            return;
        }
        dependent.add(workDir, {name: packageName, mode, hasLockfile});
    }

}
