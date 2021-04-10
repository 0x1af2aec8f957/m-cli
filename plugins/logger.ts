/// 本页所有颜文字都来自: https://emojixd.com
import {
    red,
    blue,
    yellow
} from 'colors'; /// doc: https://github.com/Marak/colors.js
import ora from 'ora';

interface LoggerType{
    success(text: string): void;
    error(text: string, isExit: boolean): void;
    failed(text: string, isExit: boolean): void;
    warning(text: string): void;
    loading(text: string): ora.Ora;
}

export class Logger implements LoggerType{
    log(...texts: string[]): void{ // 普通文本打印
        console.log(...texts);
    };

    success(text: string): void{ // 成功
        console.log(`👍  ${blue(text)}`);
    };

    error(text: string, isExit: boolean = false): void{ // 错误
        console.log(`🙌  ${red(text)}`);
        if (isExit) process.exit(1);
    };

    failed(text: string, isExit: boolean = false): void{ // 失败
        console.log(`👎  ${red(text)}`);
        if (isExit) process.exit(1);
    }

    warning(text: string): void{ // 警告
        console.log(`🙏  ${yellow(text)}`);
    }

    loading(text: string): ora.Ora{ // 加载中
        return ora(text).start()
    }
}

export default new Logger();
