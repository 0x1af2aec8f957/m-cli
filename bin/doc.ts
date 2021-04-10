import logger from "../plugins/logger";

export default {
    // alias: '',
    command: 'doc [type]',
    description: '文档生成',
    options: {},
    action(_type: string, _options: {}): void | Promise<void> {
        logger.error('该命令尚未设计，与此相关的命令服务均不可用', true);
    }

}
