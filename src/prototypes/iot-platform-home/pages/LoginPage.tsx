import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Eye, EyeOff, Lock, Mail, Phone, RefreshCw, ShieldCheck, UserRound } from 'lucide-react';
import platformLogo from '../assets/platform-logo.png';
import loginBgUrl from '../assets/login-bg.png?url';
import IotToast, { type IotToastData, triggerIotToast } from '../components/IotToast';
import {
    authenticateCredentials,
    DEFAULT_USER_INIT_PASSWORD,
    getLoginErrorMessage,
    loadRememberedAccount,
    persistRememberedAccount,
    persistSession,
    PLATFORM_SUPER_ADMIN_ACCOUNT,
    type PlatformSessionUser,
} from '../data/platformSession';
import type { SystemUserRecord } from '../data/systemUsers';
import '../login.css';

const PLATFORM_NAME = '紫峰装备智慧化管理平台';
const PLATFORM_SLOGAN = '智慧物联 · 高效运维 · 安全可靠';
const ADMIN_CONTACT = {
    name: '系统管理员',
    phone: '18947728990',
    email: 'admin@zifeng.com',
    workTime: '工作日 9:00 - 18:00',
};

function LoginContactDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
    useEffect(() => {
        if (!open) return undefined;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [open]);

    if (!open) return null;

    return createPortal(
        <div
            className="login-contact-dialog__mask"
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <div
                className="login-contact-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="login-contact-dialog-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="login-contact-dialog__head">
                    <h3 id="login-contact-dialog-title">联系管理员</h3>
                    <button type="button" className="login-contact-dialog__close" onClick={onClose} aria-label="关闭">×</button>
                </div>
                <div className="login-contact-dialog__body">
                    <p className="login-contact-dialog__intro">如需开通账号或重置密码，请联系平台管理员：</p>
                    <dl className="login-contact-dialog__list">
                        <div className="login-contact-dialog__item">
                            <dt>联系人</dt>
                            <dd>{ADMIN_CONTACT.name}</dd>
                        </div>
                        <div className="login-contact-dialog__item">
                            <dt><Phone size={14} aria-hidden /> 联系电话</dt>
                            <dd><a href={`tel:${ADMIN_CONTACT.phone}`}>{ADMIN_CONTACT.phone}</a></dd>
                        </div>
                        <div className="login-contact-dialog__item">
                            <dt><Mail size={14} aria-hidden /> 电子邮箱</dt>
                            <dd><a href={`mailto:${ADMIN_CONTACT.email}`}>{ADMIN_CONTACT.email}</a></dd>
                        </div>
                        <div className="login-contact-dialog__item">
                            <dt>服务时间</dt>
                            <dd>{ADMIN_CONTACT.workTime}</dd>
                        </div>
                    </dl>
                </div>
                <div className="login-contact-dialog__foot">
                    <button type="button" className="login-contact-dialog__btn" onClick={onClose}>我知道了</button>
                </div>
            </div>
        </div>,
        document.body,
    );
}

function generateCaptchaCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

type LoginPageProps = {
    users: SystemUserRecord[];
    onLoginSuccess: (user: PlatformSessionUser, remember: boolean) => void;
};

