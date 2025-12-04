import { processMediaElement } from './image-helper';
import { Config } from './index';
import { CQCode } from '@pynickle/koishi-plugin-adapter-onebot';
import { Message } from '@pynickle/koishi-plugin-adapter-onebot/lib/types';
import { Context } from 'koishi';

export async function reconstructForwardMsg(
    ctx: Context,
    message: Message[],
    cfg: Config
): Promise<CQCode[]> {
    return Promise.all(
        message.map(async (msg: Message) => {
            const content = await processForwardMessageContent(ctx, msg, cfg);

            return {
                type: 'node',
                data: {
                    user_id: msg.sender.user_id,
                    nickname: msg.sender.nickname,
                    content,
                },
            };
        })
    );
}

async function processForwardMessageContent(
    ctx: Context,
    msg: Message,
    cfg: Config
): Promise<string | CQCode[]> {
    // deal with text message
    if (typeof msg.message === 'string') {
        return msg.message;
    }

    // deal with forward message
    const firstElement = msg.message[0];
    if (firstElement?.type === 'forward') {
        return reconstructForwardMsg(ctx, firstElement.data.content, cfg);
    }

    // deal with normal message
    return Promise.all(
        msg.message.map(async (element) => {
            return processMediaElement(ctx, element, cfg);
        })
    );
}
