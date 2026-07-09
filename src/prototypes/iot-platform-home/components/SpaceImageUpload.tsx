import React, { useRef } from 'react';
import { Plus, X } from 'lucide-react';

type SpaceImageUploadProps = {
    value?: string;
    onChange: (imageUrl: string) => void;
    readonly?: boolean;
};

const ACCEPT_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
const MAX_SIZE_MB = 15;

export default function SpaceImageUpload({ value, onChange, readonly }: SpaceImageUploadProps) {
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
        <div className="sc-space-image">
            <div className="pcp-upload-wrap">
                {value ? (
                    <div className="sc-space-image__preview">
                        <img src={value} alt="空间图片预览" className="sc-space-image__img" />
                        {!readonly && (
                            <button
                                type="button"
                                className="sc-space-image__remove"
                                aria-label="删除图片"
                                onClick={() => onChange('')}
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                ) : (
                    <button
                        type="button"
                        className={`pcp-upload-box ${readonly ? 'is-readonly' : ''}`.trim()}
                        aria-label="上传空间图片"
                        disabled={readonly}
                        onClick={() => inputRef.current?.click()}
                    >
                        <Plus size={22} />
                        <span>上传文件</span>
                    </button>
                )}
                <p className="pcp-upload-tip">
                    支持 jpg、png 图片及 3D 模型文件
                    <br />
                    大小不超过 15M
                </p>
            </div>
            {!readonly && (
                <input
                    ref={inputRef}
                    type="file"
                    className="sc-space-image__input"
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    onChange={handleFileChange}
                />
            )}
        </div>
    );
}
