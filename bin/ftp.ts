import logger from '../plugins/logger';

export default {
    // alias: '',
    command: 'ftp <command>',
    description: 'FTP服务器[附加]',
    options: {

    },
    action(_type: string, _options: {}): void | Promise<void> {
        logger.error('该命令尚未设计，与此相关的命令服务均不可用', true);
    }

}
