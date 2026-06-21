import Taro, { usePullDownRefresh } from '@tarojs/taro';

export function usePageRefresh(refreshFn: () => void | Promise<void>) {
  usePullDownRefresh(() => {
    Promise.resolve(refreshFn()).finally(() => {
      Taro.stopPullDownRefresh();
    });
  });
}
