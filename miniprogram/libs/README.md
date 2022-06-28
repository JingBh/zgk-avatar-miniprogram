# libs

## How to initialize:

If not initialized submodules yet:
```bash
git submodule update --init --recursive
```

### `image-cropper`

```bash
git -C ./image-cropper config core.sparseCheckout true
echo <<< EOL
/src/*
LICENSE
EOL >>../../.git/modules/miniprogram/libs/image-cropper/info/sparse-checkout
git submodule update --force --checkout image-cropper
```
