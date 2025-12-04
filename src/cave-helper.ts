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

    // 模板数据
    const templateData = {
        id: caveMsg.id.toString(),
        date,
        originName,
        userName,
        nl: '\n',
    };

    const TEMPLATE_COUNT = 5;

    if (caveMsg.type === 'forward') {
        // 获取 forward 模板，过滤掉空模板
        const availableTemplates: string[] = [];
        for (let i = 0; i < TEMPLATE_COUNT; i++) {
            const template = session.text(`echo-cave.templates.forward.${i}`, templateData);
            if (template.trim() !== '') {
                availableTemplates.push(template);
            }
        }

        if (availableTemplates.length === 0) {
            await session.send(session.text('echo-cave.general.noTemplatesConfigured'));
            return;
        }

        // 随机选择一个模板
        const chosenTemplate =
            availableTemplates[Math.floor(Math.random() * availableTemplates.length)];

        await session.onebot.sendGroupMsg(channelId, [createTextMsg(chosenTemplate)]);
        await session.onebot.sendGroupForwardMsg(channelId, content);

        return;
    }

    // 获取 msg 模板，过滤掉空模板
    const availableTemplates: Array<{ prefix: string; suffix: string }> = [];
    for (let i = 0; i < TEMPLATE_COUNT; i++) {
        const prefix = session.text(`echo-cave.templates.msg.${i}.prefix`, templateData);
        const suffix = session.text(`echo-cave.templates.msg.${i}.suffix`, templateData);
        if (prefix.trim() !== '' && suffix.trim() !== '') {
            availableTemplates.push({ prefix, suffix });
        }
    }

    if (availableTemplates.length === 0) {
        await session.send(session.text('echo-cave.general.noTemplatesConfigured'));
        return;
    }

    // 随机选择一个模板
    const chosenTemplate =
        availableTemplates[Math.floor(Math.random() * availableTemplates.length)];

    const last = content.at(-1);
    const needsNewline = last?.type === 'text';

    content.unshift(createTextMsg(chosenTemplate.prefix));
    content.push(createTextMsg(`${needsNewline ? '\n\n' : ''}${chosenTemplate.suffix}`));

    await session.onebot.sendGroupMsg(channelId, content);
}

export function formatDate(date: Date): string {
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
}
