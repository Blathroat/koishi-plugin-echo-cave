import axios from 'axios';
import { Context } from 'koishi';
import { promises as fs } from 'node:fs';
import path from 'node:path';

export async function saveMedia(
    ctx: Context,
    mediaElement: Record<string, any>,
    type: 'image' | 'video' | 'file'
) {
    const mediaUrl: string = mediaElement.url;
    const originalMediaName: string = mediaElement.file;

    const ext = (() => {
        const i = originalMediaName.lastIndexOf('.');
        return i === -1
            ? type === 'image'
                ? 'png'
                : type === 'video'
                  ? 'mp4'
                  : 'bin'
            : originalMediaName.slice(i + 1).toLowerCase();
    })();

    const mediaDir = path.join(ctx.baseDir, 'data', 'cave', type + 's');
    const mediaName = Date.now().toString();
    const fullMediaPath = path.join(mediaDir, `${mediaName}.${ext}`);

    ctx.logger.info(`Saving ${type} from ${mediaUrl} -> ${fullMediaPath}`);

    try {
        await fs.mkdir(mediaDir, { recursive: true });

        const res = await axios.get(mediaUrl, {
            responseType: 'arraybuffer',
            validateStatus: () => true,
        });

        if (res.status < 200 || res.status >= 300) {
            ctx.logger.warn(
                `${type.charAt(0).toUpperCase() + type.slice(1)} download failed: HTTP ${res.status}`
            );
            return mediaUrl;
        }

        const contentType = res.headers['content-type'];
        if (contentType) {
            if (type === 'image' && !contentType.startsWith('image/')) {
                ctx.logger.warn(`Invalid image content-type: ${contentType}`);
                return mediaUrl;
            }
            if (type === 'video' && !contentType.startsWith('video/')) {
                ctx.logger.warn(`Invalid video content-type: ${contentType}`);
                return mediaUrl;
            }
            // 对于 file 类型，不严格检查 content-type
        }

        const buffer = Buffer.from(res.data);
        if (!buffer || buffer.length === 0) {
            ctx.logger.warn(`Downloaded ${type} buffer is empty`);
            return mediaUrl;
        }

        await fs.writeFile(fullMediaPath, buffer);

        ctx.logger.info(
            `${type.charAt(0).toUpperCase() + type.slice(1)} saved successfully: ${fullMediaPath}`
        );
        return fullMediaPath;
    } catch (err) {
        ctx.logger.error(`Failed to save ${type}: ${err}`);
        return mediaUrl;
    }
}

export async function processMediaElement(ctx: Context, element: any) {
    if (element.type === 'image' || element.type === 'video' || element.type === 'file') {
        return {
            ...element,
            data: {
                ...element.data,
                url: await saveMedia(ctx, element.data, element.type as 'image' | 'video' | 'file'),
            },
        };
    }
    return element;
}
