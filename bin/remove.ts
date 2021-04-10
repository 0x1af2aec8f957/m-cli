import { dependent } from '../plugins/package';

export default {
    // alias: '',
    command: 'remove [package-name]',
    description: '删除依赖(硬删除，不会进行递归分析引用关系)',
    options: {},
    action(packageName: string, _options: {}): void | Promise<void> {
        const workDir: string = process.cwd();
        dependent.remove(workDir, packageName);
    }

}
