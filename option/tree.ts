// @ts-ignore
import tree from 'tree-node-cli';

import logger from '../plugins/logger';

export default {
    flags: '-t, --tree',
    description: '目录树状结构',
    action(){
        const workDir: string = process.cwd();
        logger.log('目录树信息:\n', tree(workDir));
        process.exit(0);
    },
}
