# CDN 

支付宝静态文件托管服务。

上传静态文件到支付宝 cdn 上，生成随机的地址返回。目前支持 .png .jpg .jpeg .gif .ico .swf .js .css .zip .pdf .flv .mp4 这些类型的文件。

---

## 安装

```
$ sudo npm install cdn -g
```

## 使用

```
$ cdn test.jpg
```
 
```
Ready to upload your file » test.jpg
Uploading ...
Upload to alipay cdn successfully!
➠  https://i.alipayobjects.com/e/201301/21MmTCjPoD.jpg » test.jpg
```

就可以访问 [https://i.alipayobjects.com/e/201301/21MmTCjPoD.jpg](https://i.alipayobjects.com/e/201301/21MmTCjPoD.jpg) 了。

如果你是`MacOS`用户，上传成功后 cdn 地址将会自动复制到剪贴板中。

### 部署网络地址

```
$ cdn https://npmjs.org/static/npm.png
```

### 在 NodeJS 中

```js
require('cdn');

cdn('/path/to/test.jpg', function(url) {
    // url -> https://i.alipayobjects.com/e/201301/21MmTCjPoD.jpg
});
```
