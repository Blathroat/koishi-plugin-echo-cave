import { Session } from 'koishi';
import { EchoCave } from './index';

export async function sendCaveMsg(
    session: Session,
    caveMsg: EchoCave
): Promise<void> {
    const { channelId } = session;

    const content = JSON.parse(caveMsg.content);

    if (caveMsg.type === 'forward') {
        await session.onebot.sendGroupForwardMsg(channelId, content);
    } else {
        await session.onebot.sendGroupMsg(channelId, content);
    }
}
