import { View, Image, Text } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useCallback, useEffect, useState } from 'react';
import { getHistory, HistoryItem, isLoggedIn } from '../../services/api';
import { formatRelativeTime, getObjectEmoji } from '../../utils/time';
import { resolveAssetUrl } from '../../utils/assetUrl';
import { usePageRefresh } from '../../hooks/usePageRefresh';
import './index.scss';

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'RECOGNITION' | 'GENERATION'>('ALL');

  const loadHistory = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const type = filter === 'ALL' ? undefined : filter;
      const res = await getHistory(1, 50, type);
      setItems(res.data.items);
    } catch {
      if (!silent) {
        Taro.showToast({ title: '加载失败', icon: 'none' });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [filter]);

  useDidShow(() => {
    if (!isLoggedIn()) {
      Taro.navigateTo({ url: '/pages/login/index' });
    }
  });

  useEffect(() => {
    if (!isLoggedIn()) return;
    loadHistory();
  }, [loadHistory]);

  usePageRefresh(() => {
    if (!isLoggedIn()) return;
    return loadHistory(true);
  });

  const handleItemClick = (item: HistoryItem) => {
    Taro.navigateTo({ url: `/pages/detail/index?id=${item.id}` });
  };

  return (
    <View className="page-dark history-page">
      <View className="page-title">
        📂 <Text className="highlight">历史</Text>记录
      </View>
      <View className="page-desc">查看所有识物与创作记录</View>

      <View className="filter-bar">
        {(['ALL', 'RECOGNITION', 'GENERATION'] as const).map((f) => (
          <View
            key={f}
            className={`style-tag ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'ALL' ? '全部' : f === 'RECOGNITION' ? '识物' : '生图'}
          </View>
        ))}
      </View>

      {loading ? (
        <View className="loading-text">加载中...</View>
      ) : items.length === 0 ? (
        <View className="empty-text">暂无历史记录</View>
      ) : (
        items.map((item) => (
          <View key={item.id} className="card-item" onClick={() => handleItemClick(item)}>
            <View className="left">
              <View className="thumb">
                {item.inputImage || item.outputImage ? (
                  <Image
                    className="thumb-img"
                    src={resolveAssetUrl(item.inputImage || item.outputImage)}
                    mode="aspectFill"
                  />
                ) : (
                  <Text>
                    {item.type === 'RECOGNITION'
                      ? getObjectEmoji(item.recognition?.object)
                      : '🎨'}
                  </Text>
                )}
              </View>
              <View className="info">
                <View className="name">
                  {item.type === 'RECOGNITION'
                    ? item.recognition?.object || '识别记录'
                    : item.inputText || '生成记录'}
                </View>
                <View className="time">{formatRelativeTime(item.createdAt)}</View>
              </View>
            </View>
            <Text className="type-badge">
              {item.type === 'RECOGNITION' ? '识物' : '生图'}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}
