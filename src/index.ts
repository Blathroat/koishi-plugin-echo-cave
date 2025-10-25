import fs from 'fs';
import { Context, Schema, Session, h } from 'koishi';
import 'koishi-plugin-adapter-onebot';
import { CQCode } from 'koishi-plugin-adapter-onebot';
import { Message } from 'koishi-plugin-adapter-onebot/lib/types';
import path from 'node:path';
import { saveImages } from './image-helper';

export const name = 'echo-cave';

export const inject = ['database'];

export interface Config {}

export const Config: Schema<Config> = Schema.object({});

export interface EchoCave {
    id: number;
    channelId: string;
    createTime: Date;
    userId: string;
    originUserId: string;
    type: 'forward' | 'msg';
    content: string;
}

declare module 'koishi' {
    interface Tables {
        echo_cave: EchoCave;
    }
}

export function apply(ctx: Context) {
    const imgPath = path.join(ctx.baseDir, 'data', 'cave', 'images');

    if (!fs.existsSync(imgPath)) {
        fs.mkdirSync(imgPath, { recursive: true });
    }

    ctx.model.extend(
        'echo_cave',
        {
            id: 'unsigned',
            channelId: 'string',
            createTime: 'timestamp',
            userId: 'string',
            originUserId: 'string',
            type: 'string',
            content: 'text',
        },
        {
            primary: 'id',
            autoInc: true,
            unique: ['content'],
        }
    );

    ctx.command('cave', '随机获取回声洞消息').action(
        async ({ session }) => await getCave(ctx, session)
    );

    ctx.command('cave.echo', '将消息存入回声洞穴').action(
        async ({ session }) => await addCave(ctx, session)
    );
}

async function getCave(ctx: Context, session: Session) {
    if (!session.guildId) {
        return '❌ 请在群聊中使用该命令！';
    }

    const { channelId } = session;

    const caves = await ctx.database.get('echo_cave', {
        channelId,
    });

    if (caves.length === 0) {
        return '🚀 回声洞中暂无消息，快使用 "cave.echo" 命令添加第一条消息吧！';
    }

    const caveMessage = caves[Math.floor(Math.random() * caves.length)];

    const content = JSON.parse(caveMessage.content);

    if (caveMessage.type === 'forward') {
        await session.onebot.sendGroupForwardMsg(channelId, content);
    } else {
        await session.onebot.sendGroupMsg(channelId, content);
    }
}

async function addCave(ctx: Context, session: Session) {
    if (!session.guildId) {
        return '❌ 请在群聊中使用该命令！';
    }

    if (!session.quote) {
        return '💡 请引用一条消息后再使用此命令！';
    }

    const { userId, channelId, quote } = session;
    const messageId = quote.id;

    let content: string | CQCode[];
    let type: 'forward' | 'msg';

    if (quote.elements[0].type === 'forward') {
        type = 'forward';

        const message = await reconstructForwardMsg(
            ctx,
            session,
            await session.onebot.getForwardMsg(messageId)
        );

        content = JSON.stringify(message);
    } else {
        type = 'msg';

        content = JSON.stringify(
            (await session.onebot.getMsg(messageId)).message
        );
    }

    await ctx.database.get('echo_cave', { content }).then((existing) => {
        if (existing) {
            return '♻️ 该消息已存在于回声洞穴中！';
        }
    });

    try {
        const result = await ctx.database.create('echo_cave', {
            channelId,
            createTime: new Date(),
            userId,
            originUserId: quote.user.id,
            type,
            content,
        });

        const messageId = await session.onebot.sendGroupMsg(
            session.channelId,
            `✅ 回声洞消息已成功存入，消息 ID：${result.id}`
        );
        ctx.setTimeout(
            async () => await session.onebot.deleteMsg(messageId),
            5000
        );
    } catch (error) {
        this.ctx.logger.warn('上架商品失败:', error);
        return '❌ 上架商品失败，请稍后重试！';
    }
}

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
