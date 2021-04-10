import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

import os from 'os';
import locale from 'os-locale'; /// doc: https://github.com/sindresorhus/os-locale
import http from 'axios'; /// doc: https://github.com/axios/axios#axios-api
import moment from 'moment'; /// doc: https://momentjs.com/docs

export { AxiosInstance };

enum AcceptType {
    Json = 'application/json ',
    Plain = 'ext/plain',
    Multipart = 'application/x-www-form-urlencoded'
}

const xhrDefaultConfig: AxiosRequestConfig = {
    headers: {
        OS: JSON.stringify({
            platform: os.platform(),
            totalmem: os.totalmem(),
            freemem: os.freemem(),
            endianness: os.endianness(),
            arch: os.arch(),
            tmpdir: os.tmpdir(),
            type: os.type()
        }),
        'Content-Type': `${AcceptType.Json};charset=UTF-8`, /// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type
        'Cache-Control': 'no-cache', /// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control
        deviceID: `WEB-${window.navigator.userAgent}`,
        Accept: AcceptType.Json /// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept
        // Connection: 'Keep-Alive', /// HTTP1.1, https://en.wikipedia.org/wiki/HTTP_persistent_connection
        // 'Accept-Encoding': 'gzip', /// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Encoding
        // 'Accept-Charset': 'utf-8', /// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Charset
    }
    // timeout: 1000,
};

function httpInit(instance: AxiosInstance): AxiosInstance {
    instance.interceptors.request.use((config: AxiosRequestConfig): any => ({
        ...config,
        headers: {
            ...config.headers,
            'X-B3-Traceid': moment().valueOf() * 1000, // Traceid
            'X-B3-Spanid': moment().valueOf() * 1000, // Spanid
            'Accept-Language': locale.sync() // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Language
        },
        transformRequest: [
            // @ts-ignore
            (data: {[key: string]: any}, headers: {[key: string]: any}) => {
                switch (true) {
                case headers.Accept === AcceptType.Json:
                    return JSON.stringify(data);
                case headers.Accept === AcceptType.Plain:
                    return JSON.stringify(data);
                case headers.Accept === AcceptType.Multipart:
                    return Object.entries(data).reduce((acc: FormData, cur: [string, any]): FormData => {
                        acc.append(...cur);
                        return acc;
                    }, new FormData());
                default:
                    break;
                }
            }
        ]
    }), (error: Error) => Promise.reject(error) /* toast(error.message) */);

    instance.interceptors.response.use((response: AxiosResponse): any => {
        const {
            data,
            // config
        }: {
            data: any,
            config: AxiosRequestConfig
        } = response;

        return data;

    }, (error: any) => {
        const { response /* __CANCEL__ */ } = error;
        // if (!__CANCEL__) toast(response.message || response.data.message); // 非主动取消请求的接口
        throw new Error(response);
    });

    return instance;
}

export default new Proxy(
    Object.create(null),
    {
        get(_, key: string): AxiosInstance | null {
            const { baseURL = key, timeout, headers } = xhrDefaultConfig;
            return httpInit(http.create({
                baseURL,
                timeout,
                headers
            }));
        }
    });
