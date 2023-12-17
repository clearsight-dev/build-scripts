#!/bin/bash -e

# https://gist.github.com/roblabs/527458cbe46b0483cd2d594c7b9e583f

# Recommended source_image size 1024x1024

source_image=$1
output_dir=$2

HOMEBREW_NO_AUTO_UPDATE=1 arch -arm64 brew list imagemagick &>/dev/null || arch -arm64 brew install imagemagick
command -v convert >/dev/null 2>&1 || {
    echo >&2 "I require imagemagick but it's not installed.  Aborting."
    exit 1
}

icon_path="$output_dir/Images.xcassets/AppIcon.appiconset"

mkdir -p "$icon_path"
rm -rf $icon_path/*.png

declare -a variations=(
    "1024x1024:ios-marketing:ios-marketing-1024x1024-1x.png"
    "20x20:ipad:ipad-20x20-1x.png"
    "40x40:ipad:ipad-20x20-2x.png"
    "29x29:ipad:ipad-29x29-1x.png"
    "58x58:ipad:ipad-29x29-2x.png"
    "40x40:ipad:ipad-40x40-1x.png"
    "80x80:ipad:ipad-40x40-2x.png"
    "50x50:ipad:ipad-50x50-1x.png"
    "100x100:ipad:ipad-50x50-2x.png"
    "72x72:ipad:ipad-72x72-1x.png"
    "144x144:ipad:ipad-72x72-2x.png"
    "76x76:ipad:ipad-76x76-1x.png"
    "152x152:ipad:ipad-76x76-2x.png"
    "167x167:ipad:ipad-83.5x83.5-2x.png"

    "40x40:iphone:iphone-20x20-2x.png"
    "60x60:iphone:iphone-20x20-3x.png"
    "29x29:iphone:iphone-29x29-1x.png"
    "58x58:iphone:iphone-29x29-2x.png"

    "87x87:iphone:iphone-29x29-3x.png"
    "80x80:iphone:iphone-40x40-2x.png"
    "120x120:iphone:iphone-40x40-3x.png"
    "57x57:iphone:iphone-57x57-1x.png"
    "114x114:iphone:iphone-57x57-2x.png"
    "120x120:iphone:iphone-60x60-2x.png"
    "180x180:iphone:iphone-60x60-3x.png"
)

function generateIcon {
    convert $source_image -resize $1 "$icon_path/$3"
}

function generateIcons {
    for size in "${variations[@]}"; do
        generateIcon $(echo $size | tr : " ")
    done
}

function generateManifest {
    cat >"$icon_path/Contents.json" <<EOF
{
  "images": [
    {
      "size": "1024x1024",
      "idiom": "ios-marketing",
      "scale": "1x",
      "filename": "ios-marketing-1024x1024-1x.png"
    },
    {
      "size": "20x20",
      "idiom": "ipad",
      "scale": "1x",
      "filename": "ipad-20x20-1x.png"
    },
    {
      "size": "20x20",
      "idiom": "ipad",
      "scale": "2x",
      "filename": "ipad-20x20-2x.png"
    },
    {
      "size": "29x29",
      "idiom": "ipad",
      "scale": "1x",
      "filename": "ipad-29x29-1x.png"
    },
    {
      "size": "29x29",
      "idiom": "ipad",
      "scale": "2x",
      "filename": "ipad-29x29-2x.png"
    },
    {
      "size": "40x40",
      "idiom": "ipad",
      "scale": "1x",
      "filename": "ipad-40x40-1x.png"
    },
    {
      "size": "40x40",
      "idiom": "ipad",
      "scale": "2x",
      "filename": "ipad-40x40-2x.png"
    },
    {
      "size": "50x50",
      "idiom": "ipad",
      "scale": "1x",
      "filename": "ipad-50x50-1x.png"
    },
    {
      "size": "50x50",
      "idiom": "ipad",
      "scale": "2x",
      "filename": "ipad-50x50-2x.png"
    },
    {
      "size": "72x72",
      "idiom": "ipad",
      "scale": "1x",
      "filename": "ipad-72x72-1x.png"
    },
    {
      "size": "72x72",
      "idiom": "ipad",
      "scale": "2x",
      "filename": "ipad-72x72-2x.png"
    },
    {
      "size": "76x76",
      "idiom": "ipad",
      "scale": "1x",
      "filename": "ipad-76x76-1x.png"
    },
    {
      "size": "76x76",
      "idiom": "ipad",
      "scale": "2x",
      "filename": "ipad-76x76-2x.png"
    },
    {
      "size": "83.5x83.5",
      "idiom": "ipad",
      "scale": "2x",
      "filename": "ipad-83.5x83.5-2x.png"
    },
    {
      "size": "20x20",
      "idiom": "iphone",
      "scale": "2x",
      "filename": "iphone-20x20-2x.png"
    },
    {
      "size": "20x20",
      "idiom": "iphone",
      "scale": "3x",
      "filename": "iphone-20x20-3x.png"
    },
    {
      "size": "29x29",
      "idiom": "iphone",
      "scale": "1x",
      "filename": "iphone-29x29-1x.png"
    },
    {
      "size": "29x29",
      "idiom": "iphone",
      "scale": "2x",
      "filename": "iphone-29x29-2x.png"
    },
    {
      "size": "29x29",
      "idiom": "iphone",
      "scale": "3x",
      "filename": "iphone-29x29-3x.png"
    },
    {
      "size": "40x40",
      "idiom": "iphone",
      "scale": "2x",
      "filename": "iphone-40x40-2x.png"
    },
    {
      "size": "40x40",
      "idiom": "iphone",
      "scale": "3x",
      "filename": "iphone-40x40-3x.png"
    },
    {
      "size": "57x57",
      "idiom": "iphone",
      "scale": "1x",
      "filename": "iphone-57x57-1x.png"
    },
    {
      "size": "57x57",
      "idiom": "iphone",
      "scale": "2x",
      "filename": "iphone-57x57-2x.png"
    },
    {
      "size": "60x60",
      "idiom": "iphone",
      "scale": "2x",
      "filename": "iphone-60x60-2x.png"
    },
    {
      "size": "60x60",
      "idiom": "iphone",
      "scale": "3x",
      "filename": "iphone-60x60-3x.png"
    }
  ],
  "info": {
    "author": "xcode",
    "version": 1
  }
}
EOF
}

generateIcons
generateManifest
