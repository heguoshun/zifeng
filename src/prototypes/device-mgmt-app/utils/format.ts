/** 与 PC 端 mock 数据一致的时间格式：YYYY-MM-DD HH:mm:ss */
export function formatNowTimestamp(date = new Date()): string {
    return date.toISOString().slice(0, 19).replace('T', ' ');
}
