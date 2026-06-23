import { View, Image, Text, ScrollView } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useCallback, useState } from "react";
import CameraUpload from "../../components/CameraUpload";
import { recognizeImage } from "../../services/ai";
import {
  getAppConfig,
  getHistory,
  getUser,
  HistoryItem,
  isLoggedIn,
} from "../../services/api";
import {
  formatRelativeTime,
  getGreeting,
  getObjectEmoji,
} from "../../utils/time";
import { displayEmail, resolveAssetUrl } from "../../utils/assetUrl";
import { useScrollRefresh } from "../../hooks/useScrollRefresh";
import "./index.scss";

export default function HomePage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [imagePath, setImagePath] = useState("");
  const [recognizing, setRecognizing] = useState(false);
  const user = getUser();
  const displayName = displayEmail(user?.email);

  const loadRecords = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await getHistory(1, 50, "RECOGNITION");
      setItems(res.data.items);
    } catch {
      // silent
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const refreshPage = useCallback(async () => {
    if (!isLoggedIn()) return;
    await Promise.all([loadRecords(true), getAppConfig().catch(() => {})]);
  }, [loadRecords]);

  useDidShow(() => {
    if (!isLoggedIn()) {
      Taro.navigateTo({ url: "/pages/login/index" });
      return;
    }
    loadRecords();
    getAppConfig().catch(() => {});
  });

  const { refreshing, onRefresherRefresh } = useScrollRefresh(refreshPage);

  const handleRecognize = async () => {
    if (!imagePath) {
      Taro.showToast({ title: "请先选择图片", icon: "none" });
      return;
    }

    setRecognizing(true);
    try {
      await recognizeImage(imagePath);
      const res = await getHistory(1, 1, "RECOGNITION");
      const latest = res.data.items[0];
      await loadRecords();
      setImagePath("");
      if (latest) {
        Taro.navigateTo({ url: `/pages/detail/index?id=${latest.id}` });
      } else {
        Taro.showToast({ title: "识别成功", icon: "success" });
      }
    } catch (err) {
      Taro.showToast({
        title: err instanceof Error ? err.message : "识别失败",
        icon: "none",
      });
    } finally {
      setRecognizing(false);
    }
  };

  const handleItemClick = (item: HistoryItem) => {
    Taro.navigateTo({ url: `/pages/detail/index?id=${item.id}` });
  };

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
      onRefresherRefresh={onRefresherRefresh}>
      <View className="page-dark home-page">
        <View className="home-header">
          <View className="greeting">
            {getGreeting()}，<Text className="highlight">{displayName}</Text>
          </View>
          <View className="sub-greeting">探索你身边的万物百科</View>

          <View className="recognize-section">
            <View className="upload-area">
              <CameraUpload
                previewUrl={imagePath}
                onImageSelected={setImagePath}
              />
            </View>

            <View
              className={`btn-gen recognize-btn ${recognizing ? "loading" : ""}`}
              onClick={!recognizing ? handleRecognize : undefined}>
              {recognizing ? "AI 识别中..." : "✨ 开始识别"}
            </View>

            <View className="hint">
              支持拍照或从相册选择，图片将自动压缩后上传
            </View>
          </View>
        </View>

        <View className="record-scroll">
          {loading ? (
            <View className="loading-text">加载中...</View>
          ) : items.length === 0 ? (
            <View className="empty-text">暂无识物记录</View>
          ) : (
            <View className="record-list">
              {items.map(item => (
                <View
                  key={item.id}
                  className="card-item"
                  onClick={() => handleItemClick(item)}>
                  <View className="left">
                    <View className="thumb">
                      {item.inputImage ? (
                        <Image
                          className="thumb-img"
                          src={resolveAssetUrl(item.inputImage)}
                          mode="aspectFill"
                        />
                      ) : (
                        <Text>{getObjectEmoji(item.recognition?.object)}</Text>
                      )}
                    </View>
                    <View className="info">
                      <View className="name">
                        {item.recognition?.object || "识别记录"}
                      </View>
                      <View className="time">
                        {formatRelativeTime(item.createdAt)}
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
