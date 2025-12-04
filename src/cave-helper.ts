import { createTextMsg } from './cqcode-helper';
import { EchoCave } from './index';
import { getUserName } from './onebot-helper';
import { CQCode } from '@pynickle/koishi-plugin-adapter-onebot';
import { Context, Session } from 'koishi';

interface MsgTemplate {
    prefix: string;
    suffix: string;
}

// 随机选择数组中的一个元素
const random = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// 替换模板中的占位符
const replacePlaceholders = (template: string, data: Record<string, string>): string => {
    return template.replace(/{(\w+)}/g, (match, key) => data[key] || match);
};

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
    };

    // 从本地化获取模板
    // 使用require直接加载本地化文件，避免session.text类型问题
    const templates = require('./locales/zh-CN.json')['echo-cave'].templates;

    if (caveMsg.type === 'forward') {
        // 获取forward模板，过滤掉空模板
        const forwardTemplates = (templates.forward || []).filter(
            (template: string) => template.trim() !== ''
        );

        if (forwardTemplates.length === 0) {
            await session.send(session.text('echo-cave.general.noTemplatesConfigured'));
            return;
        }

        // 随机选择一个模板并替换占位符
        const chosenTemplate = replacePlaceholders(random(forwardTemplates), templateData);

        await session.onebot.sendGroupMsg(channelId, [createTextMsg(chosenTemplate)]);
        await session.onebot.sendGroupForwardMsg(channelId, content);

        return;
    }

    // 获取msg模板，过滤掉空模板
    const msgTemplates = (templates.msg || []).filter(
        (template: MsgTemplate) =>
            template && template.prefix?.trim() !== '' && template.suffix?.trim() !== ''
    );

    if (msgTemplates.length === 0) {
        await session.send(session.text('echo-cave.general.noTemplatesConfigured'));
        return;
    }

    // 随机选择一个模板并替换占位符
    const chosenTemplate = random(msgTemplates) as MsgTemplate;
    const prefix = replacePlaceholders(chosenTemplate.prefix, templateData);
    const suffix = replacePlaceholders(chosenTemplate.suffix, templateData);

    const last = content.at(-1);
    const needsNewline = last?.type === 'text';

    content.unshift(createTextMsg(prefix));
    content.push(createTextMsg(`${needsNewline ? '\n\n' : ''}${suffix}`));

    await session.onebot.sendGroupMsg(channelId, content);
}

export function formatDate(date: Date): string {
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
}
