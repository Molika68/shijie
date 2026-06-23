import { View, Textarea, Image, Text, ScrollView } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useState } from "react";
import { textToImage } from "../../services/ai";
import { getAppConfig, isLoggedIn } from "../../services/api";
import { useScrollRefresh } from "../../hooks/useScrollRefresh";
import "./index.scss";

const STYLE_OPTIONS = [
  {
    id: "illustration",
    emoji: "🎨",
    title: "插画",
    desc: "扁平 · 手绘 · 水彩",
  },
  { id: "realistic", emoji: "📸", title: "写实", desc: "摄影 · 电影 · 3D" },
  { id: "scifi", emoji: "🌌", title: "科幻", desc: "赛博 · 机甲 · 宇宙" },
  { id: "chinese", emoji: "🌸", title: "国风", desc: "水墨 · 工笔 · 敦煌" },
];

const MOOD_TAGS = ["全部", "梦幻", "暗黑", "清新", "复古", "极简"];

const isH5 = process.env.TARO_ENV === "h5";

const PROMPT_PLACEHOLDER = "描述你想要的画面，例如：一只猫在月球上喝咖啡";

const STYLE_SUFFIX: Record<string, string> = {
  illustration: "，插画风格，扁平手绘",
  realistic: "，写实摄影风格，高清细节",
  scifi: "，科幻赛博朋克风格",
  chinese: "，中国风水墨画风格",
};

export default function GeneratePage() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("illustration");
  const [activeMood, setActiveMood] = useState("全部");

  const refreshPage = async () => {
    if (!isLoggedIn()) return;
    await getAppConfig().catch(() => {});
  };

  useDidShow(() => {
    if (!isLoggedIn()) {
      Taro.navigateTo({ url: "/pages/login/index" });
    }
  });

  const { refreshing, onRefresherRefresh } = useScrollRefresh(refreshPage);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      Taro.showToast({ title: "请输入描述", icon: "none" });
      return;
    }

    setLoading(true);
    setImageUrl("");
    try {
      let finalPrompt = prompt.trim();
      const suffix = STYLE_SUFFIX[selectedStyle];
      if (suffix) finalPrompt += suffix;
      if (activeMood !== "全部") finalPrompt += `，${activeMood}氛围`;

      const res = await textToImage(finalPrompt);
      setImageUrl(res.data.imageUrl);
    } catch (err) {
      Taro.showToast({
        title: err instanceof Error ? err.message : "生成失败",
        icon: "none",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = () => {
    if (imageUrl) Taro.previewImage({ urls: [imageUrl] });
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
      <View className="page-dark generate-page">
        <View className="page-title">
          ✨ <Text className="highlight">创作</Text> 工坊
        </View>
        <View className="page-desc">选择风格，输入灵感，即刻生成</View>

        <View className="create-options">
          {STYLE_OPTIONS.map(opt => (
            <View
              key={opt.id}
              className={`create-option ${selectedStyle === opt.id ? "active" : ""}`}
              onClick={() => setSelectedStyle(opt.id)}>
              <Text className="emoji-big">{opt.emoji}</Text>
              <View className="opt-title">{opt.title}</View>
              <View className="opt-desc">{opt.desc}</View>
            </View>
          ))}
        </View>

        <View className="create-input-area">
          {isH5 ? (
            <textarea
              className="prompt-input"
              placeholder={PROMPT_PLACEHOLDER}
              value={prompt}
              maxLength={500}
              onChange={e => setPrompt(e.currentTarget.value)}
            />
          ) : (
            <Textarea
              className="prompt-input"
              placeholder={PROMPT_PLACEHOLDER}
              value={prompt}
              maxlength={500}
              onInput={e => setPrompt(e.detail.value)}
            />
          )}
        </View>

        <View className="create-actions">
          <View
            className={`btn-gen ${loading ? "loading" : ""}`}
            onClick={!loading ? handleGenerate : undefined}>
            {loading ? "生成中..." : "✨ 生成"}
          </View>
        </View>

        <View className="style-tags">
          {MOOD_TAGS.map(tag => (
            <View
              key={tag}
              className={`style-tag ${activeMood === tag ? "active" : ""}`}
              onClick={() => setActiveMood(tag)}>
              {tag}
            </View>
          ))}
        </View>

        {imageUrl && (
          <View className="result-image-wrap" onClick={handlePreview}>
            <Image className="result-image" src={imageUrl} mode="widthFix" />
            <View className="save-hint">点击查看大图 · 长按可保存</View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
