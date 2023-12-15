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

splash_path="$output_dir/res"

mkdir -p $splash_path
rm -rf $splash_path/*.png

declare -a variations=(
    # "2732x2732:drawable"
    # "480x480:drawable-mdpi"
    # "800x800:drawable-hdpi"
    # "1280x1280:drawable-xhdpi"
    # "1600x1600:drawable-xxhdpi"
    # "1920x1920:drawable-xxxhdpi"
    # "480x320:drawable-land-mdpi"
    # "800x480:drawable-land-hdpi"
    # "1280x720:drawable-land-xhdpi"
    # "1600x960:drawable-land-xxhdpi"
    # "1920x1280:drawable-land-xxxhdpi"
    # "480x800:drawable-port-hdpi"
    # "320x480:drawable-port-mdpi"
    # "720x1280:drawable-port-xhdpi"
    # "960x1600:drawable-port-xxhdpi"
    # "1280x1920:drawable-port-xxxhdpi"

    "140x140:mipmap-ldpi"
    "288x288:mipmap-mdpi"
    "432x432:mipmap-hdpi"
    "576x576:mipmap-xhdpi"
    "864x864:mipmap-xxhdpi"
    "1152x1152:mipmap-xxxhdpi"
)

function generateImage {
    mkdir -p $splash_path/$2
    W=$(echo $1 | cut -d'x' -f1)
    convert $source_image -resize $1 -gravity center "$splash_path/$2/splash.png"
    convert -size $1 xc:none -draw "roundrectangle 0,0,$W,$W,$(($W/2)),$(($W/2))" "$splash_path/$2/mask.png"
    convert "$splash_path/$2/splash.png" -matte "$splash_path/$2/mask.png" -compose DstIn -composite "$splash_path/$2/splash.png"
    convert "$splash_path/$2/splash.png" -background transparent -gravity center -scale "$((2*$W/3))x$((2*$W/3))" -extent $1 "$splash_path/$2/splash.png"
    rm "$splash_path/$2/mask.png"
}

function generateImages {
    for size in "${variations[@]}"; do
        generateImage $(echo $size | tr : " ")
    done
}

generateImages
