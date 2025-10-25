import { Context, Session, h } from 'koishi';
import { promises } from 'node:fs';
import path from 'node:path';

export interface ImgData {
    file: string;
    url: string;
}

export async function saveImages(ctx: Context, imgElement: ImgData) {
    const imgUrl = imgElement.url;

    const originalImgName = imgElement.file as string;
    const lastDotIndex = originalImgName.lastIndexOf('.');

    let imgExt = '';
    if (lastDotIndex === -1) {
        imgExt = 'png';
    } else {
        imgExt = originalImgName.substring(lastDotIndex + 1);
    }

    const imgPath = path.join(ctx.baseDir, 'data', 'cave', 'images');
    const imgName = new Date().getTime().toString();
    let fullImgPath = path.join(imgPath, `${imgName}.${imgExt}`);

    ctx.logger.info(`Saving image from URL: ${imgUrl} to path: ${fullImgPath}`);

    const buffer = await ctx.http.get(imgUrl);

    if (buffer.byteLength === 0) throw new Error('Image download failed');
    await promises.writeFile(fullImgPath, Buffer.from(buffer));
    return fullImgPath;
}
