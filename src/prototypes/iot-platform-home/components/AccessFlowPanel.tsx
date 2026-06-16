import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { DeviceAccessPageId } from './DeviceAccessSidebar';

type FlowStep = {
    id: string;
    title: string;
    desc: string;
    pageId?: DeviceAccessPageId;
};

const accessFlowSteps: FlowStep[] = [
    {
        id: 'product',
        title: '创建产品',
        desc: '定义产品信息与节点类型',
        pageId: 'product-management',
    },
    {
        id: 'model',
        title: '配置物模型',
        desc: '定义属性、事件与服务',
    },
    {
        id: 'register',
        title: '注册设备',
        desc: '添加设备或批量导入',
    },
    {
        id: 'connect',
        title: '设备接入',
        desc: '认证连接并建立通信',
    },
    {
        id: 'online',
        title: '设备上线',
        desc: '激活设备并进入在线状态',
    },
    {
        id: 'report',
        title: '数据上报',
        desc: '持续上报运行与状态数据',
    },
];

type AccessFlowPanelProps = {
    onNavigate?: (pageId: DeviceAccessPageId) => void;
};

export default function AccessFlowPanel({ onNavigate }: AccessFlowPanelProps) {
    return (
        <section className="panel ao-flow-panel">
            <div className="ao-flow-head">
                <h3>设备接入流程</h3>
                <p>按顺序完成以下步骤，即可将设备接入平台</p>
            </div>
            <ol className="ao-flow-steps">
                {accessFlowSteps.map((step, index) => {
                    const isLast = index === accessFlowSteps.length - 1;
                    const content = (
                        <>
                            <span className="ao-flow-step__index">{index + 1}</span>
                            <strong className="ao-flow-step__title">{step.title}</strong>
                            <span className="ao-flow-step__desc">{step.desc}</span>
                        </>
                    );

                    return (
                        <li className="ao-flow-step" key={step.id}>
                            {step.pageId && onNavigate ? (
                                <button
                                    type="button"
                                    className="ao-flow-step__body is-link"
                                    onClick={() => onNavigate(step.pageId!)}
                                >
                                    {content}
                                </button>
                            ) : (
                                <div className="ao-flow-step__body">{content}</div>
                            )}
                            {!isLast && (
                                <ChevronRight size={16} className="ao-flow-step__arrow" aria-hidden="true" />
                            )}
                        </li>
                    );
                })}
            </ol>
        </section>
    );
}
