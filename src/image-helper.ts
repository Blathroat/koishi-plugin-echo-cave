import { Context } from 'koishi';
import { promises } from 'node:fs';
import path from 'node:path';

export async function saveImages(
    ctx: Context,
    imgElement: Record<string, any>
) {
    const imgUrl: string = imgElement.url;

    const originalImgName: string = imgElement.file;
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

    ctx.logger.info(
        `Saving image from URL: ${imgUrl} to path: ${imgName}.${imgExt}`
    );

    const buffer = await ctx.http.get(imgUrl);

    if (buffer.byteLength === 0) throw new Error('Image download failed');
    await promises.writeFile(fullImgPath, Buffer.from(buffer));
    return fullImgPath;
}
