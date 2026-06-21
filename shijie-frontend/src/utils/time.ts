export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return '夜深了';
  if (hour < 12) return '早上好';
  if (hour < 14) return '午安';
  if (hour < 18) return '下午好';
  return '晚上好';
}

export function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days === 1) return '昨天';
  if (days < 7) return `${days}天前`;

  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function getObjectEmoji(name?: string): string {
  if (!name) return '🔮';
  const map: Record<string, string> = {
    咖啡: '☕',
    向日葵: '🌻',
    多肉: '🌵',
    植物: '🌿',
    耳机: '🎧',
    猫: '🐱',
    狗: '🐶',
    花: '🌸',
    书: '📚',
    手机: '📱',
    电脑: '💻',
    星空: '🌌',
    月亮: '🌙',
  };
  for (const [key, emoji] of Object.entries(map)) {
    if (name.includes(key)) return emoji;
  }
  return '✨';
}
