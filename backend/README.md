# backend

The backend, to be deployed on Alibaba Cloud Function Compute. The function uses a Node.js 20 runtime.

In `package.json`, the `dependencies` stands for packages that you need to install in the environment manually, via layers or directly in the code pack, while the `devDependencies` stands for the packages provided by the runtime, which only presents for the convenience of local development.

Required environment variables:

```json
{
  "ALIYUN_ACCESS_KEY_ID": "******",
  "ALIYUN_ACCESS_KEY_SECRET": "******",
  "ALIYUN_OSS_BUCKET": "******",
  "ALIYUN_OSS_ENDPOINT": "oss-cn-beijing-internal.aliyuncs.com",
  "ALIYUN_SLS_ENDPOINT": "cn-beijing-intranet.log.aliyuncs.com",
  "ALIYUN_SLS_LOGSTORE": "backend",
  "ALIYUN_SLS_PROJECT": "******",
  "APP_BANNED_OPENIDS": "[******, ******, ...]",
  "APP_JWT_SECRET": "******",
  "NODE_PATH": "/code/node_modules:/usr/local/lib/node_modules:/opt/nodejs/node_modules",
  "TZ": "Asia/Shanghai",
  "WECHAT_APPID": "******",
  "WECHAT_APPSECRET": "******"
}
```
