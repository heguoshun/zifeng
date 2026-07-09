import React from 'react';
import { ShieldCheck } from 'lucide-react';

type LoginPageProps = {
    onLogin: () => void;
};

export default function LoginPage({ onLogin }: LoginPageProps) {
    return (
        <div className="dma-login">
            <div className="dma-login-hero">
                <div className="dma-login-logo">
                    <ShieldCheck size={28} strokeWidth={2.2} />
                </div>
                <h1>设备管理</h1>
                <p>紫峰装备 · 现场运维移动端</p>
            </div>

            <div className="dma-login-card">
                <div className="dma-field">
                    <label htmlFor="dma-account">账号</label>
                    <input id="dma-account" defaultValue="zhangsan" placeholder="请输入账号" />
                </div>
                <div className="dma-field">
                    <label htmlFor="dma-password">密码</label>
                    <input id="dma-password" type="password" defaultValue="123456" placeholder="请输入密码" />
                </div>
                <button type="button" className="dma-btn dma-btn-primary dma-btn-block" onClick={onLogin}>
                    登录
                </button>
            </div>
        </div>
    );
}
