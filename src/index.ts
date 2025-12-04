import '@pynickle/koishi-plugin-adapter-onebot';
import { formatDate, sendCaveMsg } from './cave-helper';
import { reconstructForwardMsg } from './forward-helper';
import { processMessageContent } from './msg-helper';
import { CQCode } from '@pynickle/koishi-plugin-adapter-onebot';
import fs from 'fs';
import { Context, Schema, Session } from 'koishi';
import path from 'node:path';

export const name = 'echo-cave';

export const inject = ['database'];

export interface Config {
    adminMessageProtection?: boolean;
    allowContributorDelete?: boolean;
    allowSenderDelete?: boolean;
}

export const Config: Schema<Config> = Schema.object({
    adminMessageProtection: Schema.boolean().default(false),
    allowContributorDelete: Schema.boolean().default(true),
    allowSenderDelete: Schema.boolean().default(true),
}).i18n({
    'zh-CN': require('./locales/zh-CN.json')._config,
});

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

export function apply(ctx: Context, cfg: Config) {
    ctx.i18n.define('zh-CN', require('./locales/zh-CN.json'));

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
        }
    );

    ctx.command('cave [id:number]').action(
        async ({ session }, id) => await getCave(ctx, session, id)
    );

    ctx.command('cave.echo').action(async ({ session }) => await addCave(ctx, session));

    ctx.command('cave.wipe <id:number>').action(
        async ({ session }, id) => await deleteCave(ctx, session, cfg, id)
    );

    ctx.command('cave.listen').action(async ({ session }) => await getCaveListByUser(ctx, session));

    ctx.command('cave.trace').action(
        async ({ session }) => await getCaveListByOriginUser(ctx, session)
    );
}

async function getCaveListByUser(ctx: Context, session: Session) {
    if (!session.guildId) {
        return session.text('echo-cave.general.privateChatReminder');
    }

    const { userId, channelId } = session;

    const caves = await ctx.database.get('echo_cave', {
        userId,
        channelId,
    });

    if (caves.length === 0) {
        return session.text('.noMsgContributed');
    }

    let response = session.text('.msgListHeader');

    for (const cave of caves) {
        response += session.text('.msgListItem', [cave.id, formatDate(cave.createTime)]);
    }

    return response;
}

async function getCaveListByOriginUser(ctx: Context, session: Session) {
    if (!session.guildId) {
        return session.text('echo-cave.general.privateChatReminder');
    }

    const { userId, channelId } = session;

    const caves = await ctx.database.get('echo_cave', {
        originUserId: userId,
        channelId,
    });

    if (caves.length === 0) {
        return session.text('.noMsgTraced');
    }

    let response = session.text('.msgListHeader');

    for (const cave of caves) {
        response += session.text('.msgListItem', [cave.id, formatDate(cave.createTime)]);
    }

    return response;
}

async function getCave(ctx: Context, session: Session, id: number) {
    if (!session.guildId) {
        return session.text('echo-cave.general.privateChatReminder');
    }

    let caveMsg: EchoCave;

    const { channelId } = session;

    if (!id) {
        const caves = await ctx.database.get('echo_cave', {
            channelId,
        });

        if (caves.length === 0) {
            return session.text('.noMsgInCave');
        }

        caveMsg = caves[Math.floor(Math.random() * caves.length)];
    } else {
        const caves = await ctx.database.get('echo_cave', {
            id,
            channelId,
        });

        if (caves.length === 0) {
            return session.text('echo-cave.general.noMsgWithId');
        }

        caveMsg = caves[0];
    }

    await sendCaveMsg(ctx, session, caveMsg);
}

async function deleteCave(ctx: Context, session: Session, cfg: Config, id: number) {
    if (!session.guildId) {
        return session.text('echo-cave.general.privateChatReminder');
    }

    if (!id) {
        return session.text('.noIdProvided');
    }

    const caves = await ctx.database.get('echo_cave', id);

    if (caves.length === 0) {
        return session.text('echo-cave.general.noMsgWithId');
    }

    const caveMsg = caves[0];
    const currentUserId = session.userId;
    const user = await ctx.database.getUser(session.platform, currentUserId);
    const userAuthority = user.authority;
    const isCurrentUserAdmin = userAuthority >= 4;

    if (cfg.adminMessageProtection) {
        const caveUser = await ctx.database.getUser(session.platform, caveMsg.userId);
        const isCaveUserAdmin = caveUser.authority >= 4;

        if (isCaveUserAdmin && !isCurrentUserAdmin) {
            return session.text('.adminOnly');
        }
    }

    // Check delete permissions
    if (!isCurrentUserAdmin) {
        if (currentUserId === caveMsg.userId) {
            // Contributor check
            if (!cfg.allowContributorDelete) {
                return session.text('.contributorDeleteDenied');
            }
        } else if (currentUserId === caveMsg.originUserId) {
            // Sender check
            if (!cfg.allowSenderDelete) {
                return session.text('.senderDeleteDenied');
            }
        } else {
            // Neither contributor nor sender nor admin
            return session.text('.permissionDenied');
        }
    }

    await ctx.database.remove('echo_cave', id);
    return session.text('.msgDeleted', [id]);
}

async function addCave(ctx: Context, session: Session) {
    if (!session.guildId) {
        return session.text('echo-cave.general.privateChatReminder');
    }

    if (!session.quote) {
        return session.text('.noMsgQuoted');
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

        const message = (await session.onebot.getMsg(messageId)).message;

        let msgJson: CQCode[];

        if (typeof message === 'string') {
            msgJson = CQCode.parse(message);
        } else {
            msgJson = message;
        }

        content = JSON.stringify(await processMessageContent(ctx, msgJson));
    }

    await ctx.database.get('echo_cave', { content }).then((existing) => {
        if (existing) {
            return session.text('.existingMsg');
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

        return session.text('.msgSaved', [result.id]);
    } catch (error) {
        return session.text('.msgFailedToSave');
    }
}