export default function LoginPage({ users, onLoginSuccess }: LoginPageProps) {
    const [account, setAccount] = useState(() => loadRememberedAccount() || PLATFORM_SUPER_ADMIN_ACCOUNT);
    const [password, setPassword] = useState('');
    const [captchaInput, setCaptchaInput] = useState('');
    const [captchaCode, setCaptchaCode] = useState(generateCaptchaCode);
    const [remember, setRemember] = useState(() => Boolean(loadRememberedAccount()));
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [toast, setToast] = useState<IotToastData | null>(null);
    const [contactDialogOpen, setContactDialogOpen] = useState(false);

    const refreshCaptcha = useCallback(() => {
        setCaptchaCode(generateCaptchaCode());
        setCaptchaInput('');
    }, []);

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (submitting) return;

        setErrorMessage('');

        if (!captchaInput.trim()) {
            setErrorMessage('请输入验证码');
            return;
        }
        if (captchaInput.trim().toUpperCase() !== captchaCode) {
            setErrorMessage('验证码错误');
            refreshCaptcha();
            return;
        }

        const result = authenticateCredentials(account, password, users);
        if (!result.ok) {
            setErrorMessage(getLoginErrorMessage(result.reason));
            refreshCaptcha();
            return;
        }

        setSubmitting(true);
        persistRememberedAccount(account, remember);
        persistSession(result.user, remember);

        triggerIotToast(setToast, `欢迎回来，${result.user.displayName}`, 'success');
        window.setTimeout(() => {
            onLoginSuccess(result.user, remember);
        }, 320);
    };

    const inputErrorClass = errorMessage ? 'is-error' : '';

    return (
        <div className="login-page">
            <div
                className="login-page__bg"
                style={{ backgroundImage: `url("${loginBgUrl}")` }}
                aria-hidden="true"
            />

            <header className="login-page__header">
                <img className="login-page__header-logo" src={platformLogo} alt="紫峰装备" />
                <div>
                    <h1 className="login-page__header-title">{PLATFORM_NAME}</h1>
                    <p className="login-page__header-slogan">{PLATFORM_SLOGAN}</p>
                </div>
            </header>

            <div className="login-page__layout">
                <section className="login-page__card" aria-label="登录表单">
                    <h2 className="login-page__card-title">欢迎登录</h2>
                    <p className="login-page__card-subtitle">{PLATFORM_NAME}</p>

                    <form className="login-page__form" onSubmit={handleSubmit}>
                        <div className={`login-page__input-group ${inputErrorClass}`}>
                            <span className="login-page__input-icon" aria-hidden="true">
                                <UserRound size={18} />
                            </span>
                            <input
                                className="login-page__input"
                                value={account}
                                onChange={(event) => setAccount(event.target.value)}
                                placeholder="请输入用户名"
                                autoComplete="username"
                                disabled={submitting}
                            />
                        </div>

                        <div className={`login-page__input-group ${inputErrorClass}`}>
                            <span className="login-page__input-icon" aria-hidden="true">
                                <Lock size={18} />
                            </span>
                            <input
                                className="login-page__input"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                placeholder="请输入密码"
                                autoComplete="current-password"
                                disabled={submitting}
                            />
                            <button
                                type="button"
                                className="login-page__password-toggle"
                                aria-label={showPassword ? '隐藏密码' : '显示密码'}
                                onClick={() => setShowPassword((prev) => !prev)}
                                disabled={submitting}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>

                        <div className="login-page__captcha-row">
                            <div className={`login-page__input-group ${inputErrorClass}`}>
                                <span className="login-page__input-icon" aria-hidden="true">
                                    <ShieldCheck size={18} />
                                </span>
                                <input
                                    className="login-page__input"
                                    value={captchaInput}
                                    onChange={(event) => setCaptchaInput(event.target.value)}
                                    placeholder="请输入验证码"
                                    autoComplete="off"
                                    maxLength={4}
                                    disabled={submitting}
                                />
                            </div>
                            <div className="login-page__captcha-box">
                                <span className="login-page__captcha-image" aria-hidden="true">{captchaCode}</span>
                                <button
                                    type="button"
                                    className="login-page__captcha-refresh"
                                    aria-label="刷新验证码"
                                    onClick={refreshCaptcha}
                                    disabled={submitting}
                                >
                                    <RefreshCw size={14} />
                                </button>
                            </div>
                        </div>

                        <div className="login-page__options">
                            <label className="login-page__remember">
                                <input
                                    type="checkbox"
                                    checked={remember}
                                    onChange={(event) => setRemember(event.target.checked)}
                                    disabled={submitting}
                                />
                                <span>记住账号</span>
                            </label>
                        </div>

                        {errorMessage ? <p className="login-page__error" role="alert">{errorMessage}</p> : null}

                        <button type="submit" className="login-page__submit" disabled={submitting}>
                            {submitting ? '登录中...' : '登 录'}
                        </button>
                    </form>

                    <div className="login-page__hint">
                        <p className="login-page__hint-title">演示账号</p>
                        <p className="login-page__hint-row">
                            <UserRound size={14} aria-hidden />
                            <span>账号</span>
                            <code>{PLATFORM_SUPER_ADMIN_ACCOUNT}</code>
                        </p>
                        <p className="login-page__hint-row">
                            <Lock size={14} aria-hidden />
                            <span>密码</span>
                            <code>{DEFAULT_USER_INIT_PASSWORD}</code>
                        </p>
                    </div>

                    <p className="login-page__footer">
                        没有账号？
                        <button
                            type="button"
                            className="login-page__footer-link"
                            onClick={() => setContactDialogOpen(true)}
                        >
                            联系管理员
                        </button>
                    </p>
                </section>
            </div>

            <LoginContactDialog open={contactDialogOpen} onClose={() => setContactDialogOpen(false)} />
            <IotToast toast={toast} />
        </div>
    );
}
