import React, { useRef } from 'react';
import { Camera, UserRound, X } from 'lucide-react';

type UserAvatarUploadProps = {
    value?: string;
    onChange: (imageUrl: string) => void;
    readonly?: boolean;
};

const ACCEPT_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
const MAX_SIZE_MB = 15;

export default function UserAvatarUpload({ value, onChange, readonly }: UserAvatarUploadProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;

        if (!ACCEPT_TYPES.includes(file.type)) {
            return;
        }

        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                onChange(reader.result);
            }
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="um-avatar-upload">
            <div className="um-avatar-upload__main">
                {value ? (
                    <div className="um-avatar-upload__preview">
                        <img src={value} alt="用户头像预览" className="um-avatar-upload__img" />
                        {!readonly && (
                            <>
                                <button
                                    type="button"
                                    className="um-avatar-upload__overlay"
                                    aria-label="更换头像"
                                    onClick={() => inputRef.current?.click()}
                                >
                                    <Camera size={18} />
                                    <span>更换</span>
                                </button>
                                <button
                                    type="button"
                                    className="um-avatar-upload__remove"
                                    aria-label="删除头像"
                                    onClick={() => onChange('')}
                                >
                                    <X size={12} />
                                </button>
                            </>
                        )}
                    </div>
                ) : (
                    <button
                        type="button"
                        className={`um-avatar-upload__placeholder ${readonly ? 'is-readonly' : ''}`.trim()}
                        aria-label="上传头像"
                        disabled={readonly}
                        onClick={() => inputRef.current?.click()}
                    >
                        <UserRound size={28} strokeWidth={1.5} />
                        <span>上传头像</span>
                    </button>
                )}
            </div>
            {!readonly && (
                <>
                    <p className="um-avatar-upload__tip">
                        支持 jpg、png 格式，大小不超过 15M
                    </p>
                    <input
                        ref={inputRef}
                        type="file"
                        className="um-avatar-upload__input"
                        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                        onChange={handleFileChange}
                    />
                </>
            )}
        </div>
    );
}
