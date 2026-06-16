let loadPromise: Promise<void> | null = null;

const LOAD_TIMEOUT_MS = 15000;

function isBaiduMapReady() {
    return typeof window.BMap?.Map === 'function';
}

function waitForBaiduMapReady(timeoutMs: number): Promise<void> {
    return new Promise((resolve, reject) => {
        const started = Date.now();

        const check = () => {
            if (isBaiduMapReady()) {
                resolve();
                return;
            }
            if (Date.now() - started >= timeoutMs) {
                reject(new Error('百度地图加载超时'));
                return;
            }
            window.setTimeout(check, 50);
        };

        check();
    });
}

export function loadBaiduMap(ak: string): Promise<void> {
    if (isBaiduMapReady()) {
        return Promise.resolve();
    }

    if (!ak) {
        return Promise.reject(new Error('未配置百度地图 AK'));
    }

    if (loadPromise) {
        return loadPromise;
    }

    loadPromise = new Promise((resolve, reject) => {
        const callbackName = `__bmapInit_${Date.now()}`;
        let settled = false;

        const finish = (handler: () => void) => {
            if (settled) return;
            settled = true;
            delete (window as Window & Record<string, unknown>)[callbackName];
            handler();
        };

        const timeoutId = window.setTimeout(() => {
            finish(() => {
                loadPromise = null;
                reject(new Error('百度地图加载超时'));
            });
        }, LOAD_TIMEOUT_MS);

        (window as Window & Record<string, unknown>)[callbackName] = () => {
            window.clearTimeout(timeoutId);
            waitForBaiduMapReady(LOAD_TIMEOUT_MS)
                .then(() => {
                    finish(resolve);
                })
                .catch((error) => {
                    finish(() => {
                        loadPromise = null;
                        reject(error instanceof Error ? error : new Error('百度地图初始化失败'));
                    });
                });
        };

        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = `https://api.map.baidu.com/api?v=3.0&ak=${encodeURIComponent(ak)}&callback=${callbackName}`;
        script.onerror = () => {
            window.clearTimeout(timeoutId);
            finish(() => {
                loadPromise = null;
                reject(new Error('百度地图脚本加载失败'));
            });
        };
        document.head.appendChild(script);
    });

    return loadPromise;
}
