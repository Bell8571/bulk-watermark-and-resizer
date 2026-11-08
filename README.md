# ProPhoto Watermarker & Resizer

Bulk watermark and resize for photographers. **Version 2.0.0** — processing runs entirely on your machine.

## Project layout (SoftwareForge Product Standard v1)

```
src/           Application source
docs/          Guides and standards
assets/        Icons and static files
scripts/       Build, release, and utility scripts
electron/      Desktop shell
release/       Versioned distribution bundles (x.y.z/)
```

See [docs/PRODUCT_STANDARD.md](docs/PRODUCT_STANDARD.md).

## Development

```bash
npm install
npm run build:icon   # once, or when branding changes
npm run dev
```

```bash
npm run electron:dev
```

## Build Windows portable

```bash
npm run dist:win
npm run release
```

Output: `release/2.0.0/ProPhoto-Watermarker-2.0.0.exe` and `SHA256.txt`.

## Documentation

- [User guide](docs/USER_GUIDE.md)
- [Architecture](docs/ARCHITECTURE.md)
- [v2 feature notes](docs/IMPROVEMENTS_v2.md)

## License

MIT — see [LICENSE.txt](LICENSE.txt).
