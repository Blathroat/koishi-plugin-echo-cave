import { createTextMsg } from './cqcode-helper';
import { EchoCave } from './index';
import { getUserName } from './onebot-helper';
import { CQCode } from '@pynickle/koishi-plugin-adapter-onebot';
import { Context, Session } from 'koishi';

export async function sendCaveMsg(
    ctx: Context,
    session: Session,
    caveMsg: EchoCave
): Promise<void> {
    const { channelId } = session;
    const content: CQCode[] = JSON.parse(caveMsg.content);

    // 格式化必要信息
    const date = formatDate(caveMsg.createTime);
    const originName = await getUserName(ctx, session, caveMsg.originUserId);
    const userName = await getUserName(ctx, session, caveMsg.userId);

    // 🌀 forward 类型风格模板（五种）
    const forwardStyles = [
        `🌀 回声洞 #${caveMsg.id}

一则回声从时光中飘来——
📅 ${date} · 来自 @${originName}  
📮 由 @${userName} 投递`,

        `🌀 回声洞 #${caveMsg.id}

【记录编号】${caveMsg.id}  
【创建时间】${date}  
【原始作者】@${originName}  
【投递者】@${userName}`,

        `🌀 回声洞 #${caveMsg.id}

这声回响最初来自 @${originName}，  
由 @${userName} 在 ${date} 留下。`,

        `🌀 回声洞 #${caveMsg.id}

时间的回音在此汇聚。  
📅 ${date}  
📤 出处：@${originName}  
📮 封印者：@${userName}`,

        `🌀 回声洞 #${caveMsg.id}

📅 ${date}  
👤 来自 @${originName}  
📮 投递者 @${userName}`,
    ];

    // 💬 普通 msg 类型风格模板（五种）
    const msgStyles = [
        {
            prefix: `🌀 回声洞 #${caveMsg.id}\n\n—— 有人留下了声音 ——\n\n`,
            suffix: `📅 ${date} · 来自 @${originName}\n📮 由 @${userName} 投递`,
        },
        {
            prefix: `🌀 回声洞 #${caveMsg.id}\n───────────────\n`,
            suffix: `───────────────\n📅 ${date}\n👤 ${originName} · 由 @${userName} 投递`,
        },
        {
            prefix: `🌀 回声洞 #${caveMsg.id}\n\n💭「有人在洞壁留下印记」\n\n`,
            suffix: `📅 ${date}\n📮 ${userName} 记录`,
        },
        {
            prefix: `🌀 回声洞 #${caveMsg.id}\n\n— 回声开始 —\n\n`,
            suffix: `— 回声结束 —\n📅 ${date} · @${originName}\n📮 @${userName}`,
        },
        {
            prefix: `🌀 回声洞 #${caveMsg.id}\n\n`,
            suffix: `📅 ${date}\n来自 @${originName}\n由 @${userName} 投递`,
        },
    ];

    // 🎲 随机选风格
    const random = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

    if (caveMsg.type === 'forward') {
        // 合并转发风格
        const chosen = random(forwardStyles);
        await session.onebot.sendGroupMsg(channelId, [createTextMsg(chosen)]);
        await session.onebot.sendGroupForwardMsg(channelId, content);

        return;
    } else if (caveMsg.type == 'msg' && content.some((m) => m.type === 'reply')) {
        const chosen = random(forwardStyles);
        await session.onebot.sendGroupMsg(channelId, [createTextMsg(chosen)]);
        await session.onebot.sendGroupMsg(channelId, content);

        return;
    }

    const chosen = random(msgStyles);

    const last = content.at(-1);
    const needsNewline = last?.type === 'text';

    content.unshift(createTextMsg(chosen.prefix));
    content.push(createTextMsg(`${needsNewline ? '\n\n' : ''}${chosen.suffix}`));

    await session.onebot.sendGroupMsg(channelId, content);
}

export function formatDate(date: Date): string {
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
}
