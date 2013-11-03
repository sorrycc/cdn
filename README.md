# CDN 

[![NPM version](https://badge.fury.io/js/cdn.png)](http://badge.fury.io/js/cdn)
[![David Status](https://david-dm.org/afc163/cdn.png)](https://david-dm.org/afc163/cdn) 
[![Dependency Status](https://gemnasium.com/afc163/cdn.png)](https://gemnasium.com/afc163/cdn)

支付宝静态文件托管服务，仅限内部使用。

上传静态文件到支付宝 cdn 上，生成随机的地址返回。目前支持 .png .jpg .jpeg .gif .ico .swf .js .css .zip .pdf .flv .mp4 这些类型的文件。

![demo](https://i.alipayobjects.com/e/201301/22tNik5rDY.png)

---

## 安装

```
$ npm install cdn -g
```

## 使用

```
$ cdn test.jpg
```

```
Start check files.
Ready to upload one file：
  test.jpg @ image/jpeg 727.65Kb 5272×3192
Uploading by xingmin.zhu...
Upload one file to alipay cdn successfully!
  ➠ https://i.alipayobjects.com/e/201301/21MmTCjPoD.jpg » test.jpg
```

就可以访问 [https://i.alipayobjects.com/e/201301/21MmTCjPoD.jpg](https://i.alipayobjects.com/e/201301/21MmTCjPoD.jpg) 了。

上传成功后 cdn 地址将会自动复制到剪贴板中。

### 多文件部署

支持多文件上传和通配符的匹配。`0.0.3+`

```
$ cdn test1.js test2.js test3.css
```

```
$ cdn *.jpg
```

### 部署网络地址

```
$ cdn https://npmjs.org/static/npm.png
```

### 相对绝对路径

```
$ cdn ../../test.jpg
```

```
$ cdn /home/admin/test.jpg
```

### 在 NodeJS 中 `0.0.2+`

```js
require('cdn');

cdn('/path/to/test.jpg', function(url) {
    // url -> https://i.alipayobjects.com/e/201301/21MmTCjPoD.jpg
});
```



[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/afc163/cdn/trend.png)](https://bitdeli.com/free "Bitdeli Badge")

