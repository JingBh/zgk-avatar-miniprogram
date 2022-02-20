# libs

## How to initialize:

### `image-cropper`

```bash
git -C ./image-cropper config core.sparseCheckout true
echo <<< EOL
/src/*
LICENSE
README.md
EOL >>../../.git/modules/miniprogram/libs/image-cropper/info/sparse-checkout
git submodule update --force --checkout miniprogram/libs/image-cropper
```
