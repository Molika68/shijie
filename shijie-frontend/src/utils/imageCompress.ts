import Taro from '@tarojs/taro';

const MAX_SIZE = 1024 * 1024; // 1MB

export async function compressImage(filePath: string): Promise<string> {
  try {
    const info = await Taro.getFileInfo({ filePath });
    if (info.size <= MAX_SIZE) {
      return filePath;
    }

    const compressed = await Taro.compressImage({
      src: filePath,
      quality: 70,
    });

    return compressed.tempFilePath;
  } catch {
    return filePath;
  }
}
