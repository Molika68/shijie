const isWeapp = process.env.TARO_ENV === 'weapp';
const iconExt = isWeapp ? 'png' : 'svg';

export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/generate/index',
    'pages/profile/index',
    'pages/history/index',
    'pages/detail/index',
    'pages/login/index',
  ],
  window: {
    backgroundTextStyle: 'dark',
    navigationBarBackgroundColor: '#aebefc',
    navigationBarTitleText: '识界',
    navigationBarTextStyle: 'black',
    backgroundColor: '#aebefc',
  },
  tabBar: {
    color: '#8a8aaa',
    selectedColor: '#7b5cff',
    backgroundColor: '#eeeef8',
    borderStyle: 'white',
    safeAreaInsetBottom: true,
    list: [
      {
        pagePath: 'pages/home/index',
        text: '发现',
        iconPath: `./static/tabbar/discover.${iconExt}`,
        selectedIconPath: `./static/tabbar/discover-active.${iconExt}`,
      },
      {
        pagePath: 'pages/generate/index',
        text: '创作',
        iconPath: `./static/tabbar/create.${iconExt}`,
        selectedIconPath: `./static/tabbar/create-active.${iconExt}`,
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
        iconPath: `./static/tabbar/profile.${iconExt}`,
        selectedIconPath: `./static/tabbar/profile-active.${iconExt}`,
      },
    ],
  },
});
