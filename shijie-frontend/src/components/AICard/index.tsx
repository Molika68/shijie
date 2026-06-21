import { View, Text } from '@tarojs/components';
import { RecognitionResult } from '../../services/api';
import './index.scss';

interface AICardProps {
  result: RecognitionResult;
}

export default function AICard({ result }: AICardProps) {
  return (
    <View className="ai-card">
      <View className="object-name">{result.object}</View>
      <View className="english">{result.english}</View>
      <Text className="description">{result.description}</Text>
    </View>
  );
}
