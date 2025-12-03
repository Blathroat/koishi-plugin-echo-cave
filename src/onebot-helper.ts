import { Context, Session } from 'koishi';

export async function getUserName(ctx: Context, session: Session, userId: string): Promise<string> {
    try {
        const memberInfo = await session.onebot.getGroupMemberInfo(session.channelId, userId);
        return memberInfo.card || memberInfo.nickname || userId;
    } catch (error) {
        ctx.logger.warn(`获取群成员信息失败（userId: ${userId}）：`, error);
        return userId;
    }
}
