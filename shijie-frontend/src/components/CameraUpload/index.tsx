import { View, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { compressImage } from '../../utils/imageCompress';
import './index.scss';

interface CameraUploadProps {
  onImageSelected: (filePath: string) => void;
  previewUrl?: string;
}

export default function CameraUpload({ onImageSelected, previewUrl }: CameraUploadProps) {
  const handleChoose = async (sourceType: ('album' | 'camera')[]) => {
    try {
      const res = await Taro.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType,
      });
      const filePath = await compressImage(res.tempFilePaths[0]);
      onImageSelected(filePath);
    } catch {
      // user cancelled
    }
  };

  return (
    <View className="camera-upload">
      {previewUrl ? (
        <Image className="preview" src={previewUrl} mode="aspectFill" />
      ) : (
        <View className="placeholder">
          <View className="icon">📷</View>
          <View className="hint">拍照或选择图片</View>
        </View>
      )}
      <View className="actions">
        <View className="action-btn" onClick={() => handleChoose(['camera'])}>
          拍照
        </View>
        <View className="action-btn" onClick={() => handleChoose(['album'])}>
          相册
        </View>
      </View>
    </View>
  );
}
