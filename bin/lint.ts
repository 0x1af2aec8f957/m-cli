import type {GlobbyOptions} from 'globby';
// import type {LintResult} from 'eslint';
import type {LinterResult} from 'stylelint';

import { bold } from "colors";
import path from "path";
import { ESLint } from 'eslint';
import StyleLint from 'stylelint';

import log from '../plugins/logger';

export default {
    // alias: '',
    command: 'lint [type]',
    description: '代码审查',
    options: {
        '-f, --fix': '自动修复',
    },
    async action(type: 'style' | 'js' | undefined, options: {fix: true}): Promise<void> {
        const worDir: string = process.cwd();
        const eslintConfigPath: string = path.resolve(__dirname, '..', 'config', '.eslintrc.json'); // cli中eslint配置文件位置
        const stylelintConfigPath: string = path.resolve(__dirname, '..', 'config', '.stylelintrc.json'); // cli中stylelint配置文件位置

        if (!type || type === 'js') {
            const extensions: string[] = ['js', 'vue', 'ts', 'jsx']; // 代码扩展文件名的数组
            const spinner = log.loading(`[ECMASCRIPT-LINT]正在审查`);
            const _eslint: ESLint = new ESLint({
                cwd: worDir, // 工作目录的目录的路径
                fix: options.fix, // 是否自动修复
                useEslintrc: false, // 不加载.eslintrc.json配置文件
                errorOnUnmatchedPattern: false, // --no-error-on-unmatched-pattern
                // resolvePluginsRelativeTo: path.resolve(__dirname, '..', 'node_modules'),
                extensions, // 检查代码扩展文件名的数组
                baseConfig: require(eslintConfigPath), // 设置为与Schema具有相同架构的配置对象.eslintrc.*
                // ignorePath: path.resolve(worDir, 'node_modules') // 要忽略的检测路径[.eslintignore]
            });

            try{
                const results: ESLint.LintResult[] = await _eslint.lintFiles(extensions.map((extension: string) => `${worDir}/**/*.${extension}`));
                const filteredResults: ESLint.LintResult[] = ESLint.getErrorResults(results);
                const result = filteredResults.reduce((acc, {errorCount, warningCount, fixableErrorCount, fixableWarningCount}) => {
                    acc.errorCount += errorCount;
                    acc.warningCount += warningCount;
                    acc.fixableErrorCount += fixableErrorCount;
                    acc.fixableWarningCount += fixableWarningCount;
                    return acc;
                }, {
                    errorCount: 0,
                    warningCount: 0,
                    fixableWarningCount: 0,
                    fixableErrorCount: 0,
                });
                spinner.succeed(`[ECMASCRIPT-LINT]审查成功 -> ${bold(String(result.errorCount))}(${result.fixableErrorCount}) 个错误，${bold(String(result.warningCount))}(${result.fixableWarningCount}) 个警告`);
            }catch (err: any){
                log.failed(`[ECMASCRIPT-LINT]审查失败<${err?.message}>`);
            }

        }

        if (!type || type === 'style') {
            const spinner = log.loading(`[STYLE-LINT]正在审查`);
            try{
                const _stylelint: LinterResult = await StyleLint.lint({
                    // @ts-ignore
                    globbyOptions: <GlobbyOptions>{ /// doc: https://github.com/sindresorhus/globby#options
                        cwd: worDir // // 工作目录的目录的路径
                    },
                    fix: options.fix, // 自动修复
                    config: require(stylelintConfigPath), // stylelint不会再次使用.stylelintrc文件
                    files: '**/*.(vue|htm|html|css|style|styl|less|(s(c|a)ss))' // 检测的文件全局或文件全局数组
                });

                const result: number = _stylelint.results
                    .filter((result) => result.errored)
                    .reduce((acc, {errored}) => acc + Number(errored), 0);

                spinner.succeed(`[STYLE-LINT]审查成功 -> ${bold(String(result))} 个错误`);
            }catch (err: any){
                spinner.fail(`[STYLE-LINT]审查失败<${err?.message}>`)
            }

        }

    }

}
