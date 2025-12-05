import { Context, Session } from 'koishi';

export async function getUserName(ctx: Context, session: Session, userId: string): Promise<string> {
    try {
        const memberInfo = await session.onebot.getGroupMemberInfo(session.channelId, userId);
        return memberInfo.card || memberInfo.nickname || userId;
    } catch (error) {
        ctx.logger.warn(`Failed to get group member info (userId: ${userId}):`, error);
        return userId;
    }
}

/**
 * 检查用户是否属于指定群组
 */
export async function checkUsersInGroup(
    ctx: Context,
    session: Session,
    userIds: string[]
): Promise<boolean> {
    try {
        const groupMembers = await session.onebot.getGroupMemberList(session.channelId);
        const memberIds = groupMembers.map((member) => member.user_id.toString());

        // 检查所有用户 ID 是否都在群组中
        return userIds.every((userId) => memberIds.includes(userId));
    } catch (error) {
        ctx.logger.warn(`Failed to get group member list:`, error);
        return false;
    }
}
