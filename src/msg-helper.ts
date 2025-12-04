import { processMediaElement } from './image-helper';
import { CQCode } from '@pynickle/koishi-plugin-adapter-onebot';
import { Context } from 'koishi';

export async function processMessageContent(ctx: Context, msg: CQCode[]): Promise<CQCode[]> {
    return Promise.all(
        msg.map(async (element) => {
            if (element.type === 'reply') {
                return element;
            }
            return processMediaElement(ctx, element);
        })
    );
}
