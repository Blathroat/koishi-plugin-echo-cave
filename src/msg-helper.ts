import { saveImages } from './image-helper';
import { CQCode } from '@pynickle/koishi-plugin-adapter-onebot';
import { Context } from 'koishi';

export async function processMessageContent(ctx: Context, msg: CQCode[]): Promise<CQCode[]> {
    return Promise.all(
        msg.map(async (element) => {
            if (element.type === 'image') {
                return {
                    ...element,
                    data: {
                        ...element.data,
                        url: await saveImages(ctx, element.data),
                    },
                };
            }

            return element;
        })
    );
}
