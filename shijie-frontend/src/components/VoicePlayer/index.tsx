import { View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState } from 'react';
import { speakText } from '../../services/ai';
import './index.scss';

interface VoicePlayerProps {
  text: string;
}

export default function VoicePlayer({ text }: VoicePlayerProps) {
  const [playing, setPlaying] = useState(false);

  const handleSpeak = async () => {
    if (playing || !text) return;

    setPlaying(true);
    try {
      const res = await speakText(text);

      if (res.data.audioUrl) {
        const audio = Taro.createInnerAudioContext();
        audio.src = res.data.audioUrl;
        audio.onEnded(() => setPlaying(false));
        audio.onError(() => setPlaying(false));
        audio.play();
        return;
      }

      if (process.env.TARO_ENV === 'h5' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'zh-CN';
        utterance.onend = () => setPlaying(false);
        utterance.onerror = () => setPlaying(false);
        window.speechSynthesis.speak(utterance);
        return;
      }

      Taro.showToast({ title: res.data.message || '请使用系统朗读', icon: 'none' });
      setPlaying(false);
    } catch {
      Taro.showToast({ title: '朗读失败', icon: 'none' });
      setPlaying(false);
    }
  };

  return (
    <View className={`voice-player ${playing ? 'playing' : ''}`} onClick={handleSpeak}>
      {playing ? '🔊 朗读中...' : '🔈 语音朗读'}
    </View>
  );
}
