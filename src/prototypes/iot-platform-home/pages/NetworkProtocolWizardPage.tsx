import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, Info } from 'lucide-react';
import networkProtocolStep1Icon from '../assets/network-protocol-step1-icon.png';
import networkProtocolStep2Icon from '../assets/network-protocol-step2-icon.png';
import networkProtocolStep3Icon from '../assets/network-protocol-step3-icon.png';
import AppShell from '../components/AppShell';
import DeviceAccessSidebar, { type DeviceAccessPageId } from '../components/DeviceAccessSidebar';
import IotToast, { type IotToastData, type IotToastType, triggerIotToast } from '../components/IotToast';
import {
    NETWORK_PROTOCOL_COMPONENTS,
    NETWORK_PROTOCOL_OPTIONS,
    NETWORK_PROTOCOL_SERVICE_TYPES,
    buildNetworkProtocolRecord,
    getProtocolOptionsForServiceType,
    type NetworkProtocolRecord,
} from '../data/networkProtocols';
import '../device-access.css';
import '../product-management.css';
import '../product-create.css';
import '../network-protocol.css';

const DESCRIPTION_MAX = 100;

const WIZARD_STEPS = [
    '选择组件类型',
    '选择网络组件',
    '选择通信协议',
    '完成',
] as const;

type WizardState = {
    serviceTypeId: string;
    networkComponentId: string;
    protocolOptionId: string;
    name: string;
    description: string;
};

const EMPTY_WIZARD: WizardState = {
    serviceTypeId: '',
    networkComponentId: '',
    protocolOptionId: '',
    name: '',
    description: '',
};

type NetworkProtocolWizardPageProps = {
    mode: 'create' | 'edit';
    editingRecord: NetworkProtocolRecord | null;
    networkProtocols: NetworkProtocolRecord[];
    onUpdateNetworkProtocols: React.Dispatch<React.SetStateAction<NetworkProtocolRecord[]>>;
    onNavigateHome: () => void;
    onNavigateDeviceAccess: () => void;
    onNavigateMessageCenter: () => void;
    onNavigate: (pageId: DeviceAccessPageId) => void;
    onNavigateOmManagement: () => void;
    onBack: () => void;
};

