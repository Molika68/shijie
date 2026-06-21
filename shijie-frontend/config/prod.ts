import type { UserConfigExport } from '@tarojs/cli';

export default {
  defineConstants: {
    API_BASE_URL: JSON.stringify(
      process.env.TARO_APP_API || 'https://your-api.onrender.com/api',
    ),
  },
  mini: {},
  h5: {},
} satisfies UserConfigExport<'vite'>;
