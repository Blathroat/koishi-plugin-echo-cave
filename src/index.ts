import '@pynickle/koishi-plugin-adapter-onebot';
import { CQCode } from '@pynickle/koishi-plugin-adapter-onebot';
import fs from 'fs';
import { Context, Schema, Session } from 'koishi';
import path from 'node:path';
import { reconstructForwardMsg } from './forward-helper';
import { sendCaveMsg } from './msg-helper';

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

    ctx.command(
        'cave [id:number]',
        '随机获取 / 获取特定 id 的回声洞信息'
    ).action(async ({ session }, id) => await getCave(ctx, session, id));

    ctx.command('cave.echo', '将消息存入回声洞穴').action(
        async ({ session }) => await addCave(ctx, session)
    );

    ctx.command('cave.wipe <id:number>', '抹去特定 id 的回声洞信息', {
        authority: 4,
    }).action(async ({ session }, id) => await deleteCave(ctx, session, id));
}

async function getCave(ctx: Context, session: Session, id: number) {
    if (!session.guildId) {
        return '❌ 请在群聊中使用该命令！';
    }

    let caveMsg: EchoCave;

    if (!id) {
        const { channelId } = session;

        const caves = await ctx.database.get('echo_cave', {
            channelId,
        });

        if (caves.length === 0) {
            return '🚀 回声洞中暂无消息，快使用 "cave.echo" 命令添加第一条消息吧！';
        }

        caveMsg = caves[Math.floor(Math.random() * caves.length)];
    } else {
        const caves = await ctx.database.get('echo_cave', id);

        if (caves.length === 0) {
            return '🔍 未找到该 ID 的回声洞消息';
        }

        caveMsg = caves[0];
    }

    await sendCaveMsg(session, caveMsg);
}

async function deleteCave(ctx: Context, session: Session, id: number) {
    if (!session.guildId) {
        return '❌ 请在群聊中使用该命令！';
    }

    const caves = await ctx.database.get('echo_cave', id);

    if (caves.length === 0) {
        return '🔍 未找到该 ID 的回声洞消息';
    }

    await ctx.database.remove('echo_cave', id);
    return `✅ 已成功抹去回声洞消息 ID：${id}`;
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
