import { View, Image, Text } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useEffect, useState } from 'react';
import { deleteHistory, getHistoryDetail, HistoryItem } from '../../services/api';
import { speakText, textToImage } from '../../services/ai';
import { getObjectEmoji } from '../../utils/time';
import { resolveAssetUrl } from '../../utils/assetUrl';
import './index.scss';

export default function DetailPage() {
  const router = useRouter();
  const [item, setItem] = useState<HistoryItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = router.params.id;
    if (!id) return;

    getHistoryDetail(id)
      .then((res) => setItem(res.data))
      .catch(() => Taro.showToast({ title: '加载失败', icon: 'none' }))
      .finally(() => setLoading(false));
  }, [router.params.id]);

  const handleBack = () => Taro.navigateBack();

  const handleSpeak = async () => {
    if (!item?.recognition) return;
    const text = `${item.recognition.object}。${item.recognition.description}`;
    try {
      const res = await speakText(text);
      if (res.data.audioUrl) {
        const audio = Taro.createInnerAudioContext();
        audio.src = res.data.audioUrl;
        audio.play();
        return;
      }
      if (process.env.TARO_ENV === 'h5' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'zh-CN';
        window.speechSynthesis.speak(utterance);
      }
    } catch {
      Taro.showToast({ title: '朗读失败', icon: 'none' });
    }
  };

  const handleGenerateSimilar = async () => {
    const prompt = item?.recognition
      ? `${item.recognition.object}，${item.recognition.description}`
      : item?.inputText;
    if (!prompt) return;

    Taro.showLoading({ title: '生成中...' });
    try {
      await textToImage(prompt);
      Taro.hideLoading();
      Taro.switchTab({ url: '/pages/generate/index' });
    } catch {
      Taro.hideLoading();
      Taro.showToast({ title: '生成失败', icon: 'none' });
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    const res = await Taro.showModal({ title: '确认删除这条记录？' });
    if (!res.confirm) return;
    try {
      await deleteHistory(item.id);
      Taro.showToast({ title: '已删除', icon: 'success' });
      setTimeout(() => Taro.navigateBack(), 500);
    } catch {
      Taro.showToast({ title: '删除失败', icon: 'none' });
    }
  };

  if (loading) {
    return <View className="page-dark loading-text">加载中...</View>;
  }

  if (!item) {
    return <View className="page-dark empty-text">记录不存在</View>;
  }

  const isRecognition = item.type === 'RECOGNITION' && item.recognition;
  const isMockResult = isRecognition && item.recognition?.mock;
  const heroEmoji = isRecognition ? getObjectEmoji(item.recognition?.object) : '🎨';
  const title = isRecognition
    ? `${item.recognition!.object} / ${item.recognition!.english}`
    : item.inputText || '生成记录';

  return (
    <View className="page-dark detail-page">
      <View className="back-btn" onClick={handleBack}>← 返回</View>

      <View className="detail-hero">
        {item.inputImage || item.outputImage ? (
          <Image
            className="hero-img"
            src={resolveAssetUrl(item.inputImage || item.outputImage)}
            mode="aspectFill"
          />
        ) : (
          <Text>{heroEmoji}</Text>
        )}
      </View>

      <View className="detail-title">{title}</View>

      {isMockResult && (
        <View className="mock-banner">
          <Text>⚠️ 此为演示数据，并非真实识别结果</Text>
        </View>
      )}

      <View className="detail-body">
        {isRecognition ? (
          <>
            <Text>{item.recognition!.description}</Text>
            <View style={{ marginTop: '20rpx' }}>
              <Text>英文名称：</Text>
              <Text className="highlight">{item.recognition!.english}</Text>
            </View>
          </>
        ) : (
          <>
            <Text>{item.inputText}</Text>
            {item.outputImage && (
              <Image
                className="result-image"
                src={resolveAssetUrl(item.outputImage)}
                mode="widthFix"
                style={{ marginTop: '24rpx', borderRadius: '24rpx', width: '100%' }}
              />
            )}
          </>
        )}
      </View>

      {isRecognition && (
        <View className="detail-tags">
          <Text className="tag">✨ {item.recognition!.object}</Text>
          <Text className="tag">🌐 {item.recognition!.english}</Text>
          <Text className="tag">📷 识物</Text>
        </View>
      )}

      <View className="detail-actions-bottom">
        {isRecognition && (
          <>
            <View className="btn-secondary" onClick={handleSpeak}>🔊 朗读</View>
            <View className="btn-primary" onClick={handleGenerateSimilar}>🔄 生成同款图片</View>
          </>
        )}
        {!isRecognition && (
          <View className="btn-secondary" onClick={handleDelete}>🗑 删除记录</View>
        )}
      </View>
    </View>
  );
}
