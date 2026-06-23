import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useCallback, useState } from 'react';
import { getHistory, getUser, HistoryItem, isLoggedIn, logout } from '../../services/api';
import { speakText } from '../../services/ai';
import { textToImage } from '../../services/ai';
import { getObjectEmoji } from '../../utils/time';
import { displayEmail } from '../../utils/assetUrl';
import { useScrollRefresh } from '../../hooks/useScrollRefresh';
import './index.scss';

export default function ProfilePage() {
  const user = getUser();
  const [recognitionCount, setRecognitionCount] = useState(0);
  const [generationCount, setGenerationCount] = useState(0);
  const [latestItem, setLatestItem] = useState<HistoryItem | null>(null);

  const loadStats = useCallback(async () => {
    try {
      const [recRes, genRes, allRes] = await Promise.all([
        getHistory(1, 1, 'RECOGNITION'),
        getHistory(1, 1, 'GENERATION'),
        getHistory(1, 1),
      ]);
      setRecognitionCount(recRes.data.total);
      setGenerationCount(genRes.data.total);
      setLatestItem(allRes.data.items[0] || null);
    } catch {
      // silent
    }
  }, []);

  useDidShow(() => {
    if (!isLoggedIn()) {
      Taro.navigateTo({ url: '/pages/login/index' });
      return;
    }
    loadStats();
  });

  const { refreshing, onRefresherRefresh } = useScrollRefresh(loadStats);

  const displayName = user?.email ? displayEmail(user.email) : '识界用户';

  const handleLogout = async () => {
    const res = await Taro.showModal({ title: '退出登录', content: '确定要退出当前账号吗？' });
    if (!res.confirm) return;
    await logout();
    Taro.reLaunch({ url: '/pages/login/index' });
  };

  const handleSpeak = async () => {
    if (!latestItem?.recognition) return;
    const text = `${latestItem.recognition.object}。${latestItem.recognition.description}`;
    try {
      await speakText(text);
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
    if (!latestItem?.recognition) return;
    Taro.showLoading({ title: '生成中...' });
    try {
      const prompt = `${latestItem.recognition.object}，${latestItem.recognition.description.slice(0, 50)}`;
      await textToImage(prompt);
      Taro.hideLoading();
      Taro.switchTab({ url: '/pages/generate/index' });
      Taro.showToast({ title: '已提交生成', icon: 'success' });
    } catch {
      Taro.hideLoading();
      Taro.showToast({ title: '生成失败', icon: 'none' });
    }
  };

  const menuItems = [
    { icon: '📜', label: '历史记录', action: () => Taro.navigateTo({ url: '/pages/history/index' }) },
    { icon: '📊', label: '使用统计', action: () => Taro.showToast({ title: `识物 ${recognitionCount} 次 · 生图 ${generationCount} 次`, icon: 'none' }) },
    { icon: '💬', label: '帮助反馈', action: () => Taro.showToast({ title: '反馈邮箱: support@shijie.ai', icon: 'none' }) },
    { icon: '🚪', label: '退出登录', action: handleLogout },
  ];

  return (
    <ScrollView
      className="page-scroll"
      scrollY
      enhanced
      showScrollbar={false}
      refresherEnabled
      refresherTriggered={refreshing}
      refresherBackground="#aebefc"
      refresherDefaultStyle="black"
      onRefresherRefresh={onRefresherRefresh}
    >
      <View className="page-dark profile-page">
      <View className="profile-card">
        <View className="profile-avatar">🧑‍🎨</View>
        <View className="profile-name">{displayName}</View>
        <View className="profile-name-edit">{user?.email || ''}</View>
      </View>

      <View className="stats-row">
        <View className="stat">
          <View className="num">{recognitionCount}</View>
          <View className="label">识别次数</View>
        </View>
        <View className="stat">
          <View className="num">{generationCount}</View>
          <View className="label">生成次数</View>
        </View>
      </View>

      {latestItem?.recognition && (
        <View className="detail-card">
          <View className="title-row">
            <View className="title">
              {getObjectEmoji(latestItem.recognition.object)} {latestItem.recognition.object} / {latestItem.recognition.english}
            </View>
            <View className="badge-confidence">AI 识别</View>
          </View>
          <View className="desc">{latestItem.recognition.description}</View>
          <View className="detail-actions-row">
            <View className="btn-outline" onClick={handleSpeak}>🔊 朗读介绍</View>
            <View className="btn-primary-sm" onClick={handleGenerateSimilar}>🔄 生成同款</View>
          </View>
        </View>
      )}

      <View className="profile-menu">
        {menuItems.map((item) => (
          <View key={item.label} className="menu-item" onClick={item.action}>
            <View className="left">
              <Text className="icon">{item.icon}</Text>
              <Text className="label">{item.label}</Text>
            </View>
            <Text className="arrow">›</Text>
          </View>
        ))}
      </View>
      </View>
    </ScrollView>
  );
}
