import { processMediaElement } from './image-helper';
import { Config } from './index';
import { CQCode } from '@pynickle/koishi-plugin-adapter-onebot';
import { Message } from '@pynickle/koishi-plugin-adapter-onebot/lib/types';
import { Context, Session } from 'koishi';

export async function reconstructForwardMsg(
    ctx: Context,
    session: Session,
    message: Message[],
    cfg: Config
): Promise<CQCode[]> {
    return Promise.all(
        message.map(async (msg: Message) => {
            const content = await processForwardMessageContent(ctx, session, msg, cfg);

            const senderNickname = msg.sender.nickname;

            let senderUserId = msg.sender.user_id;
            senderUserId =
                senderUserId === 1094950020
                    ? await getUserIdFromNickname(session, senderNickname, senderUserId)
                    : senderUserId;

            return {
                type: 'node',
                data: {
                    user_id: senderUserId,
                    nickname: senderNickname,
                    content,
                },
            };
        })
    );
}

async function getUserIdFromNickname(
    session: Session,
    nickname: string,
    userId: number
): Promise<number> {
    const memberInfos = await session.onebot.getGroupMemberList(session.channelId);

    // 找出所有 nickname 严格匹配的项
    const matches = memberInfos.filter((m) => m.nickname === nickname);

    // 如果恰好有一个匹配，则返回那个成员的 user_id
    if (matches.length === 1) {
        return matches[0].user_id;
    }

    // 否则（无匹配或多重匹配）返回传入的 userId
    return userId;
}

async function processForwardMessageContent(
    ctx: Context,
    session: Session,
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
        return reconstructForwardMsg(ctx, session, firstElement.data.content, cfg);
    }

    // deal with normal message
    return Promise.all(
        msg.message.map(async (element) => {
            return processMediaElement(ctx, element, cfg);
        })
    );
}
