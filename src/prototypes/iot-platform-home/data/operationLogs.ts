export type OperationLogStatus = '成功' | '失败';

export type OperationLogType = '添加' | '删除' | '查询' | '修改' | '导入' | '导出';

export type OperationLogRecord = {
    id: string;
    module: string;
    operationType: OperationLogType;
    requestMethod: string;
    operator: string;
    host: string;
    status: OperationLogStatus;
    operationTime: string;
    operationMethod?: string;
    requestUrl?: string;
    requestParams?: string;
    responseParams?: string;
    responseMessage?: string;
    durationMs?: number;
};

export const OPERATION_LOG_TYPE_OPTIONS = ['全部', '添加', '删除', '查询', '修改', '导入', '导出'] as const;
export const OPERATION_LOG_STATUS_OPTIONS = ['全部', '成功', '失败'] as const;

export function createInitialOperationLogs(): OperationLogRecord[] {
    return [
        {
            id: '1776047164089',
            module: '更新设备',
            operationType: '修改',
            requestMethod: 'PUT',
            operator: 'admin',
            host: '10.6.126.198',
            status: '成功',
            operationTime: '2026-04-13 10:26:04',
            operationMethod: 'com.bestlink.device.controller.IotDeviceController.edit()',
            requestUrl: '/iot/device/edit',
            requestParams: '{"id":"1776047164089","createBy":"admin","createTime":"2026-04-13 09:10:00","updateBy":"admin","updateTime":"2026-04-13 10:26:04","deviceCode":"GF-DM-003","deviceName":"桥北_1.88MW_光伏3#电表","productCode":"GF-001","productName":"光伏产品","deviceStatus":"在线","classifyName":"光伏产品","deptCode":"D001","locationType":"园区","networkId":"NW-1001","protocolId":"PR-2001","status":1,"pageNo":1,"pageSize":10}',
            responseParams: "{'success':true,'message':'操作成功','code':200,'data':null,'timestamp':1776047164088}",
            responseMessage: '操作成功',
            durationMs: 128,
        },
        {
            id: '1776045123098',
            module: '新增协议',
            operationType: '添加',
            requestMethod: 'POST',
            operator: 'admin',
            host: '10.6.126.198',
            status: '成功',
            operationTime: '2026-04-13 09:52:03',
            operationMethod: 'com.bestlink.protocol.controller.ProtocolController.add()',
            requestUrl: '/iot/protocol/add',
            requestParams: '{"name":"MQTT协议","type":"Local"}',
            responseParams: "{'success':true,'message':'操作成功','code':200,'data':null,'timestamp':1776045123098}",
            responseMessage: '操作成功',
            durationMs: 96,
        },
        {
            id: '1776043018842',
            module: '删除网络服务',
            operationType: '删除',
            requestMethod: 'DELETE',
            operator: 'zhangsan',
            host: '10.0.98.54',
            status: '成功',
            operationTime: '2026-04-13 09:16:58',
            operationMethod: 'com.bestlink.network.controller.NetworkServiceController.delete()',
            requestUrl: '/iot/network-service/delete',
            responseParams: "{'success':true,'message':'操作成功','code':200,'data':null,'timestamp':1776043018842}",
            responseMessage: '操作成功',
            durationMs: 74,
        },
        {
            id: '1776041022764',
            module: '查询设备列表',
            operationType: '查询',
            requestMethod: 'GET',
            operator: 'lisi',
            host: '192.168.1.24',
            status: '成功',
            operationTime: '2026-04-13 08:43:42',
            operationMethod: 'com.bestlink.device.controller.IotDeviceController.list()',
            requestUrl: '/iot/device/list',
            requestParams: 'page=1&pageSize=10',
            responseParams: "{'success':true,'message':'操作成功','code':200,'data':{'total':8},'timestamp':1776041022764}",
            responseMessage: '操作成功',
            durationMs: 52,
        },
        {
            id: '1776038841205',
            module: '导入产品',
            operationType: '导入',
            requestMethod: 'POST',
            operator: 'admin',
            host: '10.6.126.198',
            status: '失败',
            operationTime: '2026-04-13 08:07:21',
            operationMethod: 'com.bestlink.product.controller.ProductController.importData()',
            requestUrl: '/iot/product/import',
            requestParams: '{"fileName":"products.xlsx"}',
            responseParams: "{'success':false,'message':'文件格式不正确','code':500,'data':null,'timestamp':1776038841205}",
            responseMessage: '文件格式不正确',
            durationMs: 210,
        },
        {
            id: '1776035019921',
            module: '导出工单',
            operationType: '导出',
            requestMethod: 'GET',
            operator: 'operator',
            host: '10.0.98.54',
            status: '成功',
            operationTime: '2026-04-13 07:03:39',
            operationMethod: 'com.bestlink.workorder.controller.WorkOrderController.export()',
            requestUrl: '/iot/work-order/export',
            requestParams: 'startTime=2026-04-01&endTime=2026-04-13',
            responseParams: "{'success':true,'message':'操作成功','code':200,'data':null,'timestamp':1776035019921}",
            responseMessage: '操作成功',
            durationMs: 318,
        },
        {
            id: '1776032017743',
            module: '修改告警规则',
            operationType: '修改',
            requestMethod: 'PUT',
            operator: 'admin',
            host: '10.6.126.198',
            status: '成功',
            operationTime: '2026-04-13 06:13:37',
            operationMethod: 'com.bestlink.alarm.controller.AlarmRuleController.update()',
            requestUrl: '/iot/alarm-rule/update',
            requestParams: '{"ruleId":"AR001","enabled":true}',
            responseParams: "{'success':true,'message':'操作成功','code':200,'data':null,'timestamp':1776032017743}",
            responseMessage: '操作成功',
            durationMs: 143,
        },
        {
            id: '1776028845120',
            module: '新增网络协议',
            operationType: '添加',
            requestMethod: 'POST',
            operator: 'wangwu',
            host: '172.16.0.8',
            status: '成功',
            operationTime: '2026-04-13 05:20:45',
            operationMethod: 'com.bestlink.network.controller.NetworkProtocolController.add()',
            requestUrl: '/iot/network-protocol/add',
            requestParams: '{"name":"UDP协议","serviceType":"udp"}',
            responseParams: "{'success':true,'message':'操作成功','code':200,'data':null,'timestamp':1776028845120}",
            responseMessage: '操作成功',
            durationMs: 167,
        },
    ];
}
