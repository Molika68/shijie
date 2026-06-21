import { View, Input, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState } from 'react';
import { login, sendCode, setAuth } from '../../services/api';
import './index.scss';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendCode = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Taro.showToast({ title: '请输入有效邮箱', icon: 'none' });
      return;
    }

    setSending(true);
    try {
      const res = await sendCode(email);
      startCountdown();
      const devHint = res.data.devCode ? `（开发码: ${res.data.devCode}）` : '';
      Taro.showToast({ title: `${res.data.message}${devHint}`, icon: 'none', duration: 3000 });
    } catch (err) {
      Taro.showToast({
        title: err instanceof Error ? err.message : '发送失败',
        icon: 'none',
      });
    } finally {
      setSending(false);
    }
  };

  const handleLogin = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Taro.showToast({ title: '请输入有效邮箱', icon: 'none' });
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      Taro.showToast({ title: '请输入 6 位验证码', icon: 'none' });
      return;
    }

    setLoading(true);
    try {
      const res = await login(email, code);
      setAuth(res.data.token, { userId: res.data.userId, email: res.data.email }, res.data.refreshToken);
      Taro.showToast({ title: '登录成功', icon: 'success' });
      setTimeout(() => Taro.switchTab({ url: '/pages/home/index' }), 500);
    } catch (err) {
      Taro.showToast({
        title: err instanceof Error ? err.message : '登录失败',
        icon: 'none',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="page-dark login-page">
      <View className="logo-wrap">
        <View className="logo-icon">🔮</View>
        <View className="logo">识界</View>
        <View className="slogan">多模态 AI 智能助手</View>
      </View>

      <View className="login-card">
        <View className="input-label">邮箱登录</View>
        <Input
          className="email-input"
          type="text"
          placeholder="请输入邮箱"
          placeholderClass="input-placeholder"
          value={email}
          onInput={(e) => setEmail(e.detail.value.trim())}
        />

        <View className="code-row">
          <Input
            className="code-input"
            type="number"
            maxlength={6}
            placeholder="6 位验证码"
            placeholderClass="input-placeholder"
            value={code}
            onInput={(e) => setCode(e.detail.value)}
          />
          <View
            className={`send-code-btn ${countdown > 0 || sending ? 'disabled' : ''}`}
            onClick={countdown === 0 && !sending ? handleSendCode : undefined}
          >
            {sending ? '发送中' : countdown > 0 ? `${countdown}s` : '获取验证码'}
          </View>
        </View>
      </View>

      <View
        className={`btn-gen ${loading ? 'loading' : ''}`}
        onClick={!loading ? handleLogin : undefined}
      >
        {loading ? '登录中...' : '登录'}
      </View>

      <View className="tip">
        零成本方案：Resend 免费发邮件；未配置时验证码在后端控制台输出
      </View>
    </View>
  );
}
