import { CQCode } from '@pynickle/koishi-plugin-adapter-onebot';

export interface ParseResult {
    parsedUserIds: string[];
    error?: string;
}

export function createTextMsg(content: string) {
    return {
        type: 'text',
        data: {
            text: content,
        },
    };
}

export function parseUserIds(userIds: string[]): ParseResult {
    const parsedUserIds: string[] = [];
    for (const userIdStr of userIds) {
        try {
            const cqCode = CQCode.from(userIdStr);
            if (cqCode.type === 'at') {
                const qq = cqCode.data.qq;
                if (qq === 'all') {
                    return {
                        parsedUserIds: [],
                        error: 'invalid_all_mention',
                    };
                }
                if (qq) {
                    parsedUserIds.push(qq);
                }
            } else {
                // Check if it's a valid number
                const num = Number(userIdStr);
                if (!Number.isNaN(num)) {
                    parsedUserIds.push(String(num));
                }
            }
        } catch (e) {
            // If parsing fails, check if it's a valid number
            /*const num = Number(userIdStr);
            if (!Number.isNaN(num)) {
                parsedUserIds.push(String(num));
            }*/
            parsedUserIds.push(userIdStr.split(":")[1]);
        }
    }
    return {
        parsedUserIds,
    };
}
