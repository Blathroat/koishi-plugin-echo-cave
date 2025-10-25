import { Context } from 'koishi';
import { CQCode } from 'koishi-plugin-adapter-onebot';
import { Message } from 'koishi-plugin-adapter-onebot/lib/types';
import { saveImages } from './image-helper';

export async function reconstructForwardMsg(
    ctx: Context,
    message: Message[]
): Promise<CQCode[]> {
    return Promise.all(
        message.map(async (msg: Message) => {
            const content = await processMessageContent(ctx, msg);

            return {
                type: 'node',
                data: {
                    user_id: msg.sender.user_id,
                    nick_name: msg.sender.nickname,
                    content,
                },
            };
        })
    );
}

async function processMessageContent(
    ctx: Context,
    msg: Message
): Promise<string | CQCode[]> {
    // deal with text message
    if (typeof msg.message === 'string') {
        return msg.message;
    }

    // deal with forward message
    const firstElement = msg.message[0];
    if (firstElement?.type === 'forward') {
        return reconstructForwardMsg(ctx, firstElement.data.content);
    }

    // deal with normal message
    return Promise.all(
        msg.message.map(async (element) => {
            if (element.type === 'image') {
                return {
                    ...element,
                    data: {
                        ...element.data,
                        url: await saveImages(ctx, element.data),
                    },
                };
            }

            return element;
        })
    );
}
