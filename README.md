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
Start check files.
Ready to upload one file：
  test.jpg @ image/jpeg 727.65Kb 5272×3192
Uploading by xingmin.zhu...
Upload one file to alipay cdn successfully!
  ➠ https://i.alipayobjects.com/e/201301/21MmTCjPoD.jpg » test.jpg
```

就可以访问 [https://i.alipayobjects.com/e/201301/21MmTCjPoD.jpg](https://i.alipayobjects.com/e/201301/21MmTCjPoD.jpg) 了。

如果你是`MacOS`用户，上传成功后 cdn 地址将会自动复制到剪贴板中。

### 多文件部署

支持多文件上传和通配符的匹配。

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

### 更改上传用户

请设置为自己的域账号前缀，默认为 `xingmin.zhu`。

```
$ cdn --username ali.pay
```

### 在 NodeJS 中

```js
require('cdn');

cdn('/path/to/test.jpg', function(url) {
    // url -> https://i.alipayobjects.com/e/201301/21MmTCjPoD.jpg
});
```

