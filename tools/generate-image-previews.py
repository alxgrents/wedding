"""Build lossless, antialiased screen previews. Requires Pillow; originals stay intact."""

from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
WIDTHS = (50, 100, 200, 400, 800, 1600)


def main():
    sources = sorted((ROOT / "assets" / "images_person").glob("*.jpg"), key=lambda path: int(path.stem))
    sources.extend(sorted((ROOT / "assets" / "images").glob("*.jpg")))
    sources.extend(sorted((ROOT / "assets" / "images").glob("*.png")))
    sources.extend(sorted((ROOT / "animals").glob("*.jpg")))
    for source in sources:
        destination = source.parent / "previews"
        destination.mkdir(parents=True, exist_ok=True)
        with Image.open(source) as original:
            image = ImageOps.exif_transpose(original).convert("RGB")
            for width in WIDTHS:
                if width >= image.width:
                    continue
                height = round(image.height * width / image.width)
                preview = image.resize((width, height), Image.Resampling.LANCZOS)
                preview.save(
                    destination / f"{source.stem}-{width}.png",
                    icc_profile=original.info.get("icc_profile"),
                )
        print(f"{source.relative_to(ROOT)}: previews ready", flush=True)


if __name__ == "__main__":
    main()
