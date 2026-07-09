/** 百度地图 AK，可在项目根目录 .env 中配置 VITE_BAIDU_MAP_AK；Referer 白名单本地调试可填 * 或 *localhost:51720* */
export const BAIDU_MAP_AK = import.meta.env.VITE_BAIDU_MAP_AK ?? '';

export const BAIDU_MAP_DEFAULT_CENTER = {
    longitude: 118.796877,
    latitude: 32.060255,
};

export const BAIDU_MAP_DEFAULT_ZOOM = 15;
