import { Context, Schema, Session } from 'koishi';
import 'koishi-plugin-adapter-onebot';

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
    content: string;
}

declare module 'koishi' {
    interface Tables {
        echo_cave: EchoCave;
    }
}

export function apply(ctx: Context) {
    ctx.model.extend(
        'echo_cave',
        {
            id: 'unsigned',
            channelId: 'string',
            createTime: 'timestamp',
            userId: 'string',
            originUserId: 'string',
            content: 'text',
        },
        {
            primary: 'id',
            autoInc: true,
            unique: ['content'],
        }
    );

    ctx.command('cave', '随机获取回声洞消息').action(
        async ({ session }) => await getCave(ctx, { session })
    );

    ctx.command('cave.echo', '将消息存入回声洞穴').action(
        async ({ session }) => await addCave(ctx, { session })
    );
}

async function getCave(ctx: Context, { session }: { session: Session }) {
    if (!session.guildId) {
        return '❌ 请在群聊中使用该命令！';
    }

    const { channelId } = session;

    const caves = await ctx.database.get('echo_cave', {
        channelId,
    });

    if (caves.length === 0) {
        return '回声洞中暂无消息，快使用 "cave.echo" 命令添加第一条消息吧！';
    }

    return caves[Math.floor(Math.random() * caves.length)].content;
}

async function addCave(ctx: Context, { session }: { session: Session }) {
    if (!session.guildId) {
        return '❌ 请在群聊中使用该命令！';
    }

    if (!session.quote) {
        return '请引用一条消息后再使用此命令！';
    }

    const { userId, channelId } = session;
    const content = session.quote.content;

    ctx.logger('echo-cave').info(
        `User ${userId} is adding a message to the echo cave: ${content}`
    );

    await ctx.database.get('echo_cave', { content }).then((existing) => {
        if (existing) {
            return '该消息已存在于回声洞穴中！';
        }
    });

    try {
        // 创建商品记录
        const result = await ctx.database.create('echo_cave', {
            channelId: channelId,
            createTime: new Date(),
            userId: userId,
            originUserId: userId,
            content: content,
        });

        if (session.onebot) {
            const messageId = await session.onebot.sendGroupMsg(
                session.channelId,
                `✅ 回声洞消息已成功存入，消息 ID：${result.id}`
            );
            ctx.setInterval(
                async () => await session.onebot.deleteMsg(messageId),
                5000
            );
        } else {
            return `✅ 回声洞消息已成功存入，消息 ID：${result.id}`;
        }
    } catch (error) {
        this.ctx.logger.warn('上架商品失败:', error);
        return '❌ 上架商品失败，请稍后重试！';
    }
}