function WizardSteps({ currentStep }: { currentStep: number }) {
    return (
        <div className="np-wizard-steps">
            {WIZARD_STEPS.map((label, index) => {
                const stepNumber = index + 1;
                const isActive = currentStep === stepNumber;
                const isDone = currentStep > stepNumber;
                return (
                    <React.Fragment key={label}>
                        <div className={`np-wizard-step ${isActive ? 'is-active' : ''} ${isDone ? 'is-done' : ''}`.trim()}>
                            <span className="np-wizard-step__index">{stepNumber}</span>
                            <span>{label}</span>
                        </div>
                        {index < WIZARD_STEPS.length - 1 ? (
                            <span className={`np-wizard-step__line ${isDone ? 'is-done' : ''}`.trim()} />
                        ) : null}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

const WIZARD_STEP_ICONS = {
    1: networkProtocolStep1Icon,
    2: networkProtocolStep2Icon,
    3: networkProtocolStep3Icon,
} as const;

function WizardCardIcon({ step }: { step: keyof typeof WIZARD_STEP_ICONS }) {
    return (
        <span className="np-select-card__icon">
            <img src={WIZARD_STEP_ICONS[step]} alt="" />
        </span>
    );
}

function SelectCard({
    selected,
    onClick,
    children,
}: {
    selected: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            className={`np-select-card ${selected ? 'is-selected' : ''}`.trim()}
            onClick={onClick}
        >
            <Check size={12} className="np-select-card__check" aria-hidden="true" />
            {children}
        </button>
    );
}

export default function NetworkProtocolWizardPage({
    mode,
    editingRecord,
    networkProtocols,
    onUpdateNetworkProtocols,
    onNavigateHome,
    onNavigateDeviceAccess,
    onNavigateMessageCenter,
    onNavigate,
    onNavigateOmManagement,
    onBack,
}: NetworkProtocolWizardPageProps) {
    const [currentStep, setCurrentStep] = useState(1);
    const [wizard, setWizard] = useState<WizardState>(EMPTY_WIZARD);
    const [toast, setToast] = useState<IotToastData | null>(null);

    const showToast = (message: string, type: IotToastType = 'warning') => {
        triggerIotToast(setToast, message, type);
    };

    useEffect(() => {
        if (mode === 'edit' && editingRecord) {
            setWizard({
                serviceTypeId: editingRecord.serviceTypeId,
                networkComponentId: editingRecord.networkComponentId,
                protocolOptionId: editingRecord.protocolOptionId,
                name: editingRecord.name,
                description: editingRecord.description,
            });
            setCurrentStep(1);
            return;
        }
        setWizard(EMPTY_WIZARD);
        setCurrentStep(1);
    }, [mode, editingRecord?.id]);

    const protocolOptions = useMemo(
        () => (wizard.serviceTypeId
            ? getProtocolOptionsForServiceType(wizard.serviceTypeId)
            : NETWORK_PROTOCOL_OPTIONS),
        [wizard.serviceTypeId],
    );

    const canGoNext = useMemo(() => {
        if (currentStep === 1) return Boolean(wizard.serviceTypeId);
        if (currentStep === 2) return Boolean(wizard.networkComponentId);
        if (currentStep === 3) return Boolean(wizard.protocolOptionId);
        if (currentStep === 4) return wizard.name.trim().length > 0;
        return false;
    }, [currentStep, wizard]);

    const handleNext = () => {
        if (!canGoNext) return;
        if (currentStep < 4) {
            setCurrentStep((step) => step + 1);
            return;
        }

        const duplicate = networkProtocols.some((item) => (
            item.name === wizard.name.trim() && item.id !== editingRecord?.id
        ));
        if (duplicate) {
            showToast('组件名称已存在');
            return;
        }

        const built = buildNetworkProtocolRecord({
            name: wizard.name.trim(),
            description: wizard.description.trim(),
            serviceTypeId: wizard.serviceTypeId,
            networkComponentId: wizard.networkComponentId,
            protocolOptionId: wizard.protocolOptionId,
            id: editingRecord?.id,
            createdAt: editingRecord?.createdAt,
        });

        if (!built) {
            showToast('请完整填写网络协议信息');
            return;
        }

        if (mode === 'create') {
            onUpdateNetworkProtocols((prev) => [built, ...prev]);
            showToast('网络协议新增成功', 'success');
        } else {
            onUpdateNetworkProtocols((prev) => prev.map((item) => (
                item.id === built.id ? built : item
            )));
            showToast('网络协议保存成功', 'success');
        }
        onBack();
    };

    const sidebar = <DeviceAccessSidebar pageId="network-protocol" onNavigate={onNavigate} />;

    return (
        <AppShell
            activeTopTab="设备接入"
            sidebar={sidebar}
            onNavigateOmManagement={onNavigateOmManagement}
            onNavigateMessageCenter={onNavigateMessageCenter}
            onTopTabChange={(tab) => {
                if (tab === '设备接入') onNavigate('home');
                if (tab === '运维管理') onNavigateOmManagement();
            }}
        >
            <div className="np-wizard-page">
                <div className="np-wizard-head">
                    <button type="button" className="np-wizard-back" onClick={onBack} aria-label="返回">
                        <ArrowLeft size={18} />
                    </button>
                    <h2>{mode === 'create' ? '新增网络协议' : '编辑网络协议'}</h2>
                </div>

                <section className="panel np-wizard-panel">
                    <div className="np-wizard-content">
                        <WizardSteps currentStep={currentStep} />

                    {currentStep === 1 ? (
                        <>
                            <div className="np-wizard-tip">
                                <Info size={16} />
                                请选择设备的通信网络类型
                            </div>
                            <div className="np-wizard-grid">
                                {NETWORK_PROTOCOL_SERVICE_TYPES.map((item) => (
                                    <SelectCard
                                        key={item.id}
                                        selected={wizard.serviceTypeId === item.id}
                                        onClick={() => setWizard((prev) => ({
                                            ...prev,
                                            serviceTypeId: item.id,
                                            protocolOptionId: '',
                                        }))}
                                    >
                                        <div className="np-select-card__main">
                                            <WizardCardIcon step={1} />
                                            <div className="np-select-card__content">
                                                <span className="np-select-card__title">{item.label}</span>
                                            </div>
                                        </div>
                                    </SelectCard>
                                ))}
                            </div>
                        </>
                    ) : null}

                    {currentStep === 2 ? (
                        <>
                            <div className="np-wizard-tip">
                                <Info size={16} />
                                请选择通信网络组件
                            </div>
                            <div className="np-wizard-grid">
                                {NETWORK_PROTOCOL_COMPONENTS.map((item) => (
                                    <SelectCard
                                        key={item.id}
                                        selected={wizard.networkComponentId === item.id}
                                        onClick={() => setWizard((prev) => ({
                                            ...prev,
                                            networkComponentId: item.id,
                                        }))}
                                    >
                                        <div className="np-select-card__main">
                                            <WizardCardIcon step={2} />
                                            <div className="np-select-card__content">
                                                <span className="np-select-card__title">{item.name}</span>
                                                <span className="np-select-card__status">
                                                    <i className="np-select-card__status-dot" />
                                                    {item.ipAddress}
                                                </span>
                                            </div>
                                        </div>
                                    </SelectCard>
                                ))}
                            </div>
                        </>
                    ) : null}

                    {currentStep === 3 ? (
                        <>
                            <div className="np-wizard-tip">
                                <Info size={16} />
                                请选择设备通信协议
                            </div>
                            <div className="np-wizard-grid">
                                {protocolOptions.map((item) => (
                                    <SelectCard
                                        key={item.id}
                                        selected={wizard.protocolOptionId === item.id}
                                        onClick={() => setWizard((prev) => ({
                                            ...prev,
                                            protocolOptionId: item.id,
                                        }))}
                                    >
                                        <div className="np-select-card__main">
                                            <WizardCardIcon step={3} />
                                            <div className="np-select-card__content">
                                                <span className="np-select-card__title">{item.protocolName}</span>
                                                <span className="np-select-card__sub">类型：{item.protocolType}</span>
                                            </div>
                                        </div>
                                    </SelectCard>
                                ))}
                            </div>
                        </>
                    ) : null}

                    {currentStep === 4 ? (
                        <>
                            <div className="np-wizard-tip">
                                <Info size={16} />
                                请选择填写信息
                            </div>
                            <div className="np-wizard-form">
                                <label className="pcp-drawer-field">
                                    <span className="pcp-form-label"><em>*</em>组件名称：</span>
                                    <input
                                        type="text"
                                        className="pcp-form-input"
                                        placeholder="请输入组件名称"
                                        value={wizard.name}
                                        onChange={(event) => setWizard((prev) => ({
                                            ...prev,
                                            name: event.target.value,
                                        }))}
                                    />
                                </label>
                                <label className="pcp-drawer-field">
                                    <span className="pcp-form-label">组件描述：</span>
                                    <div className="dai-textarea-wrap">
                                        <textarea
                                            className="pcp-form-textarea"
                                            placeholder="请输入描述信息"
                                            maxLength={DESCRIPTION_MAX}
                                            rows={4}
                                            value={wizard.description}
                                            onChange={(event) => setWizard((prev) => ({
                                                ...prev,
                                                description: event.target.value,
                                            }))}
                                        />
                                        <span className="dai-textarea-counter">
                                            {wizard.description.length}/{DESCRIPTION_MAX}
                                        </span>
                                    </div>
                                </label>
                            </div>
                        </>
                    ) : null}
                    </div>

                    <div className="np-wizard-foot">
                        <button type="button" className="pm-btn pm-btn-ghost" onClick={onBack}>取消</button>
                        {currentStep > 1 ? (
                            <button
                                type="button"
                                className="pm-btn pm-btn-primary"
                                onClick={() => setCurrentStep((step) => step - 1)}
                            >
                                上一步
                            </button>
                        ) : null}
                        <button
                            type="button"
                            className="pm-btn pm-btn-primary"
                            disabled={!canGoNext}
                            onClick={handleNext}
                        >
                            {currentStep === 4 ? '完成' : '下一步'}
                        </button>
                    </div>
                </section>
            </div>

            <IotToast toast={toast} />
        </AppShell>
    );
}
