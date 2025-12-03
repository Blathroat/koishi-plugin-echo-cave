import axios from 'axios';
import { Context } from 'koishi';
import { promises as fs } from 'node:fs';
import path from 'node:path';

export async function saveImages(ctx: Context, imgElement: Record<string, any>) {
    const imgUrl: string = imgElement.url;
    const originalImgName: string = imgElement.file;

    const ext = (() => {
        const i = originalImgName.lastIndexOf('.');
        return i === -1 ? 'png' : originalImgName.slice(i + 1).toLowerCase();
    })();

    const imgDir = path.join(ctx.baseDir, 'data', 'cave', 'images');
    const imgName = Date.now().toString();
    const fullImgPath = path.join(imgDir, `${imgName}.${ext}`);

    ctx.logger.info(`Saving image from ${imgUrl} -> ${fullImgPath}`);

    try {
        await fs.mkdir(imgDir, { recursive: true });

        const res = await axios.get(imgUrl, {
            responseType: 'arraybuffer',
            validateStatus: () => true,
        });

        if (res.status < 200 || res.status >= 300) {
            ctx.logger.warn(`Image download failed: HTTP ${res.status}`);
            return imgUrl;
        }

        const type = res.headers['content-type'];
        if (!type || !type.startsWith('image/')) {
            ctx.logger.warn(`Invalid image content-type: ${type}`);
            return imgUrl;
        }

        const buffer = Buffer.from(res.data);
        if (!buffer || buffer.length === 0) {
            ctx.logger.warn('Downloaded image buffer is empty');
            return imgUrl;
        }

        await fs.writeFile(fullImgPath, buffer);

        ctx.logger.info(`Image saved successfully: ${fullImgPath}`);
        return fullImgPath;
    } catch (err) {
        ctx.logger.error(`Failed to save image: ${err}`);
        return imgUrl;
    }
}
