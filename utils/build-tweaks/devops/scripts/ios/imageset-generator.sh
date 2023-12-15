#!/bin/bash -e

# https://gist.github.com/roblabs/527458cbe46b0483cd2d594c7b9e583f

# Recommended splash.(png|jpg) must be at least 2732×2732px

source_image=$1
output_dir=$2

HOMEBREW_NO_AUTO_UPDATE=1 brew list imagemagick &>/dev/null || brew install imagemagick
command -v convert >/dev/null 2>&1 || {
    echo >&2 "I require imagemagick but it's not installed.  Aborting."
    exit 1
}

splash_path="$output_dir/Images.xcassets/LaunchScreen.imageset"

mkdir -p "$splash_path"
rm -rf $splash_path/*.png

declare -a variations=(
    "640x960:Default@2x.png"
    "640x1136:Default-568h@2x.png"
    "750x1334:Default-667h@2x.png"
    "1242x2208:Default-Portrait-736h@3x.png"
    "2208x1242:Default-Landscape-736h@3x.png"
)

function generateImage {
    convert $source_image -resize $1 -gravity center "$splash_path/$2"
}

function generateImages {
    for size in "${variations[@]}"; do
        generateImage $(echo $size | tr : " ")
    done
}

function generateManifest {
    cat >"$splash_path/Contents.json" <<EOF
{
  "images" : [
    {
      "idiom" : "iphone",
      "scale" : "1x",
      "filename" : "Default@2x.png"
    },
    {
      "filename" : "Default@2x.png",
      "idiom" : "iphone",
      "scale" : "2x"
    },
    {
      "idiom" : "iphone",
      "scale" : "3x",
      "filename" : "Default@2x.png"
    },
    {
      "idiom" : "iphone",
      "scale" : "1x",
      "subtype" : "retina4",
      "filename" : "Default-568h@2x.png"
    },
    {
      "filename" : "Default-568h@2x.png",
      "idiom" : "iphone",
      "scale" : "2x",
      "subtype" : "retina4"
    },
    {
      "filename" : "Default-Portrait-736h@3x.png",
      "idiom" : "iphone",
      "scale" : "3x",
      "subtype" : "retina4"
    },
    {
      "filename" : "Default-Landscape-736h@3x.png",
      "idiom" : "iphone",
      "scale" : "3x",
      "subtype" : "736h"
    },
    {
      "filename" : "Default-667h@2x.png",
      "idiom" : "iphone",
      "scale" : "2x",
      "subtype" : "667h"
    }
  ],
  "info" : {
    "author" : "xcode",
    "version" : 1
  }
}
EOF
}

generateImages
generateManifest
