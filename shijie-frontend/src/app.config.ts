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
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#0e0e28',
    navigationBarTitleText: '识界',
    navigationBarTextStyle: 'white',
    backgroundColor: '#0e0e28',
  },
  tabBar: {
    color: '#6a6a8e',
    selectedColor: '#b07aff',
    backgroundColor: '#0e0e28',
    borderStyle: 'black',
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
