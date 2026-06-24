import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useOverlayCoordination } from './useOverlayCoordination';

const NON_CLEARABLE_TYPES = new Set([
    'checkbox',
    'radio',
    'file',
    'hidden',
    'range',
    'color',
    'button',
    'submit',
    'reset',
]);

type ClearableInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
    wrapperClassName?: string;
    clearAriaLabel?: string;
};

export default function ClearableInput({
    className = '',
    wrapperClassName = '',
    clearAriaLabel = '清除',
    value,
    defaultValue,
    onChange,
    readOnly,
    disabled,
    type = 'text',
    onFocus,
    onBlur,
    ...rest
}: ClearableInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [focused, setFocused] = useState(false);
    const [internalValue, setInternalValue] = useState(() => (
        defaultValue !== undefined && defaultValue !== null ? String(defaultValue) : ''
    ));

    const { claim } = useOverlayCoordination('input', focused, () => setFocused(false), 'clearable-input');

    const isControlled = value !== undefined;
    const currentValue = isControlled ? String(value ?? '') : internalValue;
    const canClear = !NON_CLEARABLE_TYPES.has(String(type)) && !readOnly && !disabled;
    const showClear = canClear && currentValue.length > 0;

    useEffect(() => {
        if (!isControlled && defaultValue !== undefined && defaultValue !== null) {
            setInternalValue(String(defaultValue));
        }
    }, [defaultValue, isControlled]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!isControlled) {
            setInternalValue(event.target.value);
        }
        onChange?.(event);
    };

    const handleClear = () => {
        const input = inputRef.current;
        if (!input) return;

        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            'value',
        )?.set;
        nativeInputValueSetter?.call(input, '');
        input.dispatchEvent(new Event('input', { bubbles: true }));

        if (!isControlled) {
            setInternalValue('');
        }

        onChange?.({
            ...({} as React.ChangeEvent<HTMLInputElement>),
            target: input,
            currentTarget: input,
        });
    };

    return (
        <span
            className={`iot-clearable-input ${showClear ? 'is-clearable' : ''} ${wrapperClassName}`.trim()}
        >
            <input
                {...rest}
                ref={inputRef}
                type={type}
                className={className}
                value={value}
                defaultValue={isControlled ? undefined : defaultValue}
                readOnly={readOnly}
                disabled={disabled}
                onChange={handleChange}
                onFocus={(event) => {
                    claim();
                    setFocused(true);
                    onFocus?.(event);
                }}
                onBlur={(event) => {
                    setFocused(false);
                    onBlur?.(event);
                }}
            />
            {showClear ? (
                <button
                    type="button"
                    className="iot-clearable-input__clear"
                    aria-label={clearAriaLabel}
                    tabIndex={-1}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={handleClear}
                >
                    <X size={14} />
                </button>
            ) : null}
        </span>
    );
}
