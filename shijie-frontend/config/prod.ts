import type { UserConfigExport } from '@tarojs/cli';

export default {
  defineConstants: {
    API_BASE_URL: JSON.stringify(
      process.env.TARO_APP_API || 'http://localhost:3000/api',
    ),
  },
  mini: {},
  h5: {},
} satisfies UserConfigExport<'vite'>;
