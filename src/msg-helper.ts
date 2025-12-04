import { saveImages } from './image-helper';
import { CQCode } from '@pynickle/koishi-plugin-adapter-onebot';
import { Context } from 'koishi';

export async function processMessageContent(ctx: Context, msg: CQCode[]): Promise<CQCode[]> {
    const result: CQCode[] = [];

    for (const element of msg) {
        if (element.type === 'reply') {
            continue;
        }

        if (element.type === 'image') {
            const newUrl = await saveImages(ctx, element.data);
            result.push({
                ...element,
                data: {
                    ...element.data,
                    url: newUrl,
                },
            });
        } else {
            result.push(element);
        }
    }

    return result;
}
