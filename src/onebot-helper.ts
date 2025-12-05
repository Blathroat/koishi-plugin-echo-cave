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
        ctx.logger.warn(`获取群成员列表失败：`, error);
        return false;
    }
}

/**
 * 检查用户是否属于指定群组（调试版本，输出详细信息）
 */
export async function checkUsersInGroupDebug(
    ctx: Context,
    session: Session,
    userIds: string[]
): Promise<boolean> {
    try {
        const channelId = session.channelId;
        console.log(`\n=== 调试信息：checkUsersInGroupDebug ===`);
        console.log(`channelId: ${channelId}`);

        const groupMembers = await session.onebot.getGroupMemberList(channelId);
        console.log(`群成员数量：${groupMembers.length}`);
        console.log(`群成员ID列表：${groupMembers.map((member) => member.user_id).join(', ')}`);

        const memberIds = groupMembers.map((member) => member.user_id.toString());
        const userIdsSet = new Set(userIds);

        console.log(`检查的用户ID：${userIds.join(', ')}`);

        // 检查所有用户ID是否都在群组中
        const usersNotHere = userIds.filter((userId) => !memberIds.includes(userId));

        if (usersNotHere.length > 0) {
            console.log(`❌ 不在群组的用户ID：${usersNotHere.join(', ')}`);
            console.log(`=== 调试结束 ===\n`);
            return false;
        } else {
            console.log(`✅ 所有用户都在群组中`);
            console.log(`=== 调试结束 ===\n`);
            return true;
        }
    } catch (error) {
        console.error(`\n=== 调试错误：checkUsersInGroupDebug ===`);
        console.error(`获取群成员列表失败：`, error);
        console.error(`=== 调试结束 ===\n`);
        ctx.logger.warn(`获取群成员列表失败：`, error);
        return false;
    }
}
